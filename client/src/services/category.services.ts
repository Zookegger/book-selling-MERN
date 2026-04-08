import api, { mapApiError } from "@services/api";
import type { CategoryWithBookCountDto, ListCategoriesResponseDto } from "@my-types/category.dto";

export const categoryService = {
  getAllCategoriesWithBookCount: async (): Promise<CategoryWithBookCountDto[]> => {
    try {
      const response = await api.get<ListCategoriesResponseDto>("/categories", {
        params: { page: 1, limit: 100 },
      });

      // Backend hiện chưa trả bookCount theo category, tạm map = 0 để UI hoạt động ổn định.
      return response.data.data.map((category) => ({
        ...category,
        bookCount: 0,
      }));
    } catch (error: unknown) {
      throw mapApiError(error, "Không thể tải danh sách thể loại.");
    }
  },
};

