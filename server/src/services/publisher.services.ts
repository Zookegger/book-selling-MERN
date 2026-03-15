import mongoose from "mongoose";
import { Publisher } from "@models";
import { IPublisher } from "@models/publisher.model";
import { HttpError } from "@middleware/error.middleware";
import { createPublisherSchema, updatePublisherSchema } from "@schemas";
import { getPagination } from "@utils";

/**
 * Tạo nhà xuất bản mới.
 *
 * - Validate dữ liệu đầu vào bằng `createPublisherSchema`.
 * - Kiểm tra tên đã tồn tại hay chưa (tên nhà xuất bản là duy nhất).
 * - Tự động tạo slug từ tên nếu không được cung cấp.
 * - Lưu và trả về nhà xuất bản vừa tạo.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 409 khi tên đã tồn tại.
 */
export const createPublisher = async (dto: Record<string, unknown>): Promise<IPublisher> => {
	const parsed = createPublisherSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(",");
		throw new HttpError(message, 400);
	}

	const existing = await Publisher.findOne({
		$or: [{ contactEmail: parsed.data.contactEmail }, { name: parsed.data.name }],
	});

	if (existing) throw new HttpError("Publisher already exists", 409);

	const publisher = new Publisher({ ...parsed.data });

	try {
		await publisher.save();
	} catch (err: any) {
		if (err.code === 11000) throw new HttpError("Author already exists", 409);
		throw err;
	}

	return publisher;
};

/**
 * Lấy danh sách nhà xuất bản có phân trang và tìm kiếm theo tên.
 *
 * @param query.page   Trang hiện tại (mặc định: 1).
 * @param query.limit  Số lượng kết quả mỗi trang (mặc định: 10).
 * @param query.search Chuỗi tìm kiếm theo tên (không phân biệt hoa/thường).
 * @returns Đối tượng chứa danh sách, tổng số, trang hiện tại và tổng số trang.
 */
export const listPublishers = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	order?: "asc" | "desc";
}): Promise<{ data: IPublisher[]; total: number; page: number; totalPages: number }> => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.name = { $regex: query.search, $options: "i" }; // case-insensitive
	}

	const total = await Publisher.countDocuments(filter);

	const data = await Publisher.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ createdAt: query.order === "desc" ? -1 : 1 }); // Sort by newest

	const totalPages = Math.ceil(total / limit);
	return { data, total, page, totalPages };
};

/**
 * Lấy thông tin nhà xuất bản theo ID.
 *
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Nhà xuất bản nếu tìm thấy, ngược lại trả về null.
 */
export const getPublisher = async (identifier: string): Promise<IPublisher | null> => {
	if (mongoose.Types.ObjectId.isValid(identifier)) return await Publisher.findById(identifier);

	return await Publisher.findOne({
		$or: [{ slug: identifier }, { contactEmail: identifier }, { name: identifier }],
	}).exec();
};

/**
 * Cập nhật thông tin nhà xuất bản theo ID.
 *
 * - Validate dữ liệu đầu vào (partial) bằng `updatePublisherSchema`.
 * - Trả về nhà xuất bản sau khi cập nhật.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 404 khi nhà xuất bản không tồn tại.
 */
export const updatePublisher = async (id: string, dto: Record<string, unknown>): Promise<IPublisher | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	const parsed = updatePublisherSchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const publisher = await Publisher.findById(id);
	if (!publisher) throw new HttpError("Publisher not found", 404);

	if (parsed.data.slug && parsed.data.slug !== publisher.slug) {
		const existing = await Publisher.findOne({ slug: parsed.data.slug });
		if (existing) {
			throw new HttpError("Slug already taken", 409);
		}
	}

	return await Publisher.findByIdAndUpdate(id, parsed.data, { new: true }).exec();
};

/**
 * Xóa nhà xuất bản theo ID.
 *
 * @throws {HttpError} 404 khi nhà xuất bản không tồn tại.
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Nhà xuất bản đã xóa.
 */
export const deletePublisher = async (id: string): Promise<IPublisher | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	const publisher = await Publisher.findById(id);

	if (!publisher) throw new HttpError("Publisher not found", 404);

	await Publisher.findByIdAndDelete(id).exec();
	return publisher;
};
