import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { Book, Author, Publisher, Category } from "@models";
import mongoose from "mongoose";

const BOOKS = "/api/books";

describe("Contract Tests: Book Management", () => {
	// ─── DB lifecycle ──────────────────────────────────────────────────────────

	beforeAll(async () => await connectTestDB());
	afterEach(async () => await clearTestDB());
	afterAll(async () => await closeTestDB());

	// ─── Helpers ───────────────────────────────────────────────────────────────

	const createBookPayload = (overrides: Record<string, unknown> = {}) => ({
		title: "Nineteen Eighty-Four",
		description: "A dystopian novel by George Orwell",
		publicationDate: "1949-06-08",
		language: "en",
		...overrides,
	});

	const physicalFormat = {
		formatType: "physical",
		sku: "SKU-PHYS-001",
		price: 14.99,
		stockQuantity: 50,
	};

	const digitalFormat = {
		formatType: "digital",
		sku: "SKU-DIG-001",
		price: 7.99,
		fileFormat: "PDF",
		fileSize: 1024000,
	};

	const seedBook = (overrides: Record<string, unknown> = {}) =>
		request(app).post(BOOKS).send(createBookPayload(overrides));

	// ─── POST /api/books ───────────────────────────────────────────────────────

	describe("POST /api/books", () => {
		it("returns 201 with the created book on success", async () => {
			const res = await request(app).post(BOOKS).send(createBookPayload());

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("_id");
			expect(res.body.title).toBe("Nineteen Eighty-Four");
			expect(res.body.language).toBe("en");
		});

		it("creates a book with a physical format", async () => {
			const res = await seedBook({ formats: [physicalFormat] });

			expect(res.status).toBe(201);
			expect(res.body.formats.length).toBe(1);
			expect(res.body.formats[0].formatType).toBe("physical");
		});

		it("returns 400 when title is missing", async () => {
			const res = await request(app)
				.post(BOOKS)
				.send({ description: "Some description", publicationDate: "2024-01-01", language: "en" });
			expect(res.status).toBe(400);
		});

		it("returns 400 when description is missing", async () => {
			const res = await request(app)
				.post(BOOKS)
				.send({ title: "Some Title", publicationDate: "2024-01-01", language: "en" });
			expect(res.status).toBe(400);
		});

		it("returns 409 when ISBN already exists", async () => {
			await seedBook({ isbn: "978-0451524935" });
			const res = await seedBook({ isbn: "978-0451524935" });
			expect(res.status).toBe(409);
		});

		it("returns 400 when physical format includes a digital file field", async () => {
			const res = await seedBook({
				formats: [{ ...physicalFormat, file: "/path/to/file.pdf" }],
			});
			expect(res.status).toBe(400);
		});

		it("returns 400 when digital format includes stockQuantity", async () => {
			const res = await seedBook({
				formats: [{ ...digitalFormat, stockQuantity: 10 }],
			});
			expect(res.status).toBe(400);
		});

		it("creates a book linked to existing authors and categories", async () => {
			const author = await Author.create({ name: "George Orwell" });
			const cat = await Category.create({ name: "Fiction", slug: "fiction" });

			const res = await seedBook({
				authors: [author._id.toString()],
				categories: [cat._id.toString()],
			});

			expect(res.status).toBe(201);
			expect(res.body.authors).toContain(author._id.toString());
			expect(res.body.categories).toContain(cat._id.toString());
		});
	});

	// ─── GET /api/books ────────────────────────────────────────────────────────

	describe("GET /api/books", () => {
		beforeEach(async () => {
			await Book.create({
				title: "Nineteen Eighty-Four",
				description: "By Orwell",
				publicationDate: new Date("1949-06-08"),
				language: "en",
			});
			await Book.create({
				title: "Brave New World",
				description: "By Huxley",
				publicationDate: new Date("1932-01-01"),
				language: "en",
			});
			await Book.create({
				title: "Fahrenheit 451",
				description: "By Bradbury",
				publicationDate: new Date("1953-10-19"),
				language: "en",
			});
		});

		it("returns 200 with a paginated list of books", async () => {
			const res = await request(app).get(BOOKS);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("data");
			expect(res.body).toHaveProperty("total");
			expect(res.body.data.length).toBe(3);
		});

		it("respects ?limit query parameter", async () => {
			const res = await request(app).get(`${BOOKS}?limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(2);
			expect(res.body.total).toBe(3);
		});

		it("respects ?page query parameter", async () => {
			const res = await request(app).get(`${BOOKS}?page=2&limit=2`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
		});

		it("filters by ?search query parameter on title (case insensitive)", async () => {
			const res = await request(app).get(`${BOOKS}?search=brave`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
			expect(res.body.data[0].title).toBe("Brave New World");
		});

		it("filters by ?language query parameter", async () => {
			await Book.create({
				title: "Cien años de soledad",
				description: "By García Márquez",
				publicationDate: new Date("1967-05-30"),
				language: "es",
			});
			const res = await request(app).get(`${BOOKS}?language=es`);

			expect(res.status).toBe(200);
			expect(res.body.data.length).toBe(1);
		});
	});

	// ─── GET /api/books/:bookId ────────────────────────────────────────────────

	describe("GET /api/books/:bookId", () => {
		it("returns 200 with the book when found", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).get(`${BOOKS}/${created._id}`);

			expect(res.status).toBe(200);
			expect(res.body._id).toBe(created._id);
			expect(res.body.title).toBe("Nineteen Eighty-Four");
		});

		it("populates author, publisher, and category references", async () => {
			const author = await Author.create({ name: "George Orwell" });
			const publisher = await Publisher.create({ name: "Secker & Warburg" });
			const category = await Category.create({ name: "Fiction", slug: "fiction" });

			const { body: created } = await seedBook({
				authors: [author._id.toString()],
				publisher: publisher._id.toString(),
				categories: [category._id.toString()],
			});

			const res = await request(app).get(`${BOOKS}/${created._id}`);

			expect(res.status).toBe(200);
			expect(res.body.authors[0].name).toBe("George Orwell");
			expect(res.body.publisher.name).toBe("Secker & Warburg");
			expect(res.body.categories[0].name).toBe("Fiction");
		});

		it("returns 404 for a valid ObjectId that does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).get(`${BOOKS}/${fakeId}`);
			expect(res.status).toBe(404);
		});
	});

	// ─── PATCH /api/books/:bookId ──────────────────────────────────────────────

	describe("PATCH /api/books/:bookId", () => {
		it("returns 200 with the updated book on success", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).patch(`${BOOKS}/${created._id}`).send({ title: "Animal Farm" });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Animal Farm");
		});

		it("does not change fields that are not included in the payload", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).patch(`${BOOKS}/${created._id}`).send({ title: "Animal Farm" });

			expect(res.status).toBe(200);
			expect(res.body.language).toBe("en");
		});

		it("returns 404 when book does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).patch(`${BOOKS}/${fakeId}`).send({ title: "Ghost Book" });
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid ObjectId", async () => {
			const res = await request(app).get(`${BOOKS}/not-an-id`);
			expect(res.status).toBe(400);
		});
	});

	// ─── PUT /api/books/:bookId ────────────────────────────────────────────────

	describe("PUT /api/books/:bookId", () => {
		it("returns 200 with the fully replaced book on success", async () => {
			const { body: created } = await seedBook();
			const replacement = createBookPayload({
				title: "Animal Farm",
				description: "A satirical allegory",
				publicationDate: "1945-08-17",
				language: "en",
			});

			const res = await request(app).put(`${BOOKS}/${created._id}`).send(replacement);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Animal Farm");
			expect(res.body.description).toBe("A satirical allegory");
		});

		it("returns 400 when required fields are missing in replacement", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).put(`${BOOKS}/${created._id}`).send({ title: "Only Title" });
			expect(res.status).toBe(400);
		});

		it("returns 404 when book does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).put(`${BOOKS}/${fakeId}`).send(createBookPayload());
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid ObjectId", async () => {
			const res = await request(app).get(`${BOOKS}/not-an-id`);
			expect(res.status).toBe(400);
		});
	});

	// ─── DELETE /api/books/:bookId ─────────────────────────────────────────────

	describe("DELETE /api/books/:bookId", () => {
		it("returns 204 on successful deletion", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).delete(`${BOOKS}/${created._id}`);
			expect(res.status).toBe(204);
		});

		it("book is removed from the database after deletion", async () => {
			const { body: created } = await seedBook();
			await request(app).delete(`${BOOKS}/${created._id}`);

			expect(await Book.findById(created._id)).toBeNull();
		});

		it("returns 404 when book does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${BOOKS}/${fakeId}`);
			expect(res.status).toBe(404);
		});

		it("returns 400 for an invalid ObjectId", async () => {
			const res = await request(app).get(`${BOOKS}/not-an-id`);
			expect(res.status).toBe(400);
		});
	});

	// ─── POST /api/books/:bookId/formats ──────────────────────────────────────

	describe("POST /api/books/:bookId/formats", () => {
		it("returns 201 with the updated book containing the new format", async () => {
			const { body: created } = await seedBook();
			const res = await request(app).post(`${BOOKS}/${created._id}/formats`).send(physicalFormat);

			expect(res.status).toBe(201);
			expect(res.body.formats.length).toBe(1);
			expect(res.body.formats[0].sku).toBe("SKU-PHYS-001");
		});

		it("returns 404 when book does not exist", async () => {
			const fakeId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).post(`${BOOKS}/${fakeId}/formats`).send(physicalFormat);
			expect(res.status).toBe(404);
		});

		it("returns 400 when physical format includes a digital file", async () => {
			const { body: created } = await seedBook();
			const res = await request(app)
				.post(`${BOOKS}/${created._id}/formats`)
				.send({ ...physicalFormat, file: "/bad/path.pdf" });
			expect(res.status).toBe(400);
		});
	});

	// ─── PUT /api/books/:bookId/formats/:formatId ─────────────────────────────

	describe("PUT /api/books/:bookId/formats/:formatId", () => {
		it("returns 200 with the updated format", async () => {
			const { body: created } = await seedBook({ formats: [physicalFormat] });
			const formatId = created.formats[0]._id;

			const res = await request(app).put(`${BOOKS}/${created._id}/formats/${formatId}`).send({ price: 19.99 });

			expect(res.status).toBe(200);
			expect(res.body.formats[0].price).toBe(19.99);
		});

		it("returns 404 when book does not exist", async () => {
			const fakeBookId = new mongoose.Types.ObjectId().toString();
			const fakeFormatId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).put(`${BOOKS}/${fakeBookId}/formats/${fakeFormatId}`).send({ price: 9.99 });
			expect(res.status).toBe(404);
		});

		it("returns 404 when format does not exist on the book", async () => {
			const { body: created } = await seedBook();
			const fakeFormatId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).put(`${BOOKS}/${created._id}/formats/${fakeFormatId}`).send({ price: 9.99 });
			expect(res.status).toBe(404);
		});
	});

	// ─── DELETE /api/books/:bookId/formats/:formatId ──────────────────────────

	describe("DELETE /api/books/:bookId/formats/:formatId", () => {
		it("returns 204 on successful format removal", async () => {
			const { body: created } = await seedBook({ formats: [physicalFormat] });
			const formatId = created.formats[0]._id;

			const res = await request(app).delete(`${BOOKS}/${created._id}/formats/${formatId}`);
			expect(res.status).toBe(204);
		});

		it("format is removed from the book in the database", async () => {
			const { body: created } = await seedBook({ formats: [physicalFormat] });
			const formatId = created.formats[0]._id;

			await request(app).delete(`${BOOKS}/${created._id}/formats/${formatId}`);

			const book = await Book.findById(created._id);
			expect(book!.formats.length).toBe(0);
		});

		it("returns 404 when book does not exist", async () => {
			const fakeBookId = new mongoose.Types.ObjectId().toString();
			const fakeFormatId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${BOOKS}/${fakeBookId}/formats/${fakeFormatId}`);
			expect(res.status).toBe(404);
		});

		it("returns 404 when format does not exist on the book", async () => {
			const { body: created } = await seedBook();
			const fakeFormatId = new mongoose.Types.ObjectId().toString();
			const res = await request(app).delete(`${BOOKS}/${created._id}/formats/${fakeFormatId}`);
			expect(res.status).toBe(404);
		});
	});
});
