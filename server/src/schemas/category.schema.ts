import { z } from "zod";

export const categorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
	slug: z.string().optional(),
	description: z.string().optional().default(""),
	parent: z.string().nullable().optional().default(null),
	order: z.number().optional().default(0),
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = categorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
