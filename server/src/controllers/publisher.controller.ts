import { NextFunction, Request, Response } from "express";
import * as publisherServices from "@services/publisher.services";
import { HttpError } from "@middleware/error.middleware";

type IdParam = { id: string };

/**
 * Tạo nhà xuất bản mới.
 * POST /api/publishers
 */
export async function createPublisher(req: Request, res: Response, next: NextFunction) {
	try {
		const publisher = await publisherServices.createPublisher(req.body);
		return res.status(201).json(publisher);
	} catch (err) {
		next(err);
	}
}

/**
 * Lấy danh sách nhà xuất bản với phân trang và tìm kiếm.
 * GET /api/publishers
 */
export async function listPublishers(req: Request, res: Response, next: NextFunction) {
	try {
		const { page, limit, search } = req.query as Record<string, string>;
		const result = await publisherServices.listPublishers({
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
 * Lấy thông tin nhà xuất bản theo ID.
 * GET /api/publishers/:id
 */
export async function getPublisher(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const publisher = await publisherServices.getPublisher(req.params.id);
		if (!publisher) return next(new HttpError("Publisher not found", 404));
		return res.status(200).json(publisher);
	} catch (err) {
		next(err);
	}
}

/**
 * Cập nhật thông tin nhà xuất bản theo ID.
 * PATCH /api/publishers/:id
 */
export async function updatePublisher(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		const publisher = await publisherServices.updatePublisher(req.params.id, req.body);
		return res.status(200).json(publisher);
	} catch (err) {
		next(err);
	}
}

/**
 * Xóa nhà xuất bản theo ID.
 * DELETE /api/publishers/:id
 */
export async function deletePublisher(req: Request<IdParam>, res: Response, next: NextFunction) {
	try {
		await publisherServices.deletePublisher(req.params.id);
		return res.status(204).send();
	} catch (err) {
		next(err);
	}
}
