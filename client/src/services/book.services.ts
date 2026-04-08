import type { BookDto } from "@my-types/book.dto";
import api, { mapApiError } from "./api";

interface PaginatedBooks {
    data: BookDto[];
    total: number;
    page?: number;
    totalPages?: number;
}

export const BookService = {
	fetchDetail: async (bookIdentifier: string): Promise<BookDto> => {
		try {
			const response = await api.get<BookDto>(`/books/${bookIdentifier}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch book detail.");
		}
	},
	fetchAll: async (params?: { category?: string; page?: number; limit?: number }): Promise<PaginatedBooks> => {
        try {
            const response = await api.get<PaginatedBooks>("/books", { params });
            return response.data;
        } catch (error: any) {
            throw mapApiError(error, "Could not fetch books.");
        }
    }
};
