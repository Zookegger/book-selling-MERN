import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { HttpError } from "./error.middleware";

/**
 * Mở rộng `Request` của Express để chứa `userId` do middleware xác thực gán.
 * @property {string} [userId] - ID người dùng được trích xuất từ JWT (nếu đã xác thực).
 */
export interface AuthRequest extends Request {
	userId?: string;
}

/**
 * Khởi tạo hệ thống xác thực JWT dùng `passport`.
 *
 * Mô tả:
 * - Đọc `JWT_SECRET` từ biến môi trường.
 * - Nếu không có `JWT_SECRET` sẽ ném lỗi ngay lập tức.
 * - Đăng ký chiến lược `passport-jwt` để trích `userId` từ payload token.
 *
 * @throws {Error} Khi `process.env.JWT_SECRET` chưa được cấu hình.
 * @returns {express.Handler} middleware khởi tạo `passport` để dùng trong app.
 */
export const initializeAuth = () => {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error("JWT_SECRET is not set");

	passport.use(
		new JwtStrategy(
			{ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: secret },
			(payload: { userId: string }, done) => {
				if (!payload.userId) return done(null, false);
				return done(null, { id: payload.userId });
			},
		),
	);

	return passport.initialize();
};

/**
 * Middleware bảo vệ route, yêu cầu JWT hợp lệ.
 *
 * Mô tả:
 * - Sử dụng `passport.authenticate('jwt')` để kiểm tra header Authorization.
 * - Nếu token hợp lệ sẽ gán `req.userId` bằng `user.id` từ payload.
 * - Nếu không hợp lệ hoặc có lỗi, trả `HttpError(401)` về pipeline lỗi.
 *
 * @param {AuthRequest} req - Request mở rộng có thể chứa `userId`.
 * @param {Response} res - Response của Express.
 * @param {NextFunction} next - Hàm next để chuyển cho middleware tiếp theo.
 * @throws {HttpError} 401 khi token không tồn tại hoặc không hợp lệ.
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
	passport.authenticate("jwt", { session: false }, (error: Error | null, user: { id: string } | false) => {
		if (error || !user) {
			return next(new HttpError("Unauthorized", 401));
		}

		req.userId = user.id;
		next();
	})(req, res, next);
};
