import { NextFunction, Response } from "express";
import { HttpError } from "./error.middleware";
import User from "@models/user.model";
import { AuthRequest } from "./auth.middleware";

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
	if (!req.userId) {
		return next(new HttpError("Unauthorized", 401));
	}

	const user = await User.findById(req.userId).select("role");
	if (!user) {
		return next(new HttpError("Unauthorized", 401));
	}

	if (user.role !== "admin") {
		return next(new HttpError("Forbidden", 403));
	}

	next();
};
