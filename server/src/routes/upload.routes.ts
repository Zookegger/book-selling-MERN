import { NextFunction, Request, Response, Router } from "express";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";
import { HttpError } from "@middleware/error.middleware";
import { upload } from "@middleware/upload.middleware";
import * as uploadController from "@controllers/upload.controller";

const router = Router();

const uploadSingleFile = (req: Request, res: Response, next: NextFunction) => {
	upload.single("file")(req, res, (error: unknown) => {
		if (!error) {
			next();
			return;
		}

		const message = error instanceof Error ? error.message : "File upload failed";
		next(new HttpError(message, 400));
	});
};

router.post("/", authMiddleware, adminMiddleware, uploadSingleFile, uploadController.uploadFile);

export default router;
