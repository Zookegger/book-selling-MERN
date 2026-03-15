import mongoose from "mongoose";
import { Book, Author, Publisher, Category } from "@models";
import {
	createBook,
	listBooks,
	getBook,
	updateBook,
	deleteBook,
	addFormat,
	updateFormat,
	removeFormat,
} from "@services/book.services";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";

// ─── Test DB Setup ────────────────────────────────────────────────────────────

beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());
afterEach(async () => await clearTestDB());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeBook = async (overrides: Record<string, unknown> = {}) =>
	createBook({
		title: "Nineteen Eighty-Four",
		description: "A dystopian novel by George Orwell",
		publicationDate: new Date("1949-06-08"),
		language: "en",
		...overrides,
	});

const physicalFormat = {
	formatType: "physical" as const,
	sku: "SKU-PHYS-001",
	price: 14.99,
	stockQuantity: 50,
};

const digitalFormat = {
	formatType: "digital" as const,
	sku: "SKU-DIG-001",
	price: 7.99,
	fileFormat: "PDF" as const,
	fileSize: 1024000,
};

// ─── createBook ───────────────────────────────────────────────────────────────

describe("createBook()", () => {
	it("creates a book with required fields", async () => {
		const book = await makeBook();

		expect(book._id).toBeDefined();
		expect(book.title).toBe("Nineteen Eighty-Four");
		expect(book.description).toBe("A dystopian novel by George Orwell");
		expect(book.language).toBe("en");
	});

	it("stores createdAt and updatedAt timestamps", async () => {
		const book = await makeBook();
		expect(book.createdAt).toBeDefined();
		expect(book.updatedAt).toBeDefined();
	});

	it("creates a book with a physical format", async () => {
		const book = await makeBook({ formats: [physicalFormat] });

		expect(book.formats.length).toBe(1);
		expect(book.formats[0].formatType).toBe("physical");
		expect(book.formats[0].sku).toBe("SKU-PHYS-001");
	});

	it("creates a book with a digital format", async () => {
		const book = await makeBook({ formats: [digitalFormat] });

		expect(book.formats[0].formatType).toBe("digital");
		expect(book.formats[0].fileFormat).toBe("PDF");
	});

	it("creates a book linked to an author", async () => {
		const author = await Author.create({ name: "George Orwell" });
		const book = await makeBook({ authors: [author._id.toString()] });

		expect(book.authors[0].toString()).toBe(author._id.toString());
	});

	it("creates a book linked to a publisher", async () => {
		const publisher = await Publisher.create({ name: "Secker & Warburg" });
		const book = await makeBook({ publisher: publisher._id.toString() });

		expect(book.publisher!.toString()).toBe(publisher._id.toString());
	});

	it("creates a book linked to categories", async () => {
		const cat = await Category.create({ name: "Fiction", slug: "fiction" });
		const book = await makeBook({ categories: [cat._id.toString()] });

		expect(book.categories[0].toString()).toBe(cat._id.toString());
	});

	it("throws 400 when title is missing", async () => {
		await expect(
			createBook({
				title: "",
				description: "Some description",
				publicationDate: new Date(),
				language: "en",
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when description is missing", async () => {
		await expect(
			createBook({
				title: "Some Title",
				description: "",
				publicationDate: new Date(),
				language: "en",
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 409 when a book with the same ISBN already exists", async () => {
		await makeBook({ isbn: "978-0451524935" });
		await expect(makeBook({ isbn: "978-0451524935" })).rejects.toMatchObject({ statusCode: 409 });
	});

	it("throws 400 when a physical format includes a digital file field", async () => {
		await expect(
			makeBook({
				formats: [{ ...physicalFormat, file: "/path/to/ebook.pdf" }],
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when a digital format includes stockQuantity", async () => {
		await expect(
			makeBook({
				formats: [{ ...digitalFormat, stockQuantity: 10 }],
			}),
		).rejects.toMatchObject({ statusCode: 400 });
	});
});

// ─── listBooks ────────────────────────────────────────────────────────────────

describe("listBooks()", () => {
	beforeEach(async () => {
		await makeBook({ title: "Nineteen Eighty-Four", language: "en" });
		await makeBook({
			title: "Brave New World",
			description: "A dystopian novel by Aldous Huxley",
			language: "en",
		});
		await makeBook({
			title: "Fahrenheit 451",
			description: "A dystopian novel by Ray Bradbury",
			language: "en",
		});
	});

	it("returns all books with default pagination", async () => {
		const result = await listBooks({});
		expect(result.data.length).toBe(3);
		expect(result.total).toBe(3);
	});

	it("respects page and limit parameters", async () => {
		const result = await listBooks({ page: 1, limit: 2 });
		expect(result.data.length).toBe(2);
		expect(result.total).toBe(3);
		expect(result.totalPages).toBe(2);
	});

	it("returns second page correctly", async () => {
		const result = await listBooks({ page: 2, limit: 2 });
		expect(result.data.length).toBe(1);
	});

	it("filters books by title search (case insensitive)", async () => {
		const result = await listBooks({ search: "brave" });
		expect(result.data.length).toBe(1);
		expect(result.data[0].title).toBe("Brave New World");
	});

	it("returns empty array when search matches nothing", async () => {
		const result = await listBooks({ search: "Harry Potter" });
		expect(result.data.length).toBe(0);
		expect(result.total).toBe(0);
	});

	it("filters books by language", async () => {
		await makeBook({
			title: "Cien años de soledad",
			description: "Novel by Gabriel García Márquez",
			language: "es",
		});
		const result = await listBooks({ language: "es" });
		expect(result.data.length).toBe(1);
	});
});

// ─── getBook ──────────────────────────────────────────────────────────────────

describe("getBook()", () => {
	it("returns the book for a valid existing ID", async () => {
		const created = await makeBook();
		const found = await getBook(created._id.toString());

		expect(found).not.toBeNull();
		expect(found!.title).toBe("Nineteen Eighty-Four");
	});

	it("populates author, publisher and category references", async () => {
		const author = await Author.create({ name: "George Orwell" });
		const publisher = await Publisher.create({ name: "Secker & Warburg" });
		const category = await Category.create({ name: "Fiction", slug: "fiction" });

		const created = await makeBook({
			authors: [author._id.toString()],
			publisher: publisher._id.toString(),
			categories: [category._id.toString()],
		});

		const found = await getBook(created._id.toString());
		expect((found!.authors[0] as any).name).toBe("George Orwell");
		expect((found!.publisher as any).name).toBe("Secker & Warburg");
		expect((found!.categories[0] as any).name).toBe("Fiction");
	});

	it("returns null for a valid ObjectId that does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		expect(await getBook(fakeId)).toBeNull();
	});

	it("throws when given an invalid ObjectId", async () => {
		await expect(getBook("not-an-id")).rejects.toThrow();
	});
});

// ─── updateBook ───────────────────────────────────────────────────────────────

describe("updateBook()", () => {
	it("applies partial updates and returns the updated document", async () => {
		const created = await makeBook();
		const updated = await updateBook(created._id.toString(), { title: "Animal Farm" });

		expect(updated!.title).toBe("Animal Farm");
	});

	it("does not modify fields not included in the update", async () => {
		const created = await makeBook();
		const updated = await updateBook(created._id.toString(), { title: "Animal Farm" });

		expect(updated!.language).toBe("en");
	});

	it("throws 404 when book does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateBook(fakeId, { title: "Ghost Book" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});

// ─── deleteBook ───────────────────────────────────────────────────────────────

describe("deleteBook()", () => {
	it("deletes the book and returns the deleted document", async () => {
		const created = await makeBook();
		const deleted = await deleteBook(created._id.toString());

		expect(deleted).not.toBeNull();
		expect(deleted!._id.toString()).toBe(created._id.toString());
	});

	it("book no longer exists in DB after deletion", async () => {
		const created = await makeBook();
		await deleteBook(created._id.toString());

		expect(await Book.findById(created._id)).toBeNull();
	});

	it("throws 404 when book does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(deleteBook(fakeId)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws when given an invalid ObjectId", async () => {
		await expect(deleteBook("not-an-id")).rejects.toThrow();
	});
});

// ─── addFormat ────────────────────────────────────────────────────────────────

describe("addFormat()", () => {
	it("adds a format to an existing book", async () => {
		const book = await makeBook();
		const updated = await addFormat(book._id.toString(), physicalFormat);

		expect(updated!.formats.length).toBe(1);
		expect(updated!.formats[0].sku).toBe("SKU-PHYS-001");
	});

	it("adds multiple formats to the same book", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const updated = await addFormat(book._id.toString(), {
			...digitalFormat,
			sku: "SKU-DIG-002",
		});

		expect(updated!.formats.length).toBe(2);
	});

	it("throws 404 when book does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(addFormat(fakeId, physicalFormat)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws 400 when physical format includes a digital file", async () => {
		const book = await makeBook();
		await expect(
			addFormat(book._id.toString(), { ...physicalFormat, file: "/path/to/file.pdf" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when digital format includes stockQuantity", async () => {
		const book = await makeBook();
		await expect(
			addFormat(book._id.toString(), { ...digitalFormat, stockQuantity: 5 }),
		).rejects.toMatchObject({ statusCode: 400 });
	});
});

// ─── updateFormat ─────────────────────────────────────────────────────────────

describe("updateFormat()", () => {
	it("updates fields on an existing format", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0]._id!.toString();

		const updated = await updateFormat(book._id.toString(), formatId, { price: 19.99 });

		expect(updated!.formats[0].price).toBe(19.99);
	});

	it("does not modify fields not included in the update", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0]._id!.toString();

		const updated = await updateFormat(book._id.toString(), formatId, { price: 19.99 });
		expect(updated!.formats[0].sku).toBe("SKU-PHYS-001");
	});

	it("throws 404 when book does not exist", async () => {
		const fakeBookId = new mongoose.Types.ObjectId().toString();
		const fakeFormatId = new mongoose.Types.ObjectId().toString();
		await expect(updateFormat(fakeBookId, fakeFormatId, { price: 9.99 })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 404 when format does not exist on the book", async () => {
		const book = await makeBook();
		const fakeFormatId = new mongoose.Types.ObjectId().toString();
		await expect(updateFormat(book._id.toString(), fakeFormatId, { price: 9.99 })).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});

// ─── removeFormat ─────────────────────────────────────────────────────────────

describe("removeFormat()", () => {
	it("removes a format from the book", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0]._id!.toString();

		const updated = await removeFormat(book._id.toString(), formatId);
		expect(updated!.formats.length).toBe(0);
	});

	it("throws 404 when book does not exist", async () => {
		const fakeBookId = new mongoose.Types.ObjectId().toString();
		const fakeFormatId = new mongoose.Types.ObjectId().toString();
		await expect(removeFormat(fakeBookId, fakeFormatId)).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws 404 when format does not exist on the book", async () => {
		const book = await makeBook();
		const fakeFormatId = new mongoose.Types.ObjectId().toString();
		await expect(removeFormat(book._id.toString(), fakeFormatId)).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});
