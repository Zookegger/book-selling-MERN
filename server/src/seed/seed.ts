import mongoose, { Types } from "mongoose";
import slugify from "slugify";
import connectDB from "../config/db";
import { Author, Publisher, Category, Book } from "@models";

interface CategorySeed {
	slug: string;
	name: string;
	description: string;
	order: number;
	parentSlug?: string;
}

interface PublisherSeed {
	name: string;
	description: string;
	contactEmail: string;
	website: string;
	location: {
		address: string;
		city: string;
		country: string;
	};
}

interface BookFormatSeed {
	formatType: "physical" | "digital";
	price: number;
	discountedPrice?: number;
	stockQuantity?: number;
	weight?: number;
	dimensions?: string;
	fileFormat?: "PDF" | "ePub" | "MOBI";
	fileSize?: number;
}

interface BookSeed {
	title: string;
	subtitle?: string;
	description: string;
	publicationDate: string;
	language: string;
	pageCount: number;
	publisherName: string;
	authorNames: string[];
	categorySlugs: string[];
	formats: BookFormatSeed[];
}

const authorSeeds = [
	{
		name: "Maya Nguyen",
		email: "maya.nguyen@example.com",
		bio: "Writes literary fiction centered around migration and memory.",
		website: "https://authors.local/maya-nguyen",
	},
	{
		name: "Jonah Tran",
		email: "jonah.tran@example.com",
		bio: "Software engineer and technical author focused on backend systems.",
		website: "https://authors.local/jonah-tran",
	},
	{
		name: "Elena Pham",
		email: "elena.pham@example.com",
		bio: "Data storyteller working at the intersection of analytics and ethics.",
		website: "https://authors.local/elena-pham",
	},
	{
		name: "Noah Le",
		email: "noah.le@example.com",
		bio: "Children's writer creating science-inspired adventure books.",
		website: "https://authors.local/noah-le",
	},
	{
		name: "Iris Hoang",
		email: "iris.hoang@example.com",
		bio: "Historian documenting overlooked stories from Southeast Asia.",
		website: "https://authors.local/iris-hoang",
	},
	{
		name: "Daniel Vu",
		email: "daniel.vu@example.com",
		bio: "Product leader writing practical guides for builders.",
		website: "https://authors.local/daniel-vu",
	},
	{
		name: "Sophie Dao",
		email: "sophie.dao@example.com",
		bio: "Biographer and long-form journalist.",
		website: "https://authors.local/sophie-dao",
	},
];

const publisherSeeds: PublisherSeed[] = [
	{
		name: "North Harbor Press",
		description: "Independent publisher of modern fiction and essays.",
		contactEmail: "editorial@northharborpress.example.com",
		website: "https://publishers.local/north-harbor-press",
		location: { address: "14 Lakeview Avenue", city: "Seattle", country: "USA" },
	},
	{
		name: "Orbit Lane Books",
		description: "Specialized in technology, product, and startup books.",
		contactEmail: "hello@orbitlanebooks.example.com",
		website: "https://publishers.local/orbit-lane-books",
		location: { address: "88 Innovation Street", city: "San Francisco", country: "USA" },
	},
	{
		name: "Little Acorn House",
		description: "Children's and middle-grade educational publishing house.",
		contactEmail: "team@littleacornhouse.example.com",
		website: "https://publishers.local/little-acorn-house",
		location: { address: "9 Maple Road", city: "Singapore", country: "Singapore" },
	},
	{
		name: "Atlas Chronicle",
		description: "History, biography, and cultural studies publisher.",
		contactEmail: "contact@atlaschronicle.example.com",
		website: "https://publishers.local/atlas-chronicle",
		location: { address: "21 Heritage Plaza", city: "London", country: "UK" },
	},
];

