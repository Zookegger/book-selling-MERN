import nodemailer from "nodemailer";
import { verificationEmailTemplate } from "@templates/verificationEmail";
import { resetPasswordEmailTemplate } from "@templates/resetPasswordEmail";

/**
 * Cấu hình tùy chọn để khởi tạo một instance của EmailService.
 * Mỗi thuộc tính có thể được cung cấp trực tiếp hoặc để mặc định lấy từ biến môi trường.
 *
 * @example
 * // Cấu hình cơ bản dùng Gmail
 * const options = {
 *   smtpHost: 'smtp.gmail.com',
 *   smtpPort: 587,
 *   smtpSecure: false,
 *   smtpUser: 'user@gmail.com',
 *   smtpPass: 'app-password',
 *   clientUrl: 'https://myapp.com',
 *   emailFrom: 'My App <noreply@myapp.com>'
 * };
 */
export interface EmailServiceOptions {
	/** Host của SMTP server (mặc định: process.env.SMTP_HOST || 'smtp.gmail.com') */
	smtpHost?: string;
	/** Cổng SMTP (mặc định: process.env.SMTP_PORT || 587) */
	smtpPort?: number;
	/** True nếu dùng TLS (cổng 465), false nếu dùng STARTTLS (cổng 587) (mặc định: process.env.SMTP_SECURE === 'true') */
	smtpSecure?: boolean;
	/** Tên đăng nhập SMTP (mặc định: process.env.SMTP_USER) */
	smtpUser?: string;
	/** Mật khẩu SMTP (mặc định: process.env.SMTP_PASS) */
	smtpPass?: string;
	/** Base URL của frontend, dùng để tạo link xác minh/đặt lại mật khẩu (mặc định: process.env.CLIENT_URL) */
	clientUrl?: string;
	/** Địa chỉ email hiển thị ở trường "From" (mặc định: process.env.EMAIL_FROM || 'noreply@bookstore.com') */
	emailFrom?: string;
}

/**
 * Dịch vụ email dạng class, cho phép tạo nhiều instance độc lập với cấu hình riêng.
 * Không sử dụng singleton mặc định để linh hoạt trong test và đa cấu hình.
 *
 * @example
 * // Khởi tạo instance mặc định (dùng biến môi trường)
 * const emailService = new EmailService();
 *
 * @example
 * // Khởi tạo với cấu hình tuỳ chỉnh (ghi đè biến môi trường)
 * const customService = new EmailService({
 *   smtpHost: 'smtp.sendgrid.net',
 *   smtpPort: 587,
 *   smtpUser: 'apikey',
 *   smtpPass: 'SG.xxxxx',
 *   clientUrl: 'https://test.myapp.com'
 * });
 */
export class EmailService {
	private readonly transporter: nodemailer.Transporter;
	private readonly clientUrl: string;
	private readonly emailFrom: string;

	/**
	 * Khởi tạo EmailService. Các giá trị không được cung cấp trong options sẽ được lấy từ
	 * biến môi trường tương ứng, hoặc giá trị mặc định cứng nếu không có biến môi trường.
	 *
	 * @param options - Cấu hình ghi đè (xem {@link EmailServiceOptions})
	 *
	 * @example
	 * // Dùng hoàn toàn biến môi trường
	 * const service = new EmailService();
	 *
	 * @example
	 * // Chỉ ghi đè clientUrl, các thông số SMTP lấy từ env
	 * const service = new EmailService({ clientUrl: 'https://staging.app.com' });
	 */
	constructor(options: EmailServiceOptions = {}) {
		this.clientUrl = options.clientUrl ?? process.env.CLIENT_URL ?? "";
		this.emailFrom = options.emailFrom ?? process.env.EMAIL_FROM ?? "noreply@bookstore.com";

		const smtpPortFromEnv = Number.parseInt(process.env.SMTP_PORT || "587", 10);
		const smtpPort = options.smtpPort ?? (Number.isNaN(smtpPortFromEnv) ? 587 : smtpPortFromEnv);

		this.transporter = nodemailer.createTransport({
			host: options.smtpHost ?? process.env.SMTP_HOST ?? "smtp.gmail.com",
			port: smtpPort,
			secure: options.smtpSecure ?? process.env.SMTP_SECURE === "true",
			auth: {
				user: options.smtpUser ?? process.env.SMTP_USER,
				pass: options.smtpPass ?? process.env.SMTP_PASS,
			},
		});
	}

