import nodemailer from "nodemailer";
import { EmailService } from "@services/email.service";
import { verificationEmailTemplate } from "@templates/verificationEmail";
import { resetPasswordEmailTemplate } from "@templates/resetPasswordEmail";

// Mock nodemailer
jest.mock("nodemailer");

// Mock email templates
jest.mock("@templates/verificationEmail", () => ({
	verificationEmailTemplate: jest.fn((firstName: string, link: string) => 
		`<html>Xin chào ${firstName}, link: ${link}</html>`
	),
}));

jest.mock("@templates/resetPasswordEmail", () => ({
	resetPasswordEmailTemplate: jest.fn((firstName: string, link: string) => 
		`<html>Reset mật khẩu ${firstName}, link: ${link}</html>`
	),
}));

// ============================================================
// Helper: tạo mock transporter
// ============================================================
const taoMockTransporter = () => ({
	verify: jest.fn(),
	sendMail: jest.fn(),
	close: jest.fn(),
});

const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockedVerificationTemplate = verificationEmailTemplate as jest.MockedFunction<typeof verificationEmailTemplate>;
const mockedResetPasswordTemplate = resetPasswordEmailTemplate as jest.MockedFunction<typeof resetPasswordEmailTemplate>;

// ============================================================
// 1. CONSTRUCTOR
// ============================================================
describe("EmailService - Constructor", () => {
	let mockTransporter: ReturnType<typeof taoMockTransporter>;

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);
	});

	afterEach(() => {
		jest.clearAllMocks();
		delete process.env.CLIENT_URL;
		delete process.env.EMAIL_FROM;
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_PORT;
		delete process.env.SMTP_SECURE;
		delete process.env.SMTP_USER;
		delete process.env.SMTP_PASS;
	});

	test("Không truyền options → lấy giá trị từ biến môi trường", () => {
		process.env.CLIENT_URL = "http://env-client.com";
		process.env.EMAIL_FROM = "env@example.com";
		process.env.SMTP_HOST = "smtp.env.com";
		process.env.SMTP_PORT = "465";
		process.env.SMTP_SECURE = "true";
		process.env.SMTP_USER = "envuser";
		process.env.SMTP_PASS = "envpass";

		const service = new EmailService();

		expect((service as any).clientUrl).toBe("http://env-client.com");
		expect((service as any).emailFrom).toBe("env@example.com");
		expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "smtp.env.com",
				port: 465,
				secure: true,
				auth: { user: "envuser", pass: "envpass" },
			}),
		);
	});

	test("Truyền options một phần (chỉ clientUrl) → env vars bù phần còn lại", () => {
		process.env.EMAIL_FROM = "env@example.com";
		process.env.SMTP_HOST = "smtp.env.com";

		const service = new EmailService({ clientUrl: "http://custom-client.com" });

		expect((service as any).clientUrl).toBe("http://custom-client.com");
		expect((service as any).emailFrom).toBe("env@example.com");
		expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.env.com" }));
	});

	test("Truyền đầy đủ options → options ghi đè env vars và giá trị mặc định", () => {
		process.env.CLIENT_URL = "http://env-client.com";
		process.env.SMTP_HOST = "smtp.env.com";

		const service = new EmailService({
			clientUrl: "http://options-client.com",
			emailFrom: "options@example.com",
			smtpHost: "smtp.options.com",
			smtpPort: 2525,
			smtpSecure: true,
			smtpUser: "optionsuser",
			smtpPass: "optionspass",
		});

		expect((service as any).clientUrl).toBe("http://options-client.com");
		expect((service as any).emailFrom).toBe("options@example.com");
		expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "smtp.options.com",
				port: 2525,
				secure: true,
				auth: { user: "optionsuser", pass: "optionspass" },
			}),
		);
	});

	test("Không có options và không có env vars → sử dụng giá trị mặc định", () => {
		const service = new EmailService();

		expect((service as any).clientUrl).toBe("");
		expect((service as any).emailFrom).toBe("noreply@bookstore.com");
		expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "smtp.gmail.com",
				port: 587,
				secure: false,
			}),
		);
	});

	test("Thiếu SMTP_USER và SMTP_PASS → transporter vẫn được tạo nhưng auth có thể undefined", () => {
		const service = new EmailService();

		// Transporter được tạo (eager initialization)
		expect(mockedNodemailer.createTransport).toHaveBeenCalledTimes(1);
		expect(service).toBeDefined();
	});

	test("clientUrl không có env var và không có options → mặc định là chuỗi rỗng", () => {
		const service = new EmailService();

		expect((service as any).clientUrl).toBe("");
	});

	test('emailFrom không có env var và không có options → mặc định là "noreply@bookstore.com"', () => {
		const service = new EmailService();

		expect((service as any).emailFrom).toBe("noreply@bookstore.com");
	});

	test('SMTP_SECURE không phải "true" → secure = false', () => {
		process.env.SMTP_SECURE = "false";

		new EmailService();

		expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: false }));
	});
});

