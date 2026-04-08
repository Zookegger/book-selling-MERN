import mongoose, { Types } from "mongoose";
import slugify from "slugify";
import connectDB from "../config/db";
import { Author, Publisher, Category, Book, User } from "@models";
import { faker } from "@faker-js/faker";
import Chance from "chance";
import bcrypt from "bcrypt";

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

interface UserSeed {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	password: string;
	role: "customer" | "admin";
	isEmailVerified: boolean;
}

const chance = new Chance();

// Parse numeric CLI args like `--books=25` or `--books 25`
const parseNumberArg = (key: string, defaultValue: number): number => {
	const direct = process.argv.find((a) => a.startsWith(`${key}=`));
	if (direct) {
		const [, v] = direct.split("=");
		const n = Number(v);
		return Number.isFinite(n) && n >= 0 ? Math.max(0, Math.floor(n)) : defaultValue;
	}

	const idx = process.argv.indexOf(key);
	if (idx !== -1 && process.argv.length > idx + 1) {
		const n = Number(process.argv[idx + 1]);
		return Number.isFinite(n) && n >= 0 ? Math.max(0, Math.floor(n)) : defaultValue;
	}

	return defaultValue;
};

// Generate author seeds using faker
const generateAuthorSeeds = (count: number = 12) => {
	return Array.from({ length: count }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		bio: faker.lorem.paragraph(),
		website: faker.internet.url(),
	}));
};

// Generate publisher seeds using faker
const generatePublisherSeeds = (count: number = 8) => {
	return Array.from({ length: count }, () => ({
		name: faker.company.name() + " Publications",
		description: faker.lorem.paragraph(),
		contactEmail: faker.internet.email().toLowerCase(),
		website: faker.internet.url(),
		location: {
			address: faker.location.streetAddress(),
			city: faker.location.city(),
			country: faker.location.country(),
		},
	}));
};

// Generate user seeds using faker (Customers Only)
const generateCustomerSeeds = (count: number = 8) => {
	const users = [];
	for (let i = 0; i < count; i++) {
		users.push({
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			email: faker.internet.email().toLowerCase(),
			phone: chance.phone({ formatted: false }) || faker.phone.number(),
			password: "Password123!@#",
			role: "customer" as const,
			isEmailVerified: true,
		});
	}
	return users;
};

const categorySeeds: CategorySeed[] = [
	{ slug: "fiction", name: "Fiction", description: "Narrative and literary works", order: 1 },
	{ slug: "non-fiction", name: "Non Fiction", description: "Informational and factual works", order: 2 },
	{ slug: "children", name: "Children", description: "Books for children and young readers", order: 3 },
	{ slug: "history", name: "History", description: "Historical analysis and narratives", order: 4 },
	{
		slug: "technology",
		name: "Technology",
		description: "Technology and software topics",
		order: 5,
		parentSlug: "non-fiction",
	},
	{
		slug: "software-engineering",
		name: "Software Engineering",
		description: "Coding and system architecture",
		order: 6,
		parentSlug: "technology",
	},
	{
		slug: "data-science",
		name: "Data Science",
		description: "Data analytics and ML",
		order: 7,
		parentSlug: "technology",
	},
	{
		slug: "biography",
		name: "Biography",
		description: "Life stories and profiles",
		order: 8,
		parentSlug: "non-fiction",
	},
	{
		slug: "business",
		name: "Business",
		description: "Product, leadership, and strategy",
		order: 9,
		parentSlug: "non-fiction",
	},
];

const generateBookSeeds = (count: number, availableAuthors: string[], availablePublishers: string[]): BookSeed[] => {
	const books: BookSeed[] = [];

	for (let i = 0; i < count; i++) {
		const numAuthors = chance.integer({ min: 1, max: Math.min(3, availableAuthors.length) });
		const authorNames = chance.pickset(availableAuthors, numAuthors);

		const publisherName = chance.pickone(availablePublishers);
		const categoryCount = chance.integer({ min: 1, max: 3 });
		const allSlugs = categorySeeds.map((c) => c.slug);
		const categorySlugs = chance.pickset(allSlugs, categoryCount);

		const basePrice = chance.floating({ min: 14.99, max: 49.99, fixed: 2 });
		const hasDiscount = chance.bool({ likelihood: 60 });
		const discountedPrice = hasDiscount ? +(basePrice * 0.8).toFixed(2) : undefined;

		const hasPhysical = chance.bool({ likelihood: 85 });
		const hasDigital = chance.bool({ likelihood: 75 });

		const formats: BookFormatSeed[] = [];

		if (hasPhysical) {
			formats.push({
				formatType: "physical",
				price: basePrice,
				discountedPrice,
				stockQuantity: chance.integer({ min: 20, max: 300 }),
				weight: chance.floating({ min: 0.25, max: 1.5, fixed: 2 }),
				dimensions: `${chance.integer({ min: 19, max: 25 })}x${chance.integer({ min: 12, max: 16 })}x${chance.floating({ min: 0.8, max: 4.0, fixed: 1 })} cm`,
			});
		}

		if (hasDigital) {
			formats.push({
				formatType: "digital",
				price: +(basePrice * 0.5).toFixed(2),
				discountedPrice: hasDiscount ? +(basePrice * 0.4).toFixed(2) : undefined,
				fileFormat: chance.pickone(["PDF", "ePub", "MOBI"]) as "PDF" | "ePub" | "MOBI",
				fileSize: chance.integer({ min: 1_000_000, max: 12_000_000 }),
			});
		}

		books.push({
			title: faker.book.title(),
			subtitle: chance.bool({ likelihood: 40 }) ? faker.book.title() : undefined,
			description: faker.lorem.paragraphs(2, "\n"),
			publicationDate: faker.date.past({ years: 6 }).toISOString().split("T")[0],
			language: "en",
			pageCount: chance.integer({ min: 80, max: 600 }),
			publisherName,
			authorNames,
			categorySlugs,
			formats,
		});
	}

	return books;
};