const categorySeeds: CategorySeed[] = [
	{ slug: "fiction", name: "Fiction", description: "Narrative and literary works", order: 1 },
	{ slug: "non-fiction", name: "Non Fiction", description: "Informational and factual works", order: 2 },
	{ slug: "children", name: "Children", description: "Books for children and young readers", order: 3 },
	{ slug: "history", name: "History", description: "Historical analysis and narratives", order: 4 },
	{ slug: "technology", name: "Technology", description: "Technology and software topics", order: 5, parentSlug: "non-fiction" },
	{
		slug: "software-engineering",
		name: "Software Engineering",
		description: "Coding and system architecture",
		order: 6,
		parentSlug: "technology",
	},
	{ slug: "data-science", name: "Data Science", description: "Data analytics and ML", order: 7, parentSlug: "technology" },
	{ slug: "biography", name: "Biography", description: "Life stories and profiles", order: 8, parentSlug: "non-fiction" },
	{ slug: "business", name: "Business", description: "Product, leadership, and strategy", order: 9, parentSlug: "non-fiction" },
];

const bookSeeds: BookSeed[] = [
	{
		title: "The Quiet Monsoon",
		subtitle: "Stories Across Three Generations",
		description: "A family saga exploring identity, language, and belonging.",
		publicationDate: "2020-03-14",
		language: "en",
		pageCount: 356,
		publisherName: "North Harbor Press",
		authorNames: ["Maya Nguyen"],
		categorySlugs: ["fiction"],
		formats: [
			{ formatType: "physical", price: 24.99, discountedPrice: 19.99, stockQuantity: 120, weight: 0.62, dimensions: "21x14x2.7 cm" },
			{ formatType: "digital", price: 11.99, fileFormat: "ePub", fileSize: 2_300_000 },
		],
	},
	{
		title: "Building Type Safe APIs",
		description: "A practical guide to resilient backend APIs with TypeScript.",
		publicationDate: "2023-01-09",
		language: "en",
		pageCount: 428,
		publisherName: "Orbit Lane Books",
		authorNames: ["Jonah Tran"],
		categorySlugs: ["technology", "software-engineering"],
		formats: [
			{ formatType: "physical", price: 39.0, discountedPrice: 32.0, stockQuantity: 80, weight: 0.88, dimensions: "24x17x3 cm" },
			{ formatType: "digital", price: 18.5, fileFormat: "PDF", fileSize: 8_500_000 },
		],
	},
	{
		title: "Data Stories for Humans",
		subtitle: "How to Explain Complex Findings Clearly",
		description: "Narrative techniques for making analytics understandable and actionable.",
		publicationDate: "2022-06-01",
		language: "en",
		pageCount: 290,
		publisherName: "Orbit Lane Books",
		authorNames: ["Elena Pham"],
		categorySlugs: ["non-fiction", "data-science"],
		formats: [
			{ formatType: "physical", price: 31.5, stockQuantity: 70, weight: 0.71, dimensions: "23x15x2.2 cm" },
			{ formatType: "digital", price: 15.0, fileFormat: "PDF", fileSize: 6_200_000 },
		],
	},
	{
		title: "Little Explorers Space Camp",
		description: "An illustrated STEM adventure for curious young readers.",
		publicationDate: "2021-08-20",
		language: "en",
		pageCount: 84,
		publisherName: "Little Acorn House",
		authorNames: ["Noah Le"],
		categorySlugs: ["children", "technology"],
		formats: [
			{ formatType: "physical", price: 16.99, stockQuantity: 250, weight: 0.29, dimensions: "25x20x0.9 cm" },
			{ formatType: "digital", price: 7.99, fileFormat: "PDF", fileSize: 3_100_000 },
		],
	},
	{
		title: "Ledger of Empires",
		description: "Trade routes, diplomacy, and conflict in maritime Asia.",
		publicationDate: "2019-11-03",
		language: "en",
		pageCount: 512,
		publisherName: "Atlas Chronicle",
		authorNames: ["Iris Hoang"],
		categorySlugs: ["history", "non-fiction"],
		formats: [
			{ formatType: "physical", price: 42.0, discountedPrice: 35.0, stockQuantity: 50, weight: 1.1, dimensions: "24x16x4 cm" },
			{ formatType: "digital", price: 20.0, fileFormat: "MOBI", fileSize: 9_300_000 },
		],
	},
	{
		title: "Product Thinking Handbook",
		description: "Field-tested methods for building products users keep returning to.",
		publicationDate: "2024-02-12",
		language: "en",
		pageCount: 338,
		publisherName: "Orbit Lane Books",
		authorNames: ["Daniel Vu"],
		categorySlugs: ["business", "non-fiction"],
		formats: [
			{ formatType: "physical", price: 33.0, discountedPrice: 27.5, stockQuantity: 95, weight: 0.66, dimensions: "22x14x2.1 cm" },
			{ formatType: "digital", price: 14.0, fileFormat: "ePub", fileSize: 5_100_000 },
		],
	},
	{
		title: "From Bug to Blueprint",
		description: "Debugging habits and architectural patterns for scaling teams.",
		publicationDate: "2022-10-04",
		language: "en",
		pageCount: 374,
		publisherName: "Orbit Lane Books",
		authorNames: ["Jonah Tran", "Daniel Vu"],
		categorySlugs: ["software-engineering", "technology"],
		formats: [
			{ formatType: "physical", price: 36.5, stockQuantity: 65, weight: 0.79, dimensions: "23x15x2.6 cm" },
			{ formatType: "digital", price: 17.0, fileFormat: "PDF", fileSize: 7_900_000 },
		],
	},
	{
		title: "Women Who Rewired the World",
		subtitle: "Profiles in Technology Leadership",
		description: "A collection of biographies highlighting innovators who reshaped technology.",
		publicationDate: "2023-09-29",
		language: "en",
		pageCount: 304,
		publisherName: "Atlas Chronicle",
		authorNames: ["Sophie Dao", "Elena Pham"],
		categorySlugs: ["biography", "technology"],
		formats: [
			{ formatType: "physical", price: 29.99, stockQuantity: 85, weight: 0.58, dimensions: "21x14x1.9 cm" },
			{ formatType: "digital", price: 13.99, fileFormat: "ePub", fileSize: 4_600_000 },
		],
	},
	{
		title: "Tiny Robots Big Dreams",
		description: "Hands-on robotics concepts explained for children.",
		publicationDate: "2025-01-18",
		language: "en",
		pageCount: 96,
		publisherName: "Little Acorn House",
		authorNames: ["Noah Le", "Elena Pham"],
		categorySlugs: ["children", "technology"],
		formats: [
			{ formatType: "physical", price: 18.5, stockQuantity: 210, weight: 0.34, dimensions: "25x20x1.2 cm" },
			{ formatType: "digital", price: 8.5, fileFormat: "PDF", fileSize: 3_500_000 },
		],
	},
	{
		title: "Node at Scale",
		subtitle: "Production Patterns for Real Traffic",
		description: "Operational guidance for running high-volume Node.js services safely.",
		publicationDate: "2024-11-05",
		language: "en",
		pageCount: 446,
		publisherName: "Orbit Lane Books",
		authorNames: ["Jonah Tran"],
		categorySlugs: ["software-engineering", "technology"],
		formats: [
			{ formatType: "physical", price: 41.99, discountedPrice: 35.99, stockQuantity: 55, weight: 0.94, dimensions: "24x16x3.3 cm" },
			{ formatType: "digital", price: 19.99, fileFormat: "PDF", fileSize: 10_200_000 },
		],
	},
];

