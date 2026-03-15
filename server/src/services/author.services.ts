import mongoose from "mongoose";
import { Author, Category } from "@models";
import { IAuthor } from "@models/author.model";
import { HttpError } from "@middleware/error.middleware";
import { CreateAuthorInput, createAuthorSchema, UpdateAuthorInput, updateAuthorSchema } from "@schemas";
import { getPagination } from "@utils";

/**
 * Tạo tác giả mới.
 *
 * - Validate dữ liệu đầu vào bằng `createAuthorSchema`.
 * - Kiểm tra email đã tồn tại hay chưa.
 * - Tự động tạo slug từ tên nếu không được cung cấp.
 * - Lưu và trả về tác giả vừa tạo.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 409 khi email đã được sử dụng.
 */
export const createAuthor = async (dto: CreateAuthorInput): Promise<IAuthor> => {
	const parsed = createAuthorSchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const existing = await Author.findOne({ email: parsed.data.email });
	if (existing) throw new HttpError("Author already exists", 409);

	const author = new Author({ ...parsed.data });
	try {
		await author.save();
	} catch (err: any) {
		if (err.code === 11000) throw new HttpError("Author already exists", 409);
		throw err;
	}

	return author;
};

/**
 * Lấy danh sách tác giả có phân trang và tìm kiếm theo tên.
 *
 * @param query.page   Trang hiện tại (mặc định: 1).
 * @param query.limit  Số lượng kết quả mỗi trang (mặc định: 10).
 * @param query.search Chuỗi tìm kiếm theo tên tác giả (không phân biệt hoa/thường).
 * @returns Đối tượng chứa danh sách, tổng số, trang hiện tại và tổng số trang.
 */
export const listAuthors = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	order?: "asc" | "desc";
}): Promise<{ data: IAuthor[]; total: number; page: number; totalPages: number }> => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.name = { $regex: query.search, $options: "i" }; // case-insensitive
	}

	const total = await Author.countDocuments(filter);

	const data = await Author.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ createdAt: query.order === "desc" ? -1 : 1 }); // Sort by newest

	const totalPages = Math.ceil(total / limit);
	return { data, total, page, totalPages };
};

/**
 * Lấy thông tin tác giả theo ID.
 *
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Tác giả nếu tìm thấy, ngược lại trả về null.
 */
export const getAuthor = async (identifier: string): Promise<IAuthor | null> => {
	if (mongoose.Types.ObjectId.isValid(identifier)) return await Author.findById(identifier);

	return await Author.findOne({ $or: [{ slug: identifier }, { email: identifier }, { name: identifier }] }).exec();
};

/**
 * Cập nhật thông tin tác giả theo ID.
 *
 * - Validate dữ liệu đầu vào (partial) bằng `updateAuthorSchema`.
 * - Trả về tác giả sau khi cập nhật.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 404 khi tác giả không tồn tại.
 */
export const updateAuthor = async (id: string, dto: UpdateAuthorInput): Promise<IAuthor | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	const parsed = updateAuthorSchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const author = await Author.findById(id);
	if (!author) throw new HttpError("Author not found", 404);

	if (parsed.data.slug && parsed.data.slug !== author.slug) {
		const existing = await Author.findOne({ slug: parsed.data.slug });
		if (existing) {
			throw new HttpError("Slug already taken", 409);
		}
	}

	return await Author.findByIdAndUpdate(id, parsed.data, { returnDocument: "after" }).exec();
};

/**
 * Xóa tác giả theo ID.
 *
 * @throws {HttpError} 404 khi tác giả không tồn tại.
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Tác giả đã xóa.
 */
export const deleteAuthor = async (id: string): Promise<IAuthor | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	const author = await Author.findById(id);

	if (!author) throw new HttpError("Author not found", 404);

	await Author.findByIdAndDelete(id).exec();
	return author;
};
