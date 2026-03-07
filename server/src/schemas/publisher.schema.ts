import { z } from "zod";

export const publisherSchema = z.object({
	name: z.string().min(1, "Publisher name is required"),
	address: z.string().optional().default(""),
	contactEmail: z
		.string()
		.email("Invalid contact email")
		.optional()
		.or(z.literal("")),
});

export const createPublisherSchema = publisherSchema;

export const updatePublisherSchema = publisherSchema.partial();

export type CreatePublisherInput = z.infer<typeof createPublisherSchema>;
export type UpdatePublisherInput = z.infer<typeof updatePublisherSchema>;
