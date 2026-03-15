import { z } from "zod";

export const publisherLocationSchema = z.object({
	address: z.string().optional(),
	city: z.string().optional(),
	country: z.string().optional(),
});

export const publisherSchema = z.object({
	name: z.string().min(1, "Publisher name is required"),
	slug: z.string().optional(),
	description: z.string().optional(),
	location: publisherLocationSchema.optional(),
	contactEmail: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")).optional(),
	website: z.string().pipe(z.url("Invalid website URL")).optional(),
	logo: z.string().optional(),
	isActive: z.boolean().default(true).optional(),
});

export const createPublisherSchema = publisherSchema;

export const updatePublisherSchema = publisherSchema.partial();

export type CreatePublisherInput = z.infer<typeof createPublisherSchema>;
export type UpdatePublisherInput = z.infer<typeof updatePublisherSchema>;
