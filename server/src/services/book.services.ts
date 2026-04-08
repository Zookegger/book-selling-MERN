import mongoose from "mongoose";
import { Book } from "@models";
import type { IBook } from "@models/book.model";
import { HttpError } from "@middleware/error.middleware";
import {
	CreateBookInput,
	createBookSchema,
	UpdateBookInput,
	updateBookSchema,
	AddBookFormatInput,
	EditBookFormatInput,
	createBookFormatSchema,
	updateBookFormatSchema,
} from "@schemas/book.schema";
import { getPagination } from "@utils";

/**
 * Tạo sách mới cùng với các định dạng (formats) nếu có.
 */
export const createBook = async (dto: CreateBookInput): Promise<IBook> => {
	const parsed = createBookSchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = new Book(parsed.data);

	try {
		await book.save();
	} catch (err: any) {
		if (err.code === 11000) {
			throw new HttpError("Book with this ISBN or slug already exists", 409);
		}
		throw err;
	}

	return book;
};

/**
 * Lấy danh sách sách có phân trang và hỗ trợ tìm kiếm / lọc đơn giản.
 */
export const listBooks = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	language?: string;
	order?: "asc" | "desc";
}): Promise<{ data: IBook[]; total: number; page: number; totalPages: number }> => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.$text = { $search: query.search };
	}

	if (query.language) {
		filter.language = query.language;
	}

	const total = await Book.countDocuments(filter);

	const data = await Book.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ createdAt: query.order === "desc" ? -1 : 1 })
		.populate("publisher")
		.populate("authors")
		.populate("categories")
		.exec();

	const totalPages = Math.ceil(total / limit);
	return { data, total, page, totalPages };
};

/**
 * Lấy chi tiết một cuốn sách theo ID.
 */
export const getBook = async (id: string): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid book ID", 400);

	return await Book.findById(id).populate("publisher").populate("authors").populate("categories").exec();
};

/**
 * Thay thế toàn bộ thông tin sách (PUT).
 */
export const replaceBook = async (id: string, dto: CreateBookInput): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid book ID", 400);

	const parsed = createBookSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findByIdAndUpdate(id, parsed.data, {
		returnDocument: "after",
		runValidators: true,
	}).exec();

	if (!book) throw new HttpError("Book not found", 404);
	return book;
};

/**
 * Cập nhật một phần thông tin sách (PATCH).
 */
export const updateBook = async (id: string, dto: UpdateBookInput): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid book ID", 400);

	const parsed = updateBookSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findByIdAndUpdate(id, parsed.data, {
		returnDocument: "after",
		runValidators: true,
	}).exec();

	if (!book) throw new HttpError("Book not found", 404);
	return book;
};

/**
 * Xóa sách theo ID.
 */
export const deleteBook = async (id: string): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid book ID", 400);

	const book = await Book.findById(id).exec();
	if (!book) throw new HttpError("Book not found", 404);

	await Book.findByIdAndDelete(id).exec();
	return book;
};

/**
 * Thêm định dạng (format) mới cho sách.
 */
export const addFormat = async (bookId: string, dto: AddBookFormatInput): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(bookId)) throw new HttpError("Invalid book ID", 400);

const parsed = createBookFormatSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	book.formats.push({
		// Mongoose subdocument _id sẽ được tự tạo, không cần truyền từ DTO
		...(parsed.data as any),
		createdAt: new Date(),
		updatedAt: new Date(),
	} as any);

	await book.save();
	return book;
};

/**
 * Cập nhật một định dạng (format) cụ thể của sách.
 */
export const updateFormat = async (
	bookId: string,
	formatId: string,
	dto: EditBookFormatInput,
): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(formatId)) {
		throw new HttpError("Invalid ID", 400);
	}

	const parsed = updateBookFormatSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	const formatIndex = book.formats.findIndex((f: any) => String((f as any)._id) === String(formatId));
	if (formatIndex === -1) throw new HttpError("Format not found", 404);

	const currentFormat: any = book.formats[formatIndex];
	book.formats[formatIndex] = {
		...currentFormat.toObject?.(),
		...parsed.data,
		updatedAt: new Date(),
	};

	await book.save();
	return book;
};

/**
 * Xóa một định dạng (format) khỏi sách.
 */
export const removeFormat = async (bookId: string, formatId: string): Promise<IBook | null> => {
	if (!mongoose.Types.ObjectId.isValid(bookId) || !mongoose.Types.ObjectId.isValid(formatId)) {
		throw new HttpError("Invalid ID", 400);
	}

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	const originalLength = book.formats.length;
	book.formats = book.formats.filter((f: any) => String((f as any)._id) !== String(formatId));

	if (book.formats.length === originalLength) throw new HttpError("Format not found", 404);

	await book.save();
	return book;
};