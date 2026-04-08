import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Contract Tests: Role-Based Access", () => {
	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";

	let sendVerificationEmailSpy: jest.SpyInstance;

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

	const registerAndLogin = async (email: string, role: "customer" | "admin") => {
		const payload = {
			firstName: role === "admin" ? "Admin" : "User",
			lastName: "Access",
			phone: "+84911111111",
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

		return loginRes.body.token as string;
	};

	beforeAll(async () => {
		await connectTestDB();
		sendVerificationEmailSpy = jest
			.spyOn(EmailService.prototype, "sendVerificationEmail")
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

	it("requires admin for creating books", async () => {
		const customerToken = await registerAndLogin("role-book-customer@example.com", "customer");
		const adminToken = await registerAndLogin("role-book-admin@example.com", "admin");

		const payload = {
			title: "Secured Book",
			description: "Role test",
			publicationDate: "2024-06-15",
			language: "en",
			formats: [
				{
					formatType: "physical",
					sku: "SECURE-BOOK-001",
					price: 100000,
					currency: "VND",
					stockQuantity: 10,
				},
			],
		};

		const unauthorized = await request(app).post("/api/books").send(payload);
		expect(unauthorized.status).toBe(401);

		const forbidden = await request(app)
			.post("/api/books")
			.set("Authorization", `Bearer ${customerToken}`)
			.send(payload);
		expect(forbidden.status).toBe(403);

		const success = await request(app)
			.post("/api/books")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(payload);
		expect(success.status).toBe(201);
		expect(sendVerificationEmailSpy).toHaveBeenCalled();
	});

	it("requires admin for creating authors", async () => {
		const customerToken = await registerAndLogin("role-author-customer@example.com", "customer");
		const adminToken = await registerAndLogin("role-author-admin@example.com", "admin");

		const payload = { name: "Secure Author", email: "secure-author@example.com" };

		const unauthorized = await request(app).post("/api/authors").send(payload);
		expect(unauthorized.status).toBe(401);

		const forbidden = await request(app)
			.post("/api/authors")
			.set("Authorization", `Bearer ${customerToken}`)
			.send(payload);
		expect(forbidden.status).toBe(403);

		const success = await request(app)
			.post("/api/authors")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(payload);
		expect(success.status).toBe(201);
	});

	it("requires admin for creating categories", async () => {
		const customerToken = await registerAndLogin("role-category-customer@example.com", "customer");
		const adminToken = await registerAndLogin("role-category-admin@example.com", "admin");

		const payload = { name: "Secure Category" };

		const unauthorized = await request(app).post("/api/categories").send(payload);
		expect(unauthorized.status).toBe(401);

		const forbidden = await request(app)
			.post("/api/categories")
			.set("Authorization", `Bearer ${customerToken}`)
			.send(payload);
		expect(forbidden.status).toBe(403);

		const success = await request(app)
			.post("/api/categories")
			.set("Authorization", `Bearer ${adminToken}`)
			.send(payload);
		expect(success.status).toBe(201);
	});
});
