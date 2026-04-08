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

	it("returns 400 for credit_card when card details are missing", async () => {
		const { token, userId } = await registerAndLogin("missing-card-details@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "credit_card",
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/Payment details are required|Card holder name is required/i);
	});

	it("returns 400 for bank_transfer when transferReference is missing", async () => {
		const { token, userId } = await registerAndLogin("missing-bank-ref@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "bank_transfer",
			paymentDetails: {
				bankCode: "VCB",
			},
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/Transfer reference is required/i);
	});

	it("returns 400 for paypal when paypalEmail is invalid", async () => {
		const { token, userId } = await registerAndLogin("invalid-paypal-email@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "paypal",
			paymentDetails: {
				paypalEmail: "not-an-email",
			},
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toMatch(/PayPal email is invalid/i);
	});

	it("confirms order successfully with valid credit_card details", async () => {
		const { token, userId } = await registerAndLogin("valid-credit-card@example.com");
		const book = await createBook();
		await addDefaultAddressForUser(userId);
		await addBookToCart(token, book._id);

		const res = await request(app).post(`${ORDERS}/confirm`).set("Authorization", `Bearer ${token}`).send({
			paymentMethod: "credit_card",
			paymentDetails: {
				cardHolderName: "NGUYEN VAN B",
				cardLast4: "1234",
			},
		});

		expect(res.status).toBe(201);
		expect(res.body.paymentMethod).toBe("credit_card");
		expect(res.body.paymentStatus).toBe("paid");
		expect(sendOrderConfirmationEmailSpy).toHaveBeenCalledTimes(1);
	});
});

