import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Contract Tests: Orders", () => {
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

	const registerAndLogin = async (email: string) => {
		const payload = {
			firstName: "Order",
			lastName: "User",
			phone: "+84943438532",
			email,
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		await request(app).post(REGISTER).send(payload);
		await verifyUserEmail(payload.email);

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
				title: `Orderable Book ${unique}`,
				description: "Book for order test",
				publicationDate: "2024-06-15",
				language: "en",
				formats: [
					{
						formatType: "physical",
						sku: `SKU-${unique}`,
						price: 100000,
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
						recipientName: "Nguyen Van A",
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

	describe("POST /api/orders/confirm", () => {
		it("confirms order from cart and clears cart", async () => {
			const { token, userId } = await registerAndLogin("order-confirm@example.com");
			const book = await createBook();
			await addDefaultAddressForUser(userId);

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 2,
			});

			const confirmRes = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
				paymentMethod: "cod",
				note: "Please call before delivery",
			});

			expect(confirmRes.status).toBe(201);
			expect(confirmRes.body.status).toBe("confirmed");
			expect(confirmRes.body.items).toHaveLength(1);
			expect(confirmRes.body.totalAmount).toBe(200000);
			expect(confirmRes.body.shippingAddress.recipientName).toBe("Nguyen Van A");
			expect(sendOrderConfirmationEmailSpy).toHaveBeenCalledTimes(1);

			const cartRes = await request(app).get(CART).set("Authorization", `Bearer ${token}`);
			expect(cartRes.status).toBe(200);
			expect(cartRes.body.items).toHaveLength(0);
			expect(cartRes.body.totalAmount).toBe(0);
		});

		it("returns 400 when cart is empty", async () => {
			const { token, userId } = await registerAndLogin("order-empty-cart@example.com");
			await addDefaultAddressForUser(userId);

			const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
				paymentMethod: "cod",
			});

			expect(res.status).toBe(400);
		});

		it("returns 400 when user has no shipping address", async () => {
			const { token } = await registerAndLogin("order-no-address@example.com");
			const book = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 1,
			});

			const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
				paymentMethod: "cod",
			});

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/shipping address/i);
		});
	});

	describe("GET /api/orders/my", () => {
		it("returns current user's order history in newest-first order", async () => {
			const { token, userId } = await registerAndLogin("order-history@example.com");
			const bookA = await createBook();
			const bookB = await createBook();
			await addDefaultAddressForUser(userId);

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: bookA._id,
				selectedFormat: "physical",
				quantity: 1,
			});
			await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
				paymentMethod: "cod",
			});

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: bookB._id,
				selectedFormat: "physical",
				quantity: 1,
			});
			await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
				paymentMethod: "cod",
			});

			const historyRes = await request(app).get(`${ORDERS}/my`).set("Authorization", `Bearer ${token}`);

			expect(historyRes.status).toBe(200);
			expect(Array.isArray(historyRes.body)).toBe(true);
			expect(historyRes.body.length).toBe(2);
			expect(new Date(historyRes.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
				new Date(historyRes.body[1].createdAt).getTime(),
			);
		});

		it("returns 401 when missing token", async () => {
			const res = await request(app).get(`${ORDERS}/my`);
			expect(res.status).toBe(401);
		});
	});
});

