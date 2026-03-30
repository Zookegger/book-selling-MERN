import { z } from "zod";

const normalizePhoneSpaces = (value: string) => value.replace(/\s+/g, "");

export const addressSchema = z.object({
	recipientName: z.string().trim().min(1, "Recipient name is required"),
	phoneNumber: z
		.string()
		.trim()
		.min(8, "Phone number must be at least 8 characters")
		.regex(/^[0-9+\-\s]{8,}$/, "Invalid phone number")
		.transform(normalizePhoneSpaces),
	provinceOrCity: z.string().trim().min(1, "Province or city is required"),
	district: z.string().trim().min(1, "District is required"),
	ward: z.string().trim().min(1, "Ward is required"),
	streetDetails: z.string().trim().min(1, "Street details are required"),
	country: z.string().optional().default("Vietnam"),
	isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const wishlistItemSchema = z.object({
	book: z.string().min(1, "Book ID is required"),
	addedAt: z.coerce.date().optional(),
	desiredFormat: z.enum(["physical", "digital", "audiobook"]).optional(),
});

export const digitalLibraryItemSchema = z.object({
	book: z.string().min(1, "Book ID is required"),
	formatIndex: z.number().min(0).optional(),
	purchasedAt: z.coerce.date().optional(),
});

export const userRoleSchema = z.enum(["customer", "admin"]);

export const createUserSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	phone: z
		.string()
		.trim()
		.min(8, "Phone number must be at least 8 characters")
		.regex(/^[0-9+\-\s]{8,}$/, "Invalid phone number")
		.transform(normalizePhoneSpaces),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters") // minLength
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
	role: userRoleSchema.optional().default("customer"),
});

export const updateUserSchema = z.object({
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	phone: z
		.string()
		.trim()
		.min(8, "Phone number must be at least 8 characters")
		.regex(/^[0-9+\-\s]{8,}$/, "Invalid phone number")
		.transform(normalizePhoneSpaces)
		.optional(),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")).optional(),
	role: userRoleSchema.optional(),
	addresses: z.array(addressSchema).optional(),
	wishList: z.array(wishlistItemSchema).optional(),
});

export const updateProfileSchema = z.object({
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	phone: z
		.string()
		.trim()
		.min(8, "Phone number must be at least 8 characters")
		.regex(/^[0-9+\-\s]{8,}$/, "Invalid phone number")
		.transform(normalizePhoneSpaces)
		.optional(),
	addresses: z.array(addressSchema).optional(),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")).optional(),
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(1, "New password is required"),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type AddAddressInput = z.input<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
