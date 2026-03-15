import { Book } from "@models";
import { HttpError } from "@middleware/error.middleware";
import type { IBook } from "@models/book.model";
import { createBookSchema } from "@schemas/book.schema";
import { getPagination } from "@utils";
import mongoose from "mongoose";

export const createBook = async (dto: IBook): Promise<IBook> => {
	const parsed = createBookSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	try {
		// If ISBN provided, ensure uniqueness
		if (parsed.data.isbn) {
			const existing = await Book.findOne({ isbn: parsed.data.isbn }).exec();
			if (existing) throw new HttpError("A book with this ISBN already exists", 409);
		}

		const book = await Book.create({ ...parsed.data });
		return book;
	} catch (error: any) {
		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 *
 * @param query.page Trang hiện tại (mặc định: 1).
 * @param query.limit Số lượng kết quả mỗi trang (mặc định: 10).
 * @param query.search Chuỗi tìm kiếm theo tên (không phân biệt hoa/thường).
 * @param query.order Thứ tự sắp xếp
 * @returns Đối tượng chứa danh sách, tổng số, trang hiện tại và tổng số trang.
 */
export const listBooks = async (query: { page?: number; limit?: number; search?: string; order?: "asc" | "desc" }) => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.name = { $regex: query.search, $options: "i" }; // case-insensitive
	}

	const total = await Book.countDocuments(filter);

	const data = await Book.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ createdAt: query.order === "desc" ? -1 : 1 }); // Sort by newest

	const totalPages = Math.ceil(total / limit);
	return { data, total, page, totalPages };
};

export const getBook = async (identifier: string) => {
	if (mongoose.Types.ObjectId.isValid(identifier)) return await Book.findById(identifier);

	return await Book.findOne({
		$or: [{ slug: identifier }, { contactEmail: identifier }, { name: identifier }],
	}).exec();
};

// export const replaceBook = async (id: string, dto: ) => {};

// export const updateBook = async () => {};

// export const deleteBook = async () => {};
