import { isTokenExpired, getTokenExpiration, generateToken } from "@utils/tokenGenerator";

// ---------------------------------------------------------------------------
// 1. isTokenExpired()
// ---------------------------------------------------------------------------
describe("isTokenExpired()", () => {
	const NOW = new Date("2025-06-01T12:00:00.000Z");

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(NOW);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("Token đã hết hạn", () => {
		it("trả về true khi ngày hết hạn ở quá khứ (1 giây trước)", () => {
			const expired = new Date(NOW.getTime() - 1_000);
			expect(isTokenExpired(expired)).toBe(true);
		});

		it("trả về true khi ngày hết hạn trước đó 1 giờ", () => {
			const expired = new Date(NOW.getTime() - 60 * 60 * 1_000);
			expect(isTokenExpired(expired)).toBe(true);
		});

		it("trả về true khi ngày hết hạn trước đó 1 ngày", () => {
			const expired = new Date(NOW.getTime() - 24 * 60 * 60 * 1_000);
			expect(isTokenExpired(expired)).toBe(true);
		});

		it("trả về true khi ngày hết hạn là Unix epoch (1970-01-01)", () => {
			expect(isTokenExpired(new Date(0))).toBe(true);
		});
	});

	describe("Token còn hiệu lực", () => {
		it("trả về false khi ngày hết hạn ở tương lai (1 giây sau)", () => {
			const valid = new Date(NOW.getTime() + 1_000);
			expect(isTokenExpired(valid)).toBe(false);
		});

		it("trả về false khi ngày hết hạn sau 1 giờ", () => {
			const valid = new Date(NOW.getTime() + 60 * 60 * 1_000);
			expect(isTokenExpired(valid)).toBe(false);
		});

		it("trả về false khi ngày hết hạn sau 7 ngày", () => {
			const valid = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1_000);
			expect(isTokenExpired(valid)).toBe(false);
		});
	});

	describe("Trường hợp biên — đúng thời điểm hiện tại", () => {
		it("trả về true khi ngày hết hạn bằng đúng thời điểm hiện tại (đã hết hạn tại t=now)", () => {
			// Token hết hạn tại NOW — tùy logic <=  hay < mà behavior khác nhau.
			// Test này tài liệu hóa hành vi hiện tại: now >= expiration → expired
			expect(isTokenExpired(new Date(NOW))).toBe(true);
		});
	});

	describe("Trường hợp biên — giá trị đặc biệt", () => {
		it("ném lỗi khi nhận vào Date với timestamp NaN (Invalid Date)", () => {
			expect(() => isTokenExpired(new Date(NaN))).toThrow(TypeError);
		});

		it("trả về false khi ngày hết hạn rất xa trong tương lai (năm 9999)", () => {
			expect(isTokenExpired(new Date("9999-12-31T23:59:59.999Z"))).toBe(false);
		});
	});
});