const resolveIds = (keys: string[], idMap: Map<string, Types.ObjectId>, label: string, bookTitle: string): Types.ObjectId[] => {
	return keys.map((key) => {
		const id = idMap.get(key);
		if (!id) {
			throw new Error(`${label} \"${key}\" was not found while building \"${bookTitle}\"`);
		}

		return id;
	});
};

const createCategoryHierarchy = async (): Promise<Map<string, Types.ObjectId>> => {
	const categoryState = new Map<string, { id: Types.ObjectId; ancestors: Types.ObjectId[] }>();
	const pending = [...categorySeeds];

	while (pending.length > 0) {
		let createdInPass = 0;

		for (let i = 0; i < pending.length; i += 1) {
			const item = pending[i];
			if (!item) continue;

			if (item.parentSlug && !categoryState.has(item.parentSlug)) {
				continue;
			}

			const parent = item.parentSlug ? categoryState.get(item.parentSlug) : undefined;
			const ancestors = parent ? [...parent.ancestors, parent.id] : [];

			const created = new Category({
				name: item.name,
				description: item.description,
				parent: parent?.id,
				ancestors,
				order: item.order,
			});
			await created.save();

			categoryState.set(item.slug, {
				id: created._id as Types.ObjectId,
				ancestors: (created.ancestors as Types.ObjectId[]) ?? [],
			});

			pending.splice(i, 1);
			i -= 1;
			createdInPass += 1;
		}

		if (createdInPass === 0) {
			throw new Error("Category hierarchy could not be resolved. Check parentSlug references.");
		}
	}

	return new Map([...categoryState.entries()].map(([slug, value]) => [slug, value.id]));
};

