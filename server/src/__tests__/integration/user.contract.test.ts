import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import User from "../../models/user.model";
import { EmailService } from "../../services/email.service";

describe("Kiểm thử hợp đồng: Quản lý người dùng", () => {
	const REGISTER = "/api/auth/register";
	const LOGIN = "/api/auth/login";
	const PROFILE = "/api/users/profile";
	const CHANGE_PASSWORD = "/api/users/change-password";
	const ADDRESSES = "/api/users/addresses";
	const DELETE_ACCOUNT = "/api/users/me";

	let sendVerificationEmailSpy: jest.SpyInstance;
	let sendPasswordResetEmailSpy: jest.SpyInstance;

	const sampleAddress = {
		recipientName: "Nguyen Van A",
		phoneNumber: "0901234567",
		provinceOrCity: "Ho Chi Minh",
		district: "District 1",
		ward: "Ben Nghe",
		streetDetails: "123 Le Loi",
		country: "Vietnam",
		isDefault: true,
	};

	/**
	 * Helper: directly mark a user's email as verified in the database.
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

	/**
	 * Helper: register a new user, verify their email, then log in.
	 * Returns the login JWT and the registration payload.
	 */
	const registerAndLogin = async (overrides: Record<string, string> = {}) => {
		const payload = {
			firstName: "Test",
			lastName: "User",
			email: "testuser@example.com",
			password: "P455word123!@#",
			confirmPassword: "P455word123!@#",
			...overrides,
		};
		await request(app).post(REGISTER).send(payload);
		await verifyUserEmail(payload.email);
		const loginRes = await request(app).post(LOGIN).send({ email: payload.email, password: payload.password });
		return { token: loginRes.body.token as string, payload };
	};

	// ---------------------------------------------------------------------------
	// DB lifecycle
	// ---------------------------------------------------------------------------

	beforeAll(async () => {
		await connectTestDB();
		sendVerificationEmailSpy = jest
			.spyOn(EmailService.prototype, "sendVerificationEmail")
			.mockResolvedValue(undefined);
		sendPasswordResetEmailSpy = jest
			.spyOn(EmailService.prototype, "sendPasswordResetEmail")
			.mockResolvedValue(undefined);
	});

	afterEach(async () => await clearTestDB());

	afterAll(async () => {
		await closeTestDB();
		jest.restoreAllMocks();
	});

	// ---------------------------------------------------------------------------
	// PUT /api/users/profile — Profile Management
	// ---------------------------------------------------------------------------

	describe("PUT /api/users/profile — Quản lý hồ sơ", () => {
		// --- happy path ---

		it("trả về 200 khi cập nhật trường firstName", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ firstName: "Updated" });
			expect(res.status).toBe(200);
		});

		it("trả về firstName đã được cập nhật trong phần thân phản hồi", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ firstName: "Updated" });
			expect(res.body.firstName).toBe("Updated");
		});

		it("trả về 200 khi cập nhật trường lastName", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ lastName: "NewLast" });
			expect(res.status).toBe(200);
			expect(res.body.lastName).toBe("NewLast");
		});

		it("trả về 200 khi cập nhật email thành địa chỉ mới chưa được sử dụng", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ email: "newemail@example.com" });
			expect(res.status).toBe(200);
			expect(res.body.email).toBe("newemail@example.com");
		});

		it("không thay đổi các trường không có trong payload cập nhật", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ firstName: "OnlyFirst" });
			expect(res.body.lastName).toBe("User");
		});

		it("không trả về trường mật khẩu trong phần thân phản hồi", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ firstName: "Safe" });
			expect(JSON.stringify(res.body)).not.toMatch(/password/i);
		});

		it("Content-Type là application/json", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ firstName: "Json" });
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		// --- input validation ---

		it("trả về 400 khi định dạng email không hợp lệ", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ email: "not-an-email" });
			expect(res.status).toBe(400);
		});

		it("trả về 409 khi email đã được đăng ký cho tài khoản khác", async () => {
			await registerAndLogin({ email: "occupied@example.com", confirmPassword: "P455word123!@#" });
			const { token } = await registerAndLogin({
				email: "current@example.com",
				confirmPassword: "P455word123!@#",
			});
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", `Bearer ${token}`)
				.send({ email: "occupied@example.com" });
			expect(res.status).toBe(409);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).put(PROFILE).send({ firstName: "Ghost" });
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi token không hợp lệ", async () => {
			const res = await request(app)
				.put(PROFILE)
				.set("Authorization", "Bearer invalid.token.here")
				.send({ firstName: "Hacker" });
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// PUT /api/users/change-password — Change Password
	// ---------------------------------------------------------------------------

	describe("PUT /api/users/change-password — Đổi mật khẩu", () => {
		const BASE_PW = "P455word123!@#";
		const NEW_PW = "N3wP455word!@#";

		// --- happy path ---

		it("trả về 200 khi mật khẩu hiện tại đúng và mật khẩu mới đủ mạnh", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			expect(res.status).toBe(200);
		});

		it("có thể đăng nhập bằng mật khẩu mới sau khi thay đổi thành công", async () => {
			const { token, payload } = await registerAndLogin();
			await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			const loginRes = await request(app).post(LOGIN).send({ email: payload.email, password: NEW_PW });
			expect(loginRes.status).toBe(200);
		});

		it("không thể đăng nhập bằng mật khẩu cũ sau khi thay đổi thành công", async () => {
			const { token, payload } = await registerAndLogin();
			await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			const loginRes = await request(app).post(LOGIN).send({ email: payload.email, password: BASE_PW });
			expect(loginRes.status).toBe(401);
		});

		it("không trả về trường mật khẩu trong phần thân phản hồi", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			expect(JSON.stringify(res.body)).not.toMatch(/password/i);
		});

		// --- validation ---

		it("trả về 401 khi mật khẩu hiện tại không đúng", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: "WrongP455!!", newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			expect(res.status).toBe(401);
		});

		it("trả về 400 khi newPassword và confirmNewPassword không khớp", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: "Different1!" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi mật khẩu mới quá yếu", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW, newPassword: "short", confirmNewPassword: "short" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi thiếu currentPassword trong phần thân yêu cầu", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi thiếu newPassword trong phần thân yêu cầu", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.set("Authorization", `Bearer ${token}`)
				.send({ currentPassword: BASE_PW });
			expect(res.status).toBe(400);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app)
				.put(CHANGE_PASSWORD)
				.send({ currentPassword: BASE_PW, newPassword: NEW_PW, confirmNewPassword: NEW_PW });
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// POST /api/users/addresses — Add Address
	// ---------------------------------------------------------------------------

	describe("POST /api/users/addresses — Thêm địa chỉ", () => {
		// --- happy path ---

		it("trả về 201 sau khi thêm địa chỉ mới", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
			expect(res.status).toBe(201);
		});

		it("trả về mảng addresses đã cập nhật chứa mục mới", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
			expect(Array.isArray(res.body.addresses)).toBe(true);
			expect(res.body.addresses).toHaveLength(1);
			expect(res.body.addresses[0].streetDetails).toBe(sampleAddress.streetDetails);
		});

		it("lưu trữ nhiều địa chỉ khi gọi API nhiều lần", async () => {
			const { token } = await registerAndLogin();
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, streetDetails: "First St" });
			const res = await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, streetDetails: "Second St", isDefault: false });
			expect(res.body.addresses).toHaveLength(2);
		});

		it("khi isDefault là true, chỉ địa chỉ mới là mặc định", async () => {
			const { token } = await registerAndLogin();
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, isDefault: true, streetDetails: "First St" });
			const res = await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, isDefault: true, streetDetails: "Second St" });
			const defaults = res.body.addresses.filter((a: { isDefault: boolean }) => a.isDefault);
			expect(defaults).toHaveLength(1);
			expect(defaults[0].streetDetails).toBe("Second St");
		});

		it("Content-Type là application/json", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		// --- validation ---

		it("trả về 400 khi thiếu các trường bắt buộc của địa chỉ", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ streetDetails: "Incomplete address" });
			expect(res.status).toBe(400);
		});

		it("trả về 400 khi số điện thoại có định dạng không hợp lệ", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, phoneNumber: "abc" });
			expect(res.status).toBe(400);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).post(ADDRESSES).send(sampleAddress);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// PUT /api/users/addresses/:index — Edit Address
	// ---------------------------------------------------------------------------

	describe("PUT /api/users/addresses/:index — Chỉnh sửa địa chỉ", () => {
		let token: string;

		beforeEach(async () => {
			const result = await registerAndLogin();
			token = result.token;
			await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
		});

		// --- happy path ---

		it("trả về 200 khi cập nhật địa chỉ tồn tại", async () => {
			const res = await request(app)
				.put(`${ADDRESSES}/0`)
				.set("Authorization", `Bearer ${token}`)
				.send({ streetDetails: "Updated Street" });
			expect(res.status).toBe(200);
		});

		it("trả về giá trị trường đã cập nhật trong phản hồi", async () => {
			const res = await request(app)
				.put(`${ADDRESSES}/0`)
				.set("Authorization", `Bearer ${token}`)
				.send({ streetDetails: "New Street Name" });
			expect(res.body.addresses[0].streetDetails).toBe("New Street Name");
		});

		it("không thay đổi các địa chỉ khác", async () => {
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, streetDetails: "Second St", isDefault: false });
			const res = await request(app)
				.put(`${ADDRESSES}/0`)
				.set("Authorization", `Bearer ${token}`)
				.send({ streetDetails: "Changed First" });
			expect(res.body.addresses[1].streetDetails).toBe("Second St");
		});

		it("khi đặt isDefault thành true, các địa chỉ khác không còn mặc định", async () => {
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, streetDetails: "Second St", isDefault: false });
			const res = await request(app)
				.put(`${ADDRESSES}/1`)
				.set("Authorization", `Bearer ${token}`)
				.send({ isDefault: true });
			const defaults = res.body.addresses.filter((a: { isDefault: boolean }) => a.isDefault);
			expect(defaults).toHaveLength(1);
			expect(defaults[0].streetDetails).toBe("Second St");
		});

		// --- validation ---

		it("trả về 404 khi chỉ số (index) ngoài phạm vi", async () => {
			const res = await request(app)
				.put(`${ADDRESSES}/99`)
				.set("Authorization", `Bearer ${token}`)
				.send({ streetDetails: "Ghost" });
			expect(res.status).toBe(404);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).put(`${ADDRESSES}/0`).send({ streetDetails: "Intruder" });
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// DELETE /api/users/addresses/:index — Delete Address
	// ---------------------------------------------------------------------------

	describe("DELETE /api/users/addresses/:index — Xóa địa chỉ", () => {
		let token: string;

		beforeEach(async () => {
			const result = await registerAndLogin();
			token = result.token;
			await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
		});

		// --- happy path ---

		it("trả về 200 sau khi xóa một địa chỉ", async () => {
			const res = await request(app).delete(`${ADDRESSES}/0`).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});

		it("địa chỉ bị xóa không còn xuất hiện trong phản hồi", async () => {
			const res = await request(app).delete(`${ADDRESSES}/0`).set("Authorization", `Bearer ${token}`);
			expect(res.body.addresses).toHaveLength(0);
		});

		it("xóa một địa chỉ không làm ảnh hưởng đến các địa chỉ khác", async () => {
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, streetDetails: "Second St", isDefault: false });
			const res = await request(app).delete(`${ADDRESSES}/0`).set("Authorization", `Bearer ${token}`);
			expect(res.body.addresses).toHaveLength(1);
			expect(res.body.addresses[0].streetDetails).toBe("Second St");
		});

		// --- validation ---

		it("trả về 404 khi chỉ số (index) ngoài phạm vi", async () => {
			const res = await request(app).delete(`${ADDRESSES}/99`).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(404);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).delete(`${ADDRESSES}/0`);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// PATCH /api/users/addresses/:index/default — Set Default Address
	// ---------------------------------------------------------------------------

	describe("PATCH /api/users/addresses/:index/default — Đặt địa chỉ mặc định", () => {
		let token: string;

		beforeEach(async () => {
			const result = await registerAndLogin();
			token = result.token;
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, isDefault: true, streetDetails: "First St" });
			await request(app)
				.post(ADDRESSES)
				.set("Authorization", `Bearer ${token}`)
				.send({ ...sampleAddress, isDefault: false, streetDetails: "Second St" });
		});

		// --- happy path ---

		it("trả về 200 sau khi đặt địa chỉ mặc định", async () => {
			const res = await request(app).patch(`${ADDRESSES}/1/default`).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});

		it("địa chỉ được chọn có isDefault là true sau khi thực hiện", async () => {
			const res = await request(app).patch(`${ADDRESSES}/1/default`).set("Authorization", `Bearer ${token}`);
			expect(res.body.addresses[1].isDefault).toBe(true);
		});

		it("các địa chỉ khác có isDefault là false sau khi thực hiện", async () => {
			const res = await request(app).patch(`${ADDRESSES}/1/default`).set("Authorization", `Bearer ${token}`);
			const defaults = res.body.addresses.filter((a: { isDefault: boolean }) => a.isDefault);
			expect(defaults).toHaveLength(1);
		});

		it("địa chỉ trước đó không còn cờ isDefault", async () => {
			const res = await request(app).patch(`${ADDRESSES}/1/default`).set("Authorization", `Bearer ${token}`);
			expect(res.body.addresses[0].isDefault).toBe(false);
		});

		// --- validation ---

		it("trả về 404 khi chỉ số (index) ngoài phạm vi", async () => {
			const res = await request(app).patch(`${ADDRESSES}/99/default`).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(404);
		});

		// --- authentication ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).patch(`${ADDRESSES}/0/default`);
			expect(res.status).toBe(401);
		});
	});

	// ---------------------------------------------------------------------------
	// DELETE /api/users/me — Account Deletion (GDPR)
	// ---------------------------------------------------------------------------

	describe("DELETE /api/users/me — Xóa tài khoản (GDPR)", () => {
		// --- happy path ---

		it("trả về 200 sau khi xóa tài khoản thành công", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			expect(res.status).toBe(200);
		});

		it("trả về thông báo xác nhận trong phần thân phản hồi", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			expect(res.body).toHaveProperty("message");
		});

		it("document người dùng không còn tồn tại trong cơ sở dữ liệu sau khi xóa", async () => {
			const { token, payload } = await registerAndLogin();
			await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			const user = await User.findOne({ email: payload.email });
			expect(user).toBeNull();
		});

		it("không thể đăng nhập bằng thông tin của tài khoản đã xóa", async () => {
			const { token, payload } = await registerAndLogin();
			await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			const loginRes = await request(app).post(LOGIN).send({ email: payload.email, password: payload.password });
			expect(loginRes.status).toBe(401);
		});

		it("tất cả dữ liệu nhúng của người dùng (địa chỉ) được xóa cùng với tài khoản", async () => {
			const { token } = await registerAndLogin();
			// Add an address before deletion
			await request(app).post(ADDRESSES).set("Authorization", `Bearer ${token}`).send(sampleAddress);
			await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			// Ensure no user document remains
			const users = await User.find({});
			expect(users).toHaveLength(0);
		});

		it("Content-Type là application/json", async () => {
			const { token } = await registerAndLogin();
			const res = await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${token}`);
			expect(res.headers["content-type"]).toMatch(/application\/json/);
		});

		// --- security ---

		it("trả về 401 khi không cung cấp header Authorization", async () => {
			const res = await request(app).delete(DELETE_ACCOUNT);
			expect(res.status).toBe(401);
		});

		it("trả về 401 khi token không hợp lệ", async () => {
			const res = await request(app).delete(DELETE_ACCOUNT).set("Authorization", "Bearer tampered.token.value");
			expect(res.status).toBe(401);
		});

		it("không thể xóa tài khoản của người khác bằng token hợp lệ của chính mình", async () => {
			const { token: tokenA } = await registerAndLogin({
				email: "usera@example.com",
				confirmPassword: "P455word123!@#",
			});
			const { payload: payloadB } = await registerAndLogin({
				email: "userb@example.com",
				confirmPassword: "P455word123!@#",
			});

			// User A deletes their own account
			await request(app).delete(DELETE_ACCOUNT).set("Authorization", `Bearer ${tokenA}`);

			// User B's account should still exist
			const userB = await User.findOne({ email: payloadB.email });
			expect(userB).not.toBeNull();
		});
	});
});
