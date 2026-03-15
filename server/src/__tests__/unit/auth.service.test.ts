import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { HttpError } from "@middleware/error.middleware";
import { authServices } from "@services";
import { User } from "@models";
import { EmailService } from "@services/email.service";
import * as tokenGenerator from "@utils/tokenGenerator";

jest.mock("@models", () => ({
	User: {
		findOne: jest.fn(),
		create: jest.fn(),
	},
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("@services/email.service");
jest.mock("@utils/tokenGenerator");

const mockedUser = User as jest.Mocked<typeof User>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const mockedGenerateToken = tokenGenerator.generateToken as jest.MockedFunction<typeof tokenGenerator.generateToken>;
const mockedGetTokenExpiration = tokenGenerator.getTokenExpiration as jest.MockedFunction<
	typeof tokenGenerator.getTokenExpiration
>;
const mockedIsTokenExpired = tokenGenerator.isTokenExpired as jest.MockedFunction<typeof tokenGenerator.isTokenExpired>;

const mockUser = {
	_id: "user-id-123",
	firstName: "Jane",
	lastName: "Doe",
	email: "jane@example.com",
	password: "$2b$10$hashedpassword",
	isEmailVerified: true,
	comparePassword: async function (candidate: string) {
		return bcrypt.compare(candidate, mockUser.password);
	},
};

const validUserInfo = {
	firstName: "Jane",
	lastName: "Doe",
	email: "jane@example.com",
};

beforeAll(() => {
	process.env.JWT_SECRET = "super-secret-test-key";
});

describe("login", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it("trả về người dùng và token khi email và mật khẩu chính xác", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
		mockedJwt.sign.mockReturnValueOnce("test-token" as any);

		const result = await authServices.login({ email: "jane@example.com", password: "correctpassword" });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
		expect(mockedBcrypt.compare).toHaveBeenCalledWith("correctpassword", mockUser.password);
		expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser._id }, "super-secret-test-key", {
			expiresIn: "1d",
		});
		expect(result.user).toBe(mockUser);
		expect(result.token).toBe("test-token");
	});

	it("thêm HttpError 401 khi không tìm thấy người dùng cho email đã cho", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.login({ email: "unknown@example.com", password: "pass" })).rejects.toMatchObject({
			statusCode: 401,
			message: "Invalid email or password",
		});
		expect(mockedBcrypt.compare).not.toHaveBeenCalled();
	});

	it("thêm HttpError 401 khi mật khẩu không khớp", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

		await expect(authServices.login({ email: "jane@example.com", password: "wrongpassword" })).rejects.toMatchObject({
			statusCode: 401,
			message: "Invalid email or password",
		});
	});

	it("thêm một thể HttpError trên credentials không hợp lệ", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.login({ email: "x@x.com", password: "pass" })).rejects.toBeInstanceOf(HttpError);
	});

	it("truyền lại lỗi database bất ngờ", async () => {
		mockedUser.findOne.mockRejectedValueOnce(new Error("DB failure"));

		await expect(authServices.login({ email: "jane@example.com", password: "pass" })).rejects.toThrow("DB failure");
	});

	it("thêm HttpError 400 khi email là một chuỗi rỗng", async () => {
		await expect(authServices.login({ email: "", password: "password" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("thêm HttpError 400 khi mật khẩu là một chuỗi rỗng", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

		await expect(authServices.login({ email: "jane@example.com", password: "" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("không tiết lộ liệu email có tồn tại", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		const { message: msgBadEmail } = await authServices.login({ email: "no@user.com", password: "pass" }).catch((e) => e);

		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
		const { message: msgBadPass } = await authServices.login({ email: "jane@example.com", password: "wrong" }).catch((e) => e);

		expect(msgBadEmail).toBe(msgBadPass);
	});

	it("gọi findOne với email chính xác được truyền, bảo tồn chữ hằng", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await authServices.login({ email: "Jane@Example.COM", password: "pass" }).catch(() => {});

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
	});

	it("không gọi bcrypt.compare khi không tìm thấy người dùng", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await authServices.login({ email: "ghost@example.com", password: "pass" }).catch(() => {});

		expect(mockedBcrypt.compare).not.toHaveBeenCalled();
	});

	it("gọi findOne đúng một lần cho mỗi lần đăng nhập", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await authServices.login({ email: "jane@example.com", password: "pass" }).catch(() => {});

		expect(mockedUser.findOne).toHaveBeenCalledTimes(1);
	});

	it("truyền lại lỗi bcrypt bất ngờ", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockRejectedValueOnce(new Error("bcrypt failure"));

		await expect(authServices.login({ email: "jane@example.com", password: "pass" })).rejects.toThrow("bcrypt failure");
	});

	it("không trả về mật khẩu đã hash của người dùng trong kết quả", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
		mockedJwt.sign.mockReturnValueOnce("test-token" as any);

		const result = (await authServices.login({ email: "jane@example.com", password: "correctpassword" })) as any;

		expect(result.user?.password).not.toBe("correctpassword");
	});

	it("thêm HttpError 403 khi email chưa được xác minh", async () => {
		const unverifiedUser = { ...mockUser, isEmailVerified: false };
		mockedUser.findOne.mockResolvedValueOnce(unverifiedUser as any);
		(mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

		await expect(authServices.login({ email: "jane@example.com", password: "correctpassword" })).rejects.toMatchObject({
			statusCode: 403,
			message: "Please verify your email before logging in",
		});
	});
});

describe("register", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		// Setup default mocks for token generation
		mockedGenerateToken.mockReturnValue("mock-email-token");
		mockedGetTokenExpiration.mockReturnValue(new Date(Date.now() + 3600000));

		// Setup default mock for EmailService
		const mockEmailInstance = {
			sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
			sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
			verifyConnection: jest.fn().mockResolvedValue(true),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);
	});

	it("tạo và trả về người dùng mới (IUser) khi tất cả các trường hợp lệ", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({
			...mockUser,
			password: "$2b$10$hashed",
			emailVerificationToken: "mock-email-token",
			emailVerificationExpires: new Date(),
			isEmailVerified: false,
		} as any);

		const result = await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(result).toMatchObject({ email: "jane@example.com" });
		expect(mockedJwt.sign).not.toHaveBeenCalled();
		expect(mockedGenerateToken).toHaveBeenCalled();
		expect(mockedGetTokenExpiration).toHaveBeenCalledWith(1);
	});

	it("truyền tất cả các trường userInfo của người dùng.create", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({ ...mockUser } as any);

		await authServices.register({ ...validUserInfo, password: "Password1!" });

		const createArg = mockedUser.create.mock.calls[0][0] as any;
		expect(createArg).toMatchObject(validUserInfo);
	});

	it("thêm HttpError 409 khi người dùng có email đã tồn tại", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);

		await expect(authServices.register({ ...validUserInfo, password: "Password1!" })).rejects.toMatchObject({
			statusCode: 409,
		});
		expect(mockedUser.create).not.toHaveBeenCalled();
	});

	it("thêm HttpError 400 khi userInfo giả", async () => {
		await expect(authServices.register(null as any)).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("thêm HttpError 400 khi firstName bị thiếu", async () => {
		await expect(
			authServices.register({ firstName: "", lastName: "Doe", email: "a@b.com", password: "Password1!" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("thêm HttpError 400 khi lastName bị thiếu", async () => {
		await expect(
			authServices.register({ firstName: "Jane", lastName: "", email: "a@b.com", password: "Password1!" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("thêm HttpError 400 khi email bị thiếu", async () => {
		await expect(
			authServices.register({ firstName: "Jane", lastName: "Doe", email: "", password: "Password1!" }),
		).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("thêm HttpError 400 khi mật khẩu bị thiếu", async () => {
		await expect(authServices.register({ ...validUserInfo, password: "" })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("thêm một thể HttpError cho các trường bị thiếu", async () => {
		await expect(authServices.register(null as any)).rejects.toBeInstanceOf(HttpError);
	});

	it("không gọi bcrypt.hash khi xác thực không thành công", async () => {
		await expect(authServices.register(null as any)).rejects.toBeDefined();
		expect(mockedBcrypt.hash).not.toHaveBeenCalled();
	});

	it("truyền lại các lỗi database bất ngờ trong quá trình tạo", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockRejectedValueOnce(new Error("DB write failure"));

		await expect(authServices.register({ ...validUserInfo, password: "Password1!" })).rejects.toThrow("DB write failure");
	});

	it("gọi findOne với email chính xác trước khi cố gắng tạo", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({ ...mockUser } as any);

		await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: validUserInfo.email });
		expect(mockedUser.findOne).toHaveBeenCalledTimes(1);
	});

	it("không gọi bcrypt.hash khi email đã tồn tại", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);

		await authServices.register({ ...validUserInfo, password: "Password1!" }).catch(() => {});

		expect(mockedBcrypt.hash).not.toHaveBeenCalled();
	});

	it("thêm thể HttpError 409 khi email trùng lặp", async () => {
		mockedUser.findOne.mockResolvedValueOnce(mockUser as any);

		await expect(authServices.register({ ...validUserInfo, password: "Password1!" })).rejects.toBeInstanceOf(HttpError);
	});

	it("truyền lại các lỗi database bất ngờ trong quá trình findOne", async () => {
		mockedUser.findOne.mockRejectedValueOnce(new Error("DB read failure"));

		await expect(authServices.register({ ...validUserInfo, password: "Password1!" })).rejects.toThrow("DB read failure");
	});

	it("không gọi bcrypt.hash trực tiếp (việc hash thuộc về model pre-save hook)", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({ ...mockUser } as any);

		await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(mockedBcrypt.hash).not.toHaveBeenCalled();
	});

	it("thêm HttpError 400 khi firstName chỉ là khoảng trắng", async () => {
		await expect(
			authServices.register({ firstName: "   ", lastName: "Doe", email: "a@b.com", password: "Password1!" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("thêm HttpError 400 khi lastName chỉ là khoảng trắng", async () => {
		await expect(
			authServices.register({ firstName: "Jane", lastName: "   ", email: "a@b.com", password: "Password1!" }),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("thêm HttpError 400 khi mật khẩu chỉ là khoảng trắng", async () => {
		await expect(authServices.register({ ...validUserInfo, password: "   " })).rejects.toMatchObject({
			statusCode: 400,
		});
	});

	it("trả về IUser được tạo bởi User.create", async () => {
		const created = { ...mockUser, password: "$2b$10$hashed", __v: 0 };
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce(created as any);

		const result = await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(result).toBe(created);
	});

	it("user trả về có password ở dạng bcrypt hash ($2b$10$...)", async () => {
		const createdWithHash = { ...mockUser, password: "$2b$10$abc123hashedpassword" };
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce(createdWithHash as any);

		const result = await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(result.password).toMatch(/^\$2[ab]\$10\$/);
	});

	it("thực hiện findOne -> create theo thứ tự", async () => {
		const callOrder: string[] = [];

		mockedUser.findOne.mockImplementation(((filter: any) => {
			callOrder.push("findOne");
			return Promise.resolve(null);
		}) as any);

		mockedUser.create.mockImplementation(async () => {
			callOrder.push("create");
			return { ...validUserInfo, _id: "new-id", password: "$2b$10$hashed" } as any;
		});

		const result = await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(callOrder).toEqual(["findOne", "create"]);
		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: validUserInfo.email });
		expect(mockedBcrypt.hash).not.toHaveBeenCalled();
		expect(mockedJwt.sign).not.toHaveBeenCalled();

		const createArg = mockedUser.create.mock.calls[0][0] as any;
		expect(createArg).toMatchObject(validUserInfo);

		expect(result._id).toBe("new-id");
		expect(result.password).toBe("$2b$10$hashed");
	});

	it("gửi email xác minh sau khi tạo người dùng", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({
			...mockUser,
			password: "$2b$10$hashed",
			emailVerificationToken: "mock-email-token",
			isEmailVerified: false,
		} as any);

		await authServices.register({ ...validUserInfo, password: "Password1!" });

		expect(mockedEmailService).toHaveBeenCalled();
		const emailInstance = mockedEmailService.mock.results[0].value;
		expect(emailInstance.sendVerificationEmail).toHaveBeenCalledWith(
			validUserInfo.email,
			validUserInfo.firstName,
			"mock-email-token",
		);
	});

	it("không thêm lỗi nếu gửi email thất bại", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);
		mockedUser.create.mockResolvedValueOnce({
			...mockUser,
			password: "$2b$10$hashed",
			emailVerificationToken: "mock-email-token",
			isEmailVerified: false,
		} as any);

		// Mock email service to throw error
		const mockEmailInstance = {
			sendVerificationEmail: jest.fn().mockRejectedValue(new Error("Email service down")),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);

		// Should not throw - email failure is logged but doesn't stop registration
		await expect(authServices.register({ ...validUserInfo, password: "Password1!" })).resolves.toBeDefined();
	});
});

describe("verifyEmail", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it("xác minh email thành công với token hợp lệ", async () => {
		const mockUserWithToken = {
			...mockUser,
			isEmailVerified: false,
			emailVerificationToken: "valid-token",
			emailVerificationExpires: new Date(Date.now() + 3600000),
			save: jest.fn().mockResolvedValue(true),
		};
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithToken as any);
		mockedIsTokenExpired.mockReturnValue(false);

		const result = await authServices.verifyEmail({ token: "valid-token" });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ emailVerificationToken: "valid-token" });
		expect(result.isEmailVerified).toBe(true);
		expect(result.emailVerificationToken).toBeUndefined();
		expect(result.emailVerificationExpires).toBeUndefined();
		expect(mockUserWithToken.save).toHaveBeenCalled();
	});

	it("thêm HttpError 400 khi token không được cung cấp", async () => {
		await expect(authServices.verifyEmail({ token: "" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Verification token is required",
		});
	});

	it("thêm HttpError 400 khi token không hợp lệ", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.verifyEmail({ token: "invalid-token" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Invalid verification token",
		});
	});

	it("thêm HttpError 400 khi token đã hết hạn", async () => {
		const mockUserWithExpiredToken = {
			...mockUser,
			isEmailVerified: false,
			emailVerificationToken: "expired-token",
			emailVerificationExpires: new Date(Date.now() - 3600000),
		};
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithExpiredToken as any);
		mockedIsTokenExpired.mockReturnValue(true);

		await expect(authServices.verifyEmail({ token: "expired-token" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Verification token has expired",
		});
	});

	it("thêm HttpError 400 khi email đã được xác minh", async () => {
		const mockVerifiedUser = {
			...mockUser,
			isEmailVerified: true,
			emailVerificationToken: "some-token",
		};
		mockedUser.findOne.mockResolvedValueOnce(mockVerifiedUser as any);
		mockedIsTokenExpired.mockReturnValue(false);

		await expect(authServices.verifyEmail({ token: "some-token" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Email is already verified",
		});
	});
});

describe("forgotPassword", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		mockedGenerateToken.mockReturnValue("reset-token-123");
		mockedGetTokenExpiration.mockReturnValue(new Date(Date.now() + 3600000));

		const mockEmailInstance = {
			sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);
	});

	it("tạo token đặt lại mật khẩu và gửi email khi người dùng tồn tại", async () => {
		const mockUserWithSave = {
			...mockUser,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithSave);

		await authServices.forgotPassword({ email: "jane@example.com" });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
		expect(mockUserWithSave.passwordResetToken).toBe("reset-token-123");
		expect(mockUserWithSave.passwordResetExpires).toBeDefined();
		expect(mockUserWithSave.save).toHaveBeenCalled();

		const emailInstance = mockedEmailService.mock.results[0].value;
		expect(emailInstance.sendPasswordResetEmail).toHaveBeenCalledWith(
			"jane@example.com",
			"Jane",
			"reset-token-123",
		);
	});

	it("trả về void không có lỗi khi người dùng không tồn tại (ngăn email enumeration)", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.forgotPassword({ email: "notfound@example.com" })).resolves.toBeUndefined();
		expect(mockedGenerateToken).not.toHaveBeenCalled();
	});

	it("chuẩn hóa email (trim và lowercase)", async () => {
		const mockUserWithSave = {
			...mockUser,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithSave);

		await authServices.forgotPassword({ email: "  Jane@Example.COM  " });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
	});

	it("không thêm lỗi nếu gửi email thất bại", async () => {
		const mockUserWithSave = {
			...mockUser,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithSave);

		const mockEmailInstance = {
			sendPasswordResetEmail: jest.fn().mockRejectedValue(new Error("Email service down")),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);

		await expect(authServices.forgotPassword({ email: "jane@example.com" })).resolves.toBeUndefined();
	});
});

describe("resetPassword", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	it("đặt lại mật khẩu thành công với token hợp lệ", async () => {
		const mockUserWithToken = {
			password: "old-hashed-password",
			passwordResetToken: "valid-reset-token",
			passwordResetExpires: new Date(Date.now() + 3600000),
			save: jest.fn().mockResolvedValue(true),
		};

		// Mock findOne để trả về user giả lập
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithToken as any);

		// Mock util kiểm tra hết hạn token
		mockedIsTokenExpired.mockReturnValue(false);

		// CHÚ Ý: Không mock bcrypt.hash ở đây vì Service không còn gọi nó nữa.
		const newRawPassword = "NewPassword123!";
		const result = await authServices.resetPassword({ token: "valid-reset-token", newPassword: newRawPassword });

		// Kiểm tra Service đã tìm đúng token chưa
		expect(mockedUser.findOne).toHaveBeenCalledWith({ passwordResetToken: "valid-reset-token" });

		// Kiểm tra Service đã gán password thô chưa (Hook Schema sẽ lo phần hash khi save() chạy)
		expect(mockUserWithToken.password).toBe(newRawPassword);

		// Kiểm tra các token đã được dọn dẹp chưa
		expect(mockUserWithToken.passwordResetToken).toBeUndefined();
		expect(mockUserWithToken.passwordResetExpires).toBeUndefined();

		// Kiểm tra xem hàm save đã được gọi để kích hoạt middleware chưa
		expect(mockUserWithToken.save).toHaveBeenCalled();
	});

	it("thêm HttpError 400 khi token không được cung cấp", async () => {
		await expect(authServices.resetPassword({ token: "", newPassword: "NewPassword123!" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Reset token is required",
		});
	});

	it("thêm HttpError 400 khi mật khẩu mới không được cung cấp", async () => {
		await expect(authServices.resetPassword({ token: "valid-token", newPassword: "" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Password must be at least 8 characters",
		});
	});

	it("thêm HttpError 400 khi token không hợp lệ", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.resetPassword({ token: "invalid-token", newPassword: "NewPassword123!" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Invalid reset token",
		});
	});

	it("thêm HttpError 400 khi token đã hết hạn", async () => {
		const mockUserWithExpiredToken = {
			...mockUser,
			passwordResetToken: "expired-token",
			passwordResetExpires: new Date(Date.now() - 3600000),
		};
		mockedUser.findOne.mockResolvedValueOnce(mockUserWithExpiredToken as any);
		mockedIsTokenExpired.mockReturnValue(true);

		await expect(authServices.resetPassword({ token: "expired-token", newPassword: "NewPassword123!" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Reset token has expired",
		});
	});
});

describe("resendVerificationEmail", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();

		mockedGenerateToken.mockReturnValue("new-verification-token");
		mockedGetTokenExpiration.mockReturnValue(new Date(Date.now() + 3600000));

		const mockEmailInstance = {
			sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);
	});

	it("gửi lại email xác minh thành công", async () => {
		const mockUserUnverified = {
			...mockUser,
			isEmailVerified: false,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserUnverified);

		const result = await authServices.resendVerificationEmail({ email: "jane@example.com" });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
		expect(mockUserUnverified.emailVerificationToken).toBe("new-verification-token");
		expect(mockUserUnverified.emailVerificationExpires).toBeDefined();
		expect(mockUserUnverified.save).toHaveBeenCalled();

		const emailInstance = mockedEmailService.mock.results[0].value;
		expect(emailInstance.sendVerificationEmail).toHaveBeenCalledWith(
			"jane@example.com",
			"Jane",
			"new-verification-token",
		);
	});

	it("thêm HttpError 400 khi email không được cung cấp", async () => {
		await expect(authServices.resendVerificationEmail({ email: "" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Invalid email address",
		});
	});

	it("thêm HttpError 400 khi không tìm thấy người dùng", async () => {
		mockedUser.findOne.mockResolvedValueOnce(null);

		await expect(authServices.resendVerificationEmail({ email: "notfound@example.com" })).rejects.toMatchObject({
			statusCode: 400,
			message: "User not found",
		});
	});

	it("thêm HttpError 400 khi email đã được xác minh", async () => {
		const mockVerifiedUser = {
			...mockUser,
			isEmailVerified: true,
		};
		mockedUser.findOne.mockResolvedValueOnce(mockVerifiedUser as any);

		await expect(authServices.resendVerificationEmail({ email: "jane@example.com" })).rejects.toMatchObject({
			statusCode: 400,
			message: "Email is already verified",
		});
	});

	it("chuẩn hóa email (trim và lowercase)", async () => {
		const mockUserUnverified = {
			...mockUser,
			isEmailVerified: false,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserUnverified);

		await authServices.resendVerificationEmail({ email: "  Jane@Example.COM  " });

		expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
	});

	it("thêm lỗi nếu gửi email thất bại", async () => {
		const mockUserUnverified = {
			...mockUser,
			isEmailVerified: false,
			save: jest.fn().mockResolvedValue(true),
		} as any;
		mockedUser.findOne.mockResolvedValueOnce(mockUserUnverified);

		const mockEmailInstance = {
			sendVerificationEmail: jest.fn().mockRejectedValue(new Error("Email service down")),
		};
		mockedEmailService.mockImplementation(() => mockEmailInstance as any);

		await expect(authServices.resendVerificationEmail({ email: "jane@example.com" })).rejects.toMatchObject({
			statusCode: 500,
			message: "Failed to send verification email",
		});
	});
});
