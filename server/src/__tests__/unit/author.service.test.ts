import mongoose from "mongoose";
import { Author } from "@models";
import { createAuthor, listAuthors, getAuthor, updateAuthor, deleteAuthor } from "@services/author.services";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { HttpError } from "@middleware/error.middleware";

// ─── Test DB Setup ────────────────────────────────────────────────────────────

beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());
afterEach(async () => await clearTestDB());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeAuthor = (overrides = {}) =>
	createAuthor({
		name: "George Orwell",
		email: "george.orwell@example.com",
		bio: "English novelist and essayist",
		website: "https://georgeorwell.com",
		...overrides,
	});

// ─── createAuthor ─────────────────────────────────────────────────────────────

describe("createAuthor()", () => {
	it("creates an author with the correct fields", async () => {
		const author = await makeAuthor();

		expect(author).toHaveProperty("id");
		expect(author.name).toBe("George Orwell");
		expect(author.bio).toBe("English novelist and essayist");
		expect(author.website).toBe("https://georgeorwell.com");
	});

	it("defaults bio to an empty string when not provided", async () => {
		const author = await createAuthor({ name: "Anonymous", email: "anon@example.com" });
		expect(author.bio).toBe("");
	});

	it("creates an author without optional fields (birthDate, website)", async () => {
		const author = await createAuthor({ name: "No Extras", email: "noextras@example.com" });

		expect(author.birthDate).toBeUndefined();
		expect(author.website).toBeUndefined();
	});

	it("generates a slug from the name when not provided", async () => {
		const author = await createAuthor({
			name: "George Orwell",
			email: "george.orwell@example.com",
		});
		expect(author.slug).toBeDefined();
		expect(typeof author.slug).toBe("string");
	});

	it("throws 400 when name is missing", async () => {
		await expect(createAuthor({ name: "", email: "test@example.com" })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when email is invalid", async () => {
		await expect(createAuthor({ name: "Test", email: "not-an-email" })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 409 when email already exists", async () => {
		await makeAuthor();
		await expect(makeAuthor()).rejects.toMatchObject({ statusCode: 409 });
	});

	it("throws 400 when website is not a valid URL", async () => {
		await expect(
			createAuthor({ name: "Test", email: "test@example.com", website: "not-a-url" }),
		).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("stores createdAt and updatedAt timestamps", async () => {
		const author = await makeAuthor();
		expect(author.createdAt).toBeDefined();
		expect(author.updatedAt).toBeDefined();
	});

	it("rethrows unexpected persistence errors", async () => {
		const saveSpy = jest.spyOn(Author.prototype, "save").mockRejectedValueOnce(new Error("db boom"));

		await expect(createAuthor({ name: "Broken", email: "broken@example.com" })).rejects.toThrow("db boom");

		saveSpy.mockRestore();
	});
});

// ─── listAuthors ──────────────────────────────────────────────────────────────

describe("listAuthors()", () => {
	beforeEach(async () => {
		await createAuthor({ name: "George Orwell", email: "george.orwell@example.com" });
		await createAuthor({ name: "Aldous Huxley", email: "aldous.huxley@example.com" });
		await createAuthor({ name: "Ray Bradbury", email: "ray.bradbury@example.com" });
	});

	it("returns all authors with default pagination", async () => {
		const result = await listAuthors({});
		expect(result.data.length).toBe(3);
		expect(result.total).toBe(3);
	});

	it("respects page and limit parameters", async () => {
		const result = await listAuthors({ page: 1, limit: 2 });
		expect(result.data.length).toBe(2);
		expect(result.total).toBe(3);
		expect(result.page).toBe(1);
		expect(result.totalPages).toBe(2);
	});

	it("returns second page correctly", async () => {
		const result = await listAuthors({ page: 2, limit: 2 });
		expect(result.data.length).toBe(1);
	});

	it("filters authors by name (case insensitive)", async () => {
		const result = await listAuthors({ search: "orwell" });
		expect(result.data.length).toBe(1);
		expect(result.data[0].name).toBe("George Orwell");
	});

	it("returns empty array when search matches nothing", async () => {
		const result = await listAuthors({ search: "nonexistent" });
		expect(result.data.length).toBe(0);
		expect(result.total).toBe(0);
	});

	it("sorts authors ascending by createdAt by default", async () => {
		const result = await listAuthors({ order: "asc" });
		const dates = result.data.map((a) => new Date(a.createdAt).getTime());
		expect(dates).toEqual([...dates].sort((a, b) => a - b));
	});

	it("sorts authors descending by createdAt when order is desc", async () => {
		const result = await listAuthors({ order: "desc" });
		const dates = result.data.map((a) => new Date(a.createdAt).getTime());
		expect(dates).toEqual([...dates].sort((a, b) => b - a));
	});
});

// ─── getAuthor ────────────────────────────────────────────────────────────────

describe("getAuthor()", () => {
	it("returns the author for a valid existing ID", async () => {
		const created = await makeAuthor();
		const found = await getAuthor(created.id.toString());

		expect(found).not.toBeNull();
		expect(found!.name).toBe("George Orwell");
	});

	it("returns null for a valid ObjectId that does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		const found = await getAuthor(fakeId);
		expect(found).toBeNull();
	});

	it("returns the author by slug", async () => {
		const created = await makeAuthor();
		const found = await getAuthor(created.slug);

		expect(found).not.toBeNull();
		expect(found!.id.toString()).toBe(created.id.toString());
	});

	it("returns the author by email", async () => {
		const created = await makeAuthor();
		const found = await getAuthor(created.email);

		expect(found).not.toBeNull();
		expect(found!.id.toString()).toBe(created.id.toString());
	});

	it("returns the author by name", async () => {
		const created = await makeAuthor();
		const found = await getAuthor(created.name);

		expect(found).not.toBeNull();
		expect(found!.id.toString()).toBe(created.id.toString());
	});

	it("returns null when no author matches a non-ObjectId string", async () => {
		const found = await getAuthor("does-not-exist");
		expect(found).toBeNull();
	});
});

// ─── updateAuthor ─────────────────────────────────────────────────────────────

describe("updateAuthor()", () => {
	it("updates specified fields and returns the updated document", async () => {
		const created = await makeAuthor();
		const updated = await updateAuthor(created.id.toString(), { name: "Eric Arthur Blair" });

		expect(updated!.name).toBe("Eric Arthur Blair");
	});

	it("does not modify fields that are not included in the update", async () => {
		const created = await makeAuthor();
		const updated = await updateAuthor(created.id.toString(), { bio: "Updated bio" });

		expect(updated!.name).toBe("George Orwell");
	});

	it("throws 404 when author does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateAuthor(fakeId, { name: "Ghost" })).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws 400 when update data is invalid (bad URL)", async () => {
		const created = await makeAuthor();
		await expect(updateAuthor(created.id.toString(), { website: "bad-url" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 400 when ID is invalid", async () => {
		await expect(updateAuthor("not-an-id", { name: "Nope" })).rejects.toMatchObject({ statusCode: 400 });
	});
});

// ─── deleteAuthor ─────────────────────────────────────────────────────────────

describe("deleteAuthor()", () => {
	it("deletes the author and returns the deleted document", async () => {
		const created = await makeAuthor();
		const deleted = await deleteAuthor(created.id.toString());

		console.log(created);
		console.log(deleted);

		expect(deleted).not.toBeNull();
		expect(deleted!.id.toString()).toBe(created.id.toString());
	});

	it("author no longer exists in the DB after deletion", async () => {
		const created = await makeAuthor();
		await deleteAuthor(created.id.toString());

		const found = await Author.findById(created.id);
		expect(found).toBeNull();
	});

	it("throws 404 when author does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(deleteAuthor(fakeId)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws when given an invalid ObjectId", async () => {
		await expect(deleteAuthor("not-an-id")).rejects.toThrow();
	});
});
