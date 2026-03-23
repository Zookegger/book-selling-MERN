import { z } from "zod";

const normalizePhoneSpaces = (value: string) => value.replace(/\s+/g, "");

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
	password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
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
});

export const forgotPasswordSchema = z.object({
	email: z.string().nonempty().trim().toLowerCase().pipe(z.email("Invalid email address")),
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

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.input<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.input<typeof resendVerificationSchema>;
