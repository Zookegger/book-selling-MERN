import { NextFunction, Request, Response } from "express";
import * as authorServices from "@services/author.services";
import { HttpError } from "@middleware/error.middleware";

type IdParam = { id: string };

/**
 * Tạo tác giả mới.
 * POST /api/authors
 */
export async function createAuthor(req: Request, res: Response, next: NextFunction) {
	try {
		const author = await authorServices.createAuthor(req.body);
		return res.status(201).json(author);
	} catch (err) {
		next(err);
	}
}

/**
 * Lấy danh sách tác giả với phân trang và tìm kiếm.
 * GET /api/authors
 */
export async function listAuthors(req: Request, res: Response, next: NextFunction) {
	try {
		const { page, limit, search } = req.query as Record<string, string>;
		const result = await authorServices.listAuthors({
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
 * Lấy thông tin tác giả theo ID.
 * GET /api/authors/:id
 */
export async function getAuthor(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const author = await authorServices.getAuthor(req.params.id);
		if (!author) return next(new HttpError("Author not found", 404));
		return res.status(200).json(author);
	} catch (err) {
		next(err);
	}
}

/**
 * Cập nhật thông tin tác giả theo ID.
 * PATCH /api/authors/:id
 */
export async function updateAuthor(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const author = await authorServices.updateAuthor(req.params.id, req.body);
		return res.status(200).json(author);
	} catch (err) {
		next(err);
	}
}

/**
 * Xóa tác giả theo ID.
 * DELETE /api/authors/:id
 */
export async function deleteAuthor(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		await authorServices.deleteAuthor(req.params.id);
		return res.status(204).send();
	} catch (err) {
		next(err);
	}
}
