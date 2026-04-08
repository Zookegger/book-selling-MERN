import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";

describe("Contract Tests: Session Cart", () => {
	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";
	const BOOKS = "/api/books";
	const CART = "/api/cart";

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
			firstName: "Cart",
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

		return loginRes.body.token as string;
	};

	const createBook = async () => {
		const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const response = await request(app)
			.post(BOOKS)
			.send({
				title: `Cartable Book ${unique}`,
				description: "Book for cart test",
				publicationDate: "2024-06-15",
				language: "en",
				formats: [
					{
						formatType: "physical",
						sku: `SKU-${unique}`,
						price: 19.99,
						stockQuantity: 50,
					},
				],
			});

		return response.body;
	};

	beforeAll(async () => await connectTestDB());
	afterEach(async () => await clearTestDB());
	afterAll(async () => await closeTestDB());

	describe("GET /api/cart", () => {
		it("returns an empty cart for a new authenticated session", async () => {
			const token = await registerAndLogin("cart-empty@example.com");

			const res = await request(app).get(CART).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body.items)).toBe(true);
			expect(res.body.items).toHaveLength(0);
			expect(res.body.subtotal).toBe(0);
			expect(res.body.totalAmount).toBe(0);
		});

		it("returns 401 when session is missing", async () => {
			const res = await request(app).get(CART);
			expect(res.status).toBe(401);
		});
	});

	describe("GET /api/cart/count", () => {
		it("returns 0 for a new authenticated session", async () => {
			const token = await registerAndLogin("cart-count-empty@example.com");

			const res = await request(app).get(`${CART}/count`).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body).toBe(0);
		});

		it("returns number of cart line items", async () => {
			const token = await registerAndLogin("cart-count-items@example.com");
			const bookA = await createBook();
			const bookB = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: bookA._id,
				selectedFormat: "physical",
				quantity: 2,
			});

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: bookB._id,
				selectedFormat: "physical",
				quantity: 1,
			});

			const res = await request(app).get(`${CART}/count`).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body).toBe(2);
		});
	});

	describe("POST /api/cart/items", () => {
		it("adds an item and computes totals", async () => {
			const token = await registerAndLogin("cart-add@example.com");
			const book = await createBook();

			const res = await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 2,
			});

			expect(res.status).toBe(200);
			expect(res.body.items).toHaveLength(1);
			expect(res.body.items[0].quantity).toBe(2);
			expect(res.body.items[0].selectedFormat).toBe("physical");
			expect(res.body.items[0].unitPrice).toBe(19.99);
			expect(res.body.subtotal).toBe(39.98);
			expect(res.body.totalAmount).toBe(39.98);
		});

		it("merges quantity when same book and format are added again", async () => {
			const token = await registerAndLogin("cart-merge@example.com");
			const book = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 1,
			});

			const res = await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 3,
			});

			expect(res.status).toBe(200);
			expect(res.body.items).toHaveLength(1);
			expect(res.body.items[0].quantity).toBe(4);
			expect(res.body.subtotal).toBe(79.96);
		});

		it("returns 400 for unavailable selected format", async () => {
			const token = await registerAndLogin("cart-invalid-format@example.com");
			const book = await createBook();

			const res = await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "digital",
				quantity: 1,
			});

			expect(res.status).toBe(400);
		});
	});

	describe("DELETE /api/cart/items", () => {
		it("removes an item from cart", async () => {
			const token = await registerAndLogin("cart-remove@example.com");
			const book = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 2,
			});

			const res = await request(app).delete(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
			});

			expect(res.status).toBe(200);
			expect(res.body.items).toHaveLength(0);
			expect(res.body.subtotal).toBe(0);
			expect(res.body.totalAmount).toBe(0);
		});
	});

	describe("PATCH /api/cart/items", () => {
		it("updates quantity of an existing cart item", async () => {
			const token = await registerAndLogin("cart-patch@example.com");
			const book = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 1,
			});

			const res = await request(app).patch(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 5,
			});

			expect(res.status).toBe(200);
			expect(res.body.items).toHaveLength(1);
			expect(res.body.items[0].quantity).toBe(5);
			expect(res.body.subtotal).toBe(99.95);
		});

		it("returns 404 when trying to update non-existing cart item", async () => {
			const token = await registerAndLogin("cart-patch-missing@example.com");
			const book = await createBook();

			const res = await request(app).patch(`${CART}/items`).set("Authorization", `Bearer ${token}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 2,
			});

			expect(res.status).toBe(404);
		});
	});

	describe("Session isolation", () => {
		it("keeps cart items isolated per authenticated user", async () => {
			const tokenA = await registerAndLogin("cart-a@example.com");
			const tokenB = await registerAndLogin("cart-b@example.com");
			const book = await createBook();

			await request(app).post(`${CART}/items`).set("Authorization", `Bearer ${tokenA}`).send({
				bookId: book._id,
				selectedFormat: "physical",
				quantity: 1,
			});

			const cartA = await request(app).get(CART).set("Authorization", `Bearer ${tokenA}`);
			const cartB = await request(app).get(CART).set("Authorization", `Bearer ${tokenB}`);

			expect(cartA.status).toBe(200);
			expect(cartB.status).toBe(200);
			expect(cartA.body.items).toHaveLength(1);
			expect(cartB.body.items).toHaveLength(0);
		});
	});
});