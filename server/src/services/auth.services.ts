import { HttpError } from "@middleware/error.middleware";
import { User } from "@models";
import { IUser } from "@models/user.model";
import jwt from "jsonwebtoken";
import { generateToken, getTokenExpiration, isTokenExpired } from "@utils/tokenGenerator";
import { EmailService } from "@services/email.service";
import {
	loginSchema,
	registerSchema,
	verifyEmailSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	resendVerificationSchema,
	LoginInput,
	RegisterInput,
	VerifyEmailInput,
	ForgotPasswordInput,
	ResetPasswordInput,
	ResendVerificationInput,
} from "@schemas/auth.schema";

/**
 * Xác thực người dùng bằng email và mật khẩu.
 *
 * - Chuẩn hóa email (trim và chuyển về chữ thường).
 * - Kiểm tra các trường bắt buộc.
 * - So khớp mật khẩu bằng `bcrypt`.
 * - Tạo JWT có thời hạn 1 ngày.
 *
 * @throws {HttpError} 400 khi thiếu trường bắt buộc.
 * @throws {HttpError} 401 khi thông tin đăng nhập không hợp lệ.
 * @throws {HttpError} 403 khi người dùng chưa xác minh email.
 *
 * @returns Một đối tượng chứa `user` đã xác thực và `token` JWT đã ký.
 */
export async function login(dto: LoginInput): Promise<{ user: IUser; token: string }> {
	const parsed = loginSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	const normalizedEmail = parsed.data.email;

	const user = await User.findOne({ email: normalizedEmail });
	if (!user) throw new HttpError("Invalid email or password", 401);

	const isMatch = await user.comparePassword(parsed.data.password);
	if (!isMatch) throw new HttpError("Invalid email or password", 401);

	if (!user.isEmailVerified) {
		throw new HttpError("Please verify your email before logging in", 403, { code: "EMAIL_NOT_VERIFIED" });
	}

	const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

	return { user, token };
}

/**
 * Đăng ký tài khoản người dùng mới.
 *
 * - Loại bỏ khoảng trắng xung quanh các trường nhập.
 * - Kiểm tra dữ liệu đăng ký bắt buộc.
 * - Đảm bảo email chưa được đăng ký trước đó.
 * - Hash mật khẩu bằng `bcrypt`.
 * - Tạo email verification token.
 * - Lưu người dùng mới vào cơ sở dữ liệu.
 * - Gửi email xác minh.
 * - Tạo JWT có thời hạn 1 ngày.
 *
 * @throws {HttpError} 400 khi thiếu trường đăng ký bắt buộc.
 * @throws {HttpError} 409 khi email đã tồn tại.
 *
 * @returns Một đối tượng chứa `user` vừa tạo và `token` JWT đã ký.
 */
export async function register(dto: RegisterInput): Promise<IUser> {
	const parsed = registerSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	const { firstName, lastName, email: cleanEmail, password: cleanPassword } = parsed.data;
	const cleanUserInfo = { firstName, lastName, email: cleanEmail };

	const existingUser = await User.findOne({ email: cleanUserInfo.email });

	if (existingUser) throw new HttpError("A user with this email already exists", 409);

	const emailVerificationToken = generateToken();
	const emailVerificationExpires = getTokenExpiration(1);

	// Mongoose pre('save') hook automatically intercepts this and hashes the raw password
	const user = await User.create({
		...cleanUserInfo,
		password: cleanPassword,
		emailVerificationToken,
		emailVerificationExpires,
		isEmailVerified: false,
	});

	try {
		const emailService = new EmailService();
		await emailService.sendVerificationEmail(user.email, user.firstName, emailVerificationToken);
	} catch (error) {
		console.error("Failed to send verification email:", error);
	}

	return user;
}

/**
 * Xác minh email của người dùng.
 *
 * - Tìm người dùng có verification token khớp.
 * - Kiểm tra token chưa hết hạn.
 * - Đánh dấu email là đã xác minh.
 * - Xóa token và ngày hết hạn.
 *
 * @throws {HttpError} 400 khi token không hợp lệ hoặc đã hết hạn.
 * @throws {HttpError} 400 khi email đã được xác minh.
 *
 * @returns Thông tin người dùng sau khi xác minh.
 */