const resolveIds = (
	keys: string[],
	idMap: Map<string, Types.ObjectId>,
	label: string,
	bookTitle: string,
): Types.ObjectId[] => {
	return keys.map((key) => {
		const id = idMap.get(key);
		if (!id) {
			throw new Error(`${label} "${key}" was not found while building "${bookTitle}"`);
		}
		return id;
	});
};

const createOrUpdateCategoryHierarchy = async (): Promise<Map<string, Types.ObjectId>> => {
	const categoryState = new Map<string, { id: Types.ObjectId; ancestors: Types.ObjectId[] }>();
	const pending = [...categorySeeds];

	while (pending.length > 0) {
		let processedInPass = 0;

		for (let i = 0; i < pending.length; i += 1) {
			const item = pending[i];
			if (!item) continue;

			if (item.parentSlug && !categoryState.has(item.parentSlug)) {
				continue; // Wait for parent to be processed
			}

			const parent = item.parentSlug ? categoryState.get(item.parentSlug) : undefined;
			const ancestors = parent ? [...parent.ancestors, parent.id] : [];

			// Use findOneAndUpdate with upsert to handle both fresh seeds and appends cleanly
			const savedCategory = await Category.findOneAndUpdate(
				{ slug: item.slug },
				{
					$set: {
						name: item.name,
						description: item.description,
						parent: parent?.id,
						ancestors,
						order: item.order,
					},
				},
				{ upsert: true, new: true },
			);

			categoryState.set(item.slug, {
				id: savedCategory._id as Types.ObjectId,
				ancestors: (savedCategory.ancestors as Types.ObjectId[]) ?? [],
			});

			pending.splice(i, 1);
			i -= 1;
			processedInPass += 1;
		}

		if (processedInPass === 0) {
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
			await Promise.all([
				Book.deleteMany({}),
				Category.deleteMany({}),
				Publisher.deleteMany({}),
				Author.deleteMany({}),
				User.deleteMany({}),
			]);
			console.log("Existing books, users, and related entities cleared.");
		}

		const admin_password = bcrypt.hash("AdminPass123!@#", 10);

		// 1. Handle Admin User (Upsert to prevent duplicate key errors on append)
		await User.findOneAndUpdate(
			{ email: "admin@luminabooks.local" },
			{
				$set: {
					firstName: "Admin",
					lastName: "User",
					phone: chance.phone({ formatted: false }).replace(/\D/g, "").slice(0, 15) || "+84901234567",
					password: "AdminPass123!@#",
					role: "admin",
					isEmailVerified: true,
				},
			},
			{ upsert: true },
		);

		// 2. Insert new generic entities
		const authorCount = parseNumberArg("--author", 18);
		const publisherCount = parseNumberArg("--publisher", 18);
		const userCount = parseNumberArg("--user", 18);

		const [newAuthors, newPublishers, newUsers] = await Promise.all([
			Author.create(generateAuthorSeeds(authorCount)),
			Publisher.create(generatePublisherSeeds(publisherCount)),
			User.create(generateCustomerSeeds(userCount)),
		]);

		// 3. Upsert Categories (handles both reset and append gracefully)
		const categoryIdsBySlug = await createOrUpdateCategoryHierarchy();

		// 4. Fetch ALL available Authors & Publishers to blend existing data with new data
		const allAuthors = await Author.find().select("_id name");
		const allPublishers = await Publisher.find().select("_id name");

		const availableAuthorNames = allAuthors.map((a) => a.name);
		const availablePublisherNames = allPublishers.map((p) => p.name);

		const authorIdsByName = new Map(allAuthors.map((a) => [a.name, a._id as Types.ObjectId]));
		const publisherIdsByName = new Map(allPublishers.map((p) => [p.name, p._id as Types.ObjectId]));

		// 5. Generate and Insert Books
		const bookCount = parseNumberArg("--books", 18);
		const bookSeeds = generateBookSeeds(bookCount, availableAuthorNames, availablePublisherNames);

		let bookIsbnCounter = Math.floor(Math.random() * 9000) + 1000;
		let formatIsbnCounter = Math.floor(Math.random() * 9000) + 5000;
		let skuCounter = await Book.countDocuments(); // Ensure SKUs continue incrementing

		const booksPayload = bookSeeds.map((book) => {
			const publisherId = publisherIdsByName.get(book.publisherName);
			if (!publisherId) throw new Error(`Publisher "${book.publisherName}" missing.`);

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
			`Seeded ${newAuthors.length} new authors, ${newPublishers.length} new publishers, ${categoryIdsBySlug.size} categories validated, ${newUsers.length} new customers, and ${books.length} new books.`,
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
