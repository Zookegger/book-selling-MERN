import connectDB from "../config/db";
import { Author, Publisher, Category, Book } from "@models";

const seed = async () => {
	await connectDB();

	console.log("Connected to DB — seeding...");

	// Clear existing sample data (safe for local/dev only)
	await Promise.all([
		Author.deleteMany({}),
		Publisher.deleteMany({}),
		Category.deleteMany({}),
		Book.deleteMany({}),
	]);

	const authorsData = [
		{ name: "Nguyen Van A", bio: "Contemporary fiction author." },
		{ name: "Le Thi B", bio: "Children's books and illustrations." },
		{ name: "Tran C", bio: "Science and technology writer." },
		{ name: "Pham D", bio: "Historical novels." },
		{ name: "Hoang E", bio: "Poetry and essays." },
	];

	const publishersData = [
		{ name: "Horizon Press", address: "123 Main St" },
		{ name: "Lotus Publishing", address: "45 Nguyen Trai" },
		{ name: "Riverbank Books", address: "9 Tran Phu" },
	];

	const categoriesData = [
		{ name: "Fiction", slug: "fiction" },
		{ name: "Children", slug: "children" },
		{ name: "Technology", slug: "technology" },
		{ name: "History", slug: "history" },
	];

	const [authors, publishers, categories] = await Promise.all([
		Author.create(authorsData),
		Publisher.create(publishersData),
		Category.create(categoriesData),
	]);

	// Create 8 books (total documents ~5 authors + 3 publishers + 4 categories + 8 books = 20)
	const booksData = [
		{
			title: "Paths of Home",
			description: "A literary exploration of family and identity.",
			publicationDate: new Date("2019-05-01"),
			language: "en",
			pageCount: 320,
			publisher: publishers[0]._id,
			authors: [authors[0]._id],
			categories: [categories[0]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0001", price: 19.99, currency: "USD", active: true, stockQuantity: 120 },
				{ formatType: "digital", sku: "SKU-D-0001", price: 9.99, currency: "USD", active: true, fileFormat: "PDF", fileSize: 1_024_000 },
			],
		},
		{
			title: "Little Lanterns",
			description: "A collection of bedtime stories for young readers.",
			publicationDate: new Date("2021-09-10"),
			language: "en",
			pageCount: 48,
			publisher: publishers[1]._id,
			authors: [authors[1]._id],
			categories: [categories[1]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0002", price: 12.5, currency: "USD", active: true, stockQuantity: 300 },
				{ formatType: "digital", sku: "SKU-D-0002", price: 4.99, currency: "USD", active: true, fileFormat: "ePub", fileSize: 512_000 },
			],
		},
		{
			title: "Codes & Culture",
			description: "How software shapes modern society.",
			publicationDate: new Date("2020-02-20"),
			language: "en",
			pageCount: 260,
			publisher: publishers[2]._id,
			authors: [authors[2]._id],
			categories: [categories[2]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0003", price: 29.99, currency: "USD", active: true, stockQuantity: 80 },
				{ formatType: "digital", sku: "SKU-D-0003", price: 14.99, currency: "USD", active: true, fileFormat: "PDF", fileSize: 2_048_000 },
			],
		},
		{
			title: "River of Time",
			description: "A sweeping historical novel exploring generations.",
			publicationDate: new Date("2018-11-11"),
			language: "en",
			pageCount: 480,
			publisher: publishers[0]._id,
			authors: [authors[3]._id],
			categories: [categories[3]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0004", price: 24.99, currency: "USD", active: true, stockQuantity: 60 },
				{ formatType: "digital", sku: "SKU-D-0004", price: 11.99, currency: "USD", active: true, fileFormat: "MOBI", fileSize: 3_000_000 },
			],
		},
		{
			title: "Short Lines",
			description: "A book of contemporary poems and short essays.",
			publicationDate: new Date("2022-03-03"),
			language: "en",
			pageCount: 112,
			publisher: publishers[1]._id,
			authors: [authors[4]._id],
			categories: [categories[0]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0005", price: 16.0, currency: "USD", active: true, stockQuantity: 90 },
				{ formatType: "digital", sku: "SKU-D-0005", price: 6.99, currency: "USD", active: true, fileFormat: "ePub", fileSize: 750_000 },
			],
		},
		{
			title: "Pocket Reference: JS",
			description: "Practical JavaScript reference for developers.",
			publicationDate: new Date("2021-06-15"),
			language: "en",
			pageCount: 220,
			publisher: publishers[2]._id,
			authors: [authors[2]._id],
			categories: [categories[2]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0006", price: 34.5, currency: "USD", active: true, stockQuantity: 40 },
				{ formatType: "digital", sku: "SKU-D-0006", price: 17.5, currency: "USD", active: true, fileFormat: "PDF", fileSize: 4_000_000 },
			],
		},
		{
			title: "Growing Up in Saigon",
			description: "Memoir and reflections on urban life.",
			publicationDate: new Date("2017-08-08"),
			language: "en",
			pageCount: 200,
			publisher: publishers[0]._id,
			authors: [authors[0]._id, authors[4]._id],
			categories: [categories[3]._id, categories[0]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0007", price: 18.0, currency: "USD", active: true, stockQuantity: 75 },
			],
		},
		{
			title: "Tiny Machines",
			description: "An illustrated guide to simple robots for kids.",
			publicationDate: new Date("2023-01-01"),
			language: "en",
			pageCount: 64,
			publisher: publishers[1]._id,
			authors: [authors[1]._id, authors[2]._id],
			categories: [categories[1]._id, categories[2]._id],
			formats: [
				{ formatType: "physical", sku: "SKU-P-0008", price: 14.99, currency: "USD", active: true, stockQuantity: 150 },
				{ formatType: "digital", sku: "SKU-D-0008", price: 7.99, currency: "USD", active: true, fileFormat: "PDF", fileSize: 1_200_000 },
			],
		},
	];

	const books = await Book.create(booksData);

	console.log(`Seeded: ${authors.length} authors, ${publishers.length} publishers, ${categories.length} categories, ${books.length} books`);
	process.exit(0);
};

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
