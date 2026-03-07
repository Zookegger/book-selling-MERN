import { z } from "zod";

export const bookFormatTypeSchema = z.enum(["physical", "digital", "audiobook"]);

export const bookFormatSchema = z
	.object({
		formatType: bookFormatTypeSchema,
		sku: z.string().min(1, "SKU is required"),
		isbn: z.string().optional(),
		price: z.number().min(0, "Price must be non-negative"),
		discountedPrice: z.number().min(0).optional(),
		currency: z
			.string()
			.length(3, "Currency must be a 3-letter code")
			.toUpperCase()
			.optional()
			.default("USD"),
		active: z.boolean().optional().default(true),
		releaseDate: z.coerce.date().optional(),

		// Physical
		stockQuantity: z.number().min(0).optional(),
		weight: z.number().min(0).optional(),
		dimensions: z.string().optional(),

		// Digital
		file: z.string().optional(),
		fileFormat: z.enum(["PDF", "ePub", "MOBI"]).optional(),
		fileSize: z.number().min(0).optional(),
		downloadLimit: z.number().min(1).optional(),
		sampleFile: z.string().optional(),
	})
	.refine(
		(data) => !(data.formatType === "physical" && data.file),
		{ message: "Physical format cannot have a digital file", path: ["file"] },
	)
	.refine(
		(data) => !(data.formatType === "digital" && data.stockQuantity != null),
		{ message: "Digital format should not have stock quantity", path: ["stockQuantity"] },
	);

export const createBookSchema = z.object({
	title: z.string().min(1, "Title is required"),
	subtitle: z.string().optional().default(""),
	description: z.string().min(1, "Description is required"),
	isbn: z.string().optional(),
	publicationDate: z.coerce.date({ message: "Publication date is required" }),
	language: z.string().min(1, "Language is required").default("en"),
	pageCount: z.number().min(1, "Page count must be at least 1").optional(),
	publisher: z.string().optional(),
	authors: z.array(z.string()).optional().default([]),
	categories: z.array(z.string()).optional().default([]),
	coverImage: z.string().optional(),
	formats: z.array(bookFormatSchema).optional().default([]),
});

export const updateBookSchema = createBookSchema.partial();

export type BookFormatInput = z.infer<typeof bookFormatSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
