import mongoose from "mongoose";
import { Book, Author, Publisher, Category } from "@models";
import {
	createBook,
	listBooks,
	getBook,
	replaceBook,
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

		expect(book.id).toBeDefined();
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
		const book = await makeBook({ authors: [author.id.toString()] });

		expect(book.authors[0].toString()).toBe(author.id.toString());
	});

	it("creates a book linked to a publisher", async () => {
		const publisher = await Publisher.create({ name: "Secker & Warburg" });
		const book = await makeBook({ publisher: publisher.id.toString() });

		expect(book.publisher!.toString()).toBe(publisher.id.toString());
	});

	it("creates a book linked to categories", async () => {
		const cat = await Category.create({ name: "Fiction", slug: "fiction" });
		const book = await makeBook({ categories: [cat.id.toString()] });

		expect(book.categories[0].toString()).toBe(cat.id.toString());
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
		const found = await getBook(created.id.toString());

		expect(found).not.toBeNull();
		expect(found!.title).toBe("Nineteen Eighty-Four");
	});

	it("populates author, publisher and category references", async () => {
		const author = await Author.create({ name: "George Orwell" });
		const publisher = await Publisher.create({ name: "Secker & Warburg" });
		const category = await Category.create({ name: "Fiction", slug: "fiction" });

		const created = await makeBook({
			authors: [author.id.toString()],
			publisher: publisher.id.toString(),
			categories: [category.id.toString()],
		});

		const found = await getBook(created.id.toString());
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

// ─── replaceBook ──────────────────────────────────────────────────────────────

describe("replaceBook()", () => {
	it("replaces an existing book and returns the replaced document", async () => {
		const created = await makeBook({ isbn: "978-0000000001" });
		const replaced = await replaceBook(created.id.toString(), {
			title: "Animal Farm",
			description: "Political satire",
			publicationDate: new Date("1945-08-17"),
			language: "en",
			isbn: "978-0000000002",
		});

		expect(replaced!.title).toBe("Animal Farm");
		expect(replaced!.isbn).toBe("978-0000000002");
	});

	it("throws 404 when replacing a non-existing book", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(
			replaceBook(fakeId, {
				title: "Ghost",
				description: "Ghost",
				publicationDate: new Date(),
				language: "en",
			}),
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("throws 400 when replace payload is invalid", async () => {
		const created = await makeBook();
		await expect(
			replaceBook(created.id.toString(), {
				title: "",
				description: "Invalid",
				publicationDate: new Date(),
				language: "en",
			} as any),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 409 when ISBN conflicts with another book", async () => {
		const existing = await makeBook({ isbn: "978-1111111111" });
		const target = await makeBook({ isbn: "978-2222222222", title: "Target" });

		await expect(
			replaceBook(target.id.toString(), {
				title: "Target Replaced",
				description: "Target Replaced",
				publicationDate: new Date(),
				language: "en",
				isbn: existing.isbn,
			}),
		).rejects.toMatchObject({ statusCode: 409 });
	});

	it("throws 409 when replacement creates duplicate format SKU", async () => {
		await makeBook({
			title: "Book A",
			formats: [{ ...physicalFormat, sku: "SKU-DUP-REPLACE" }],
		});
		const target = await makeBook({ title: "Book B" });

		await expect(
			replaceBook(target.id.toString(), {
				title: "Book B Replaced",
				description: "Book B Replaced",
				publicationDate: new Date(),
				language: "en",
				formats: [{ ...physicalFormat, sku: "SKU-DUP-REPLACE" }],
			}),
		).rejects.toMatchObject({ statusCode: 409 });
	});
});

// ─── updateBook ───────────────────────────────────────────────────────────────

describe("updateBook()", () => {
	it("applies partial updates and returns the updated document", async () => {
		const created = await makeBook();
		const updated = await updateBook(created.id.toString(), { title: "Animal Farm" });

		expect(updated!.title).toBe("Animal Farm");
	});

	it("does not modify fields not included in the update", async () => {
		const created = await makeBook();
		const updated = await updateBook(created.id.toString(), { title: "Animal Farm" });

		expect(updated!.language).toBe("en");
	});

	it("throws 404 when book does not exist", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateBook(fakeId, { title: "Ghost Book" })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 400 when update payload is invalid", async () => {
		const created = await makeBook();
		await expect(updateBook(created.id.toString(), { title: "" } as any)).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 409 when updating ISBN to an existing ISBN", async () => {
		await makeBook({ title: "Book A", isbn: "978-3333333333" });
		const bookB = await makeBook({ title: "Book B", isbn: "978-4444444444" });

		await expect(updateBook(bookB.id.toString(), { isbn: "978-3333333333" })).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("throws 409 when updating formats to duplicate SKU", async () => {
		await makeBook({
			title: "Book A",
			formats: [{ ...physicalFormat, sku: "SKU-DUP-UPDATE" }],
		});
		const bookB = await makeBook({ title: "Book B" });

		await expect(
			updateBook(bookB.id.toString(), {
				formats: [{ ...physicalFormat, sku: "SKU-DUP-UPDATE" }],
			}),
		).rejects.toMatchObject({ statusCode: 409 });
	});
});

// ─── deleteBook ───────────────────────────────────────────────────────────────

describe("deleteBook()", () => {
	it("deletes the book and returns the deleted document", async () => {
		const created = await makeBook();
		const deleted = await deleteBook(created.id.toString());

		expect(deleted).not.toBeNull();
		expect(deleted!.id.toString()).toBe(created.id.toString());
	});

	it("book no longer exists in DB after deletion", async () => {
		const created = await makeBook();
		await deleteBook(created.id.toString());

		expect(await Book.findById(created.id)).toBeNull();
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
		const updated = await addFormat(book.id.toString(), physicalFormat);

		expect(updated!.formats.length).toBe(1);
		expect(updated!.formats[0].sku).toBe("SKU-PHYS-001");
	});

	it("adds multiple formats to the same book", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const updated = await addFormat(book.id.toString(), {
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
			addFormat(book.id.toString(), { ...physicalFormat, file: "/path/to/file.pdf" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when digital format includes stockQuantity", async () => {
		const book = await makeBook();
		await expect(
			addFormat(book.id.toString(), { ...digitalFormat, stockQuantity: 5 }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 400 when format payload is invalid", async () => {
		const book = await makeBook();
		await expect(
			addFormat(book.id.toString(), { formatType: "physical", price: 12.5 } as any),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws 409 when adding a format with a duplicate global SKU", async () => {
		await makeBook({ formats: [{ ...physicalFormat, sku: "SKU-DUP-ADD" }] });
		const anotherBook = await makeBook({ title: "Another", isbn: "978-5555555555" });

		await expect(
			addFormat(anotherBook.id.toString(), { ...physicalFormat, sku: "SKU-DUP-ADD" }),
		).rejects.toMatchObject({ statusCode: 409 });
	});
});

// ─── updateFormat ─────────────────────────────────────────────────────────────

describe("updateFormat()", () => {
	it("updates fields on an existing format", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0].id!.toString();

		const updated = await updateFormat(book.id.toString(), formatId, { price: 19.99 });

		expect(updated!.formats[0].price).toBe(19.99);
	});

	it("does not modify fields not included in the update", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0].id!.toString();

		const updated = await updateFormat(book.id.toString(), formatId, { price: 19.99 });
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
		await expect(updateFormat(book.id.toString(), fakeFormatId, { price: 9.99 })).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("throws 400 when format update payload is invalid", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0].id!.toString();

		await expect(updateFormat(book.id.toString(), formatId, { price: -1 } as any)).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 400 when update violates digital-format business rules", async () => {
		const book = await makeBook({ formats: [digitalFormat] });
		const formatId = book.formats[0].id!.toString();

		await expect(updateFormat(book.id.toString(), formatId, { stockQuantity: 5 } as any)).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("throws 409 when updating a format SKU to a duplicate global SKU", async () => {
		await makeBook({
			title: "Book A",
			formats: [{ ...physicalFormat, sku: "SKU-DUP-FORMAT" }],
		});
		const bookB = await makeBook({
			title: "Book B",
			formats: [{ ...physicalFormat, sku: "SKU-UNIQUE-FORMAT" }],
		});
		const formatId = bookB.formats[0].id!.toString();

		await expect(
			updateFormat(bookB.id.toString(), formatId, { sku: "SKU-DUP-FORMAT" }),
		).rejects.toMatchObject({ statusCode: 409 });
	});
});

// ─── removeFormat ─────────────────────────────────────────────────────────────

describe("removeFormat()", () => {
	it("removes a format from the book", async () => {
		const book = await makeBook({ formats: [physicalFormat] });
		const formatId = book.formats[0].id!.toString();

		const updated = await removeFormat(book.id.toString(), formatId);
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
		await expect(removeFormat(book.id.toString(), fakeFormatId)).rejects.toMatchObject({
			statusCode: 404,
		});
	});
});