	/**
	 * Xác minh kết nối đến SMTP server bằng cách gọi `transporter.verify()`.
	 * Có thể gọi phương thức này ngay sau khi khởi tạo để kiểm tra cấu hình.
	 *
	 * @throws {Error} Nếu kết nối thất bại (sai thông tin, network lỗi, …)
	 *
	 * @example
	 * const service = new EmailService();
	 * try {
	 *   await service.verifyTransporter();
	 *   console.log('OK');
	 * } catch (err) {
	 *   console.error('Cấu hình email lỗi:', err);
	 * }
	 */
	public async verifyTransporter(): Promise<void> {
		try {
			await this.transporter.verify();
			console.log("Email service is ready to send messages");
		} catch (error) {
			console.error("Email service verification failed:", error);
			throw error;
		}
	}

	/**
	 * Gửi email xác minh tài khoản cho người dùng.
	 * Email chứa đường link có dạng: `{clientUrl}/verify-email?token={verificationToken}`
	 *
	 * @param email - Địa chỉ email người nhận
	 * @param firstName - Tên của người dùng (được hiển thị trong template)
	 * @param verificationToken - Token xác minh (thường là chuỗi ngẫu nhiên)
	 * @throws {Error} Nếu gửi email thất bại (SMTP lỗi, network, …)
	 *
	 * @example
	 * const service = new EmailService();
	 * await service.sendVerificationEmail('user@example.com', 'Nguyễn Văn A', 'abc123token');
	 */
	public async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<void> {
		const verificationLink = `${this.clientUrl}/verify-email?token=${verificationToken}`;
		const htmlContent = verificationEmailTemplate(firstName, verificationLink);

		const mailOptions = {
			from: this.emailFrom,
			to: email,
			subject: "Verify Your Email - Book Store",
			html: htmlContent,
		};

		try {
			await this.transporter.sendMail(mailOptions);
			console.log(`Verification email sent to ${email}`);
		} catch (error) {
			console.error(`Failed to send verification email to ${email}:`, error);
			throw error;
		} finally {
			this.close();
		}
	}

	/**
	 * Gửi email đặt lại mật khẩu cho người dùng.
	 * Email chứa đường link có dạng: `{clientUrl}/reset-password?token={resetToken}`
	 *
	 * @param email - Địa chỉ email người nhận
	 * @param firstName - Tên của người dùng (được hiển thị trong template)
	 * @param resetToken - Token đặt lại mật khẩu (thường là chuỗi ngẫu nhiên)
	 * @throws {Error} Nếu gửi email thất bại (SMTP lỗi, network, …)
	 *
	 * @example
	 * const service = new EmailService();
	 * await service.sendPasswordResetEmail('user@example.com', 'Nguyễn Văn A', 'xyz789token');
	 */
	public async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
		const resetLink = `${this.clientUrl}/reset-password?token=${resetToken}`;
		const htmlContent = resetPasswordEmailTemplate(firstName, resetLink);

		const mailOptions = {
			from: this.emailFrom,
			to: email,
			subject: "Reset Your Password - Book Store",
			html: htmlContent,
		};

		try {
			await this.transporter.sendMail(mailOptions);
			console.log(`Password reset email sent to ${email}`);
		} catch (error) {
			console.error(`Failed to send password reset email to ${email}:`, error);
			throw error;
		}
	}

	/**
	 * Closes the transporter's connection pool.
	 * Call this when shutting down the application or when you no longer need this instance.
	 */
	public async close(): Promise<void> {
		this.transporter.close();
	}
}
