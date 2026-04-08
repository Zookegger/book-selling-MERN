import api, { mapApiError } from "@services/api";
import type { AuthorDto, CreateAuthorDto, UpdateAuthorDto, ListAuthorsResponseDto } from "@my-types/author.dto";

export interface ListAuthorsParams {
	page?: number;
	limit?: number;
	search?: string;
}

export const authorService = {
	/**
	 * Lấy danh sách tác giả
	 */
	listAuthors: async (params?: ListAuthorsParams): Promise<ListAuthorsResponseDto> => {
		try {
			const response = await api.get<ListAuthorsResponseDto>("/authors", { params });
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to fetch authors");
		}
	},

	/**
	 * Lấy thông tin tác giả theo ID
	 */
	getAuthor: async (id: string): Promise<AuthorDto> => {
		try {
			const response = await api.get<AuthorDto>(`/authors/${id}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to fetch author details");
		}
	},

	/**
	 * Tạo tác giả mới
	 */
	createAuthor: async (data: CreateAuthorDto): Promise<AuthorDto> => {
		try {
			const response = await api.post<AuthorDto>("/authors", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to create author");
		}
	},

	/**
	 * Cập nhật thông tin tác giả
	 */
	updateAuthor: async (id: string, data: UpdateAuthorDto): Promise<AuthorDto> => {
		try {
			const response = await api.patch<AuthorDto>(`/authors/${id}`, data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to update author");
		}
	},

	/**
	 * Xóa tác giả
	 */
	deleteAuthor: async (id: string): Promise<void> => {
		try {
			await api.delete(`/authors/${id}`);
		} catch (error: any) {
			throw mapApiError(error, "Failed to delete author");
		}
	},
};
