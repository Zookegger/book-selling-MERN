import api from "./api"; // Trỏ đúng đường dẫn file api.ts của bạn

// Định nghĩa Types dựa trên Backend
export interface ICategory {
    id: string; // Do backend đã parse _id thành id trong toJSON
    name: string;
    slug: string;
    description?: string;
    parent?: string | { _id: string; name: string };
    order: number;
    children?: ICategory[]; // Dùng cho API Tree
}

export interface IPaginatedCategories {
    data: ICategory[];
    total: number;
    page: number;
    totalPages: number;
}

export const categoryService = {
    // Lấy danh sách phân trang
    getList: async (page = 1, limit = 10, search = "") => {
        const res = await api.get<IPaginatedCategories>("/categories", {
            params: { page, limit, search }
        });
        return res.data;
    },

    // Lấy cây danh mục (dùng cho dropdown chọn Parent)
    getTree: async () => {
        const res = await api.get<ICategory[]>("/categories/tree");
        return res.data;
    },

    // Thêm mới
    create: async (data: { name: string; description?: string; order?: number; parent?: string | null }) => {
        // Zod bắt lỗi nếu parent là chuỗi rỗng "", nên ta phải ép về null
        if (!data.parent) data.parent = null; 
        const res = await api.post<ICategory>("/categories", data);
        return res.data;
    },

    // Cập nhật
    update: async (id: string, data: { name?: string; description?: string; order?: number; parent?: string | null }) => {
        if (!data.parent) data.parent = null;
        const res = await api.patch<ICategory>(`/categories/${id}`, data);
        return res.data;
    },

    // Xóa
    delete: async (id: string) => {
        const res = await api.delete(`/categories/${id}`);
        return res.data;
    }
};