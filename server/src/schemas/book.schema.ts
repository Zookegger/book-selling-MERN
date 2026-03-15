import { z } from "zod";

const baseFormatSchema = z.object({
	sku: z.string().min(1, "SKU is required"),
	isbn: z.string().optional(),
	price: z.number().min(0, "Price must be non-negative"),
	discountedPrice: z.number().min(0).optional(),
	currency: z.string().length(3, "Currency must be a 3-letter code").toUpperCase().optional().default("USD"),
	active: z.boolean().optional().default(true),
	releaseDate: z.coerce.date().optional(),
});

const physicalFormatSchema = baseFormatSchema.extend({
	formatType: z.literal("physical"),
	stockQuantity: z.number().min(0).optional(),
	weight: z.number().min(0).optional(),
	dimensions: z.string().optional(),
});

const digitalFormatSchema = baseFormatSchema.extend({
	formatType: z.literal("digital"),
	file: z.string().optional(),
	fileFormat: z.enum(["PDF", "ePub", "MOBI"]).optional(),
	fileSize: z.number().min(0).optional(),
	downloadLimit: z.number().min(1).optional(),
	sampleFile: z.string().optional(),
});

const audiobookFormatSchema = baseFormatSchema.extend({
	formatType: z.literal("audiobook"),
	file: z.string().optional(),
	fileSize: z.number().min(0).optional(),
	sampleFile: z.string().optional(),
});

export const bookFormatSchema = z.discriminatedUnion("formatType", [
	physicalFormatSchema,
	digitalFormatSchema,
	audiobookFormatSchema,
]);

export const bookSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().optional(),
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

export const createBookSchema = bookSchema;
export const createBookFormatSchema = bookFormatSchema;

export const updateBookSchema = bookSchema.partial();
export const updateBookFormatSchema = z.union([
	physicalFormatSchema.partial(),
	digitalFormatSchema.partial(),
	audiobookFormatSchema.partial(),
]);

export type AddBookFormatInput = z.input<typeof createBookFormatSchema>;
export type EditBookFormatInput = z.input<typeof updateBookFormatSchema>;
export type CreateBookInput = z.input<typeof createBookSchema>;
export type UpdateBookInput = z.input<typeof updateBookSchema>;
