import mongoose from "mongoose";
import { Category } from "@models";
import {
	createCategory,
	listCategories,
	getCategory,
	getCategoryTree,
	updateCategory,
	deleteCategory,
} from "@services/category.services";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";

// ─── Test DB Setup ────────────────────────────────────────────────────────────

beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());
afterEach(async () => await clearTestDB());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeCategory = (overrides = {}) =>
	createCategory({
		name: "Fiction",
		...overrides,
	});

// ─── createCategory ───────────────────────────────────────────────────────────

describe("createCategory()", () => {
	it("creates a category with the correct fields", async () => {
		const category = await makeCategory();

		expect(category._id).toBeDefined();
		expect(category.name).toBe("Fiction");
		expect(category.slug).toBe("fiction");
		expect(category.parent).toBeNull();
		expect(category.description).toBe("");
		expect(category.order).toBe(0);
		expect(category.ancestors).toEqual([]);
	});

	it("creates a child category with a parent reference and populated ancestors", async () => {
		const parent = await makeCategory();
		const child = await createCategory({
			name: "Science Fiction",
			parent: parent._id.toString(),
		});

		expect(child.parent!.toString()).toBe(parent._id.toString());
		expect(child.ancestors.map(String)).toContain(parent._id.toString());
	});

	it("throws 400 when name is missing", async () => {
		await expect(createCategory({ name: "" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 409 when slug already exists", async () => {
		await Category.syncIndexes();
		await createCategory({ name: "Sci Fi" });
		await expect(createCategory({ name: "Sci-Fi" })).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("throws 404 when parent is not found", async () => {
		const missingParentId = new mongoose.Types.ObjectId().toString();
		await expect(createCategory({ name: "Child", parent: missingParentId })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("stores createdAt and updatedAt timestamps", async () => {
		const category = await makeCategory();
		expect(category.createdAt).toBeDefined();
		expect(category.updatedAt).toBeDefined();
	});
});

// ─── listCategories ───────────────────────────────────────────────────────────

describe("listCategories()", () => {
	beforeEach(async () => {
		await createCategory({ name: "Fiction" });
		await createCategory({ name: "Non-Fiction" });
		await createCategory({ name: "Science Fiction" });
	});

	it("returns all categories with default pagination", async () => {
		const result = await listCategories({});
		expect(result.data.length).toBe(3);
		expect(result.total).toBe(3);
	});

	it("respects page and limit parameters", async () => {
		const result = await listCategories({ page: 1, limit: 2 });
		expect(result.data.length).toBe(2);
		expect(result.total).toBe(3);
		expect(result.page).toBe(1);
		expect(result.totalPages).toBe(2);
	});

	it("returns second page correctly", async () => {
		const result = await listCategories({ page: 2, limit: 2 });
		expect(result.data.length).toBe(1);
	});

	it("filters categories by name (case insensitive)", async () => {
		const result = await listCategories({ search: "fiction" });
		// Matches "Fiction" and "Science Fiction"
		expect(result.total).toBe(3);

		expect(result.data).toHaveLength(3);
		expect(result.data.length).toBe(3);
		expect(result.data.map((c) => c.name)).toEqual(
			expect.arrayContaining(["Fiction", "Non-Fiction", "Science Fiction"]),
		);
	});

	it("returns empty array when search matches nothing", async () => {
		const result = await listCategories({ search: "biography" });
		expect(result.data.length).toBe(0);
		expect(result.total).toBe(0);
	});

	it("sorts categories ascending alphabetically by default", async () => {
		const result = await listCategories({ order: "asc" });
		const names = result.data.map((c) => c.name.toLowerCase());
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
	});

	it("sorts categories descending alphabetically when order is desc", async () => {
		const result = await listCategories({ order: "desc" });
		const names = result.data.map((c) => c.name.toLowerCase());
		expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
	});
});

// ─── getCategory ──────────────────────────────────────────────────────────────

describe("getCategory()", () => {
	it("returns the category for a valid existing ID", async () => {
		const created = await makeCategory();
		const found = await getCategory(created._id.toString());

		expect(found).not.toBeNull();
		expect(found!.name).toBe("Fiction");
	});

	it("populates parent when present", async () => {
		const parent = await makeCategory();
		const child = await createCategory({
			name: "Science Fiction",
			parent: parent._id.toString(),
		});

		const found = await getCategory(child._id.toString());
		expect(found!.parent).toBeDefined();
	});

	it("returns the category when passed a valid slug", async () => {
		const created = await makeCategory();
		const found = await getCategory(created.slug);
		expect(found).not.toBeNull();
		expect(found!.slug).toBe(created.slug);
	});

	it("returns the category when passed a valid name", async () => {
		const created = await makeCategory();
		const found = await getCategory(created.name);
		expect(found).not.toBeNull();
		expect(found!.name).toBe(created.name);
	});

	it("returns null for a valid ObjectId that does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		const found = await getCategory(fakeId);
		expect(found).toBeNull();
	});
});

// ─── getCategoryTree ──────────────────────────────────────────────────────────

describe("getCategoryTree()", () => {
	it("returns only root categories when there are no children", async () => {
		await createCategory({ name: "Fiction" });
		await createCategory({ name: "Non-Fiction" });

		const tree = await getCategoryTree();
		expect(tree.length).toBe(2);
	});

	it("nests child categories under their parent", async () => {
		const parent = await createCategory({ name: "Fiction" });
		await createCategory({
			name: "Science Fiction",
			parent: parent._id.toString(),
		});

		const tree = await getCategoryTree();
		const root = tree.find((c) => c.slug === "fiction");

		expect(root).toBeDefined();
		expect(root!.children).toBeDefined();
		expect(root!.children!.length).toBe(1);
		expect(root!.children![0].name).toBe("Science Fiction");
	});

	it("returns an empty array when there are no categories", async () => {
		const tree = await getCategoryTree();
		expect(tree).toEqual([]);
	});

	it("treats a category as root when its parent reference does not exist", async () => {
		const ghostParent = new mongoose.Types.ObjectId();
		await Category.create({ name: "Orphan", slug: "orphan", parent: ghostParent });

		const tree = await getCategoryTree();
		expect(tree.some((c) => c.slug === "orphan")).toBe(true);
	});
});

// ─── updateCategory ───────────────────────────────────────────────────────────

describe("updateCategory()", () => {
	it("updates specified fields and returns the updated document", async () => {
		const created = await makeCategory();
		const updated = await updateCategory(created._id.toString(), { name: "Literary Fiction" });

		expect(updated!.name).toBe("Literary Fiction");
	});

	it("does not modify fields not included in the update", async () => {
		const created = await makeCategory();
		const updated = await updateCategory(created._id.toString(), { name: "Literary Fiction" });

		expect(updated!.slug).toBe("fiction");
	});

	it("throws 404 when category does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateCategory(fakeId, { name: "Ghost" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 409 when updating slug to one that already exists", async () => {
		await createCategory({ name: "Non-Fiction" });
		const created = await makeCategory();

		await expect(updateCategory(created._id.toString(), { slug: "non-fiction" })).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("throws 400 when update payload is invalid", async () => {
		const created = await makeCategory();

		await expect(updateCategory(created._id.toString(), { order: -1 } as any)).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 400 when setting category as its own parent", async () => {
		const created = await makeCategory();

		await expect(updateCategory(created._id.toString(), { parent: created._id.toString() })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 404 when moving under a non-existing parent", async () => {
		const created = await makeCategory();
		const missingParentId = new mongoose.Types.ObjectId().toString();

		await expect(updateCategory(created._id.toString(), { parent: missingParentId })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 400 when moving a category under its descendant", async () => {
		const root = await createCategory({ name: "Root" });
		const child = await createCategory({ name: "Child", parent: root._id.toString() });

		await expect(updateCategory(root._id.toString(), { parent: child._id.toString() })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("updates descendants' ancestor chains when moving a subtree", async () => {
		const root = await createCategory({ name: "Root" });
		const child = await createCategory({ name: "Child", parent: root._id.toString() });
		const grandchild = await createCategory({ name: "Grandchild", parent: child._id.toString() });
		const newParent = await createCategory({ name: "New Parent" });

		const moved = await updateCategory(child._id.toString(), { parent: newParent._id.toString() });
		expect(moved).not.toBeNull();

		const updatedGrandchild = await Category.findById(grandchild._id).lean();
		expect(updatedGrandchild).not.toBeNull();
		expect(updatedGrandchild!.ancestors.map(String)).toEqual([
			newParent._id.toString(),
			child._id.toString(),
		]);
	});
});

// ─── deleteCategory ───────────────────────────────────────────────────────────

describe("deleteCategory()", () => {
	it("deletes the category and returns the deleted document", async () => {
		const created = await makeCategory();
		const deleted = await deleteCategory(created._id.toString());

		expect(deleted).not.toBeNull();
		expect(deleted!._id.toString()).toBe(created._id.toString());
	});

	it("category no longer exists in the DB after deletion", async () => {
		const created = await makeCategory();
		await deleteCategory(created._id.toString());

		const found = await Category.findById(created._id);
		expect(found).toBeNull();
	});

	it("throws 404 when category does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(deleteCategory(fakeId)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws when given an invalid ObjectId", async () => {
		await expect(deleteCategory("not-an-id")).rejects.toThrow();
	});
});
