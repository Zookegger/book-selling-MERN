import { validationResult } from "express-validator";
import { HttpError } from "./error.middleware";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware kiểm tra kết quả của `express-validator`.
 * - Nếu có lỗi validation, ném `HttpError` với mã 400 và thông báo lỗi đầu tiên.
 * - Nếu không có lỗi, tiếp tục pipeline bằng `next()`.
 *
 * @param req - Request của Express
 * @param _res - Response (không sử dụng)
 * @param next - NextFunction để tiếp tục pipeline
 */
export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		throw new HttpError(errors.array()[0].msg, 400);
	}
	next();
};
