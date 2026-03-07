import { Response, NextFunction } from "express";
import passport from "passport";
import { initializeAuth, authMiddleware, AuthRequest } from "@middleware/auth.middleware";
import { HttpError } from "@middleware/error.middleware";

// ---------------------------------------------------------------------------
// Mock passport hoàn toàn
// ---------------------------------------------------------------------------
jest.mock("passport", () => ({
	use: jest.fn(),
	initialize: jest.fn(() => jest.fn()), // trả về một middleware function
	authenticate: jest.fn(),
}));

jest.mock("passport-jwt", () => ({
	ExtractJwt: {
		fromAuthHeaderAsBearerToken: jest.fn(() => jest.fn()),
	},
	Strategy: jest.fn().mockImplementation((_opts, verify) => ({ verify })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeReq = (): AuthRequest => ({}) as AuthRequest;
const makeRes = (): Response => ({}) as Response;
const makeNext = (): jest.MockedFunction<NextFunction> => jest.fn();

// ---------------------------------------------------------------------------
// 1. initializeAuth()
// ---------------------------------------------------------------------------
describe("initializeAuth()", () => {
	const originalSecret = process.env.JWT_SECRET;

	afterEach(() => {
		jest.clearAllMocks();
		if (originalSecret !== undefined) process.env.JWT_SECRET = originalSecret;
		else delete process.env.JWT_SECRET;
	});

	// --- Kiểm tra JWT_SECRET ---
	describe("Kiểm tra biến môi trường JWT_SECRET", () => {
		it("ném Error với đúng thông điệp khi JWT_SECRET không được đặt", () => {
			delete process.env.JWT_SECRET;
			expect(() => initializeAuth()).toThrow("JWT_SECRET is not set");
		});

		it("ném đúng kiểu Error (không chỉ string) khi JWT_SECRET vắng mặt", () => {
			delete process.env.JWT_SECRET;
			expect(() => initializeAuth()).toThrow(Error);
		});

		it("ném lỗi khi JWT_SECRET là chuỗi rỗng", () => {
			process.env.JWT_SECRET = "";
			expect(() => initializeAuth()).toThrow("JWT_SECRET is not set");
		});

		it("không ném lỗi khi JWT_SECRET được đặt hợp lệ", () => {
			process.env.JWT_SECRET = "super-secret";
			expect(() => initializeAuth()).not.toThrow();
		});
	});

	// --- Đăng ký strategy và khởi tạo passport ---
	describe("Đăng ký passport strategy", () => {
		beforeEach(() => {
			process.env.JWT_SECRET = "test-secret";
		});

		it("gọi passport.use() đúng một lần", () => {
			initializeAuth();
			expect(passport.use).toHaveBeenCalledTimes(1);
		});

		it("gọi passport.initialize() đúng một lần", () => {
			initializeAuth();
			expect(passport.initialize).toHaveBeenCalledTimes(1);
		});

		it("trả về kết quả của passport.initialize() (một hàm middleware)", () => {
			const result = initializeAuth();
			expect(typeof result).toBe("function");
		});
	});

	// --- JWT Strategy callback (verify function) ---
	describe("JWT Strategy — hàm verify(payload, done)", () => {
		let verifyFn: (payload: { userId: string }, done: jest.Mock) => void;

		beforeEach(() => {
			process.env.JWT_SECRET = "test-secret";

			const { Strategy } = require("passport-jwt");
			(Strategy as jest.Mock).mockImplementationOnce((_opts: any, verify: any) => {
				verifyFn = verify;
				return { verify };
			});

			initializeAuth();
		});

		it("gọi done(null, false) khi payload không có userId", () => {
			const done = jest.fn();
			verifyFn({ userId: "" }, done);
			expect(done).toHaveBeenCalledWith(null, false);
		});

		it("gọi done(null, { id: userId }) khi payload có userId hợp lệ", () => {
			const done = jest.fn();
			verifyFn({ userId: "user-123" }, done);
			expect(done).toHaveBeenCalledWith(null, { id: "user-123" });
		});

		it("không gọi done() với lỗi khi payload hợp lệ", () => {
			const done = jest.fn();
			verifyFn({ userId: "user-abc" }, done);
			const [err] = done.mock.calls[0];
			expect(err).toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// 2. authMiddleware()
// ---------------------------------------------------------------------------
describe("authMiddleware()", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	// Helper: giả lập passport.authenticate gọi callback với (error, user)
	const mockAuthenticate = (error: Error | null, user: { id: string } | false) => {
		(passport.authenticate as jest.Mock).mockImplementation(
			(_strategy: string, _options: object, callback: Function) =>
				(_req: AuthRequest, _res: Response, _next: NextFunction) =>
					callback(error, user),
		);
	};

	// --- Token hợp lệ ---
	describe("Token hợp lệ", () => {
		it("gán req.userId bằng user.id từ payload", () => {
			mockAuthenticate(null, { id: "user-42" });
			const req = makeReq();
			authMiddleware(req, makeRes(), makeNext());
			expect(req.userId).toBe("user-42");
		});

		it("gọi next() không có đối số (tiếp tục pipeline)", () => {
			mockAuthenticate(null, { id: "user-42" });
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			expect(next).toHaveBeenCalledWith();
		});

		it("gọi next() đúng một lần", () => {
			mockAuthenticate(null, { id: "user-42" });
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			expect(next).toHaveBeenCalledTimes(1);
		});
	});

	// --- Token không hợp lệ / vắng mặt ---
	describe("Token không hợp lệ hoặc vắng mặt", () => {
		it("gọi next(HttpError) khi user là false (không có token)", () => {
			mockAuthenticate(null, false);
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
		});

		it("trả về HttpError với status 401 khi không xác thực được", () => {
			mockAuthenticate(null, false);
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
			expect(err.statusCode).toBe(401);
		});

		it("trả về HttpError với message 'Unauthorized'", () => {
			mockAuthenticate(null, false);
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
			expect(err.message).toBe("Unauthorized");
		});

		it("không gán req.userId khi token không hợp lệ", () => {
			mockAuthenticate(null, false);
			const req = makeReq();
			authMiddleware(req, makeRes(), makeNext());
			expect(req.userId).toBeUndefined();
		});
	});

	// --- Lỗi từ passport (error object) ---
	describe("Passport trả về lỗi (error !== null)", () => {
		it("gọi next(HttpError) khi passport trả về lỗi", () => {
			mockAuthenticate(new Error("JWT malformed"), false);
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
		});

		it("trả về HttpError 401 khi có lỗi passport, không phải lỗi gốc", () => {
			mockAuthenticate(new Error("JWT malformed"), false);
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			const err = (next as jest.Mock).mock.calls[0][0] as HttpError;
			expect(err.statusCode).toBe(401);
			expect(err.message).toBe("Unauthorized");
		});

		it("gọi next(HttpError) khi có cả error lẫn user (ưu tiên error)", () => {
			mockAuthenticate(new Error("Unexpected error"), { id: "user-1" });
			const next = makeNext();
			authMiddleware(makeReq(), makeRes(), next);
			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
		});

		it("không gán req.userId khi có lỗi passport", () => {
			mockAuthenticate(new Error("JWT malformed"), false);
			const req = makeReq();
			authMiddleware(req, makeRes(), makeNext());
			expect(req.userId).toBeUndefined();
		});
	});

	// --- Kiểm tra cấu hình passport.authenticate ---
	describe("Cấu hình passport.authenticate()", () => {
		it("gọi passport.authenticate với strategy 'jwt'", () => {
			mockAuthenticate(null, { id: "u1" });
			authMiddleware(makeReq(), makeRes(), makeNext());
			expect(passport.authenticate).toHaveBeenCalledWith("jwt", expect.any(Object), expect.any(Function));
		});

		it("gọi passport.authenticate với session: false", () => {
			mockAuthenticate(null, { id: "u1" });
			authMiddleware(makeReq(), makeRes(), makeNext());
			expect(passport.authenticate).toHaveBeenCalledWith(
				"jwt",
				expect.objectContaining({ session: false }),
				expect.any(Function),
			);
		});
	});
});
