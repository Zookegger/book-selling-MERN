import crypto from "crypto";

/**
 * Tạo token ngẫu nhiên an toàn mã hóa.
 * Được sử dụng cho token xác minh email và đặt lại mật khẩu.
 *
 * @param length - Độ dài của token tính bằng byte (mặc định: 32)
 * @returns Chuỗi ngẫu nhiên được mã hóa hex
 */
export function generateToken(length: number = 32): string {
	return crypto.randomBytes(length).toString("hex");
}

/**
 * Tính thời gian hết hạn của token
 * @param hours - Số giờ từ bây giờ (mặc định: 1)
 * @returns Đối tượng Date đại diện cho thời gian hết hạn
 */
export function getTokenExpiration(hours: number = 1): Date {
	if (!Number.isFinite(hours) || hours <= 0) {
		throw new TypeError("hours must be a positive finite number");
	}

	return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Kiểm tra xem token đã hết hạn chưa
 * @param expirationDate - Ngày hết hạn của token
 * @returns true nếu token đã hết hạn, false nếu ngược lại
 */
export function isTokenExpired(expirationDate: Date): boolean {
	if (!(expirationDate instanceof Date) || isNaN(expirationDate.getTime())) {
		throw new TypeError("expirationDate must be a valid Date");
	}

	return expirationDate.getTime() <= Date.now();
}
