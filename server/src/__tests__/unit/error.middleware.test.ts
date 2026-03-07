import { Request, Response, NextFunction } from "express";
import { HttpError, notFoundHandler, errorHandler } from "@middleware/error.middleware";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockReq = (url = "/test") => ({ originalUrl: url }) as Request;

const mockRes = () => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const mockNext = () => jest.fn() as unknown as NextFunction;

// ---------------------------------------------------------------------------
// HttpError class
// ---------------------------------------------------------------------------

describe("HttpError", () => {
	it("lưu trữ thông điệp được truyền vào constructor", () => {
		const err = new HttpError("Something failed", 400);
		expect(err.message).toBe("Something failed");
	});

	it("lưu trữ mã statusCode được truyền vào constructor", () => {
		const err = new HttpError("Bad Request", 400);
		expect(err.statusCode).toBe(400);
	});

	it("cài đặt trạng thái thành 'fail' cho mã 4xx", () => {
		expect(new HttpError("Not Found", 404).status).toBe("fail");
		expect(new HttpError("Unauthorized", 401).status).toBe("fail");
		expect(new HttpError("Conflict", 409).status).toBe("fail");
	});

	it("cài đặt trạng thái thành 'error' cho mã 5xx", () => {
		expect(new HttpError("Server Error", 500).status).toBe("error");
		expect(new HttpError("Not Implemented", 501).status).toBe("error");
	});

	it("cài đặt isOperational thành true", () => {
		const err = new HttpError("Operational", 400);
		expect(err.isOperational).toBe(true);
	});

	it("là một thể đối tượng của Error", () => {
		expect(new HttpError("Test", 400)).toBeInstanceOf(Error);
	});

	it("bắt chỗp vẵn lờn dữa dắc ", () => {
		const err = new HttpError("Stack trace test", 400);
		expect(err.stack).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// notFoundHandler
// ---------------------------------------------------------------------------

describe("notFoundHandler", () => {
	it("gọi next với một HttpError", () => {
		const next = mockNext();
		notFoundHandler(mockReq("/missing"), mockRes(), next);
		expect(next).toHaveBeenCalledTimes(1);
		expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(HttpError);
	});

	it("truyền một mã trạng thái 404", () => {
		const next = mockNext();
		notFoundHandler(mockReq("/some/path"), mockRes(), next);
		const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
		expect(err.statusCode).toBe(404);
	});

	it("bao gồm URL gốc trong thông điệp lỗi", () => {
		const next = mockNext();
		notFoundHandler(mockReq("/api/unknown"), mockRes(), next);
		const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
		expect(err.message).toMatch("/api/unknown");
	});

	it("không gọi res.status hoặc res.json chính nó", () => {
		const next = mockNext();
		const res = mockRes();
		notFoundHandler(mockReq("/x"), res, next);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// errorHandler
// ---------------------------------------------------------------------------

describe("errorHandler", () => {
	it("phản hồi với mã statusCode HttpError để hoăt động lỗi", () => {
		const res = mockRes();
		errorHandler(new HttpError("Not Found", 404), mockReq(), res, mockNext());
		expect(res.status).toHaveBeenCalledWith(404);
	});

	it("responds with { status, message } JSON for an operational error", () => {
		const res = mockRes();
		errorHandler(new HttpError("Unauthorized", 401), mockReq(), res, mockNext());
		expect(res.json).toHaveBeenCalledWith({ status: "fail", message: "Unauthorized" });
	});

	it("responds with 500 for a non-operational plain Error", () => {
		const res = mockRes();
		errorHandler(new Error("Something unexpected"), mockReq(), res, mockNext());
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ status: "error", message: "Internal Server Error" });
	});

	it("responds with 500 for an object that is not an HttpError", () => {
		const res = mockRes();
		errorHandler({ message: "weird" } as Error, mockReq(), res, mockNext());
		expect(res.status).toHaveBeenCalledWith(500);
	});

	it("uses 'fail' status string for 4xx operational errors", () => {
		const res = mockRes();
		errorHandler(new HttpError("Bad Request", 400), mockReq(), res, mockNext());
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "fail" }));
	});

	it("uses 'error' status string for 5xx HttpError", () => {
		const res = mockRes();
		errorHandler(new HttpError("Internal", 500), mockReq(), res, mockNext());
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
	});
});
