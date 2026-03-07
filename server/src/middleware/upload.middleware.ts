import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { fileExistsSync } from "tsconfig-paths/lib/filesystem";

// Ensure the upload directorty exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fileExistsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
	},
});

// Filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	// Accept images for covers, and PDFs/EPUBs for the digital library
	const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf", "application/epub+zip"];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Invalid file type. Only JPG, PNG, PDF, and EPUB are allowed."));
	}
};

export const upload = multer({
	storage,
	limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});
