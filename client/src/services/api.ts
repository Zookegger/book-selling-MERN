import { ROUTER_PATHS } from "@components/common/Router";
import type { ErrorResponseDto } from "@my-types/common.dto";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
	code?: string;
	action?: string;

	constructor(message: string, code?: string, action?: string) {
		super(message);
		this.code = code;
		this.action = action;
	}
}

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor - add token to requests
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("accessToken");

			if (window.location.pathname !== ROUTER_PATHS.LOGIN) {
				window.location.href = ROUTER_PATHS.LOGIN;
			}
		}
		return Promise.reject(error);
	},
);

export const mapApiError = (error: any, fallbackMessage: string): never => {
	if (error.response && error.response.data) {
		const serverError = error.response.data as ErrorResponseDto;
		throw new ApiError(serverError.message || fallbackMessage, serverError.data?.code);
	}

	throw new ApiError(fallbackMessage);
};

export default api;
