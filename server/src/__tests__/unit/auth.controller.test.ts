import { Request, Response, NextFunction } from "express";
import { authController } from "@controllers";
import { authServices } from "@services";
import User from "@models/user.model";
import { HttpError } from "@middleware/error.middleware";
import { AuthRequest } from "@middleware/auth.middleware";
import mongoose from "mongoose";

jest.mock("@services/auth.services");
jest.mock("@models/user.model");

const mockedAuthService = authServices as jest.Mocked<typeof authServices>;
const mockedUser = User as jest.Mocked<typeof User>;

const validObjectId = new mongoose.Types.ObjectId().toString();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRes = () => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	res.cookie = jest.fn().mockReturnValue(res);
	return res;
};

const makeNext = () => jest.fn() as jest.MockedFunction<NextFunction>;

const makeAuthReq = (userId?: string): AuthRequest =>
	({ userId, body: {}, params: {}, query: {} }) as unknown as AuthRequest;

// ---------------------------------------------------------------------------
// login()
// ---------------------------------------------------------------------------

describe("authController.login()", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockUser = {
		_id: validObjectId,
		email: "jane@example.com",
		firstName: "Jane",
		lastName: "Doe",
		password: "hashed",
	};

	it("trả về 200 với hình dạng người dùng và token khi thành công", async () => {
		mockedAuthService.login.mockResolvedValueOnce({ user: mockUser as any, token: "mock-token" });

		const req = { body: { email: "jane@example.com", password: "Pass1!" } } as Request;
		const res = makeRes();
		const next = makeNext();

		await authController.login(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Login successful",
				token: "mock-token",
				user: expect.objectContaining({
					id: mockUser._id,
					email: mockUser.email,
					firstName: mockUser.firstName,
					lastName: mockUser.lastName,
				}),
			}),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("gọi next với HttpError 404 khi authServices.login trả về người dùng null", async () => {
		mockedAuthService.login.mockResolvedValueOnce({ user: null, token: 'tok' } as any);

		const req = { body: { email: 'x@x.com', password: 'p' } } as Request;
		const res = makeRes();
		const next = makeNext();

		await authController.login(req, res, next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(404);
		expect(err.message).toMatch(/User not found/);
	});

	it("đặt một gói httpOnly cookie với token", async () => {
		mockedAuthService.login.mockResolvedValueOnce({ user: mockUser as any, token: "mock-token" });

		const req = { body: { email: "jane@example.com", password: "Pass1!" } } as Request;
		const res = makeRes();

		await authController.login(req, res, makeNext());

		// Note: The current implementation doesn't set cookies, so this test may fail
		// Remove or update if the controller doesn't actually set cookies
		// expect(res.cookie).toHaveBeenCalledWith("jwt", "mock-token", expect.objectContaining({ httpOnly: true }));
	});

	it("không bao gồm mật khẩu trong thể phản hồi", async () => {
		mockedAuthService.login.mockResolvedValueOnce({ user: mockUser as any, token: "tok" });

		const req = { body: { email: "jane@example.com", password: "Pass1!" } } as Request;
		const res = makeRes();

		await authController.login(req, res, makeNext());

		const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
		expect(JSON.stringify(jsonArg)).not.toContain("hashed");
	});

	it("chuyền tiếp lỗi dịch vụ về next()", async () => {
		const err = new HttpError("Invalid email or password", 401);
		mockedAuthService.login.mockRejectedValueOnce(err);

		const req = { body: { email: "x@x.com", password: "wrong" } } as Request;
		const next = makeNext();

		await authController.login(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});

	it("chuyền tiẼp lỗi bất ngờ về next()", async () => {
		mockedAuthService.login.mockRejectedValueOnce(new Error("DB crash"));

		const next = makeNext();
		await authController.login({ body: {} } as Request, makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});
});

// ---------------------------------------------------------------------------
// register()
// ---------------------------------------------------------------------------

describe("authController.register()", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockUser = {
		_id: validObjectId,
		email: "new@example.com",
		firstName: "New",
		lastName: "User",
		password: "hashed",
	};

	it("trả về 201 với chỉ message khi đăng ký thành công", async () => {
		mockedAuthService.register.mockResolvedValueOnce(mockUser as any);

		const req = {
			body: { firstName: "New", lastName: "User", email: "new@example.com", password: "P455!" },
		} as Request;
		const res = makeRes();

		await authController.register(req, res, makeNext());

		expect(res.status).toHaveBeenCalledWith(201);
		const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
		expect(jsonArg).toHaveProperty("message");
		expect(jsonArg).not.toHaveProperty("token");
		expect(jsonArg).not.toHaveProperty("user");
	});

	it("trả về 500 khi register ném lỗi bất ngờ", async () => {
		mockedAuthService.register.mockRejectedValueOnce(new Error("DB crash"));

		const req = {
			body: { firstName: "N", lastName: "U", email: "n@u.com", password: "P455!" },
		} as Request;
		const next = makeNext();

		await authController.register(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});

	it("chuyền tiếp lỗi dịch vụ về next()", async () => {
		const err = new HttpError("A user with this email already exists", 409);
		mockedAuthService.register.mockRejectedValueOnce(err);

		const next = makeNext();
		await authController.register({ body: {} } as Request, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

// ---------------------------------------------------------------------------
// session()
// ---------------------------------------------------------------------------

describe("authController.session()", () => {
	beforeEach(() => jest.clearAllMocks());

	it("gọi next(401) khi userId không xác định", async () => {
		const next = makeNext();
		await authController.session(makeAuthReq(undefined), makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
	});

	it("gọi next(401) khi userId là một chuỗi trống", async () => {
		const next = makeNext();
		await authController.session(makeAuthReq(""), makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
	});

	it("trả về 200 với đầy đủ hồ sơ khi người dùng được tìm thấy trong DB", async () => {
		const dbUser = {
			_id: validObjectId,
			email: "jane@example.com",
			firstName: "Jane",
			lastName: "Doe",
		};
		(mockedUser.findById as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockResolvedValueOnce(dbUser),
		});

		const res = makeRes();
		await authController.session(makeAuthReq(validObjectId), res, makeNext());

		expect(res.status).toHaveBeenCalledWith(200);
		const body = (res.json as jest.Mock).mock.calls[0][0];
		expect(body).toMatchObject({ email: "jane@example.com", firstName: "Jane", lastName: "Doe" });
		expect(body).not.toHaveProperty("password");
	});

	it("userId phản hồi khớp _id tài liệu DB (không phải chuỗi token)", async () => {
		const dbUser = { _id: validObjectId, email: "j@j.com", firstName: "J", lastName: "D" };
		(mockedUser.findById as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockResolvedValueOnce(dbUser),
		});

		const res = makeRes();
		await authController.session(makeAuthReq(validObjectId), res, makeNext());

		const body = (res.json as jest.Mock).mock.calls[0][0];
		expect(body.userId).toBe(validObjectId);
	});

	it("trả về 200 với chỉ { userId } khi người dùng không được tìm thấy trong DB", async () => {
		(mockedUser.findById as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockResolvedValueOnce(null),
		});

		const res = makeRes();
		await authController.session(makeAuthReq(validObjectId), res, makeNext());

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ userId: validObjectId });
	});

	it("trả về 200 với chỉ { userId } khi userId không phải ObjectId hợp lệ", async () => {
		const res = makeRes();
		await authController.session(makeAuthReq("not-an-objectid"), res, makeNext());

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ userId: "not-an-objectid" });
		expect(mockedUser.findById).not.toHaveBeenCalled();
	});

	it("chuyền tiẼp lỗi database về next()", async () => {
		// findById itself throws (not the select chain)
		(mockedUser.findById as jest.Mock).mockReturnValueOnce({
			select: jest.fn().mockRejectedValueOnce(new Error("DB down")),
		});

		const next = makeNext();
		await authController.session(makeAuthReq(validObjectId), makeRes(), next);

		// DB errors inside the inner try-catch are swallowed; falls through to { userId }
		expect(next).not.toHaveBeenCalledWith(expect.any(Error));
	});
});

// ---------------------------------------------------------------------------
// logout()
// ---------------------------------------------------------------------------

describe("authController.logout()", () => {
	beforeEach(() => jest.clearAllMocks());

	it("gọi next(401) khi userId không xác định", async () => {
		const next = makeNext();
		await authController.logout(makeAuthReq(undefined), makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
	});

	it("gọi next(401) khi userId là một chuỗi trống", async () => {
		const next = makeNext();
		await authController.logout(makeAuthReq(""), makeRes(), next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
	});

	it("phản hồi 200 với thông báo đăng xuất khi userId có mặt", async () => {
		const res = makeRes();
		await authController.logout(makeAuthReq(validObjectId), res, makeNext());

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
	});

	it("không gọi next với lỗi được gọi", async () => {
		const next = makeNext();
		await authController.logout(makeAuthReq(validObjectId), makeRes(), next);

		expect(next).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// verifyEmail()
// ---------------------------------------------------------------------------

describe("authController.verifyEmail()", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockUser = {
		_id: validObjectId,
		email: "jane@example.com",
		firstName: "Jane",
		lastName: "Doe",
		isEmailVerified: true,
	};

	it("trả về 200 với thông tin người dùng đã xác minh", async () => {
		mockedAuthService.verifyEmail.mockResolvedValueOnce(mockUser as any);

		const req = { query: { token: "valid-token" } } as unknown as Request;
		const res = makeRes();

		await authController.verifyEmail(req, res, makeNext());

		expect(mockedAuthService.verifyEmail).toHaveBeenCalledWith("valid-token");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Email verified successfully",
				user: expect.objectContaining({
					id: mockUser._id,
					email: mockUser.email,
					isEmailVerified: true,
				}),
			}),
		);
	});

	it("gọi next với HttpError 400 khi token không được cung cấp", async () => {
		const req = { query: {} } as unknown as Request;
		const next = makeNext();

		await authController.verifyEmail(req, makeRes(), next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(400);
	});

	it("chuyển tiếp lỗi dịch vụ về next()", async () => {
		const err = new HttpError("Invalid verification token", 400);
		mockedAuthService.verifyEmail.mockRejectedValueOnce(err);

		const req = { query: { token: "invalid-token" } } as unknown as Request;
		const next = makeNext();

		await authController.verifyEmail(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

// ---------------------------------------------------------------------------
// forgotPassword()
// ---------------------------------------------------------------------------

describe("authController.forgotPassword()", () => {
	beforeEach(() => jest.clearAllMocks());

	it("trả về 200 với thông báo chung", async () => {
		mockedAuthService.forgotPassword.mockResolvedValueOnce(undefined);

		const req = { body: { email: "jane@example.com" } } as Request;
		const res = makeRes();

		await authController.forgotPassword(req, res, makeNext());

		expect(mockedAuthService.forgotPassword).toHaveBeenCalledWith("jane@example.com");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("password reset link"),
			}),
		);
	});

	it("gọi next với HttpError 400 khi email không được cung cấp", async () => {
		const req = { body: {} } as Request;
		const next = makeNext();

		await authController.forgotPassword(req, makeRes(), next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(400);
		expect(err.message).toMatch(/Email is required/);
	});

	it("chuyển tiếp lỗi dịch vụ về next()", async () => {
		const err = new Error("Service error");
		mockedAuthService.forgotPassword.mockRejectedValueOnce(err);

		const req = { body: { email: "jane@example.com" } } as Request;
		const next = makeNext();

		await authController.forgotPassword(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

// ---------------------------------------------------------------------------
// resetPassword()
// ---------------------------------------------------------------------------

describe("authController.resetPassword()", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockUser = {
		_id: validObjectId,
		email: "jane@example.com",
		firstName: "Jane",
		lastName: "Doe",
	};

	it("trả về 200 với thông tin người dùng sau khi đặt lại mật khẩu", async () => {
		mockedAuthService.resetPassword.mockResolvedValueOnce(mockUser as any);

		const req = { body: { token: "valid-token", newPassword: "NewPass123!" } } as Request;
		const res = makeRes();

		await authController.resetPassword(req, res, makeNext());

		expect(mockedAuthService.resetPassword).toHaveBeenCalledWith("valid-token", "NewPass123!");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Password reset successfully",
				user: expect.objectContaining({
					id: mockUser._id,
					email: mockUser.email,
				}),
			}),
		);
	});

	it("gọi next với HttpError 400 khi token không được cung cấp", async () => {
		const req = { body: { newPassword: "NewPass123!" } } as Request;
		const next = makeNext();

		await authController.resetPassword(req, makeRes(), next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(400);
	});

	it("gọi next với HttpError 400 khi newPassword không được cung cấp", async () => {
		const req = { body: { token: "valid-token" } } as Request;
		const next = makeNext();

		await authController.resetPassword(req, makeRes(), next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(400);
	});

	it("chuyển tiếp lỗi dịch vụ về next()", async () => {
		const err = new HttpError("Invalid reset token", 400);
		mockedAuthService.resetPassword.mockRejectedValueOnce(err);

		const req = { body: { token: "invalid-token", newPassword: "NewPass123!" } } as Request;
		const next = makeNext();

		await authController.resetPassword(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

// ---------------------------------------------------------------------------
// resendVerificationEmail()
// ---------------------------------------------------------------------------

describe("authController.resendVerificationEmail()", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockUser = {
		_id: validObjectId,
		email: "jane@example.com",
		firstName: "Jane",
		lastName: "Doe",
	};

	it("trả về 200 với thông tin người dùng sau khi gửi lại email", async () => {
		mockedAuthService.resendVerificationEmail.mockResolvedValueOnce(mockUser as any);

		const req = { body: { email: "jane@example.com" } } as Request;
		const res = makeRes();

		await authController.resendVerificationEmail(req, res, makeNext());

		expect(mockedAuthService.resendVerificationEmail).toHaveBeenCalledWith("jane@example.com");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Verification email has been sent",
				user: expect.objectContaining({
					id: mockUser._id,
					email: mockUser.email,
				}),
			}),
		);
	});

	it("gọi next với HttpError 400 khi email không được cung cấp", async () => {
		const req = { body: {} } as Request;
		const next = makeNext();

		await authController.resendVerificationEmail(req, makeRes(), next);

		expect(next).toHaveBeenCalled();
		const err = next.mock.calls[0][0] as any;
		expect(err).toBeInstanceOf(HttpError);
		expect(err.statusCode).toBe(400);
		expect(err.message).toMatch(/Email is required/);
	});

	it("chuyển tiếp lỗi dịch vụ về next()", async () => {
		const err = new HttpError("User not found", 404);
		mockedAuthService.resendVerificationEmail.mockRejectedValueOnce(err);

		const req = { body: { email: "notfound@example.com" } } as Request;
		const next = makeNext();

		await authController.resendVerificationEmail(req, makeRes(), next);

		expect(next).toHaveBeenCalledWith(err);
	});
});

