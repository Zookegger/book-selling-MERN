import type { UserRoleDto } from "./user.dto";

export interface LoginRequestDto {
	email: string;
	password: string;
}

export interface RegisterRequestDto {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export interface ForgotPasswordRequestDto {
	email: string;
}

export interface ResetPasswordRequestDto {
	token: string;
	newPassword: string;
}

export interface VerifyEmailRequestDto {
	token: string;
}

export interface ResendVerificationRequestDto {
	email: string;
}

export interface AuthUserDto {
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	role?: "customer" | "admin";
	isEmailVerified?: boolean;
}

export interface LoginResponseDto {
	message: string;
	user: AuthUserDto;
	token: string;
}

export interface RegisterResponseDto {
	message: string;
}

export interface VerifyEmailResponseDto {
	message: string;
	user: AuthUserDto & { isEmailVerified: boolean };
}

export interface GetMeResponseDto {
	userId: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	role: UserRoleDto;
}

export interface LogoutResponseDto {
	message: string;
}

export interface ForgotPasswordResponseDto {
	message: string;
}

export interface ResetPasswordResponseDto {
	message: string;
	user: AuthUserDto;
}

export interface ResendVerificationResponseDto {
	message: string;
	user: AuthUserDto;
}

export type AuthResponseDto = LoginResponseDto;
