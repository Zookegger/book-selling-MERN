import mongoose from "mongoose";
import connectDB from "../config/db";
import { Author, Book, Category, Publisher, User } from "@models";

const seed = async () => {
	await connectDB();

	try {
		const shouldReset = !process.argv.includes("--append");

		if (shouldReset) {
			await Promise.all([
				Book.deleteMany({}),
				Category.deleteMany({}),
				Publisher.deleteMany({}),
				Author.deleteMany({}),
				User.deleteMany({ role: { $ne: "admin" } }),
			]);
			console.log("Cleared existing seedable data.");
		}

		const [author] = await Author.create([
			{
				name: "Seed Author",
				email: "seed-author@example.com",
				bio: "Sample author for local testing",
			},
		]);

		const [publisher] = await Publisher.create([
			{
				name: "Seed Publisher",
				contactEmail: "seed-publisher@example.com",
				description: "Sample publisher for local testing",
				website: "https://example.com",
				location: {
					address: "1 Test Street",
					city: "HCM",
					country: "Vietnam",
				},
			},
		]);

		const [category] = await Category.create([
			{
				name: "Seed Category",
				slug: "seed-category",
				description: "Sample category for local testing",
				order: 1,
				ancestors: [],
			},
		]);

		const existingBook = await Book.findOne({ title: "Seed Book" }).exec();
		if (!existingBook) {
			await Book.create({
				title: "Seed Book",
				description: "Sample seeded book for cart/checkout tests",
				publicationDate: new Date("2024-01-01"),
				language: "en",
				publisher: publisher._id,
				authors: [author._id],
				categories: [category._id],
				formats: [
					{
						formatType: "physical",
						sku: `SEED-PHY-${Date.now()}`,
						price: 120000,
						currency: "VND",
						active: true,
						stockQuantity: 100,
					},
					{
						formatType: "digital",
						sku: `SEED-DIG-${Date.now()}`,
						price: 90000,
						currency: "VND",
						active: true,
					},
				],
			});
		}

		console.log("Seed completed successfully.");
	} finally {
		await mongoose.disconnect();
		console.log("Disconnected from DB.");
	}
};

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exitCode = 1;
});

