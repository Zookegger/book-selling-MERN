import { Request, Response, NextFunction } from "express";

/**
 * Lỗi HTTP tùy chỉnh dùng trong pipeline lỗi của ứng dụng.
 * - `statusCode`: mã HTTP trả về.
 * - `status`: chuỗi phân loại `fail` (4xx) hoặc `error` (5xx).
 * - `isOperational`: đánh dấu lỗi do ứng dụng / client (khác với lỗi code nội bộ).
 */
export class HttpError extends Error {
	statusCode: number;
	status: string;
	isOperational: boolean;
	data?: any;

	constructor(message: string, statusCode: number, data?: any) {
		super(message);
		this.statusCode = statusCode;
		// 4xx = fail (client error), 5xx = error (server error)
		this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
		this.isOperational = true;
		this.data = data;

		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Middleware xử lý 404 Not Found.
 * Tạo một `HttpError` 404 và chuyển nó vào pipeline lỗi.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
	const error = new HttpError(`Not Found - ${req.originalUrl}`, 404);
	next(error);
};

/**
 * Middleware lỗi chung (error handler) cho Express.
 * - Nếu lỗi là `HttpError` và là lỗi thao tác (operational), trả về statusCode và message.
 * - Ngược lại trả về 500 và thông báo chung `Internal Server Error`.
 */
export const errorHandler = (err: Error | HttpError, _req: Request, res: Response, _next: NextFunction): void => {
	if (err instanceof HttpError && err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
			data: err.data || null,
		});
		return;
	}

	res.status(500).json({
		status: "error",
		message: "Internal Server Error",
	});
};
