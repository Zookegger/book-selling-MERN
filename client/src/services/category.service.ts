import api, { mapApiError } from "./api"; 

export interface ICategory {
	id: string; 
	name: string;
	slug: string;
	description?: string;
	parent?: string | { _id: string; name: string };
	order: number;
	children?: ICategory[]; 
}

export interface IPaginatedCategories {
	data: ICategory[];
	total: number;
	page: number;
	totalPages: number;
}

export const categoryService = {
	/** Lấy danh sách phân trang */
	getList: async (page = 1, limit = 10, search = "") => {
		try {
			const res = await api.get<IPaginatedCategories>("/categories", {
				params: { page, limit, search },
			});
			return res.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not fetch categories.");
		}
	},

	/** Lấy cây danh mục (dùng cho dropdown chọn Parent) */
	getTree: async () => {
		try {
			const res = await api.get<ICategory[]>("/categories/tree");
			return res.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not fetch category tree.");
		}
	},

	/** Thêm mới */
	create: async (data: { name: string; description?: string; order?: number; parent?: string | null }) => {
		try {
			// Zod bắt lỗi nếu parent là chuỗi rỗng "", nên ta phải ép về null
			const payload = { ...data, parent: data.parent || null };
			const res = await api.post<ICategory>("/categories", payload);
			return res.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not create category.");
		}
	},

	/** Cập nhật */
	update: async (
		id: string,
		data: { name?: string; description?: string; order?: number; parent?: string | null },
	) => {
		try {
			const payload = { ...data, parent: data.parent || null };
			const res = await api.patch<ICategory>(`/categories/${id}`, payload);
			return res.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not update category.");
		}
	},

	/** Xóa */
	delete: async (id: string) => {
		try {
			const res = await api.delete(`/categories/${id}`);
			return res.data;
		} catch (error: any) {
			throw mapApiError(error, "Could not delete category.");
		}
	},
};
