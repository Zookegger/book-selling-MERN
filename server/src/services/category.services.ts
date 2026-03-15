import mongoose from "mongoose";
import { Category } from "@models";
import { ICategory } from "@models/category.model";
import { HttpError } from "@middleware/error.middleware";
import { createCategorySchema, updateCategorySchema } from "@schemas";
import { getPagination } from "@utils";

/**
 * Tạo danh mục mới.
 *
 * - Validate dữ liệu đầu vào bằng `createCategorySchema`.
 * - Kiểm tra slug đã tồn tại hay chưa.
 * - Tự động xây dựng mảng `ancestors` dựa trên danh mục cha (nếu có).
 * - Lưu và trả về danh mục vừa tạo.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 409 khi slug đã tồn tại.
 */
export const createCategory = async (dto: Record<string, unknown>): Promise<ICategory> => {
	const parsed = createCategorySchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	// Extract the parent field from validated input.
	const { parent } = parsed.data;

	let parentId: mongoose.Types.ObjectId | null = null;
	let ancestors: mongoose.Types.ObjectId[] = [];

	if (parent) {
		// Validate the provided parent id and load the parent document.
		if (!mongoose.Types.ObjectId.isValid(parent)) throw new HttpError("Invalid parent id", 400);
		parentId = new mongoose.Types.ObjectId(parent);
		const parentDoc = await Category.findById(parentId);
		// If parent does not exist, abort creation.
		if (!parentDoc) throw new HttpError("Parent not found", 404);
		// Build the `ancestors` array by taking the parent's ancestors
		// and appending the parent itself. This allows fast breadcrumb
		// and subtree queries later.
		ancestors = [...parentDoc.ancestors, parentDoc._id];
	}

	const category = new Category({ ...parsed.data, parent: parentId, ancestors });
	try {
		await category.save();
	} catch (err: any) {
		if (err.code === 11000) throw new HttpError("Category with this slug already exists", 409);
		throw err;
	}
	return category;
};

/**
 * Lấy danh sách danh mục có phân trang và tìm kiếm theo tên.
 *
 * @param query.page   Trang hiện tại (mặc định: 1).
 * @param query.limit  Số lượng kết quả mỗi trang (mặc định: 10).
 * @param query.search Chuỗi tìm kiếm theo tên (không phân biệt hoa/thường).
 * @returns Đối tượng chứa danh sách, tổng số, trang hiện tại và tổng số trang.
 */
export const listCategories = async (query: {
	page?: number;
	limit?: number;
	search?: string;
	order?: "asc" | "desc";
}): Promise<{ data: ICategory[]; total: number; page: number; totalPages: number }> => {
	const { page, limit, skip } = getPagination({ limit: query.limit, page: query.page });

	const filter: any = {};

	if (query.search) {
		filter.name = { $regex: query.search, $options: "i" }; // case-insensitive
	}

	const total = await Category.countDocuments(filter);

	const data = await Category.find(filter)
		.skip(skip)
		.limit(limit)
		.sort({ name: query.order === "desc" ? -1 : 1 }); // Sort by alphabetic

	const totalPages = Math.ceil(total / limit);

	return { data, total, page, totalPages };
};

/**
 * Lấy thông tin danh mục theo ID, có populate danh mục cha.
 *
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Danh mục nếu tìm thấy, ngược lại trả về null.
 */
export const getCategory = async (identifier: string): Promise<ICategory | null> => {
	// The identifier can be an ObjectId, a slug, or a name. When it's a
	// valid ObjectId we prefer `findById` to return the exact document.
	if (mongoose.Types.ObjectId.isValid(identifier)) {
		return await Category.findById(identifier).populate("parent").populate("ancestors").exec();
	}
	// Otherwise try slug or name. We populate `parent` and `ancestors`
	// so callers receive breadcrumb information without extra queries.
	return await Category.findOne({ $or: [{ slug: identifier }, { name: identifier }] })
		.populate("parent")
		.populate("ancestors")
		.exec();
};

/**
 * Trả về toàn bộ cây danh mục (các danh mục gốc với con được lồng vào nhau).
 *
 * - Lấy tất cả danh mục một lần duy nhất để tránh N+1 query.
 * - Xây dựng cấu trúc cây trong bộ nhớ.
 *
 * @returns Mảng các danh mục gốc, mỗi mục có trường `children` tùy chọn.
 */
export const getCategoryTree = async (): Promise<(ICategory & { children?: ICategory[] })[]> => {
	// Load all categories into memory once to avoid N+1 queries. We use
	// `.lean()` to get plain objects (faster and cheaper than full Mongoose
	// documents) and then add a transient `children` array to each node.
	const docs = (await Category.find().sort({ order: -1, name: 1 }).lean().exec()) as (ICategory & {
		children?: ICategory[];
	})[];

	// Build a lookup map keyed by _id to assemble the tree in-memory.
	const map: Record<string, ICategory & { children?: ICategory[] }> = {};
	docs.forEach((d) => {
		// Create empty children array on each node; this field is not stored
		// in the DB but is useful for returning a nested tree to callers.
		d.children = [];
		map[d._id.toString()] = d;
	});

	// Attach children to their parent using the map. Nodes whose parent is
	// missing (or null) are treated as roots.
	const roots: ICategory[] = [];
	docs.forEach((d: ICategory & { children?: ICategory[] }) => {
		if (d.parent) {
			const p = map[d.parent.toString()];
			if (p && p.children) p.children.push(d);
			else roots.push(d);
		} else {
			roots.push(d);
		}
	});

	// Return the forest (top-level categories). Each node includes a
	// `children` array for its nested children.
	return roots;
};

