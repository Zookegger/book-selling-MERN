import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { Author } from "@models";
import mongoose from "mongoose";

const AUTHORS = "/api/authors";

describe("Contract Tests: Author Management", () => {
	// ─── DB lifecycle ──────────────────────────────────────────────────────────

	beforeAll(async () => await connectTestDB());
	afterEach(async () => await clearTestDB());
	afterAll(async () => await closeTestDB());

	// ─── Helpers ───────────────────────────────────────────────────────────────

	const createAuthorPayload = (overrides = {}) => ({
		name: "George Orwell",
		email: "george.orwell@example.com",
		bio: "English novelist and essayist",
		website: "https://georgeorwell.com",
		...overrides,
	});

	const seedAuthor = () => request(app).post(AUTHORS).send(createAuthorPayload());

	// ─── POST /api/authors ─────────────────────────────────────────────────────

	describe("POST /api/authors", () => {
		it("returns 201 with the created author on success", async () => {
			const res = await request(app).post(AUTHORS).send(createAuthorPayload());

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.name).toBe("George Orwell");
			expect(res.body.slug).toBe("george-orwell");
			expect(res.body.bio).toBe("English novelist and essayist");
		});

		it("returns 400 when name is missing", async () => {
			const res = await request(app)
				.post(AUTHORS)
				.send(createAuthorPayload({ name: undefined }));
			expect(res.status).toBe(400);
		});

		it("returns 409 when slug already exists", async () => {
			await request(app).post(AUTHORS).send(createAuthorPayload());
			const res = await request(app)
				.post(AUTHORS)
				.send(createAuthorPayload({ email: "different.email@example.com" }));
			expect(res.status).toBe(409);
		});

		it("returns 400 when website is not a valid URL", async () => {
			const res = await request(app)
				.post(AUTHORS)
				.send(createAuthorPayload({ website: "not-a-url" }));
			expect(res.status).toBe(400);
		});

		it("does not expose internal metadata in the response", async () => {
			const res = await request(app).post(AUTHORS).send(createAuthorPayload());
			console.log(res.body);
			expect(res.body).not.toHaveProperty("__v");
		});
	});

	// ─── GET /api/authors ──────────────────────────────────────────────────────

	describe("GET /api/authors", () => {
		beforeEach(async () => {
			await Author.create({ name: "George Orwell", email: "george.orwell@example.com" });
			await Author.create({ name: "Aldous Huxley", email: "aldous.huxley@example.com" });
			await Author.create({ name: "Ray Bradbury", email: "ray.bradbury@example.com" });
		});

		it("returns 200 with a paginated list of authors", async () => {
			const res = await request(app).get(AUTHORS);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body).toHaveProperty("total");
			expect(res.body.data.length).toBe(3);
			expect(res.body.data[0]).toHaveProperty("slug");
		});

		it("respects ?limit query parameter", async () => {
			const res = await request(app).get(`${AUTHORS}?limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(2);
			expect(res.body.total).toBe(3);
		});

		it("respects ?page query parameter", async () => {
			const res = await request(app).get(`${AUTHORS}?page=2&limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
		});

		it("filters by ?search query parameter (case insensitive)", async () => {
			const res = await request(app).get(`${AUTHORS}?search=orwell`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
			expect(res.body.data[0].name).toBe("George Orwell");
			expect(res.body.data[0].slug).toBe("george-orwell");
		});
	});

	// ─── GET /api/authors/:id ──────────────────────────────────────────────────

	describe("GET /api/authors/:id", () => {
		it("returns 200 with the author when found", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app).get(`${AUTHORS}/${created.id}`);

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(created.id);
			expect(res.body.name).toBe("George Orwell");
			expect(res.body.slug).toBe("george-orwell");
		});

		it("returns 404 for a valid ObjectId that does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).get(`${AUTHORS}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 404 when slug identifier does not exist", async () => {
			const res = await request(app).get(`${AUTHORS}/does-not-exist`);
			expect(res.status).toBe(404);
		});
	});

	// ─── PATCH /api/authors/:id ────────────────────────────────────────────────

	describe("PATCH /api/authors/:id", () => {
		it("returns 200 with the updated author on success", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app)
				.patch(`${AUTHORS}/${created.id}`)
				.send({ name: "Eric Arthur Blair" });

			expect(res.status).toBe(200);
			expect(res.body.name).toBe("Eric Arthur Blair");
			expect(res.body.slug).toBe("george-orwell");
		});

		it("updates slug when provided", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app)
				.patch(`${AUTHORS}/${created.id}`)
				.send({ slug: "eric-arthur-blair" });

			expect(res.status).toBe(200);
			expect(res.body.slug).toBe("eric-arthur-blair");
		});

		it("does not change fields that are not included in the payload", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app)
				.patch(`${AUTHORS}/${created.id}`)
				.send({ bio: "Updated bio" });

			expect(res.status).toBe(200);
			expect(res.body.name).toBe("George Orwell");
			expect(res.body.slug).toBe("george-orwell");
		});

		it("returns 404 when author does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app)
				.patch(`${AUTHORS}/${fakeId}`)
				.send({ name: "Nobody" });
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid website URL", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app)
				.patch(`${AUTHORS}/${created.id}`)
				.send({ website: "bad-url" });
			expect(res.status).toBe(400);
		});

		it("returns 409 when updating slug to an existing slug", async () => {
			const { body: first } = await seedAuthor();
			const { body: second } = await request(app)
				.post(AUTHORS)
				.send(
					createAuthorPayload({
						name: "Aldous Huxley",
						email: "aldous.huxley@example.com",
					}),
				);

			const res = await request(app)
				.patch(`${AUTHORS}/${second.id}`)
				.send({ slug: first.slug });
			expect(res.status).toBe(409);
		});
	});

	// ─── DELETE /api/authors/:id ───────────────────────────────────────────────

	describe("DELETE /api/authors/:id", () => {
		it("returns 204 on successful deletion", async () => {
			const { body: created } = await seedAuthor();
			const res = await request(app).delete(`${AUTHORS}/${created.id}`);
			expect(res.status).toBe(204);
		});

		it("author is removed from the database after deletion", async () => {
			const { body: created } = await seedAuthor();
			await request(app).delete(`${AUTHORS}/${created.id}`);

			const found = await Author.findById(created.id);
			expect(found).toBeNull();
		});

		it("returns 404 when author does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${AUTHORS}/${fakeId}`);
			expect(res.status).toBe(404);
		});
	});
});
