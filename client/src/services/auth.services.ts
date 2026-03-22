import api, { ApiError } from "@services/api";
import type {
	GetMeResponseDto,
	LoginRequestDto,
	LoginResponseDto,
	LogoutResponseDto,
	RegisterRequestDto,
	RegisterResponseDto,
	ResendVerificationRequestDto,
	ResendVerificationResponseDto,
	VerifyEmailRequestDto,
	VerifyEmailResponseDto,
} from "@my-types/auth.dto";
import type { ErrorResponseDto } from "@my-types/common.dto";

export const authService = {
	login: async (data: LoginRequestDto): Promise<LoginResponseDto> => {
		try {
			const response = await api.post<LoginResponseDto>("/auth/login", data);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Invalid credentials provided.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not reach the authentication server.");
		}
	},

	register: async (data: RegisterRequestDto): Promise<RegisterResponseDto> => {
		try {
			const response = await api.post<RegisterResponseDto>("/auth/register", data);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Registration failed.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not reach the registration server.");
		}
	},

	logout: async (): Promise<LogoutResponseDto> => {
		const refreshToken = localStorage.getItem("refreshToken");
		try {
			const res = await api.post<LogoutResponseDto>("/auth/logout", { refreshToken });
			return res.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Logout failed on the server.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not reach the server to logout.");
		} finally {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
		}
	},

	getCurrentUser: async (): Promise<GetMeResponseDto> => {
		try {
			const response = await api.get<GetMeResponseDto>("/auth/me");
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Failed to fetch user profile.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not retrieve user data.");
		}
	},

	verifyEmail: async (data: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> => {
		try {
			const response = await api.get<VerifyEmailResponseDto>(`/auth/verify-email?token=${data.token}`);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Failed to verify your email.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not verify you email.");
		}
	},
	resendVerification: async (data: ResendVerificationRequestDto): Promise<ResendVerificationResponseDto> => {
		try {
			const response = await api.post<ResendVerificationResponseDto>(`/auth/resend-verification`, data);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new ApiError(serverError.message || "Failed to resend your request.", serverError.data?.code);
			}

			throw new ApiError("Network error: Could not resend your request.");
		}
	},
};

export default authService;
