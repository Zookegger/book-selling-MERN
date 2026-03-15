/**
 * Contract tests for Publisher CRUD endpoints.
 *
 * These tests are in RED state — they define the expected HTTP contract.
 * Implementing the routes at /api/publishers will make them GREEN.
 * DO NOT add mocks — tests must exercise real implementations.
 */
import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { Publisher } from "@models";
import mongoose from "mongoose";

const PUBLISHERS = "/api/publishers";

describe("Contract Tests: Publisher Management", () => {
	// ─── DB lifecycle ──────────────────────────────────────────────────────────

	beforeAll(async () => await connectTestDB());
	afterEach(async () => await clearTestDB());
	afterAll(async () => await closeTestDB());

	// ─── Helpers ───────────────────────────────────────────────────────────────

	const createPublisherPayload = (overrides = {}) => ({
		name: "Penguin Random House",
		location: { address: "1745 Broadway", city: "New York", country: "US" },
		contactEmail: "contact@penguinrandomhouse.com",
		...overrides,
	});

	const seedPublisher = () => request(app).post(PUBLISHERS).send(createPublisherPayload());

	// ─── POST /api/publishers ──────────────────────────────────────────────────

	describe("POST /api/publishers", () => {
		it("returns 201 with the created publisher on success", async () => {
			const res = await request(app).post(PUBLISHERS).send(createPublisherPayload());

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.name).toBe("Penguin Random House");
			expect(res.body.location?.address).toBe("1745 Broadway");
			expect(res.body.contactEmail).toBe("contact@penguinrandomhouse.com");
		});

		it("returns 400 when name is missing", async () => {
			const res = await request(app).post(PUBLISHERS).send({ address: "Some address" });
			expect(res.status).toBe(400);
		});

		it("returns 400 when contactEmail is not a valid email", async () => {
			const res = await request(app)
				.post(PUBLISHERS)
				.send(createPublisherPayload({ contactEmail: "not-an-email" }));
			expect(res.status).toBe(400);
		});

		it("creates a publisher without optional fields", async () => {
			const res = await request(app)
				.post(PUBLISHERS)
				.send({ name: "Minimal Publisher", contactEmail: "contact@minimal-publisher.com" });

			expect(res.status).toBe(201);
			expect(res.body.name).toBe("Minimal Publisher");
		});

		it("returns 400 when website is not a valid URL", async () => {
			const res = await request(app)
				.post(PUBLISHERS)
				.send(createPublisherPayload({ website: "not-a-url" }));
			expect(res.status).toBe(400);
		});

		it("returns 409 when contactEmail already exists", async () => {
			await seedPublisher();
			const res = await request(app)
				.post(PUBLISHERS)
				.send(createPublisherPayload({ name: "Other Publisher" }));
			expect(res.status).toBe(409);
		});
	});

	// ─── GET /api/publishers ───────────────────────────────────────────────────

	describe("GET /api/publishers", () => {
		beforeEach(async () => {
			await Publisher.create({ name: "Penguin Random House", contactEmail: "contact@penguinrandomhouse.com" });
			await Publisher.create({ name: "Harper Collins", contactEmail: "contact@harpercollins.com" });
			await Publisher.create({ name: "Simon & Schuster", contactEmail: "contact@simonandschuster.com" });
		});

		it("returns 200 with a paginated list of publishers", async () => {
			const res = await request(app).get(PUBLISHERS);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body).toHaveProperty("total");
			expect(res.body.data.length).toBe(3);
		});

		it("respects ?limit query parameter", async () => {
			const res = await request(app).get(`${PUBLISHERS}?limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(2);
			expect(res.body.total).toBe(3);
		});

		it("respects ?page query parameter", async () => {
			const res = await request(app).get(`${PUBLISHERS}?page=2&limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
		});

		it("filters by ?search query parameter (case insensitive)", async () => {
			const res = await request(app).get(`${PUBLISHERS}?search=harper`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
			expect(res.body.data[0].name).toBe("Harper Collins");
			expect(res.body.data[0].slug).toBe("harper-collins");
		});
	});

	// ─── GET /api/publishers/:id ───────────────────────────────────────────────

	describe("GET /api/publishers/:id", () => {
		it("returns 200 with the publisher when found", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app).get(`${PUBLISHERS}/${created.id}`);

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(created.id);
			expect(res.body.name).toBe("Penguin Random House");
		});

		it("returns 404 for a valid ObjectId that does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).get(`${PUBLISHERS}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 404 when slug identifier does not match any publisher", async () => {
			const res = await request(app).get(`${PUBLISHERS}/does-not-exist`);
			expect(res.status).toBe(404);
		});
	});

	// ─── PATCH /api/publishers/:id ─────────────────────────────────────────────

	describe("PATCH /api/publishers/:id", () => {
		it("returns 200 with the updated publisher on success", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app).patch(`${PUBLISHERS}/${created.id}`).send({ name: "Penguin Books" });

			expect(res.status).toBe(200);
			expect(res.body.name).toBe("Penguin Books");
		});

		it("does not change fields that are not included in the payload", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app)
				.patch(`${PUBLISHERS}/${created.id}`)
				.send({ location: { city: "London" } });

			expect(res.status).toBe(200);
			expect(res.body.name).toBe("Penguin Random House");
		});

		it("returns 404 when publisher does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).patch(`${PUBLISHERS}/${fakeId}`).send({ name: "Nobody" });
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid contactEmail", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app).patch(`${PUBLISHERS}/${created.id}`).send({ contactEmail: "bad-email" });
			expect(res.status).toBe(400);
		});

		it("returns 400 for an invalid website URL", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app).patch(`${PUBLISHERS}/${created.id}`).send({ website: "not-a-url" });
			expect(res.status).toBe(400);
		});

		it("returns 400 for an invalid ObjectId on :id", async () => {
			const res = await request(app).patch(`${PUBLISHERS}/not-an-id`).send({ name: "Ghost" });
			expect(res.status).toBe(400);
		});
	});

	// ─── DELETE /api/publishers/:id ────────────────────────────────────────────

	describe("DELETE /api/publishers/:id", () => {
		it("returns 204 on successful deletion", async () => {
			const { body: created } = await seedPublisher();
			const res = await request(app).delete(`${PUBLISHERS}/${created.id}`);
			expect(res.status).toBe(204);
		});

		it("publisher is removed from the database after deletion", async () => {
			const { body: created } = await seedPublisher();
			await request(app).delete(`${PUBLISHERS}/${created.id}`);

			const found = await Publisher.findById(created.id);
			expect(found).toBeNull();
		});

		it("returns 404 when publisher does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${PUBLISHERS}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid ObjectId", async () => {
			const res = await request(app).delete(`${PUBLISHERS}/not-an-id`);
			expect(res.status).toBe(400);
		});
	});
});
