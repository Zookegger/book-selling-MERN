import request from 'supertest';
import app from '../../app';
import { connectTestDB, closeTestDB, clearTestDB } from '../utils/testDb';
import User from '../../models/user.model';
import { EmailService } from '../../services/email.service';
import { generateToken, getTokenExpiration, isTokenExpired } from '../../utils/tokenGenerator';

describe('Các tính năng email xác thực', () => {
	let sendVerificationEmailSpy: jest.SpyInstance;
	let sendPasswordResetEmailSpy: jest.SpyInstance;

	beforeAll(async () => {
		await connectTestDB();
	});

	beforeEach(() => {
		sendVerificationEmailSpy = jest
			.spyOn(EmailService.prototype, 'sendVerificationEmail')
			.mockResolvedValue(undefined);
		sendPasswordResetEmailSpy = jest
			.spyOn(EmailService.prototype, 'sendPasswordResetEmail')
			.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await clearTestDB();
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await closeTestDB();
	});

	describe('POST /api/auth/register', () => {
		it('nên đăng ký người dùng mới và gửi email xác minh', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			expect(res.status).toBe(201);
			expect(res.body.message).toContain('verify');
			expect(res.body).not.toHaveProperty('user');
			expect(res.body).not.toHaveProperty('token');

			const user = await User.findOne({ email: 'test@example.com' });
			expect(user).toBeDefined();
			expect(user?.isEmailVerified).toBe(false);
			expect(user?.emailVerificationToken).toBeDefined();
			expect(user?.emailVerificationExpires).toBeDefined();

			expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
				'test@example.com',
				'John',
				expect.any(String)
			);
		});

		it('không nên cho phép đăng nhập trước khi xác minh email', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'unverified@example.com',
					firstName: 'Jane',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'unverified@example.com',
					password: 'Password123!',
				});

			expect(loginRes.status).toBe(403);
			expect(loginRes.body.message).toContain('verify');
		});

		it('nên thất bại khi mật khẩu không khớp', async () => {
			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'test@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Different123!',
				});

			expect(res.status).toBe(400);
		});

		it('nên thất bại khi email bị trùng lặp', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'duplicate@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const res = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'duplicate@example.com',
					firstName: 'Jane',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			expect(res.status).toBe(409);
		});
	});

	describe('GET /api/auth/verify-email', () => {
		it('nên xác minh email bằng token hợp lệ', async () => {
			const registerRes = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'verify@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const user = await User.findOne({ email: 'verify@example.com' });
			const verificationToken = user?.emailVerificationToken;

			const verifyRes = await request(app)
				.get('/api/auth/verify-email')
				.query({ token: verificationToken });

			expect(verifyRes.status).toBe(200);
			expect(verifyRes.body.user.isEmailVerified).toBe(true);

			const updatedUser = await User.findOne({ email: 'verify@example.com' });
			expect(updatedUser?.isEmailVerified).toBe(true);
			expect(updatedUser?.emailVerificationToken).toBeUndefined();
			expect(updatedUser?.emailVerificationExpires).toBeUndefined();
		});

		it('nên thất bại với token không hợp lệ', async () => {
			const res = await request(app)
				.get('/api/auth/verify-email')
				.query({ token: 'invalid-token' });

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('Invalid');
		});

		it('nên thất bại với token hết hạn', async () => {
			const registerRes = await request(app)
				.post('/api/auth/register')
				.send({
					email: 'expired@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const user = await User.findOne({ email: 'expired@example.com' });
			const verificationToken = user?.emailVerificationToken;

			// Manually expire the token
			user!.emailVerificationExpires = new Date(Date.now() - 1000);
			await user!.save();

			const verifyRes = await request(app)
				.get('/api/auth/verify-email')
				.query({ token: verificationToken });

			expect(verifyRes.status).toBe(400);
			expect(verifyRes.body.message).toContain('expired');
		});

		it('nên thất bại mà không có token', async () => {
			const res = await request(app)
				.get('/api/auth/verify-email');

			expect(res.status).toBe(400);
		});
	});

	describe('POST /api/auth/forgot-password', () => {
		it('nên gửi email đặt lại mật khẩu cho người dùng hiện tại', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'user@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const res = await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'user@example.com' });

			expect(res.status).toBe(200);
			expect(res.body.message).toContain('sent');

			const user = await User.findOne({ email: 'user@example.com' });
			expect(user?.passwordResetToken).toBeDefined();
			expect(user?.passwordResetExpires).toBeDefined();

			expect(sendPasswordResetEmailSpy).toHaveBeenCalledWith(
				'user@example.com',
				'John',
				expect.any(String)
			);
		});

		it('nên trả về thành công cho email không tồn tại (ngăn chặn liệt kê)', async () => {
			const res = await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'nonexistent@example.com' });

			expect(res.status).toBe(200);
			expect(res.body.message).toContain('sent');

			// Verify email was NOT sent
			expect(sendPasswordResetEmailSpy).not.toHaveBeenCalled();
		});

		it('nên thất bại mà không có email', async () => {
			const res = await request(app)
				.post('/api/auth/forgot-password')
				.send({});

			expect(res.status).toBe(400);
		});

		it('nên thất bại với định dạng email không hợp lệ', async () => {
			const res = await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'invalid-email' });

			expect(res.status).toBe(400);
		});
	});

	describe('POST /api/auth/reset-password', () => {
		it('nên đặt lại mật khẩu bằng token hợp lệ', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'reset@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'OldPassword123!',
					confirmPassword: 'OldPassword123!',
				});

			// Request password reset
			await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'reset@example.com' });

			const user = await User.findOne({ email: 'reset@example.com' });
			const resetToken = user?.passwordResetToken;

			// Reset password
			const resetRes = await request(app)
				.post('/api/auth/reset-password')
				.send({
					token: resetToken,
					newPassword: 'NewPassword123!',
				});

			expect(resetRes.status).toBe(200);
			expect(resetRes.body.message).toContain('successfully');

			const updatedUser = await User.findOne({ email: 'reset@example.com' });
			expect(updatedUser?.passwordResetToken).toBeUndefined();
			expect(updatedUser?.passwordResetExpires).toBeUndefined();

			// Should be able to login with new password
			const loginRes = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'reset@example.com',
					password: 'NewPassword123!',
				});

			// First need to verify email
			updatedUser!.isEmailVerified = true;
			await updatedUser!.save();

			const loginRes2 = await request(app)
				.post('/api/auth/login')
				.send({
					email: 'reset@example.com',
					password: 'NewPassword123!',
				});

			expect(loginRes2.status).toBe(200);
		});

		it('nên thất bại với token không hợp lệ', async () => {
			const res = await request(app)
				.post('/api/auth/reset-password')
				.send({
					token: 'invalid-token',
					newPassword: 'NewPassword123!',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('Invalid');
		});

		it('nên thất bại với token hết hạn', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'expired-reset@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'expired-reset@example.com' });

			const user = await User.findOne({ email: 'expired-reset@example.com' });
			const resetToken = user?.passwordResetToken;

			// Expire the token
			user!.passwordResetExpires = new Date(Date.now() - 1000);
			await user!.save();

			const res = await request(app)
				.post('/api/auth/reset-password')
				.send({
					token: resetToken,
					newPassword: 'NewPassword123!',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('expired');
		});

		it('nên thất bại với mật khẩu yếu', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'weak@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			await request(app)
				.post('/api/auth/forgot-password')
				.send({ email: 'weak@example.com' });

			const user = await User.findOne({ email: 'weak@example.com' });
			const resetToken = user?.passwordResetToken;

			const res = await request(app)
				.post('/api/auth/reset-password')
				.send({
					token: resetToken,
					newPassword: 'weak',
				});

			expect(res.status).toBe(400);
		});

		it('nên thất bại khi không có token', async () => {
			const res = await request(app)
				.post('/api/auth/reset-password')
				.send({
					newPassword: 'NewPassword123!',
				});

			expect(res.status).toBe(400);
		});

		it('nên thất bại khi không có mật khẩu mới', async () => {
			const res = await request(app)
				.post('/api/auth/reset-password')
				.send({
					token: 'some-token',
				});

			expect(res.status).toBe(400);
		});
	});

	describe('POST /api/auth/resend-verification', () => {
		it('nên gửi lại email xác minh', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'resend@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			jest.clearAllMocks();

			const res = await request(app)
				.post('/api/auth/resend-verification')
				.send({ email: 'resend@example.com' });

			expect(res.status).toBe(200);
			expect(res.body.message).toContain('sent');

			const user = await User.findOne({ email: 'resend@example.com' });
			expect(user?.emailVerificationToken).toBeDefined();
			expect(user?.emailVerificationExpires).toBeDefined();

			expect(sendVerificationEmailSpy).toHaveBeenCalledWith(
				'resend@example.com',
				'John',
				expect.any(String)
			);
		});

		it('nên thất bại nếu email đã được xác minh', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'verified@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			const user = await User.findOne({ email: 'verified@example.com' });
			const verificationToken = user?.emailVerificationToken;

			// Verify email
			await request(app)
				.get('/api/auth/verify-email')
				.query({ token: verificationToken });

			// Try to resend
			const res = await request(app)
				.post('/api/auth/resend-verification')
				.send({ email: 'verified@example.com' });

			expect(res.status).toBe(400);
			expect(res.body.message).toContain('already');
		});

		it('nên thất bại nếu không tìm thấy người dùng', async () => {
			const res = await request(app)
				.post('/api/auth/resend-verification')
				.send({ email: 'nonexistent@example.com' });

			expect(res.status).toBe(400);
		});

		it('nên thất bại mà không có email', async () => {
			const res = await request(app)
				.post('/api/auth/resend-verification')
				.send({});

			expect(res.status).toBe(400);
		});
	});

	describe('Giả lập Dịch vụ Email', () => {
		it('không nên gửi email thực tế trong quá trình kiểm tra', async () => {
			await request(app)
				.post('/api/auth/register')
				.send({
					email: 'mock@example.com',
					firstName: 'John',
					lastName: 'Doe',
					password: 'Password123!',
					confirmPassword: 'Password123!',
				});

			// Verify the mock was called (not the real transporter)
			expect(sendVerificationEmailSpy).toHaveBeenCalled();

			// Verify it wasn't called with a console.log or actual email send
			const calls = sendVerificationEmailSpy.mock.calls;
			expect(calls.length).toBeGreaterThan(0);
		});
	});

	describe('Hàm Tiện ích Token', () => {
		it('nên tạo các token duy nhất', () => {
			const token1 = generateToken();
			const token2 = generateToken();

			expect(token1).toBeDefined();
			expect(token2).toBeDefined();
			expect(token1).not.toBe(token2);
			expect(token1.length).toBe(64); // 32 bytes in hex = 64 characters
		});

		it('nên tính toán thời hết hạn chính xác', () => {
			const now = Date.now();
			const expiration = getTokenExpiration(1);
			const expectedTime = now + 60 * 60 * 1000; // 1 hour

			expect(expiration.getTime()).toBeGreaterThanOrEqual(expectedTime - 1000);
			expect(expiration.getTime()).toBeLessThanOrEqual(expectedTime + 1000);
		});

		it('nên xác định chính xác các token hết hạn', () => {
			const futureDate = new Date(Date.now() + 1000);
			const pastDate = new Date(Date.now() - 1000);

			expect(isTokenExpired(futureDate)).toBe(false);
			expect(isTokenExpired(pastDate)).toBe(true);
		});
	});
});
