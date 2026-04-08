import api, { mapApiError } from "@services/api";
import type { ListBooksQueryDto, PaginatedBooksResponseDto } from "@my-types/book.dto";

export const bookService = {
  listBooks: async (params?: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> => {
    try {
      const response = await api.get<PaginatedBooksResponseDto>("/books", { params });
      return response.data;
    } catch (error: unknown) {
      throw mapApiError(error, "Không thể tải danh sách sách.");
    }
  },
};