// ============================================================
// 2. verifyTransporter()
// ============================================================
describe("EmailService - verifyTransporter()", () => {
	let service: EmailService;
	let mockTransporter: ReturnType<typeof taoMockTransporter>;

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

		service = new EmailService({ clientUrl: "http://test.com" });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test("verify() thành công → resolve và log thành công", async () => {
		mockTransporter.verify.mockResolvedValue(true);
		const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

		await expect(service.verifyTransporter()).resolves.toBeUndefined();
		expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	test("verify() thất bại → log lỗi và ném lại lỗi", async () => {
		const loi = new Error("Lỗi kết nối SMTP");
		mockTransporter.verify.mockRejectedValue(loi);
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

		await expect(service.verifyTransporter()).rejects.toThrow("Lỗi kết nối SMTP");
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	test("transporter.verify() được gọi đúng 1 lần", async () => {
		mockTransporter.verify.mockResolvedValue(true);

		await service.verifyTransporter();

		expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
	});
});

// ============================================================
// 3. sendVerificationEmail()
// ============================================================
describe("EmailService - sendVerificationEmail()", () => {
	let service: EmailService;
	let mockTransporter: ReturnType<typeof taoMockTransporter>;
	const clientUrl = "http://bookstore.com";
	const emailFrom = "no-reply@bookstore.com";

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

		service = new EmailService({ clientUrl, emailFrom });

		// Spy để ngăn log làm nhiễu output test
		jest.spyOn(console, "log").mockImplementation(() => {});
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("Gửi thành công → resolve, log thành công, và gọi close()", async () => {
		mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });

		await expect(service.sendVerificationEmail("user@test.com", "Nguyen", "token-abc")).resolves.toBeUndefined();

		expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
		expect(mockTransporter.close).toHaveBeenCalledTimes(1);
		expect(console.log).toHaveBeenCalled();
	});

	test("Link xác thực được tạo đúng với clientUrl và token", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendVerificationEmail("user@test.com", "Nguyen", "my-token");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.html).toContain(`${clientUrl}/verify-email?token=my-token`);
	});

	test("emailFrom và địa chỉ nhận được đặt đúng", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendVerificationEmail("recipient@test.com", "Tran", "tok-xyz");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.from).toBe(emailFrom);
		expect(goiSendMail.to).toBe("recipient@test.com");
	});

	test('Subject email đúng là "Verify Your Email - Book Store"', async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendVerificationEmail("user@test.com", "Le", "tok-123");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.subject).toBe("Verify Your Email - Book Store");
	});

	test("HTML được tạo từ verificationEmailTemplate với firstName và link đúng", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendVerificationEmail("user@test.com", "Pham", "tok-456");

		expect(mockedVerificationTemplate).toHaveBeenCalledWith("Pham", `${clientUrl}/verify-email?token=tok-456`);
	});

	test("Lỗi SMTP → log lỗi, ném lại lỗi, và vẫn gọi close()", async () => {
		const loi = new Error("Lỗi xác thực SMTP");
		mockTransporter.sendMail.mockRejectedValue(loi);

		await expect(service.sendVerificationEmail("user@test.com", "Hoang", "tok-err")).rejects.toThrow(
			"Lỗi xác thực SMTP",
		);

		expect(console.error).toHaveBeenCalled();
		// close() phải được gọi dù thành công hay thất bại (finally block)
		expect(mockTransporter.close).toHaveBeenCalledTimes(1);
	});

	test("close() luôn được gọi dù thành công hay thất bại", async () => {
		// Trường hợp thành công
		mockTransporter.sendMail.mockResolvedValueOnce({});
		await service.sendVerificationEmail("a@test.com", "A", "tok1");
		expect(mockTransporter.close).toHaveBeenCalledTimes(1);

		jest.clearAllMocks();

		// Trường hợp thất bại
		mockTransporter.sendMail.mockRejectedValueOnce(new Error("Lỗi"));
		await service.sendVerificationEmail("b@test.com", "B", "tok2").catch(() => {});
		expect(mockTransporter.close).toHaveBeenCalledTimes(1);
	});

	test("clientUrl rỗng → link bắt đầu bằng /verify-email?token=...", async () => {
		const serviceKhongUrl = new EmailService({ clientUrl: "", emailFrom });
		mockTransporter.sendMail.mockResolvedValue({});

		await serviceKhongUrl.sendVerificationEmail("user@test.com", "Vu", "tok-rel");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.html).toContain("/verify-email?token=tok-rel");
	});

	test("Gọi sendVerificationEmail lần 2 trên cùng instance → thất bại vì transporter đã đóng", async () => {
		// Lần 1 thành công và đóng transporter
		mockTransporter.sendMail.mockResolvedValueOnce({});
		await service.sendVerificationEmail("user@test.com", "Nguyen", "tok-1");

		// Lần 2 thất bại vì transporter đã đóng
		mockTransporter.sendMail.mockRejectedValueOnce(new Error("Transporter đã đóng"));
		await expect(service.sendVerificationEmail("user@test.com", "Nguyen", "tok-2")).rejects.toThrow(
			"Transporter đã đóng",
		);
	});
});

