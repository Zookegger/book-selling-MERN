import { z } from "zod";

export const categorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
	slug: z.string().min(1, "Category slug is required"),
	parent: z.string().nullable().optional().default(null),
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = categorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
