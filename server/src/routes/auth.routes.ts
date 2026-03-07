import { Router } from "express";
import { authController } from "@controllers";
import { errorHandler } from "@middleware/error.middleware";
import { authMiddleware } from "@middleware/auth.middleware";
import { body, query } from "express-validator";
import { validateRequest } from "@middleware/validation.middleware";

/**
 * Router cho các endpoint xác thực.
 * - Các route sử dụng `express-validator` để validate input và `validateRequest` middleware.
 * - Endpoints: login, register, verify-email, forgot-password, reset-password, resend-verification
 */
const authRouter = Router();

/**
 * POST /api/auth/login
 * Đăng nhập người dùng bằng email và mật khẩu
 */
authRouter.post(
	"/login",
	[
		body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
		body("password").notEmpty().withMessage("Password is required"),
	],
	validateRequest,
	authController.login,
	errorHandler,
);

/**
 * POST /api/auth/register
 * Đăng ký tài khoản người dùng mới
 */
authRouter.post(
	"/register",
	[
		body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
		body("firstName").trim().notEmpty().withMessage("First name is required"),
		body("lastName").trim().notEmpty().withMessage("Last name is required"),
		body("password")
			.trim()
			.isStrongPassword({
				minLength: 8,
				minLowercase: 1,
				minUppercase: 1,
				minNumbers: 1,
				minSymbols: 1,
			})
			.withMessage(
				"Password must be at least 8 characters long and include uppercase, lowercase, a number, and a symbol",
			),
		body("confirmPassword")
			.trim()
			.notEmpty()
			.withMessage("Please confirm your password")
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error("Passwords do not match");
				}
				return true;
			}),
	],
	validateRequest,
	authController.register,
	errorHandler,
);

/**
 * GET /api/auth/verify-email?token=...
 * Xác minh địa chỉ email của người dùng bằng token xác minh
 */
authRouter.get(
	"/verify-email",
	[query("token").notEmpty().withMessage("Verification token is required")],
	validateRequest,
	authController.verifyEmail,
	errorHandler,
);

/**
 * POST /api/auth/forgot-password
 * Gửi email đặt lại mật khẩu
 */
authRouter.post(
	"/forgot-password",
	[body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail()],
	validateRequest,
	authController.forgotPassword,
	errorHandler,
);

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu người dùng bằng token đặt lại hợp lệ
 */
authRouter.post(
	"/reset-password",
	[
		body("token").notEmpty().withMessage("Reset token is required"),
		body("newPassword")
			.isStrongPassword({
				minLength: 8,
				minLowercase: 1,
				minUppercase: 1,
				minNumbers: 1,
				minSymbols: 1,
			})
			.withMessage(
				"Password must be at least 8 characters long and include uppercase, lowercase, a number, and a symbol",
			),
	],
	validateRequest,
	authController.resetPassword,
	errorHandler,
);

/**
 * POST /api/auth/resend-verification
 * Gửi lại email xác minh cho người dùng
 */
authRouter.post(
	"/resend-verification",
	[body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail()],
	validateRequest,
	authController.resendVerificationEmail,
	errorHandler,
);

/**
 * GET /api/auth/me
 * Lấy phiên người dùng hiện tại (route được bảo vệ)
 */
authRouter.get("/me", authMiddleware, authController.session, errorHandler);

/**
 * POST /api/auth/logout
 * Đăng xuất người dùng hiện tại (route được bảo vệ)
 */
authRouter.post("/logout", authMiddleware, authController.logout, errorHandler);

export default authRouter;
