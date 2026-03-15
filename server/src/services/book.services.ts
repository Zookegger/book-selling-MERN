import { Book } from "@models";
import { HttpError } from "@middleware/error.middleware";
import type { IBook } from "@models/book.model";
import {
	AddBookFormatInput,
	CreateBookInput,
	createBookFormatSchema,
	createBookSchema,
	EditBookFormatInput,
	updateBookFormatSchema,
	updateBookSchema,
	UpdateBookInput,
} from "@schemas/book.schema";
import { getPagination } from "@utils";
import mongoose from "mongoose";

/**
 * Kiểm tra chuỗi có phải là ObjectId hợp lệ hay không.
 *
 * @param value - Chuỗi cần kiểm tra.
 * @param label - Nhãn hiển thị trong thông báo lỗi.
 * @throws {HttpError} 400 khi không phải ObjectId hợp lệ.
 */
const ensureValidObjectId = (value: string, label = "ID"): void => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw new HttpError(`Invalid ${label}`, 400);
	}
};

/**
 * Kiểm tra các business rule chéo trường cho format sách mà schema không thể
 * biểu diễn.
 *
 * - `physical`: không được có trường `file`.
 * - `digital`: không được có trường `stockQuantity`.
 *
 * @param format - Đối tượng format (partial) để kiểm tra.
 * @throws {HttpError} 400 khi vi phạm rule.
 */
const validateFormatBusinessRules = (format: Record<string, unknown>): void => {
	if (format.formatType === "physical" && format.file != null) {
		throw new HttpError("Physical format cannot have a digital file.", 400);
	}

	if (format.formatType === "digital" && format.stockQuantity != null) {
		throw new HttpError("Digital format should not have stock quantity.", 400);
	}
};

/**
 * Tạo sách mới.
 *
 * - Validate payload sử dụng `createBookSchema`.
 * - Kiểm tra trùng `isbn` nếu có.
 * - Áp dụng các business rule cho `formats` trước khi lưu.
 *
 * @param dto - Dữ liệu đầu vào cho sách mới.
 * @returns Promise<IBook> - Tài liệu sách vừa tạo.
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 409 khi ISBN đã tồn tại.
 */
export const createBook = async (dto: CreateBookInput): Promise<IBook> => {
	if (Array.isArray(dto.formats)) {
		dto.formats.forEach((format: Record<string, unknown>) => validateFormatBusinessRules(format));
	}

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
		if (error?.code === 11000) {
			throw new HttpError("A book with this ISBN already exists", 409);
		}

		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 * Lấy danh sách sách có phân trang, tìm kiếm theo tiêu đề và lọc theo ngôn ngữ.
 *
 * @param query.page - Số trang (1-indexed).
 * @param query.limit - Số mục trên trang.
 * @param query.search - Từ khóa tìm kiếm theo tiêu đề (case-insensitive).
 * @param query.language - Lọc theo mã ngôn ngữ (ví dụ: 'en', 'es').
 * @param query.order - Sắp xếp theo ngày tạo ('asc' | 'desc').
 * @returns Promise<{ data: IBook[]; total: number; page: number; totalPages: number }>
 */
export const listBooks = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	language?: string;
	order?: "asc" | "desc";
}) => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.title = { $regex: query.search, $options: "i" }; // case-insensitive
	}

	if (query.language) {
		filter.language = query.language;
	}

	const total = await Book.countDocuments(filter);

	const data = await Book.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ createdAt: query.order === "desc" ? -1 : 1 }); // Sort by newest

	const totalPages = Math.ceil(total / limit);
	return { data, total, page, totalPages };
};

/**
 * Lấy thông tin một sách theo ObjectId.
 *
 * @param identifier - ObjectId của sách.
 * @returns Promise<IBook | null> - Trả về null nếu không tìm thấy.
 * @throws {HttpError} 400 khi identifier không phải là ObjectId hợp lệ.
 */
export const getBook = async (identifier: string) => {
	ensureValidObjectId(identifier, "ID");

	return await Book.findById(identifier).populate("authors").populate("publisher").populate("categories").exec();
};

/**
 * Thay thế hoàn toàn một sách (PUT).
 *
 * - Validate payload đầy đủ bằng `createBookSchema`.
 * - Kiểm tra tồn tại của sách trước khi thay thế.
 * - Kiểm tra trùng `isbn` với các sách khác.
 *
 * @param id - ObjectId của sách cần thay thế.
 * @param dto - Dữ liệu thay thế (toàn bộ tài liệu).
 * @returns Promise<IBook> - Sách đã được thay thế.
 * @throws {HttpError} 400|404|409
 */
