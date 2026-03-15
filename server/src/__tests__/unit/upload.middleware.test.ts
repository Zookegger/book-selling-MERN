import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import request from "supertest";


describe("upload.middleware module initialization", () => {
	afterEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		jest.dontMock("fs");
		jest.dontMock("tsconfig-paths/lib/filesystem");
	});

	it("creates upload directory when it does not exist", () => {
		const mkdirSync = jest.fn();

		jest.doMock("fs", () => ({
			__esModule: true,
			default: { mkdirSync },
			mkdirSync,
		}));
		jest.doMock("tsconfig-paths/lib/filesystem", () => ({
			fileExistsSync: jest.fn(() => false),
		}));

		jest.isolateModules(() => {
			require("@middleware/upload.middleware");
		});

		expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining("uploads"), { recursive: true });
	});

	it("does not create directory when upload directory already exists", () => {
		const mkdirSync = jest.fn();

		jest.doMock("fs", () => ({
			__esModule: true,
			default: { mkdirSync },
			mkdirSync,
		}));
		jest.doMock("tsconfig-paths/lib/filesystem", () => ({
			fileExistsSync: jest.fn(() => true),
		}));

		jest.isolateModules(() => {
			require("@middleware/upload.middleware");
		});

		expect(mkdirSync).not.toHaveBeenCalled();
	});
});

describe("upload.middleware runtime behavior", () => {
	const uploadedFiles: string[] = [];
	const uploadDir = path.join(__dirname, "../../../uploads");

	afterEach(() => {
		for (const fileName of uploadedFiles.splice(0)) {
			const filePath = path.join(uploadDir, fileName);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}
	});

	const buildApp = () => {
		jest.resetModules();
		let upload: any;

		jest.isolateModules(() => {
			({ upload } = require("@middleware/upload.middleware"));
		});

		const app = express();
		app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
			const fileName = req.file?.filename;
			if (fileName) uploadedFiles.push(fileName);
			res.status(200).json({ fileName, mimetype: req.file?.mimetype });
		});
		app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
			res.status(400).json({ message: err.message });
		});

		return app;
	};

	it("accepts allowed image uploads", async () => {
		const app = buildApp();
		const res = await request(app)
			.post("/upload")
			.attach("file", Buffer.from("fake-jpeg-content"), { filename: "cover.jpg", contentType: "image/jpeg" });

		expect(res.status).toBe(200);
		expect(res.body.mimetype).toBe("image/jpeg");
		expect(res.body.fileName).toMatch(/^file-/);
		expect(res.body.fileName).toMatch(/\.jpg$/);
	});

	it("rejects disallowed file types", async () => {
		const app = buildApp();
		const res = await request(app)
			.post("/upload")
			.attach("file", Buffer.from("not-allowed"), { filename: "notes.txt", contentType: "text/plain" });

		expect(res.status).toBe(400);
		expect(res.body.message).toContain("Invalid file type");
	});
});