const seed = async () => {
	const shouldReset = !process.argv.includes("--append");

	await connectDB();
	console.log(`Connected to DB. Mode: ${shouldReset ? "reset" : "append"}`);

	try {
		if (shouldReset) {
			await Promise.all([Book.deleteMany({}), Category.deleteMany({}), Publisher.deleteMany({}), Author.deleteMany({})]);
			console.log("Existing books and related entities cleared.");
		}

		const [authors, publishers] = await Promise.all([Author.create(authorSeeds), Publisher.create(publisherSeeds)]);
		const categoryIdsBySlug = await createCategoryHierarchy();

		const authorIdsByName = new Map(authors.map((author) => [author.name, author._id as Types.ObjectId]));
		const publisherIdsByName = new Map(publishers.map((publisher) => [publisher.name, publisher._id as Types.ObjectId]));

		let bookIsbnCounter = 1000;
		let formatIsbnCounter = 5000;
		let skuCounter = 1;

		const booksPayload = bookSeeds.map((book) => {
			const publisherId = publisherIdsByName.get(book.publisherName);
			if (!publisherId) {
				throw new Error(`Publisher \"${book.publisherName}\" was not found while building \"${book.title}\"`);
			}

			const authorIds = resolveIds(book.authorNames, authorIdsByName, "Author", book.title);
			const categoryIds = resolveIds(book.categorySlugs, categoryIdsBySlug, "Category", book.title);
			const bookSlug = slugify(book.title, { lower: true, strict: true });

			const formats = book.formats.map((format, index) => {
				skuCounter += 1;
				const skuPrefix = format.formatType === "physical" ? "PHY" : "DIG";
				const sku = `${skuPrefix}-${String(skuCounter).padStart(5, "0")}`;

				if (format.formatType === "physical") {
					formatIsbnCounter += 1;
					return {
						formatType: "physical" as const,
						sku,
						isbn: `978-1-60309-${formatIsbnCounter}-0`,
						price: format.price,
						discountedPrice: format.discountedPrice,
						currency: "USD",
						active: true,
						releaseDate: new Date(book.publicationDate),
						stockQuantity: format.stockQuantity ?? 30,
						weight: format.weight,
						dimensions: format.dimensions,
					};
				}

				return {
					formatType: "digital" as const,
					sku,
					price: format.price,
					discountedPrice: format.discountedPrice,
					currency: "USD",
					active: true,
					releaseDate: new Date(book.publicationDate),
					fileFormat: format.fileFormat ?? "PDF",
					fileSize: format.fileSize ?? 2_000_000,
					downloadLimit: 10,
					sampleFile: `/uploads/samples/${bookSlug}-${index + 1}.pdf`,
				};
			});

			bookIsbnCounter += 1;
			return {
				title: book.title,
				subtitle: book.subtitle,
				description: book.description,
				isbn: `978-1-4028-${bookIsbnCounter}-7`,
				publicationDate: new Date(book.publicationDate),
				language: book.language,
				pageCount: book.pageCount,
				publisher: publisherId,
				authors: authorIds,
				categories: categoryIds,
				coverImage: `/uploads/covers/${bookSlug}.jpg`,
				formats,
			};
		});

		const books = await Book.create(booksPayload);

		console.log(
			`Seeded ${authors.length} authors, ${publishers.length} publishers, ${categoryIdsBySlug.size} categories, and ${books.length} books.`,
		);
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from DB.");
	}
};

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exitCode = 1;
});
