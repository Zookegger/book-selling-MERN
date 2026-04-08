import type { BookDto } from "@my-types/book.dto";
import api, { mapApiError } from "./api";

interface PaginatedBooks {
    data: BookDto[];
    total: number;
    // ... thêm các trường khác nếu Backend trả về
}

export const BookService = {
	fetchDetail: async (bookId: string): Promise<BookDto> => {
		try {
			const response = await api.get<BookDto>(`/books/${bookId}`);
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