// ============================================================
// 4. sendPasswordResetEmail()
// ============================================================
describe("EmailService - sendPasswordResetEmail()", () => {
	let service: EmailService;
	let mockTransporter: ReturnType<typeof taoMockTransporter>;
	const clientUrl = "http://bookstore.com";
	const emailFrom = "no-reply@bookstore.com";

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

		service = new EmailService({ clientUrl, emailFrom });

		jest.spyOn(console, "log").mockImplementation(() => {});
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("Gửi thành công → resolve, log thành công, KHÔNG gọi close()", async () => {
		mockTransporter.sendMail.mockResolvedValue({ messageId: "reset-123" });

		await expect(service.sendPasswordResetEmail("user@test.com", "Nguyen", "reset-token")).resolves.toBeUndefined();

		expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
		expect(mockTransporter.close).not.toHaveBeenCalled();
		expect(console.log).toHaveBeenCalled();
	});

	test("Link reset được tạo đúng với clientUrl và resetToken", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("user@test.com", "Tran", "reset-abc");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.html).toContain(`${clientUrl}/reset-password?token=reset-abc`);
	});

	test("emailFrom và địa chỉ nhận được đặt đúng", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("recipient@test.com", "Le", "reset-xyz");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.from).toBe(emailFrom);
		expect(goiSendMail.to).toBe("recipient@test.com");
	});

	test('Subject email đúng là "Reset Your Password - Book Store"', async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("user@test.com", "Pham", "reset-tok");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.subject).toBe("Reset Your Password - Book Store");
	});

	test("HTML được tạo từ resetPasswordEmailTemplate với firstName và link đúng", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("user@test.com", "Hoang", "reset-456");

		expect(mockedResetPasswordTemplate).toHaveBeenCalledWith("Hoang", `${clientUrl}/reset-password?token=reset-456`);
	});

	test("Lỗi SMTP → log lỗi, ném lại lỗi, KHÔNG gọi close()", async () => {
		const loi = new Error("Lỗi gửi email reset");
		mockTransporter.sendMail.mockRejectedValue(loi);

		await expect(service.sendPasswordResetEmail("user@test.com", "Vu", "reset-err")).rejects.toThrow(
			"Lỗi gửi email reset",
		);

		expect(console.error).toHaveBeenCalled();
		// Khác với sendVerificationEmail: KHÔNG gọi close()
		expect(mockTransporter.close).not.toHaveBeenCalled();
	});

	test("[Không nhất quán] sendPasswordResetEmail không gọi close() khác với sendVerificationEmail", async () => {
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("user@test.com", "Test", "tok");

		// Tài liệu hóa hành vi hiện tại: close() KHÔNG được gọi
		// Nếu đây là bug, test này sẽ báo hiệu khi hành vi thay đổi
		expect(mockTransporter.close).not.toHaveBeenCalled();
	});
});

