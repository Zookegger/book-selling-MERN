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

// Response interceptor - handle token refresh
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("accessToken");

			if (window.location.pathname !== "/sign-in") {
				window.location.href = "/sign-in";
			}
		}
		return Promise.reject(error);
	},
);

export default api;
