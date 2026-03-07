import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import { initializeAuth } from "@middleware/auth.middleware";

// ---------------------------------------------------------------------------
// Token crafting helpers (not mocks — used to exercise real security edge
// cases against the real middleware mounted in the real app).
// ---------------------------------------------------------------------------

const SECRET = process.env.JWT_SECRET || "super-secret-test-key";

/** Mã hóa một chuỗi theo base64url (không có padding). */
const toBase64Url = (str: string): string =>
	Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

/** Tạo token theo dạng JWT với `alg:none` — không có chữ ký. */
const buildUnsignedToken = (payload: object): string => {
	const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
	const body = toBase64Url(JSON.stringify(payload));
	return `${header}.${body}.`;
};

/** Thay phần payload của token hợp lệ để giả lập bị sửa đổi (tampering). */
const tamperPayload = (validToken: string, newPayload: object): string => {
	const [header, , signature] = validToken.split(".");
	const fakeBody = toBase64Url(JSON.stringify(newPayload));
	return `${header}.${fakeBody}.${signature}`;
};

const PROTECTED = "/api/auth/me";

/**
 * Route được bảo vệ dùng để kiểm tra `authMiddleware`.
 *
 * Các test phía dưới đang ở trạng thái RED cho đến khi
 * endpoint GET /api/auth/me được triển khai và
 * được nối với `authMiddleware` — đây là trạng thái TDD mong muốn.
 */
describe("authMiddleware()", () => {
	beforeAll(async () => {
		initializeAuth();
		await connectTestDB();
	});

	afterEach(async () => {
		await clearTestDB();
	});

	afterAll(async () => {
		await closeTestDB();
	});

	// ---------------------------------------------------------------------------
	// 1. Authorization header presence / format
	// ---------------------------------------------------------------------------

	describe("authMiddleware — Authorization header", () => {
		it("trả về 401 khi header Authorization vắng mặt", async () => {
			const res = await request(app).get(PROTECTED);
			expect(res.status).toBe(401);
			expect(res.body).toEqual({ status: "fail", message: "Unauthorized" });
		});

		it("trả về 401 khi chế độ là Basic, không phải Bearer", async () => {
			const res = await request(app).get(PROTECTED).set("Authorization", "Basic dXNlcjpwYXNz");
			expect(res.status).toBe(401);
			expect(res.body).toEqual({ status: "fail", message: "Unauthorized" });
		});

		it("trả về 401 khi header Authorization là 'Bearer' không có token", async () => {
			const res = await request(app).get(PROTECTED).set("Authorization", "Bearer ");
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi header Authorization là một chuỗi rỗng", async () => {
			const res = await request(app).get(PROTECTED).set("Authorization", "");
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi token là một chuỗi ngậu nhiên (không phải JWT)", async () => {
			const res = await request(app).get(PROTECTED).set("Authorization", "Bearer this-is-not-a-jwt");
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// 2. Algorithm / signature attacks
	// ---------------------------------------------------------------------------

	describe("authMiddleware — token signature & algorithm security", () => {
		it("trả về 401 cho token không ký alg:none (CVE-2015-9235 phản tựng cấu", async () => {
			const token = buildUnsignedToken({ id: "attacker-1" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho token được ký bằng khóa bỏ khác", async () => {
			const token = jwt.sign({ id: "user-999" }, "wrong-secret", { expiresIn: "1h" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho token hợp lệ cũ đã bị tăng ĐẺ", async () => {
			const legitimate = jwt.sign({ id: "real-user" }, SECRET, { expiresIn: "1h" });
			const tampered = tamperPayload(legitimate, { id: "attacker-2" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${tampered}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho token hết hạn", async () => {
			const token = jwt.sign({ id: "user-exp" }, SECRET, { expiresIn: -1 });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho token với nbf (không trước) đặt trong tương lai", async () => {
			const nbf = Math.floor(Date.now() / 1000) + 3600;
			const token = jwt.sign({ id: "user-nbf", nbf }, SECRET);
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// 3. JWT payload claim validation
	// ---------------------------------------------------------------------------

	describe("authMiddleware — JWT payload claims", () => {
		it("trả về 401 khi token không có id hoặc sub claim", async () => {
			const token = jwt.sign({ role: "admin" }, SECRET, { expiresIn: "1h" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi id claim là một chuỗi rỗng", async () => {
			const token = jwt.sign({ id: "" }, SECRET, { expiresIn: "1h" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi id claim là một số, không phải chuỗi", async () => {
			const token = jwt.sign({ id: 12345 } as object, SECRET, { expiresIn: "1h" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// 4. Authorized (happy-path) cases
	// ---------------------------------------------------------------------------

	describe("authMiddleware — successful authorization", () => {
		it("trả về 200 và userId cho một token hợp lệ có userId claim", async () => {
			const token = jwt.sign({ userId: "user-abc" }, SECRET, { expiresIn: "1h" });
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("userId", "user-abc");
		});

		it("trả về 200 cho token không hết hạn (không có exp claim)", async () => {
			const token = jwt.sign({ userId: "persist-user" }, SECRET);
			const res = await request(app).get(PROTECTED).set("Authorization", `Bearer ${token}`);

			expect(res.status).toBe(200);
			expect(res.body.userId).toBe("persist-user");
		});

		it("handles concurrent requests independently (strategy singleton)", async () => {
			const tokenA = jwt.sign({ userId: "user-A" }, SECRET, { expiresIn: "1h" });
			const tokenB = jwt.sign({ userId: "user-B" }, SECRET, { expiresIn: "1h" });

			const [resA, resB] = await Promise.all([
				request(app).get(PROTECTED).set("Authorization", `Bearer ${tokenA}`),
				request(app).get(PROTECTED).set("Authorization", `Bearer ${tokenB}`),
			]);

			expect(resA.status).toBe(200);
			expect(resA.body.userId).toBe("user-A");
			expect(resB.status).toBe(200);
			expect(resB.body.userId).toBe("user-B");
		});
	});

	// ---------------------------------------------------------------------------
	// 5. 401 response contract
	// ---------------------------------------------------------------------------

	describe("authMiddleware — 401 response contract", () => {
		it("401 body is exactly { status: 'fail', message: 'Unauthorized' }", async () => {
			const res = await request(app).get(PROTECTED);
			expect(res.status).toBe(401);
			expect(res.body).toStrictEqual({ status: "fail", message: "Unauthorized" });
		});

		it("401 Content-Type is application/json", async () => {
			const res = await request(app).get(PROTECTED);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});
	});
});
