/**
 * Contract tests for Category CRUD endpoints.
 *
 * These tests are in RED state — they define the expected HTTP contract.
 * Implementing the routes at /api/categories will make them GREEN.
 * DO NOT add mocks — tests must exercise real implementations.
 */
import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { Category } from "@models";
import mongoose from "mongoose";

const CATEGORIES = "/api/categories";

describe("Contract Tests: Category Management", () => {
	// ─── DB lifecycle ──────────────────────────────────────────────────────────

	beforeAll(async () => await connectTestDB());
	afterEach(async () => await clearTestDB());
	afterAll(async () => await closeTestDB());

	// ─── Helpers ───────────────────────────────────────────────────────────────

	const createCategoryPayload = (overrides = {}) => ({
		name: "Fiction",
		...overrides,
	});

	const seedCategory = (overrides = {}) =>
		request(app).post(CATEGORIES).send(createCategoryPayload(overrides));

	// ─── POST /api/categories ──────────────────────────────────────────────────

	describe("POST /api/categories", () => {
		it("returns 201 with the created category on success", async () => {
			const res = await request(app).post(CATEGORIES).send(createCategoryPayload());

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.name).toBe("Fiction");
			expect(res.body.slug).toBe("fiction");
			expect(res.body.parent).toBeNull();
			expect(res.body.description).toBe("");
			expect(res.body.order).toBe(0);
			expect(res.body.ancestors).toEqual([]);
		});

		it("creates a child category with a valid parent ID and populates ancestors", async () => {
			const { body: parent } = await seedCategory();
			const res = await request(app).post(CATEGORIES).send({
				name: "Science Fiction",
				parent: parent.id,
			});

			expect(res.status).toBe(201);
			expect(res.body.parent).toBe(parent.id);
			expect(res.body.ancestors).toContain(parent.id);
		});

		it("returns 400 when name is missing", async () => {
			const res = await request(app).post(CATEGORIES).send({ slug: "no-name" });
			expect(res.status).toBe(400);
		});

		it("returns 409 when slug already exists", async () => {
			await seedCategory();
			const res = await request(app).post(CATEGORIES).send(createCategoryPayload());
			expect(res.status).toBe(409);
		});

		it("returns 400 when parent ID is not a valid ObjectId", async () => {
			const res = await request(app).post(CATEGORIES).send(
				createCategoryPayload({ name: "Child", parent: "not-an-id" }),
			);
			expect(res.status).toBe(400);
		});

		it("returns 404 when parent ID does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).post(CATEGORIES).send(
				createCategoryPayload({ name: "Child", parent: fakeId }),
			);
			expect(res.status).toBe(404);
		});
	});

	// ─── GET /api/categories ───────────────────────────────────────────────────

	describe("GET /api/categories", () => {
		beforeEach(async () => {
			await Category.create({ name: "Fiction" });
			await Category.create({ name: "Non-Fiction" });
			await Category.create({ name: "Science Fiction" });
		});

		it("returns 200 with a paginated list of categories", async () => {
			const res = await request(app).get(CATEGORIES);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body).toHaveProperty("total");
			expect(res.body.data.length).toBe(3);
		});

		it("respects ?limit query parameter", async () => {
			const res = await request(app).get(`${CATEGORIES}?limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(2);
			expect(res.body.total).toBe(3);
		});

		it("respects ?page query parameter", async () => {
			const res = await request(app).get(`${CATEGORIES}?page=2&limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
		});

		it("filters by ?search query parameter (case insensitive)", async () => {
			const res = await request(app).get(`${CATEGORIES}?search=fiction`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(3);
			expect(res.body.data[0].name).toBe("Fiction");
			expect(res.body.data[0].slug).toBe("fiction");
		});
	});

	// ─── GET /api/categories/tree ──────────────────────────────────────────────

	describe("GET /api/categories/tree", () => {
		it("returns 200 with root categories at the top level", async () => {
			await Category.create({ name: "Fiction" });
			await Category.create({ name: "Non-Fiction" });

			const res = await request(app).get(`${CATEGORIES}/tree`);

			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body.length).toBe(2);
		});

		it("nests child categories under their parent", async () => {
			const parent = await Category.create({ name: "Fiction" });
			await Category.create({
				name: "Science Fiction",
				parent: parent.id,
			});

			const res = await request(app).get(`${CATEGORIES}/tree`);
			const root = res.body.find((c: any) => c.slug === "fiction");

			expect(res.status).toBe(200);
			expect(root).toBeDefined();
			expect(root.children.length).toBe(1);
			expect(root.children[0].name).toBe("Science Fiction");
		});

		it("returns empty array when no categories exist", async () => {
			const res = await request(app).get(`${CATEGORIES}/tree`);
			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});
	});

	// ─── GET /api/categories/:id ───────────────────────────────────────────────

	describe("GET /api/categories/:id", () => {
		it("returns 200 with the category when found", async () => {
			const { body: created } = await seedCategory();
			const res = await request(app).get(`${CATEGORIES}/${created.id}`);

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(created.id);
			expect(res.body.name).toBe("Fiction");
		});

		it("returns 404 for a valid ObjectId that does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).get(`${CATEGORIES}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 404 when slug identifier does not match any category", async () => {
			const res = await request(app).get(`${CATEGORIES}/does-not-exist`);
			expect(res.status).toBe(404);
		});
	});

	// ─── PATCH /api/categories/:id ─────────────────────────────────────────────

	describe("PATCH /api/categories/:id", () => {
		it("returns 200 with the updated category on success", async () => {
			const { body: created } = await seedCategory();
			const res = await request(app)
				.patch(`${CATEGORIES}/${created.id}`)
				.send({ name: "Literary Fiction" });

			expect(res.status).toBe(200);
			expect(res.body.name).toBe("Literary Fiction");
		});

		it("does not change fields that are not included in the payload", async () => {
			const { body: created } = await seedCategory();
			const res = await request(app)
				.patch(`${CATEGORIES}/${created.id}`)
				.send({ name: "Literary Fiction" });

			expect(res.status).toBe(200);
			expect(res.body.slug).toBe("fiction");
		});

		it("returns 404 when category does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app)
				.patch(`${CATEGORIES}/${fakeId}`)
				.send({ name: "Nobody" });
			expect(res.status).toBe(404);
		});

		it("returns 409 when updating slug to one that already exists", async () => {
			await seedCategory({ name: "Non-Fiction" });
			const { body: created } = await seedCategory({ name: "Mystery" });

			const res = await request(app)
				.patch(`${CATEGORIES}/${created.id}`)
				.send({ slug: "non-fiction" });
			expect(res.status).toBe(409);
		});

		it("returns 400 for an invalid ObjectId on :id", async () => {
			const res = await request(app)
				.patch(`${CATEGORIES}/not-an-id`)
				.send({ name: "Ghost" });
			expect(res.status).toBe(400);
		});

		it("returns 400 when moving a category under its own descendant", async () => {
			const { body: parent } = await seedCategory();
			const { body: child } = await seedCategory({ name: "Child", parent: parent.id });

			const res = await request(app)
				.patch(`${CATEGORIES}/${parent.id}`)
				.send({ parent: child.id });
			expect(res.status).toBe(400);
		});
	});

	// ─── DELETE /api/categories/:id ────────────────────────────────────────────

	describe("DELETE /api/categories/:id", () => {
		it("returns 204 on successful deletion", async () => {
			const { body: created } = await seedCategory();
			const res = await request(app).delete(`${CATEGORIES}/${created.id}`);
			expect(res.status).toBe(204);
		});

		it("category is removed from the database after deletion", async () => {
			const { body: created } = await seedCategory();
			await request(app).delete(`${CATEGORIES}/${created.id}`);

			const found = await Category.findById(created.id);
			expect(found).toBeNull();
		});

		it("returns 404 when category does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${CATEGORIES}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid ObjectId", async () => {
			const res = await request(app).delete(`${CATEGORIES}/not-an-id`);
			expect(res.status).toBe(400);
		});

		it("returns 400 when category still has children", async () => {
			const { body: parent } = await seedCategory();
			await seedCategory({ name: "Child", parent: parent.id });

			const res = await request(app).delete(`${CATEGORIES}/${parent.id}`);
			expect(res.status).toBe(400);
		});
	});
});