export const replaceBook = async (id: string, dto: UpdateBookInput) => {
	ensureValidObjectId(id, "ID");

	if (Array.isArray(dto.formats)) {
		dto.formats.forEach((format: Record<string, unknown>) => validateFormatBusinessRules(format));
	}

	const parsed = createBookSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const existing = await Book.findById(id).exec();
	if (!existing) throw new HttpError("Book not found", 404);

	if (parsed.data.isbn) {
		const isbnConflict = await Book.findOne({ isbn: parsed.data.isbn, _id: { $ne: id } }).exec();
		if (isbnConflict) throw new HttpError("A book with this ISBN already exists", 409);
	}

	try {
		const replaced = await Book.findOneAndReplace({ _id: id }, parsed.data, {
			returnDocument: "after",
			runValidators: true,
		}).exec();

		if (!replaced) throw new HttpError("Book not found", 404);
		return replaced;
	} catch (error: any) {
		if (error?.code === 11000) {
			throw new HttpError("A book with this ISBN already exists", 409);
		}

		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 * Cập nhật một số trường của sách (PATCH).
 *
 * - Validate partial payload bằng `updateBookSchema`.
 * - Không sửa các trường không được cung cấp.
 * - Kiểm tra trùng `isbn` nếu có thay đổi.
 *
 * @param id - ObjectId của sách cần cập nhật.
 * @param dto - Partial update payload.
 * @returns Promise<IBook>
 * @throws {HttpError} 400|404|409
 */
export const updateBook = async (id: string, dto: UpdateBookInput) => {
	ensureValidObjectId(id, "ID");

	if (Array.isArray(dto.formats)) {
		dto.formats.forEach((format: Record<string, unknown>) => validateFormatBusinessRules(format));
	}

	const parsed = updateBookSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	if (parsed.data.isbn) {
		const isbnConflict = await Book.findOne({ isbn: parsed.data.isbn, _id: { $ne: id } }).exec();
		if (isbnConflict) throw new HttpError("A book with this ISBN already exists", 409);
	}

	try {
		const updated = await Book.findByIdAndUpdate(id, parsed.data, {
			returnDocument: "after",
			runValidators: true,
		}).exec();

		if (!updated) throw new HttpError("Book not found", 404);
		return updated;
	} catch (error: any) {
		if (error?.code === 11000) {
			throw new HttpError("A book with this ISBN already exists", 409);
		}

		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 * Xóa một sách theo id.
 *
 * @param id - ObjectId của sách cần xóa.
 * @returns Promise<IBook> - Tài liệu đã bị xóa.
 * @throws {HttpError} 400 khi id không hợp lệ.
 * @throws {HttpError} 404 khi sách không tồn tại.
 */
export const deleteBook = async (id: string) => {
	ensureValidObjectId(id, "ID");

	const book = await Book.findById(id).exec();
	if (!book) throw new HttpError("Book not found", 404);

	await Book.findByIdAndDelete(id).exec();
	return book;
};

/**
 * Thêm một định dạng (format) vào sách hiện có.
 *
 * - Validate định dạng bằng `createBookFormatSchema`.
 * - Áp dụng các business rule (physical/digital) trước khi thêm.
 *
 * @param bookId - ObjectId của sách cần thêm format.
 * @param dto - Đối tượng định dạng.
 * @returns Promise<IBook> - Sách đã cập nhật chứa định dạng mới.
 * @throws {HttpError} 400|404|409
 */
export const addFormat = async (bookId: string, dto: AddBookFormatInput | Record<string, unknown>) => {
	ensureValidObjectId(bookId, "book ID");

	validateFormatBusinessRules(dto as Record<string, unknown>);

	const parsed = createBookFormatSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	try {
		const updatedBook = await Book.findByIdAndUpdate(
			bookId,
			{ $push: { formats: parsed.data } },
			{ returnDocument: "after", runValidators: true },
		).exec();
		return updatedBook;
	} catch (error: any) {
		if (error?.code === 11000) {
			throw new HttpError("A format with this SKU or ISBN already exists", 409);
		}

		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 * Cập nhật một format đã tồn tại trên sách.
 *
 * - Validate partial format bằng `updateBookFormatSchema`.
 * - Áp dụng business rules với merge của dữ liệu cũ và mới để tránh
 *   thay đổi trái phép giữa các loại format.
 *
 * @param bookId - ObjectId của sách chứa format.
 * @param formatId - ObjectId của format cần cập nhật.
 * @param dto - Partial update cho format.
 * @returns Promise<IBook> - Sách sau khi cập nhật format.
 * @throws {HttpError} 400|404|409
 */
export const updateFormat = async (bookId: string, formatId: string, dto: EditBookFormatInput) => {
	ensureValidObjectId(bookId, "book ID");
	ensureValidObjectId(formatId, "format ID");

	const parsed = updateBookFormatSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	const formatIndex = book.formats.findIndex((item: any) => item?._id?.toString() === formatId);
	if (formatIndex === -1) throw new HttpError("Format not found", 404);

	const format = book.formats[formatIndex];
	if (!format) throw new HttpError("Format not found", 404);

	const mergedFormat = {
		...Object(format),
		...Object(parsed.data),
		formatType: parsed.data.formatType ?? format.formatType,
	};
	validateFormatBusinessRules(mergedFormat);

	try {
		Object.assign(format, parsed.data);
		await book.save();
		return book;
	} catch (error: any) {
		if (error?.code === 11000) {
			throw new HttpError("A format with this SKU or ISBN already exists", 409);
		}

		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

/**
 * Xóa một format khỏi sách.
 *
 * @param bookId - ObjectId của sách chứa format.
 * @param formatId - ObjectId của format cần xóa.
 * @returns Promise<IBook> - Sách sau khi xóa format.
 * @throws {HttpError} 400|404
 */
export const removeFormat = async (bookId: string, formatId: string) => {
	ensureValidObjectId(bookId, "book ID");
	ensureValidObjectId(formatId, "format ID");

	const book = await Book.findById(bookId).exec();
	if (!book) throw new HttpError("Book not found", 404);

	const formatIndex = book.formats.findIndex((item: any) => item?._id?.toString() === formatId);
	if (formatIndex === -1) throw new HttpError("Format not found", 404);

	book.formats.splice(formatIndex, 1);
	await book.save();

	return book;
};
