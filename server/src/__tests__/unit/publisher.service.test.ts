import mongoose from "mongoose";
import { Publisher } from "@models";
import {
	createPublisher,
	listPublishers,
	getPublisher,
	updatePublisher,
	deletePublisher,
} from "@services/publisher.services";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";

// ─── Test DB Setup ────────────────────────────────────────────────────────────

beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());
afterEach(async () => await clearTestDB());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePublisher = (overrides = {}) =>
	createPublisher({
		name: "Penguin Random House",
		location: { address: "1745 Broadway", city: "New York", country: "US" },
		contactEmail: "contact@penguinrandomhouse.com",
		...overrides,
	});

// ─── createPublisher ──────────────────────────────────────────────────────────

describe("createPublisher()", () => {
	it("creates a publisher with the correct fields", async () => {
		const publisher = await makePublisher();

		expect(publisher).toHaveProperty("id");
		expect(publisher.name).toBe("Penguin Random House");
		expect(publisher.location?.address).toBe("1745 Broadway");
		expect(publisher.location?.city).toBe("New York");
		expect(publisher.contactEmail).toBe("contact@penguinrandomhouse.com");
	});

	it("defaults isActive to true when not provided", async () => {
		const publisher = await makePublisher();
		expect(publisher.isActive).toBe(true);
	});

	it("creates a publisher without optional fields", async () => {
		const publisher = await makePublisher({ location: {} });

		expect(publisher.description).toBeUndefined();
		expect(publisher.website).toBeUndefined();
		expect(publisher.location.address).toBeUndefined();
		expect(publisher.location.city).toBeUndefined();
		expect(publisher.location.country).toBeUndefined();
	});

	it("generates a slug from the name when not provided", async () => {
		const publisher = await makePublisher();
		expect(publisher.slug).toBeDefined();
		expect(typeof publisher.slug).toBe("string");
	});

	it("throws 400 when name is missing", async () => {
		await expect(createPublisher({ name: "" })).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when contactEmail is not a valid email", async () => {
		await expect(createPublisher({ name: "Test", contactEmail: "not-an-email" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("stores createdAt and updatedAt timestamps", async () => {
		const publisher = await makePublisher();
		expect(publisher.createdAt).toBeDefined();
		expect(publisher.updatedAt).toBeDefined();
	});

	it("throws 409 when name already exists", async () => {
		await makePublisher({ name: "Existing Name", contactEmail: "existing-name@example.com" });
		await expect(
			makePublisher({ name: "Existing Name", contactEmail: "new-email@example.com" }),
		).rejects.toMatchObject({ statusCode: 409 });
	});

	it("throws 409 when contactEmail already exists", async () => {
		await makePublisher({ name: "Publisher A", contactEmail: "shared@example.com" });
		await expect(makePublisher({ name: "Publisher B", contactEmail: "shared@example.com" })).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("throws 409 when unique slug is duplicated at save time", async () => {
		await Publisher.syncIndexes();
		await makePublisher({ name: "A B", contactEmail: "publisher-a@example.com" });

		await expect(
			makePublisher({ name: "A-B", contactEmail: "publisher-b@example.com" }),
		).rejects.toMatchObject({ statusCode: 409 });
	});
});

// ─── listPublishers ───────────────────────────────────────────────────────────

describe("listPublishers()", () => {
	beforeEach(async () => {
		await createPublisher({ name: "Penguin Random House", contactEmail: "contact@penguinrandomhouse.com" });
		await createPublisher({ name: "Harper Collins", contactEmail: "contact@harpercollins.com" });
		await createPublisher({ name: "Simon & Schuster", contactEmail: "contact@simonandschuster.com" });
	});

	it("returns all publishers with default pagination", async () => {
		const result = await listPublishers({});
		expect(result.data.length).toBe(3);
		expect(result.total).toBe(3);
	});

	it("respects page and limit parameters", async () => {
		const result = await listPublishers({ page: 1, limit: 2 });
		expect(result.data.length).toBe(2);
		expect(result.total).toBe(3);
		expect(result.page).toBe(1);
		expect(result.totalPages).toBe(2);
	});

	it("returns second page correctly", async () => {
		const result = await listPublishers({ page: 2, limit: 2 });
		expect(result.data.length).toBe(1);
	});

	it("filters publishers by name (case insensitive)", async () => {
		const result = await listPublishers({ search: "harper" });
		expect(result.data.length).toBe(1);
		expect(result.data[0].name).toBe("Harper Collins");
	});

	it("returns empty array when search matches nothing", async () => {
		const result = await listPublishers({ search: "nonexistent" });
		expect(result.data.length).toBe(0);
		expect(result.total).toBe(0);
	});
});

// ─── getPublisher ─────────────────────────────────────────────────────────────

describe("getPublisher()", () => {
	let publisher: any;

	beforeEach(async () => {
		publisher = await makePublisher({
			name: "Penguin Random House",
			slug: "penguin-random-house",
			contactEmail: "hello@penguin.com",
		});
	});

	it("returns the publisher for a valid existing ObjectId", async () => {
		const found = await getPublisher(publisher._id.toString());
		expect(found).not.toBeNull();
		expect(found!.name).toBe(publisher.name);
	});

	it("returns the publisher when queried by an existing slug", async () => {
		const found = await getPublisher(publisher.slug);
		expect(found).not.toBeNull();
		expect(found!.slug).toBe(publisher.slug);
	});

	it("returns the publisher when queried by an existing contactEmail", async () => {
		const found = await getPublisher(publisher.contactEmail);
		expect(found).not.toBeNull();
		expect(found!.contactEmail).toBe(publisher.contactEmail);
	});

	it("returns the publisher when queried by an exact existing name", async () => {
		const found = await getPublisher(publisher.name);
		expect(found).not.toBeNull();
		expect(found!.name).toBe(publisher.name);
	});

	it("returns null for a valid ObjectId that does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		const found = await getPublisher(fakeId);
		expect(found).toBeNull();
	});

	it("returns null for a string identifier that does not match any record", async () => {
		const found = await getPublisher("non-existent-ghost-string");
		expect(found).toBeNull();
	});
});

// ─── updatePublisher ──────────────────────────────────────────────────────────

describe("updatePublisher()", () => {
	it("updates specified fields and returns the updated document", async () => {
		const created = await makePublisher();
		const updated = await updatePublisher(created._id.toString(), { name: "Penguin Books" });

		expect(updated!.name).toBe("Penguin Books");
	});

	it("does not modify fields not included in the update", async () => {
		const created = await makePublisher();
		const updated = await updatePublisher(created._id.toString(), { location: { city: "London" } });

		expect(updated!.name).toBe("Penguin Random House");
	});

	it("throws 404 when publisher does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updatePublisher(fakeId, { name: "Ghost" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 400 when contactEmail is invalid", async () => {
		const created = await makePublisher();
		await expect(updatePublisher(created._id.toString(), { contactEmail: "bad-email" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 409 when updating slug to one that already exists", async () => {
		await makePublisher({ name: "Slug One", contactEmail: "slug-one@example.com", slug: "slug-one" });
		const created = await makePublisher({ name: "Slug Two", contactEmail: "slug-two@example.com", slug: "slug-two" });

		await expect(updatePublisher(created._id.toString(), { slug: "slug-one" })).rejects.toMatchObject({
			statusCode: 409,
		});
	});
});

// ─── deletePublisher ──────────────────────────────────────────────────────────

describe("deletePublisher()", () => {
	it("deletes the publisher and returns the deleted document", async () => {
		const created = await makePublisher();
		const deleted = await deletePublisher(created._id.toString());

		expect(deleted).not.toBeNull();
		expect(deleted!._id.toString()).toBe(created._id.toString());
	});

	it("publisher no longer exists in the DB after deletion", async () => {
		const created = await makePublisher();
		await deletePublisher(created._id.toString());

		const found = await Publisher.findById(created._id);
		expect(found).toBeNull();
	});

	it("throws 404 when publisher does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(deletePublisher(fakeId)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws when given an invalid ObjectId", async () => {
		await expect(deletePublisher("not-an-id")).rejects.toThrow();
	});
});
