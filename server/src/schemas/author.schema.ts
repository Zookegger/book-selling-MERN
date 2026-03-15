import { z } from "zod";

export const authorSchema = z.object({
	name: z.string().min(1, "Author name is required"),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
	slug: z.string().optional(),
	bio: z.string().optional().default(""),
	birthDate: z.coerce.date().optional(),
	website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export const createAuthorSchema = authorSchema;

export const updateAuthorSchema = authorSchema.partial();

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
