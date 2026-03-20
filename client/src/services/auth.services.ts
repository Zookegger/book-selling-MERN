import api from "@services/api";
import type {
	GetMeResponseDto,
	LoginRequestDto,
	LoginResponseDto,
	LogoutResponseDto,
	RegisterRequestDto,
	RegisterResponseDto,
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

				throw new Error(serverError.message || "Invalid credentials provided.");
			}

			throw new Error("Network error: Could not reach the authentication server.");
		}
	},

	register: async (data: RegisterRequestDto): Promise<RegisterResponseDto> => {
		try {
			const response = await api.post<RegisterResponseDto>("/auth/register", data);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new Error(serverError.message || "Registration failed.");
			}

			throw new Error("Network error: Could not reach the registration server.");
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

				throw new Error(serverError.message || "Logout failed on the server.");
			}

			throw new Error("Network error: Could not reach the server to logout.");
		} finally {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
		}
	},

	getCurrentUser: async (): Promise<GetMeResponseDto> => {
		try {
			const response = await api.get<GetMeResponseDto>("/users/me");
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				const serverError = error.response.data as ErrorResponseDto;

				throw new Error(serverError.message || "Failed to fetch user profile.");
			}

			throw new Error("Network error: Could not retrieve user data.");
		}
	},
};

export default authService;
