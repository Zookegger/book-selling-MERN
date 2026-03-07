import { z } from "zod";

export const addressSchema = z.object({
	recipientName: z.string().trim().min(1, "Recipient name is required"),
	phoneNumber: z
		.string()
		.trim()
		.min(8, "Phone number must be at least 8 characters")
		.regex(/^[0-9+\-\s]{8,}$/, "Invalid phone number"),
	provinceOrCity: z.string().trim().min(1, "Province or city is required"),
	district: z.string().trim().min(1, "District is required"),
	ward: z.string().trim().min(1, "Ward is required"),
	streetDetails: z.string().trim().min(1, "Street details are required"),
	country: z.string().optional().default("Vietnam"),
	isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

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
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")).optional(),
	addresses: z.array(addressSchema).optional(),
	wishList: z.array(wishlistItemSchema).optional(),
});

export const updateProfileSchema = z.object({
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	addresses: z.array(addressSchema).optional(),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")).optional(),
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(1, "New password is required"),
});

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
	password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters") // minLength
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1, "Reset token is required"),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters") // minLength
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

export const verifyEmailSchema = z.object({
	token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
