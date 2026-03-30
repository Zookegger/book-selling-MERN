import { Router } from "express";
import { userController } from "@controllers";
import { errorHandler } from "@middleware/error.middleware";
import { authMiddleware } from "@middleware/auth.middleware";
import { body, param } from "express-validator";
import { validateRequest } from "@middleware/validation.middleware";

const userRouter = Router();

/**
 * PUT /api/users/profile
 * Cập nhật hồ sơ người dùng (bảo vệ)
 */
userRouter.put(
	"/profile",
	authMiddleware,
	[
		body("email").optional().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
		body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
		body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
		body("phone")
			.optional()
			.trim()
			.customSanitizer((value) => value?.replace(/\s+/g, ""))
			.matches(/^\+\d{7,15}$/)
			.withMessage("Phone number is invalid"),
	],
	validateRequest,
	userController.updateProfile,
	errorHandler,
);

/**
 * PUT /api/users/change-password
 */
userRouter.put(
	"/change-password",
	authMiddleware,
	[
		body("currentPassword").notEmpty().withMessage("Current password is required"),
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
		body("confirmNewPassword")
			.notEmpty()
			.withMessage("Please confirm your new password")
			.custom((value, { req }) => {
				if (value !== req.body.newPassword) {
					throw new Error("Passwords do not match");
				}
				return true;
			}),
	],
	validateRequest,
	userController.changePassword,
	errorHandler,
);

/**
 * POST /api/users/addresses
 */
userRouter.post(
	"/addresses",
	authMiddleware,
	[
		body("recipientName").trim().notEmpty().withMessage("Recipient name is required"),
		body("phoneNumber")
			.trim()
			.customSanitizer((value) => value?.replace(/\s+/g, ""))
			.matches(/^\+\d{7,15}$/)
			.withMessage("Phone number is invalid"),
		body("provinceOrCity").trim().notEmpty().withMessage("Province or city is required"),
		body("district").trim().notEmpty().withMessage("District is required"),
		body("ward").trim().notEmpty().withMessage("Ward is required"),
		body("streetDetails").trim().notEmpty().withMessage("Street details are required"),
		body("country").trim().notEmpty().withMessage("Country is required"),
		body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
	],
	validateRequest,
	userController.addAddress,
	errorHandler,
);

/**
 * PUT /api/users/addresses/:addressId
 */
userRouter.put(
	"/addresses/:addressId",
	authMiddleware,
	[
		param("addressId").isMongoId().withMessage("Address ID must be a valid ObjectId"),
		body("phoneNumber")
			.optional()
			.trim()
			.customSanitizer((value) => value?.replace(/\s+/g, ""))
			.matches(/^\+\d{7,15}$/)
			.withMessage("Phone number is invalid"),
		body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),
	],
	validateRequest,
	userController.updateAddress,
	errorHandler,
);

userRouter.get("/addresses", authMiddleware, userController.getAddresses, errorHandler);

/**
 * DELETE /api/users/addresses/:addressId
 */
userRouter.delete(
	"/addresses/:addressId",
	authMiddleware,
	[param("addressId").isMongoId().withMessage("Address ID must be a valid ObjectId")],
	validateRequest,
	userController.deleteAddress,
	errorHandler,
);

/**
 * PATCH /api/users/addresses/:addressId/default
 */
userRouter.patch(
	"/addresses/:addressId/default",
	authMiddleware,
	[param("addressId").isMongoId().withMessage("Address ID must be a valid ObjectId")],
	validateRequest,
	userController.setDefaultAddress,
	errorHandler,
);

/**
 * DELETE /api/users/me
 */
userRouter.delete("/me", authMiddleware, userController.deleteAccount, errorHandler);

/**
 * GET /api/users/profile
 * Lấy hồ sơ người dùng hiện tại
 */
userRouter.get("/profile", authMiddleware, userController.getProfile, errorHandler);

export default userRouter;
