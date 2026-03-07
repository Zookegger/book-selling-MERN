import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "@models/user.model";
import { EmailService } from "@services/email.service";

describe("Kiểm Thử Hợp Đồng: Xác Thực", () => {
	const SECRET = process.env.JWT_SECRET!;

	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";
	const SESSION = "/api/auth/me";
	const LOGOUT = "/api/auth/logout";
	const VERIFY_EMAIL = "/api/auth/verify-email";
	const FORGOT_PASSWORD = "/api/auth/forgot-password";
	const RESET_PASSWORD = "/api/auth/reset-password";
	const RESEND_VERIFICATION = "/api/auth/resend-verification";

	let sendVerificationEmailSpy: jest.SpyInstance;
	let sendPasswordResetEmailSpy: jest.SpyInstance;

	/**
	 * Helper function to verify a user's email in the database
	 */
	const verifyUserEmail = async (email: string) => {
		await User.findOneAndUpdate(
			{ email: email.toLowerCase() },
			{
				isEmailVerified: true,
				emailVerificationToken: undefined,
				emailVerificationExpires: undefined,
			},
		);
	};

	// ---------------------------------------------------------------------------
	// DB lifecycle — wraps all suites so connectTestDB is guaranteed to resolve
	// before any beforeAll/beforeEach inside a nested describe runs.
	// ---------------------------------------------------------------------------

	beforeAll(async () => {
		await connectTestDB();
		// Mock email service methods to avoid sending actual emails during tests
		sendVerificationEmailSpy = jest
			.spyOn(EmailService.prototype, "sendVerificationEmail")
			.mockResolvedValue(undefined);
		sendPasswordResetEmailSpy = jest
			.spyOn(EmailService.prototype, "sendPasswordResetEmail")
			.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await clearTestDB();
	});

	afterAll(async () => {
		await closeTestDB();
		// Restore all mocks
		jest.restoreAllMocks();
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/register
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/register", () => {
		// --- happy path ---

		it("tạo một người dùng mới và trả về 201 với chỉ message", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "New",
				lastName: "User",
				email: "newuser@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(201);
			expect(typeof res.body.message).toBe("string");
			expect(res.body).not.toHaveProperty("user");
			expect(res.body).not.toHaveProperty("token");
		});

		it("không trả về token trong phản hồi đăng ký", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "Jwt",
				lastName: "User",
				email: "jwtuser@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(201);
			expect(res.body).not.toHaveProperty("token");
		});

		it("phản hồi không chứa trường password hoặc user", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "Safe",
				lastName: "User",
				email: "safeuser@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(201);
			expect(res.body).not.toHaveProperty("password");
			expect(res.body).not.toHaveProperty("user");
		});

		// --- input validation ---

		it("trả về 400 khi email bị thiếu", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "U",
				lastName: "User",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu bị thiếu", async () => {
			const res = await request(app)
				.post(REGISTER)
				.send({ firstName: "U", lastName: "User", email: "u@example.com" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi tên người dùng bị thiếu", async () => {
			const res = await request(app).post(REGISTER).send({
				lastName: "User",
				email: "u@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi email bị sai định dạng", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "U",
				lastName: "Bad",
				email: "not-an-email",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu quá ngắn", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "U",
				lastName: "Short",
				email: "u@example.com",
				password: "123",
				confirmPassword: "123",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 cho một body request rỗng", async () => {
			const res = await request(app).post(REGISTER).send({});
			expect(res.status).toBe(400);
		});

		// --- duplicate / conflict ---

		it("trả về 409 khi email đã được đăng ký", async () => {
			const payload = {
				firstName: "Dup",
				lastName: "User",
				email: "dup@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			};
			await request(app).post(REGISTER).send(payload);
			const res = await request(app).post(REGISTER).send(payload);
			expect(res.status).toBe(409);
		});

		// --- security ---

		it("không lưu trữ mật khẩu văn bản thô — mật khẩu trong DB phải là bcrypt hash", async () => {
			const plainPassword = "P455word123!@#";
			const res = await request(app).post(REGISTER).send({
				firstName: "Hash",
				lastName: "Check",
				email: "hashcheck@example.com",
				password: plainPassword,
				confirmPassword: plainPassword,
			});
			expect(res.status).toBe(201);
			expect(JSON.stringify(res.body)).not.toContain(plainPassword);
			const user = await User.findOne({ email: "hashcheck@example.com" });
			expect(user?.password).not.toBe(plainPassword);
			expect(user?.password).toMatch(/^\$2[ab]\$10\$/);
		});

		it("trả về 400 (không phải 500) cho payload NoSQL injection trong email", async () => {
			const res = await request(app)
				.post(REGISTER)
				.send({
					firstName: "Injector",
					lastName: "Bad",
					email: { $gt: "" },
					password: "P455word123!@#",
					confirmPassword: "P455word123!@#",
				});
			expect(res.status).toBe(400);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/login
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/login", () => {
		const USER = {
			firstName: "Login",
			lastName: "User",
			email: "loginuser@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		// Re-seed before each test because the module-level afterEach clears the DB.
		beforeEach(async () => {
			await request(app).post(REGISTER).send(USER);
			// Verify email to allow login
			await verifyUserEmail(USER.email);
		});

		// --- happy path ---

		it("trả về 200 và JWT đã ký cho email + mật khẩu hợp lệ", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("token");
		});

		it("JWT được trả về là JWT hợp lệ có thể xác minh được bằng JWT_SECRET", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(res.status).toBe(200);
			expect(() => jwt.verify(res.body.token, SECRET)).not.toThrow();
		});

		it("JWT được trả về hết hạn trong cửa sổ TTL được cấu hình (≤ 24 h)", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			const decoded = jwt.decode(res.body.token) as { exp?: number };
			const ttl = (decoded.exp ?? 0) - Math.floor(Date.now() / 1000);
			expect(ttl).toBeGreaterThan(0);
			expect(ttl).toBeLessThanOrEqual(86_400);
		});

		// --- credential errors ---

		it("trả về 401 cho email chính xác nhưng mật khẩu sai", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: "WrongPass!" });
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho email không tồn tại", async () => {
			const res = await request(app).post(LOGIN).send({ email: "ghost@example.com", password: "Password1!" });
			expect(res.status).toBe(401);
		});

		// --- input validation ---

		it("trả về 400 khi email bị thiếu", async () => {
			const res = await request(app).post(LOGIN).send({ password: "Password1!" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu bị thiếu", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email });
			expect(res.status).toBe(400);
		});

		it("trả về 400 cho một body request rỗng", async () => {
			const res = await request(app).post(LOGIN).send({});
			expect(res.status).toBe(400);
		});

		// --- security ---

		it("không tiết lộ liệu email có tồn tại trong phản hồi lỗi", async () => {
			const wrongPassRes = await request(app).post(LOGIN).send({ email: USER.email, password: "Wrong!" });
			const unknownRes = await request(app).post(LOGIN).send({ email: "ghost@example.com", password: "Wrong!" });
			expect(wrongPassRes.body.message).toBe(unknownRes.body.message);
		});

		// --- email verification required ---

		it("trả về 403 cho người dùng chưa xác minh email", async () => {
			// Create a new unverified user
			const unverifiedUser = {
				firstName: "Unverified",
				lastName: "User",
				email: "unverified@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			};
			await request(app).post(REGISTER).send(unverifiedUser);

			// Try to login without verifying email
			const res = await request(app).post(LOGIN).send({
				email: unverifiedUser.email,
				password: unverifiedUser.password,
			});
			expect(res.status).toBe(403);
		});
	});

	// ---------------------------------------------------------------------------
	// GET /api/auth/session  (protected — requires valid JWT)
	// ---------------------------------------------------------------------------

	describe("GET /api/auth/session", () => {
		const USER = {
			firstName: "Session",
			lastName: "User",
			email: "sessionuser@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		let token: string;
		let userId: string;

		beforeEach(async () => {
			await request(app).post(REGISTER).send(USER);
			await verifyUserEmail(USER.email);
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			token = res.body.token;
			userId = res.body.user.id;
		});

		// --- happy path ---

		it("trả về 200 và hồ sơ người dùng hiện tại cho Bearer JWT hợp lệ", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});

		it("body phản hồi chứa userId trùng khớp với claim id của token", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.body.userId ?? res.body._id).toBe(userId);
		});

		it("body phản hồi không bao gồm trường mật khẩu", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.body).not.toHaveProperty("password");
		});

		// --- authentication failures ---

		it("trả về 401 khi header Authorization vắng mặt", async () => {
			const res = await request(app).get(SESSION);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho JWT hết hạn", async () => {
			const expired = jwt.sign({ userId: userId }, SECRET, { expiresIn: -1 });
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${expired}`);
			expect(res.status).toBe(401);
		});

		it("trả về 401 cho một token được ký bằng một mật khẩu khác nhau", async () => {
			const bad = jwt.sign({ userId: userId }, "wrong-secret");
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${bad}`);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/login — extended
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/login — response contract", () => {
		const USER = {
			firstName: "Contract",
			lastName: "Login",
			email: "contractlogin@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		beforeEach(async () => {
			await request(app).post(REGISTER).send(USER);
			// Verify email to allow login
			await verifyUserEmail(USER.email);
		});

		it("body phản hồi chứa user.email khớp với email đã đăng ký", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(res.status).toBe(200);
			expect(res.body.user.email).toBe(USER.email);
		});

		it("body phản hồi chứa user.firstName và user.lastName", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(res.body.user.firstName).toBe(USER.firstName);
			expect(res.body.user.lastName).toBe(USER.lastName);
		});

		it("body phản hồi không chứa trường mật khẩu", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(JSON.stringify(res.body)).not.toMatch(/password/i);
		});

		it("Content-Type phản hồi là application/json", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		it("đăng nhập không phân biệt chữ hoa chữ thường cho email", async () => {
			const res = await request(app)
				.post(LOGIN)
				.send({ email: USER.email.toUpperCase(), password: USER.password });
			expect(res.status).toBe(200);
		});

		it("body 401 có status và message cho mật khẩu sai", async () => {
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: "WrongPass1!" });
			expect(res.status).toBe(401);
			expect(res.body.status).toBe("fail");
			expect(typeof res.body.message).toBe("string");
		});
	});

	// ---------------------------------------------------------------------------
	// GET /api/auth/me — extended (profile completeness)
	// ---------------------------------------------------------------------------

	describe("GET /api/auth/me — profile body contract", () => {
		const USER = {
			firstName: "Profile",
			lastName: "Body",
			email: "profilebody@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};

		let token: string;

		beforeEach(async () => {
			await request(app).post(REGISTER).send(USER);
			await verifyUserEmail(USER.email);
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			token = res.body.token;
		});

		it("body phản hồi chứa email", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.body.email).toBe(USER.email);
		});

		it("body phản hồi chứa firstName và lastName", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.body.firstName).toBe(USER.firstName);
			expect(res.body.lastName).toBe(USER.lastName);
		});

		it("Content-Type phản hồi là application/json", async () => {
			const res = await request(app).get(SESSION).set("Authorization", `Bearer ${token}`);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		it("Content-Type 401 là application/json", async () => {
			const res = await request(app).get(SESSION);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		it("body 401 có status 'fail' và message 'Unauthorized'", async () => {
			const res = await request(app).get(SESSION);
			expect(res.body.status).toBe("fail");
			expect(res.body.message).toBe("Unauthorized");
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/logout
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/logout", () => {
		let token: string;
		
		const USER = {
			firstName: "Logout",
			lastName: "User",
			email: "logoutuser@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
		};
		
		// Re-seed before each test because the module-level afterEach clears the DB.
		beforeEach(async () => {
			await request(app).post(REGISTER).send(USER);
			await verifyUserEmail(USER.email);
			const res = await request(app).post(LOGIN).send({ email: USER.email, password: USER.password });
			token = res.body.token;
		});

		it("trả về 200 khi được gọi với một token hợp lệ", async () => {
			const res = await request(app).post(LOGOUT).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});

		it("trả về 401 khi được gọi mà không có token", async () => {
			const res = await request(app).post(LOGOUT);
			expect(res.status).toBe(401);
		});

		it("trả về 401 với body đúng khi không có token được cung cấp", async () => {
			const res = await request(app).post(LOGOUT);
			expect(res.body.status).toBe("fail");
			expect(res.body.message).toBe("Unauthorized");
		});

		it("Content-Type phản hồi là application/json", async () => {
			const res = await request(app).post(LOGOUT).set("Authorization", `Bearer ${token}`);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		it("đăng xuất lần thứ hai với cùng token vẫn trả về 200 (JWT không trạng thái)", async () => {
			await request(app).post(LOGOUT).set("Authorization", `Bearer ${token}`);
			const res = await request(app).post(LOGOUT).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});
	});

	// ---------------------------------------------------------------------------
	// GET /api/auth/verify-email
	// ---------------------------------------------------------------------------

	describe("GET /api/auth/verify-email", () => {
		it("trả về 200 và xác minh email khi token hợp lệ", async () => {
			// Register a user
			const res = await request(app).post(REGISTER).send({
				firstName: "Verify",
				lastName: "Test",
				email: "verify@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});

			// Get the user to extract verification token
			const user = await User.findOne({ email: "verify@example.com" });
			expect(user).toBeTruthy();
			expect(user?.emailVerificationToken).toBeTruthy();

			// Verify email
			const verifyRes = await request(app).get(VERIFY_EMAIL).query({ token: user?.emailVerificationToken });

			expect(verifyRes.status).toBe(200);
			expect(verifyRes.body.message).toMatch(/verified/i);

			// Check user is verified in database
			const verifiedUser = await User.findOne({ email: "verify@example.com" });
			expect(verifiedUser?.isEmailVerified).toBe(true);
		});

		it("trả về 400 khi token bị thiếu", async () => {
			const res = await request(app).get(VERIFY_EMAIL);
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi token không hợp lệ", async () => {
			const res = await request(app).get(VERIFY_EMAIL).query({ token: "invalid-token-123" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi token đã hết hạn", async () => {
			// Create a user with expired token
			await request(app).post(REGISTER).send({
				firstName: "Expired",
				lastName: "Token",
				email: "expired@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});

			// Manually set expired date
			const user = await User.findOne({ email: "expired@example.com" });
			if (user) {
				user.emailVerificationExpires = new Date(Date.now() - 1000); // 1 second ago
				await user.save();
			}

			const res = await request(app).get(VERIFY_EMAIL).query({ token: user?.emailVerificationToken });
			expect(res.status).toBe(400);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/forgot-password
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/forgot-password", () => {
		beforeEach(async () => {
			await request(app).post(REGISTER).send({
				firstName: "Forgot",
				lastName: "User",
				email: "forgot@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			await verifyUserEmail("forgot@example.com");
		});

		it("trả về 200 và gửi email đặt lại mật khẩu", async () => {
			const res = await request(app).post(FORGOT_PASSWORD).send({ email: "forgot@example.com" });

			expect(res.status).toBe(200);
			expect(res.body.message).toEqual("If that email exists, a password reset link has been sent");

			// Verify reset token was created
			const user = await User.findOne({ email: "forgot@example.com" });
			expect(user?.passwordResetToken).toBeTruthy();
			expect(user?.passwordResetExpires).toBeTruthy();
		});

		it("trả về 200 ngay cả khi email không tồn tại (security)", async () => {
			const res = await request(app).post(FORGOT_PASSWORD).send({ email: "nonexistent@example.com" });

			expect(res.status).toBe(200);
		});

		it("trả về 400 khi email bị thiếu", async () => {
			const res = await request(app).post(FORGOT_PASSWORD).send({});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi email không hợp lệ", async () => {
			const res = await request(app).post(FORGOT_PASSWORD).send({ email: "not-an-email" });
			expect(res.status).toBe(400);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/reset-password
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/reset-password", () => {
		let resetToken: string;

		beforeEach(async () => {
			// Register and verify user
			await request(app).post(REGISTER).send({
				firstName: "Reset",
				lastName: "User",
				email: "reset@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			await verifyUserEmail("reset@example.com");

			// Request password reset
			await request(app).post(FORGOT_PASSWORD).send({ email: "reset@example.com" });

			// Get reset token
			const user = await User.findOne({ email: "reset@example.com" });
			resetToken = user?.passwordResetToken || "";
		});

		it("trả về 200 và đặt lại mật khẩu với token hợp lệ", async () => {
			const newPassword = "NewP455word123!@#";
			const res = await request(app).post(RESET_PASSWORD).send({ token: resetToken, newPassword });

			expect(res.status).toBe(200);
			expect(res.body.message).toMatch(/password.*reset/i);

			// Verify can login with new password
			const loginRes = await request(app).post(LOGIN).send({ email: "reset@example.com", password: newPassword });
			expect(loginRes.status).toBe(200);
		});

		it("trả về 400 khi token bị thiếu", async () => {
			const res = await request(app).post(RESET_PASSWORD).send({ newPassword: "NewP455word123!@#" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu mới bị thiếu", async () => {
			const res = await request(app).post(RESET_PASSWORD).send({ token: resetToken });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi token không hợp lệ", async () => {
			const res = await request(app)
				.post(RESET_PASSWORD)
				.send({ token: "invalid-token", newPassword: "NewP455word123!@#" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu mới yếu", async () => {
			const res = await request(app).post(RESET_PASSWORD).send({ token: resetToken, newPassword: "weak" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi token đã hết hạn", async () => {
			// Manually expire the token
			const user = await User.findOne({ email: "reset@example.com" });
			if (user) {
				user.passwordResetExpires = new Date(Date.now() - 1000);
				await user.save();
			}

			const res = await request(app)
				.post(RESET_PASSWORD)
				.send({ token: resetToken, newPassword: "NewP455word123!@#" });
			expect(res.status).toBe(400);
		});

		it("không thể đăng nhập với mật khẩu cũ sau khi đặt lại", async () => {
			// Reset password
			await request(app).post(RESET_PASSWORD).send({ token: resetToken, newPassword: "NewP455word123!@#" });

			// Try to login with old password
			const res = await request(app).post(LOGIN).send({ email: "reset@example.com", password: "P455word123!@#" });
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/resend-verification
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/resend-verification", () => {
		beforeEach(async () => {
			await request(app).post(REGISTER).send({
				firstName: "Resend",
				lastName: "User",
				email: "resend@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
		});

		it("trả về 200 và gửi lại email xác minh", async () => {
			const res = await request(app).post(RESEND_VERIFICATION).send({ email: "resend@example.com" });

			expect(res.status).toBe(200);
			expect(res.body.message).toMatch(/verification email.*sent/i);
		});

		it("trả về 400 khi email đã được xác minh", async () => {
			// Verify the email first
			await verifyUserEmail("resend@example.com");

			const res = await request(app).post(RESEND_VERIFICATION).send({ email: "resend@example.com" });

			expect(res.status).toBe(400);
			expect(res.body.message).toMatch(/already verified/i);
		});

		it("trả về 400 khi email không tồn tại", async () => {
			const res = await request(app).post(RESEND_VERIFICATION).send({ email: "nonexistent@example.com" });

			expect(res.status).toBe(400);
		});

		it("trả về 400 khi email bị thiếu", async () => {
			const res = await request(app).post(RESEND_VERIFICATION).send({});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi email không hợp lệ", async () => {
			const res = await request(app).post(RESEND_VERIFICATION).send({ email: "not-an-email" });
			expect(res.status).toBe(400);
		});
	});

	// ---------------------------------------------------------------------------
	// Unknown routes — 404 handling
	// ---------------------------------------------------------------------------

	describe("Unknown routes — 404 handling", () => {
		it("trả về 404 cho một tuyến GET không xác định", async () => {
			const res = await request(app).get("/api/auth/does-not-exist");
			expect(res.status).toBe(404);
		});

		it("trả về 404 cho một đường dẫn hoàn toàn không xác định", async () => {
			const res = await request(app).get("/api/unknown-feature/xyz");
			expect(res.status).toBe(404);
		});

		it("404 Content-Type là application/json", async () => {
			const res = await request(app).get("/api/nonexistent");
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		it("404 body có status 'fail'", async () => {
			const res = await request(app).get("/api/nonexistent");
			expect(res.body.status).toBe("fail");
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/auth/register — password confirmation mismatch
	// ---------------------------------------------------------------------------

	describe("POST /api/auth/register — password confirmation", () => {
		it("trả về 400 khi password và confirmPassword không khớp với nhau", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "Test",
				lastName: "User",
				email: "mismatch@example.com",
				password: "P455word123!@#",
				confirmPassword: "DifferentPass1!",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi password yếu (không có chữ hoa)", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "Weak",
				lastName: "Pass",
				email: "weak@example.com",
				password: "password123!",
				confirmPassword: "password123!",
			});
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi password không có ký hiệu", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "No",
				lastName: "Symbol",
				email: "nosymbol@example.com",
				password: "Password123",
				confirmPassword: "Password123",
			});
			expect(res.status).toBe(400);
		});

		it("body phản hồi đăng ký chứa trường message", async () => {
			const res = await request(app).post(REGISTER).send({
				firstName: "Msg",
				lastName: "Test",
				email: "msgtest@example.com",
				password: "P455word123!@#",
				confirmPassword: "P455word123!@#",
			});
			expect(res.status).toBe(201);
			expect(typeof res.body.message).toBe("string");
		});
	});
});
