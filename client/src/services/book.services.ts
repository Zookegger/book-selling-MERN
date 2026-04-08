import type { BookDto } from "@my-types/book.dto";
import api, { mapApiError } from "./api";

export const BookService = {
	fetchDetail: async (bookId: string): Promise<BookDto> => {
		try {
			const response = await api.get<BookDto>(`/books/${bookId}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch book detail.");
		}
	},
};