/**
 * Cập nhật thông tin danh mục theo ID.
 *
 * - Validate dữ liệu đầu vào (partial) bằng `updateCategorySchema`.
 * - Kiểm tra slug mới chưa bị trùng nếu có thay đổi.
 * - Trả về danh mục sau khi cập nhật.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 404 khi danh mục không tồn tại.
 * @throws {HttpError} 409 khi slug mới đã tồn tại.
 */
export const updateCategory = async (id: string, dto: Record<string, unknown>): Promise<ICategory | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	// Validate partial fields allowed by update schema
	const parsed = updateCategorySchema.safeParse(dto);

	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(",");
		throw new HttpError(message, 400);
	}

	// Ensure the category exists before attempting updates
	const existing = await Category.findById(id);
	if (!existing) throw new HttpError("Category not found", 404);

	// If slug is being changed, ensure the new slug is unique
	if (parsed.data.slug && parsed.data.slug !== existing.slug)
		if (await Category.findOne({ slug: parsed.data.slug })) throw new HttpError("Slug already exists", 409);

	const rawParent = parsed.data.parent;
	const currentParentStr = existing.parent ? existing.parent.toString() : null;
	const newParentStr = rawParent ? String(rawParent) : null;
	const isParentChanging =
		Object.prototype.hasOwnProperty.call(parsed.data, "parent") && currentParentStr !== newParentStr;

	// If parent is being changed, we must update the node's ancestors and
	// also adjust all descendants so their ancestor paths remain correct.
	// This operation must prevent cycles (moving under a descendant)
	// and should be performed inside a transaction to keep the tree consistent.
	if (isParentChanging) {
		if (rawParent && !mongoose.Types.ObjectId.isValid(rawParent)) {
			throw new HttpError("Invalid parent ID format", 400);
		}

		const newParentId = rawParent ? new mongoose.Types.ObjectId(rawParent) : null;

		// Prevent setting the node as its own parent
		if (newParentId && newParentId.equals(existing._id))
			throw new HttpError("Category cannot be its own parent", 400);

		if (newParentId) {
			const parentDoc = await Category.findById(newParentId);
			if (!parentDoc) throw new HttpError("Parent not found", 404);
			// Prevent cycles: new parent must not be a descendant of the node
			const isDescendant = await Category.exists({ _id: newParentId, ancestors: existing._id });
			if (isDescendant) throw new HttpError("Cannot move category under its descendant", 400);
		}

		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Compute the new ancestors array for the node being moved.
			// If newParentId is null, ancestors should be empty.
			const newAncestors = newParentId
				? [...(await Category.findById(newParentId).session(session))!.ancestors, newParentId]
				: [];
			// Update the node itself inside the transaction
			await Category.findByIdAndUpdate(
				id,
				{ ...parsed.data, parent: newParentId, ancestors: newAncestors },
				{ new: true, session },
			);

			// Update all descendants: replace the prefix of their `ancestors`
			// that referenced `existing._id` with the new prefix (newAncestors + existing._id).
			const descendants = await Category.find({ ancestors: existing._id }).session(session);

			if (descendants.length > 0) {
				const bulkOps = descendants.map((desc) => {
					const pos = desc.ancestors.findIndex((a: mongoose.Types.ObjectId) => a.equals(existing._id));
					const suffix = desc.ancestors.slice(pos + 1);

					return {
						updateOne: {
							filter: { _id: desc._id },
							// New ancestor path: newAncestors + existing node id + old suffix
							update: { $set: { ancestors: [...newAncestors, existing._id, ...suffix] } },
						},
					};
				});

				await Category.bulkWrite(bulkOps, { session });
			}

			await session.commitTransaction();
			// Return the updated node (outside transaction is fine since we've committed)
			return await Category.findById(id).exec();
		} catch (err) {
			await session.abortTransaction();
			throw err;
		} finally {
			await session.endSession();
		}
	}

	// No parent change: simple update of given fields
	return await Category.findByIdAndUpdate(id, parsed.data, { new: true }).exec();
};

/**
 * Xóa danh mục theo ID.
 *
 * @throws {HttpError} 404 khi danh mục không tồn tại.
 * @throws {mongoose.Error.CastError} khi ID không hợp lệ.
 * @returns Danh mục đã xóa.
 */
export const deleteCategory = async (id: string): Promise<ICategory | null> => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError("Invalid ID", 400);

	// Load the category so we can return it after deletion.
	const category = await Category.findById(id);
	if (!category) throw new HttpError("Category not found", 404);

	// By default we prevent deleting a category that still has children.
	// Callers should reassign or delete children first, or we could
	// implement cascading/reparenting behavior here if desired.
	const childCount = await Category.countDocuments({ parent: id });
	if (childCount > 0) throw new HttpError("Category has children; delete or reassign them first", 400);

	// Delete and return the previously loaded document.
	await Category.findByIdAndDelete(id).exec();
	return category;
};
