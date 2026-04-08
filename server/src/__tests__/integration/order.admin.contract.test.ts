import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Contract Tests: Admin Order Management", () => {
	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";
	const BOOKS = "/api/books";
	const CART = "/api/cart";
	const ORDERS = "/api/orders";

	let sendOrderConfirmationEmailSpy: jest.SpyInstance;

	const verifyUserEmail = async (email: string) => {
		await User.findOneAndUpdate(
			{ email: email.toLowerCase() },
			{
				isEmailVerified: true,
				emailVerificationToken: undefined,
				emailVerificationExpires: undefined,
			},
		);
	};

	const registerAndLogin = async (email: string, role: "customer" | "admin" = "customer") => {
		const payload = {
			firstName: role === "admin" ? "Admin" : "Order",
			lastName: "User",
			phone: "+84901231231",
			email,
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		await request(app).post(REGISTER).send(payload);
		await verifyUserEmail(payload.email);

		if (role === "admin") {
			await User.findOneAndUpdate({ email: payload.email.toLowerCase() }, { role: "admin" });
		}

		const loginRes = await request(app).post(LOGIN).send({
			email: payload.email,
			password: payload.password,
		});

		return {
			token: loginRes.body.token as string,
			userId: (loginRes.body.user?.id ?? loginRes.body.user?._id) as string,
		};
	};

	const createBook = async () => {
		const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const response = await request(app)
			.post(BOOKS)
			.send({
				title: `Order Admin Book ${unique}`,
				description: "Book for admin order management test",
				publicationDate: "2024-06-15",
				language: "en",
				formats: [
					{
						formatType: "physical",
						sku: `SKU-${unique}`,
						price: 200000,
						currency: "VND",
						stockQuantity: 50,
					},
				],
			});

		return response.body;
	};

	const addDefaultAddressForUser = async (userId: string) => {
		await User.findByIdAndUpdate(userId, {
			$set: {
				addresses: [
					{
						recipientName: "Admin Test Recipient",
						phoneNumber: "0900000000",
						provinceOrCity: "Ho Chi Minh",
						district: "District 1",
						ward: "Ben Nghe",
						streetDetails: "1 Le Loi",
						country: "Vietnam",
						isDefault: true,
					},
				],
			},
		});
	};

	const createOrderForUser = async (token: string, userId: string) => {
		const book = await createBook();
		await addDefaultAddressForUser(userId);

		await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
			bookId: book._id,
			selectedFormat: "physical",
			quantity: 1,
		});

		const confirmRes = await request(app)
			.post(`${ORDERS}/confirm`)
			.set("Authorization", `Bearer ${token}`)
			.send({ paymentMethod: "cod" });

		return confirmRes.body;
	};

	beforeAll(async () => {
		await connectTestDB();
		sendOrderConfirmationEmailSpy = jest
			.spyOn(EmailService.prototype, "sendOrderConfirmationEmail")
			.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await clearTestDB();
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await closeTestDB();
		jest.restoreAllMocks();
	});

	describe("GET /api/orders/admin", () => {
		it("returns paginated orders for admin users", async () => {
			const { token: adminToken } = await registerAndLogin("admin-orders@example.com", "admin");
			const { token: customerToken, userId } = await registerAndLogin("customer-orders@example.com", "customer");
			await createOrderForUser(customerToken, userId);

			const res = await request(app)
				.get(`${ORDERS}/admin?page=1&limit=10&search=Admin Test Recipient`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.total).toBe(1);
			expect(res.body.data[0].shippingAddress.recipientName).toBe("Admin Test Recipient");
			expect(sendOrderConfirmationEmailSpy).toHaveBeenCalledTimes(1);
		});

		it("returns 403 for non-admin users", async () => {
			const { token } = await registerAndLogin("customer-only@example.com", "customer");
			const res = await request(app).get(`${ORDERS}/admin`).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(403);
		});
	});

	describe("PATCH /api/orders/:orderId/status", () => {
		it("updates an order status and timestamps", async () => {
			const { token: adminToken } = await registerAndLogin("admin-status@example.com", "admin");
			const { token: customerToken, userId } = await registerAndLogin("customer-status@example.com", "customer");
			const order = await createOrderForUser(customerToken, userId);

			const res = await request(app)
				.patch(`${ORDERS}/${order.id}/status`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({ status: "shipped" });

			expect(res.status).toBe(200);
			expect(res.body.status).toBe("shipped");
			expect(res.body.shippedAt).toBeTruthy();
		});
	});

	describe("GET /api/orders/admin/statistics", () => {
		it("returns order statistics for dashboard", async () => {
			const { token: adminToken } = await registerAndLogin("admin-stats@example.com", "admin");
			const { token: customerToken, userId } = await registerAndLogin("customer-stats@example.com", "customer");
			await createOrderForUser(customerToken, userId);

			const res = await request(app)
				.get(`${ORDERS}/admin/statistics`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(res.status).toBe(200);
			expect(res.body.totalOrders).toBeGreaterThanOrEqual(1);
			expect(res.body.totalRevenue).toBeGreaterThanOrEqual(0);
			expect(Array.isArray(res.body.statusBreakdown)).toBe(true);
			expect(Array.isArray(res.body.paymentStatusBreakdown)).toBe(true);
			expect(Array.isArray(res.body.monthlyRevenue)).toBe(true);
			expect(res.body.monthlyRevenue).toHaveLength(6);
		});
	});
});