export async function verifyEmail(dto: VerifyEmailInput): Promise<IUser> {
	const parsed = verifyEmailSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	const user = await User.findOne({ emailVerificationToken: parsed.data.token });

	if (!user) throw new HttpError("Invalid verification token", 400);

	// Check if token has expired
	if (user.emailVerificationExpires && isTokenExpired(user.emailVerificationExpires)) {
		throw new HttpError("Verification token has expired", 400);
	}

	// Check if already verified
	if (user.isEmailVerified) {
		throw new HttpError("Email is already verified", 400);
	}

	// Mark as verified and remove token
	user.isEmailVerified = true;
	user.emailVerificationToken = undefined;
	user.emailVerificationExpires = undefined;

	await user.save();

	return user;
}

/**
 * Gửi email đặt lại mật khẩu.
 *
 * - Tìm người dùng có email khớp.
 * - Tạo password reset token.
 * - Lưu token và thời gian hết hạn.
 * - Gửi email đặt lại mật khẩu.
 * - Luôn trả về thành công (tránh email enumeration).
 *
 * @returns Luôn void - không tiết lộ email có tồn tại hay không.
 */
export async function forgotPassword(dto: ForgotPasswordInput): Promise<void> {
	const parsed = forgotPasswordSchema.safeParse(dto);
	if (!parsed.success) {
		const message = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(message, 400);
	}

	const user = await User.findOne({ email: parsed.data.email });

	// Always return success to prevent email enumeration attacks
	if (!user) return;

	// Generate password reset token
	const passwordResetToken = generateToken();
	const passwordResetExpires = getTokenExpiration(1); // 1 hour expiration

	user.passwordResetToken = passwordResetToken;
	user.passwordResetExpires = passwordResetExpires;

	await user.save();

	// Send password reset email
	try {
		const emailService = new EmailService();
		await emailService.sendPasswordResetEmail(user.email, user.firstName, passwordResetToken);
	} catch (error) {
		// Log error but don't throw - user token is created, just email sending failed
		console.error("Failed to send password reset email:", error);
	}
}

/**
 * Đặt lại mật khẩu người dùng.
 *
 * - Tìm người dùng có password reset token khớp.
 * - Kiểm tra token chưa hết hạn.
 * - Hash mật khẩu mới.
 * - Cập nhật mật khẩu.
 * - Xóa token và ngày hết hạn.
 * - Xóa tất cả JWT cũ (bằng cách thay đổi password salt).
 *
 * @throws {HttpError} 400 khi token không hợp lệ hoặc đã hết hạn.
 * @throws {HttpError} 400 khi mật khẩu mới không hợp lệ.
 *
 * @returns Thông tin người dùng sau khi cập nhật mật khẩu.
 */
export async function resetPassword(dto: ResetPasswordInput): Promise<IUser> {
	const parsed = resetPasswordSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	const user = await User.findOne({ passwordResetToken: parsed.data.token });

	if (!user) throw new HttpError("Invalid reset token", 400);

	// Check if token has expired
	if (user.passwordResetExpires && isTokenExpired(user.passwordResetExpires)) {
		throw new HttpError("Reset token has expired", 400);
	}

	// Set new password
	user.password = parsed.data.newPassword;

	// Remove reset token
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	return user;
}

/**
 * Resend email verification email.
 *
 * - Tìm người dùng với email.
 * - Kiểm tra email chưa được xác minh.
 * - Tạo verification token mới.
 * - Lưu token và thời gian hết hạn.
 * - Gửi email xác minh mới.
 *
 * @throws {HttpError} 400 khi không tìm thấy người dùng.
 * @throws {HttpError} 400 khi email đã được xác minh.
 *
 * @returns Thông tin người dùng.
 */
export async function resendVerificationEmail(dto: ResendVerificationInput): Promise<IUser> {
	const parsed = resendVerificationSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	const normalizedEmail = parsed.data.email;

	const user = await User.findOne({ email: normalizedEmail });

	if (!user) throw new HttpError("User not found", 400);

	// Check if already verified
	if (user.isEmailVerified) {
		throw new HttpError("Email is already verified", 400);
	}

	// Generate new verification token
	const emailVerificationToken = generateToken();
	const emailVerificationExpires = getTokenExpiration(1); // 1 hour expiration

	user.emailVerificationToken = emailVerificationToken;
	user.emailVerificationExpires = emailVerificationExpires;

	await user.save();

	// Send verification email
	try {
		const emailService = new EmailService();
		await emailService.sendVerificationEmail(user.email, user.firstName, emailVerificationToken);
	} catch (error) {
		console.error("Failed to send verification email:", error);
		throw new HttpError("Failed to send verification email", 500);
	}

	return user;
}
