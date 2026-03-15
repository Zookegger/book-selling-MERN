import { HttpError } from "@middleware/error.middleware";
import { NextFunction, Request, Response } from "express";
import { authServices } from "@services";
import User from "@models/user.model";
import { AuthRequest } from "@middleware/auth.middleware";
import mongoose from "mongoose";

/**
 * Xử lý yêu cầu đăng nhập.
 * - Đọc `email` và `password` từ body.
 * - Gọi `authServices.login` để xác thực và lấy `user` + `token`.
 * - Trả về thông tin người dùng (không bao gồm mật khẩu).
 */
export async function login(req: Request, res: Response, next: NextFunction) {
	try {
		const { user, token } = await authServices.login(req.body);
		if (!user) {
			throw new HttpError("User not found", 404);
		}

		return res.status(200).json({
			message: "Login successful",
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
			token,
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Xử lý đăng ký tài khoản mới.
 * - Lấy thông tin từ body và gọi `authServices.register`.
 * - Gửi email xác minh.
 * - Trả về 201 với chỉ message xác nhận.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
	try {
		const user = await authServices.register(req.body);

		if (!user) throw new HttpError("Something went wrong while signing up", 500);

		return res.status(201).json({
			message: "Registration successful. Please check your email to verify your account.",
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Xác minh email của người dùng.
 * - Lấy token từ query parameters.
 * - Gọi `authServices.verifyEmail` để xác minh.
 * - Trả về thông tin người dùng đã xác minh.
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
	try {
		const { token } = req.query;

		if (!token || typeof token !== "string") {
			throw new HttpError("Verification token is required and must be a string", 400);
		}

		const user = await authServices.verifyEmail({ token });

		return res.status(200).json({
			message: "Email verified successfully",
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				isEmailVerified: user.isEmailVerified,
			},
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Endpoint trả về session hiện tại của người dùng.
 * - Yêu cầu `authMiddleware` đã gán `req.userId`.
 * - Nếu tìm được user trong DB, trả về chi tiết (không có password).
 */
export async function session(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		let user = null;
		try {
			if (mongoose.Types.ObjectId.isValid(userId)) {
				user = await User.findById(userId).select("-password");
			}
		} catch {
			// CastError or similar — userId is not a valid ObjectId, fall through
		}

		if (user) {
			return res
				.status(200)
				.json({ userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName });
		}

		return res.status(200).json({ userId });
	} catch (err) {
		next(err);
	}
}

/**
 * Xử lý đăng xuất — route bảo vệ phải có `req.userId`.
 */
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		return res.status(200).json({ message: "Logged out successfully" });
	} catch (err) {
		next(err);
	}
}

/**
 * Gửi email đặt lại mật khẩu.
 * - Lấy email từ body.
 * - Gọi `authServices.forgotPassword`.
 * - Luôn trả về thành công (tránh email enumeration).
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
	try {
		await authServices.forgotPassword(req.body);

		// Always return success message to prevent email enumeration
		return res.status(200).json({
			message: "If that email exists, a password reset link has been sent",
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Đặt lại mật khẩu người dùng.
 * - Lấy token và mật khẩu mới từ body.
 * - Gọi `authServices.resetPassword`.
 * - Trả về thông tin người dùng với mật khẩu đã cập nhật.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
	try {
		const user = await authServices.resetPassword(req.body);

		return res.status(200).json({
			message: "Password reset successfully",
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Gửi lại email xác minh.
 * - Lấy email từ body.
 * - Gọi `authServices.resendVerificationEmail`.
 * - Trả về thông tin người dùng.
 */
export async function resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
	try {
		const user = await authServices.resendVerificationEmail(req.body);

		return res.status(200).json({
			message: "Verification email has been sent",
			user: {
				id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		});
	} catch (err) {
		next(err);
	}
}
