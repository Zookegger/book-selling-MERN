import { z } from "zod";

const objectIdStringSchema = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid parent id");

export const categorySchema = z.object({
	name: z.string().trim().min(1, "Category name is required"),
	slug: z
		.string()
		.trim()
		.toLowerCase()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
		.optional(),
	description: z.string().trim().optional().default(""),
	parent: objectIdStringSchema.nullable().optional().default(null),
	order: z.number().int().min(0, "Order must be greater than or equal to 0").optional().default(0),
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = categorySchema.partial();

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