// ---------------------------------------------------------------------------
// 2. getTokenExpiration()
// ---------------------------------------------------------------------------
describe("getTokenExpiration()", () => {
	const NOW = new Date("2025-06-01T12:00:00.000Z");

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(NOW);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("Tham số mặc định (1 giờ)", () => {
		it("trả về đối tượng Date", () => {
			expect(getTokenExpiration()).toBeInstanceOf(Date);
		});

		it("trả về thời điểm đúng 1 giờ kể từ bây giờ khi không truyền tham số", () => {
			const expected = new Date(NOW.getTime() + 60 * 60 * 1_000);
			expect(getTokenExpiration()).toEqual(expected);
		});

		it("trả về timestamp lớn hơn thời điểm hiện tại", () => {
			expect(getTokenExpiration().getTime()).toBeGreaterThan(NOW.getTime());
		});
	});

	describe("Tham số hours hợp lệ", () => {
		it("trả về đúng 2 giờ kể từ bây giờ khi hours = 2", () => {
			const expected = new Date(NOW.getTime() + 2 * 60 * 60 * 1_000);
			expect(getTokenExpiration(2)).toEqual(expected);
		});

		it("trả về đúng 24 giờ kể từ bây giờ khi hours = 24", () => {
			const expected = new Date(NOW.getTime() + 24 * 60 * 60 * 1_000);
			expect(getTokenExpiration(24)).toEqual(expected);
		});

		it("trả về đúng 0.5 giờ (30 phút) khi hours = 0.5", () => {
			const expected = new Date(NOW.getTime() + 0.5 * 60 * 60 * 1_000);
			expect(getTokenExpiration(0.5)).toEqual(expected);
		});
	});

	describe("Trường hợp biên — giá trị đặc biệt", () => {
		it("ném lỗi khi hours = 0", () => {
			expect(() => getTokenExpiration(0)).toThrow(TypeError);
		});

		it("ném lỗi khi hours âm (hours = -1)", () => {
			expect(() => getTokenExpiration(-1)).toThrow(TypeError);
		});

		it("ném lỗi khi hours âm (hours = -1)", () => {
			expect(() => getTokenExpiration(-1)).toThrow(TypeError);
		});

		it("không làm thay đổi thời điểm hiện tại (không mutate Date.now)", () => {
			getTokenExpiration(5);
			expect(Date.now()).toBe(NOW.getTime());
		});

		it("mỗi lần gọi trả về một đối tượng Date mới (không chia sẻ reference)", () => {
			const a = getTokenExpiration(1);
			const b = getTokenExpiration(1);
			expect(a).not.toBe(b);
			expect(a).toEqual(b);
		});
	});
});

// ---------------------------------------------------------------------------
// 3. generateToken()
// ---------------------------------------------------------------------------
describe("generateToken()", () => {
	describe("Định dạng đầu ra", () => {
		it("trả về một chuỗi string", () => {
			expect(typeof generateToken()).toBe("string");
		});

		it("trả về chuỗi hex hợp lệ (chỉ chứa ký tự 0-9 và a-f)", () => {
			expect(generateToken()).toMatch(/^[0-9a-f]+$/);
		});

		it("trả về chuỗi với độ dài = length * 2 (mỗi byte = 2 ký tự hex)", () => {
			expect(generateToken(32)).toHaveLength(64);
		});

		it("độ dài mặc định (32 byte) → chuỗi 64 ký tự", () => {
			expect(generateToken()).toHaveLength(64);
		});
	});

	describe("Tham số length khác nhau", () => {
		it.each([
			[1, 2],
			[16, 32],
			[32, 64],
			[64, 128],
		])("length = %i → độ dài chuỗi = %i", (length, expectedStringLength) => {
			expect(generateToken(length)).toHaveLength(expectedStringLength);
		});

		it("trả về chuỗi rỗng khi length = 0", () => {
			expect(generateToken(0)).toBe("");
		});
	});

	describe("Tính ngẫu nhiên và độc lập", () => {
		it("hai lần gọi liên tiếp trả về hai giá trị khác nhau", () => {
			expect(generateToken()).not.toBe(generateToken());
		});

		it("100 token được tạo ra đều khác nhau (không va chạm)", () => {
			const tokens = Array.from({ length: 100 }, () => generateToken());
			const unique = new Set(tokens);
			expect(unique.size).toBe(100);
		});

		it("không phụ thuộc vào thời gian (fake timer không ảnh hưởng)", () => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date("2020-01-01"));
			const token = generateToken();
			expect(token).toMatch(/^[0-9a-f]{64}$/);
			jest.useRealTimers();
		});
	});

	describe("Trường hợp biên — length đặc biệt", () => {
		it("length = 1 → chuỗi 2 ký tự hex", () => {
			const token = generateToken(1);
			expect(token).toHaveLength(2);
			expect(token).toMatch(/^[0-9a-f]{2}$/);
		});

		it("length rất lớn (1024 byte) → chuỗi 2048 ký tự", () => {
			const token = generateToken(1024);
			expect(token).toHaveLength(2048);
			expect(token).toMatch(/^[0-9a-f]+$/);
		});

		it("ném lỗi hoặc trả về chuỗi rỗng khi length âm", () => {
			// crypto.randomBytes(-1) sẽ ném RangeError
			expect(() => generateToken(-1)).toThrow();
		});
	});
});
