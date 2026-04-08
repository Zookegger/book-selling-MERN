import api, { mapApiError } from "@services/api";
import type { CategoryDto, CreateCategoryDto, UpdateCategoryDto, ListCategoriesResponseDto } from "@my-types/category.dto";

export interface ListCategoriesParams {
	page?: number;
	limit?: number;
	search?: string;
}

export const categoryService = {
	listCategories: async (params?: ListCategoriesParams): Promise<ListCategoriesResponseDto> => {
		try {
			const response = await api.get<ListCategoriesResponseDto>("/categories", { params });
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to fetch categories");
		}
	},

	getCategory: async (id: string): Promise<CategoryDto> => {
		try {
			const response = await api.get<CategoryDto>(`/categories/${id}`);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to fetch category details");
		}
	},

	// 🔥 normalize parent
	createCategory: async (data: CreateCategoryDto): Promise<CategoryDto> => {
		try {
			const payload = {
				...data,
				parent:
					typeof data.parent === "string"
						? data.parent
						: (data.parent as any)?.id || null,
			};

			const response = await api.post<CategoryDto>("/categories", payload);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to create category");
		}
	},

	// 🔥 normalize parent
	updateCategory: async (id: string, data: UpdateCategoryDto): Promise<CategoryDto> => {
		try {
			const payload = {
				...data,
				parent:
					typeof data.parent === "string"
						? data.parent
						: (data.parent as any)?.id || null,
			};

			const response = await api.patch<CategoryDto>(`/categories/${id}`, payload);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Failed to update category");
		}
	},

	deleteCategory: async (id: string): Promise<void> => {
		try {
			await api.delete(`/categories/${id}`);
		} catch (error: any) {
			throw mapApiError(error, "Failed to delete category");
		}
	},
};