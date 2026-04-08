import type {
    BookDto,
    CreateBookDto,
    ListBooksQueryDto,
    PaginatedBooksResponseDto,
    UpdateBookDto,
} from "@my-types/book.dto";
import api, { mapApiError } from "./api";

export const BookService = {
	fetchDetail: async (bookIdentifier: string): Promise<BookDto> => {
		try {
			const response = await api.get<BookDto>(`/books/${bookIdentifier}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch book detail.");
		}
	},
    fetchAll: async (params?: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> => {
        try {
            const response = await api.get<PaginatedBooksResponseDto>("/books", { params });
            return response.data;
        } catch (error: any) {
            throw mapApiError(error, "Could not fetch books.");
        }
    },
    createBook: async (data: CreateBookDto): Promise<BookDto> => {
        try {
            const response = await api.post<BookDto>("/books", data);
            return response.data;
        } catch (error: any) {
            throw mapApiError(error, "Could not create book.");
        }
    },
    updateBook: async (id: string, data: UpdateBookDto): Promise<BookDto> => {
        try {
            const response = await api.patch<BookDto>(`/books/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw mapApiError(error, "Could not update book.");
        }
    },
    deleteBook: async (id: string): Promise<void> => {
        try {
            await api.delete(`/books/${id}`);
        } catch (error: any) {
            throw mapApiError(error, "Could not delete book.");
        }
    },
};
