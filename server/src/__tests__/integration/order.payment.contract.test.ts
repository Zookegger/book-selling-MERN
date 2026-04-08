import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Contract Tests: Order Payment Validation", () => {
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
			firstName: "Payment",
			lastName: "Tester",
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
				title: `Payment Book ${unique}`,
				description: "Book for payment validation test",
				publicationDate: "2024-06-15",
				language: "en",
				formats: [
					{
						formatType: "physical",
						sku: `SKU-PAY-${unique}`,
						price: 100000,
						currency: "VND",
						stockQuantity: 20,
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
						recipientName: "Nguyen Van B",
						phoneNumber: "0911222333",
						provinceOrCity: "Ho Chi Minh",
						district: "District 3",
						ward: "Ward 6",
						streetDetails: "99 Vo Van Tan",
						country: "Vietnam",
						isDefault: true,
					},
				],
			},
		});
	};

	const addBookToCart = async (token: string, bookId: string) => {
		await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
			bookId,
			selectedFormat: "physical",
			quantity: 1,
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

	it("returns 400 for unsupported payment method", async () => {
		const { token, userId } = await registerAndLogin("missing-card-details@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "credit_card",
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/Payment method must be cod or vnpay/i);
	});

	it("returns 400 for vnpay when locale is invalid", async () => {
		const { token, userId } = await registerAndLogin("missing-bank-ref@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "vnpay",
			paymentDetails: {
				locale: "jp",
			},
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/Locale must be vn or en/i);
	});

	it("confirms order successfully with COD and pending payment status", async () => {
		const { token, userId } = await registerAndLogin("invalid-paypal-email@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "cod",
		});

		expect(res.status).toBe(201);
		expect(res.body.paymentMethod).toBe("cod");
		expect(res.body.paymentStatus).toBe("pending");
		expect(sendOrderConfirmationEmailSpy).toHaveBeenCalledTimes(1);
	});

	it("confirms order successfully with vnpay and pending payment status", async () => {
		const { token, userId } = await registerAndLogin("valid-credit-card@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "vnpay",
			paymentDetails: {
				bankCode: "NCB",
				locale: "vn",
			},
		});

		expect(res.status).toBe(201);
		expect(res.body.paymentMethod).toBe("vnpay");
		expect(res.body.paymentStatus).toBe("pending");
		expect(sendOrderConfirmationEmailSpy).toHaveBeenCalledTimes(1);
	});
});