// ============================================================
// 5. close()
// ============================================================
describe("EmailService - close()", () => {
	let service: EmailService;
	let mockTransporter: ReturnType<typeof taoMockTransporter>;

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

		service = new EmailService({ clientUrl: "http://test.com" });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test("Gọi close() → transporter.close() được gọi đúng 1 lần", () => {
		service.close();

		expect(mockTransporter.close).toHaveBeenCalledTimes(1);
	});

	test("Sau khi close(), gửi email sẽ thất bại", async () => {
		service.close();

		mockTransporter.sendMail.mockRejectedValue(new Error("Transport đã bị đóng"));
		jest.spyOn(console, "error").mockImplementation(() => {});

		await expect(service.sendPasswordResetEmail("user@test.com", "Test", "tok")).rejects.toThrow(
			"Transport đã bị đóng",
		);

		jest.restoreAllMocks();
	});
});

// ============================================================
// 6. Trường hợp biên và cân nhắc thêm
// ============================================================
describe("EmailService - Trường hợp biên", () => {
	let mockTransporter: ReturnType<typeof taoMockTransporter>;

	beforeEach(() => {
		mockTransporter = taoMockTransporter();
		mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);
		jest.spyOn(console, "log").mockImplementation(() => {});
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	test("Thiếu SMTP_USER/SMTP_PASS → sendMail ném lỗi xác thực", async () => {
		const service = new EmailService({ clientUrl: "http://test.com" });

		const loiXacThuc = new Error("Lỗi xác thực: thiếu thông tin đăng nhập");
		mockTransporter.sendMail.mockRejectedValue(loiXacThuc);

		await expect(service.sendPasswordResetEmail("user@test.com", "Test", "tok")).rejects.toThrow(
			"Lỗi xác thực: thiếu thông tin đăng nhập",
		);
	});

	test("clientUrl rỗng → link reset bắt đầu bằng /reset-password?token=...", async () => {
		const service = new EmailService({ clientUrl: "", emailFrom: "noreply@bookstore.com" });
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendPasswordResetEmail("user@test.com", "Test", "tok-rel");

		const goiSendMail = mockTransporter.sendMail.mock.calls[0][0];
		expect(goiSendMail.html).toContain("/reset-password?token=tok-rel");
	});

	test("Console.log được gọi khi gửi email xác thực thành công", async () => {
		const service = new EmailService({ clientUrl: "http://test.com" });
		mockTransporter.sendMail.mockResolvedValue({});

		await service.sendVerificationEmail("user@test.com", "Test", "tok");

		expect(console.log).toHaveBeenCalled();
	});

	test("Console.error được gọi khi gửi email reset thất bại", async () => {
		const service = new EmailService({ clientUrl: "http://test.com" });
		mockTransporter.sendMail.mockRejectedValue(new Error("SMTP down"));

		await service.sendPasswordResetEmail("user@test.com", "Test", "tok").catch(() => {});

		expect(console.error).toHaveBeenCalled();
	});

	test("Gọi sendVerificationEmail hai lần liên tiếp → lần 2 thất bại (transporter đã đóng)", async () => {
		const service = new EmailService({ clientUrl: "http://test.com" });

		mockTransporter.sendMail.mockResolvedValueOnce({});
		await service.sendVerificationEmail("user@test.com", "A", "tok-1");

		mockTransporter.sendMail.mockRejectedValueOnce(new Error("Transporter đã đóng"));
		await expect(service.sendVerificationEmail("user@test.com", "A", "tok-2")).rejects.toThrow(
			"Transporter đã đóng",
		);
	});

	test("Tắt ứng dụng gracefully → gọi close() để dọn dẹp tài nguyên", () => {
		const service = new EmailService({ clientUrl: "http://test.com" });

		service.close();

		expect(mockTransporter.close).toHaveBeenCalledTimes(1);
	});
});
