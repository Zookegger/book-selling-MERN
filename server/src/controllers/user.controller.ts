import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import { userServices } from "@services";
import { HttpError } from "@middleware/error.middleware";

const sanitizeUser = (user: any) => {
	if (!user) return user;
	const obj = typeof user.toObject === "function" ? user.toObject() : user;
	if (obj && typeof obj === "object") delete obj.password;
	return obj;
};

/**
 * Lấy hồ sơ người dùng
 */
export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const user = await userServices.getUser(userId as string);
		if (!user) return next(new HttpError("User not found", 404));

		return res.status(200).json(sanitizeUser(user));
	} catch (err) {
		next(err);
	}
}

/**
 * Cập nhật hồ sơ người dùng
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const updated = await userServices.updateProfile(userId as string, req.body);
		return res.status(200).json(sanitizeUser(updated));
	} catch (err) {
		if (err instanceof RangeError) return next(new HttpError(err.message, 404));
		next(err);
	}
}

/**
 * Đổi mật khẩu
 */
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const { currentPassword, newPassword } = req.body;
		const updated = await userServices.changePassword(userId as string, currentPassword, newPassword);
		return res.status(200).json(sanitizeUser(updated));
	} catch (err) {
		// service may throw 403 for invalid current password — map to 401 for API consistency
		if (err instanceof HttpError && err.statusCode === 403) return next(new HttpError(err.message, 401));
		next(err);
	}
}

/**
 * Thêm địa chỉ
 */
export async function addAddress(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const added = await userServices.addAddress(userId as string, req.body);
		return res.status(201).json(sanitizeUser(added));
	} catch (err) {
		next(err);
	}
}

/**
 * Cập nhật địa chỉ theo index
 */
export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const index = parseInt(req.params.index as string, 10);
		const updated = await userServices.updateAddress(userId as string, index, req.body);
		return res.status(200).json(sanitizeUser(updated));
	} catch (err) {
		if (err instanceof RangeError) return next(new HttpError(err.message, 404));
		next(err);
	}
}

/**
 * Xóa địa chỉ theo index
 */
export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const index = parseInt(req.params.index as string, 10);
		const updated = await userServices.deleteAddress(userId as string, index);
		return res.status(200).json(sanitizeUser(updated));
	} catch (err) {
		if (err instanceof RangeError) return next(new HttpError(err.message, 404));
		next(err);
	}
}

/**
 * Đặt địa chỉ mặc định theo index
 */
export async function setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const index = parseInt(req.params.index as string, 10);
		const updated = await userServices.setDefaultAddress(userId as string, index);
		return res.status(200).json(sanitizeUser(updated));
	} catch (err) {
		if (err instanceof RangeError) return next(new HttpError(err.message, 404));
		next(err);
	}
}

/**
 * Xóa tài khoản hiện tại
 */
export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		await userServices.removeUser(userId as string);
		return res.status(200).json({ message: "Account deleted successfully" });
	} catch (err) {
		next(err);
	}
}
