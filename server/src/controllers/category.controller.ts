import { NextFunction, Request, Response } from "express";
import * as categoryServices from "@services/category.services";
import { HttpError } from "@middleware/error.middleware";

type IdParam = { id: string };

/**
 * Tạo danh mục mới.
 * POST /api/categories
 */
export async function createCategory(req: Request, res: Response, next: NextFunction) {
	try {
		const category = await categoryServices.createCategory(req.body);
		return res.status(201).json(category);
	} catch (err) {
		next(err);
	}
}

/**
 * Lấy danh sách danh mục với phân trang và tìm kiếm.
 * GET /api/categories
 */
export async function listCategories(req: Request, res: Response, next: NextFunction) {
	try {
		const { page, limit, search } = req.query as Record<string, string>;
		const result = await categoryServices.listCategories({
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
			search,
		});
		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
}

/**
 * Lấy toàn bộ cây danh mục (các danh mục gốc với con lồng vào nhau).
 * GET /api/categories/tree
 */
export async function getCategoryTree(req: Request, res: Response, next: NextFunction) {
	try {
		const tree = await categoryServices.getCategoryTree();
		return res.status(200).json(tree);
	} catch (err) {
		next(err);
	}
}

/**
 * Lấy thông tin danh mục theo ID.
 * GET /api/categories/:id
 */
export async function getCategory(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const category = await categoryServices.getCategory(req.params.id);
		if (!category) return next(new HttpError("Category not found", 404));
		return res.status(200).json(category);
	} catch (err) {
		next(err);
	}
}

/**
 * Cập nhật thông tin danh mục theo ID.
 * PATCH /api/categories/:id
 */
export async function updateCategory(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const category = await categoryServices.updateCategory(req.params.id, req.body);
		return res.status(200).json(category);
	} catch (err) {
		next(err);
	}
}

/**
 * Xóa danh mục theo ID.
 * DELETE /api/categories/:id
 */
export async function deleteCategory(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		await categoryServices.deleteCategory(req.params.id);
		return res.status(204).send();
	} catch (err) {
		next(err);
	}
}
