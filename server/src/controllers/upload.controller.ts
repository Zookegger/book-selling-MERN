import { NextFunction, Request, Response } from "express";
import { HttpError } from "@middleware/error.middleware";

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.file) {
			return next(new HttpError("No file was uploaded", 400));
		}

		const publicPath = `/uploads/${req.file.filename}`;
		const publicUrl = `${req.protocol}://${req.get("host")}${publicPath}`;

		return res.status(201).json({
			url: publicUrl,
			path: publicPath,
			filename: req.file.filename,
			mimetype: req.file.mimetype,
			size: req.file.size,
		});
	} catch (error) {
		next(error);
	}
};
