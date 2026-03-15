import { User } from "@models";
import {
	getUser,
	addUser,
	removeUser,
	updateUser,
	updateProfile,
	changePassword,
	addAddress,
	updateAddress,
	deleteAddress,
	setDefaultAddress,
} from "@services/user.services";
import { connectTestDB, closeTestDB, clearTestDB } from "../utils/testDb";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { HttpError } from "@middleware/error.middleware";
// ─── Test DB Setup ────────────────────────────────────────────────────────────

beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());
afterEach(async () => await clearTestDB());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) =>
	addUser({
		firstName: "Nguyen",
		lastName: "Van A",
		email: "nguyenvana@example.com",
		password: "$2b$10$Hashedpassword",
		...overrides,
	});

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

// ─── addUser ──────────────────────────────────────────────────────────────────

describe("Thêm người dùng - addUser()", () => {
	it("tạo người dùng mới với các trường dữ liệu chính xác", async () => {
		const user = await makeUser();

		expect(user._id).toBeDefined();
		expect(user.firstName).toBe("Nguyen");
		expect(user.lastName).toBe("Van A");
		expect(user.email).toBe("nguyenvana@example.com");
		expect(user.role).toBe("customer");
		expect(user.isEmailVerified).toBe(false);
	});

	it("chuyển email về chữ thường khi tạo", async () => {
		const user = await addUser({
			firstName: "Test",
			lastName: "User",
			email: "UPPERCASE@EXAMPLE.COM",
			password: "P455w0rd123!@#",
		});
		expect(user.email).toBe("uppercase@example.com");
	});

	it("tạo người dùng với vai trò admin khi được chỉ định", async () => {
		const user = await addUser({
			firstName: "Admin",
			lastName: "User",
			email: "admin@example.com",
			role: "admin",
			password: "4dm1nP455w0rd123!@#",
		});
		expect(user.role).toBe("admin");
	});

	it("báo lỗi khi email đã tồn tại", async () => {
		await makeUser();
		await expect(makeUser()).rejects.toThrow("Email already in use");
	});

	it("báo lỗi khi email đã tồn tại không phân biệt chữ hoa chữ thường", async () => {
		await makeUser({ email: "nguyenvana@example.com" });
		await expect(makeUser({ email: "NGUYENVANA@EXAMPLE.COM" })).rejects.toThrow("Email already in use");
	});

	it("khởi tạo addresses, wishList và digitalLibrary dưới dạng mảng rỗng", async () => {
		const user = await makeUser();
		expect(user.addresses).toEqual([]);
		expect(user.wishList).toEqual([]);
		expect(user.digitalLibrary).toEqual([]);
	});
});

// ─── getUser ──────────────────────────────────────────────────────────────────

describe("Lấy người dùng - getUser()", () => {
	it("tìm người dùng theo chuỗi ObjectId", async () => {
		const created = await makeUser();
		const found = await getUser(created._id.toString());

		expect(found).not.toBeNull();
		expect(found!.email).toBe(created.email);
	});

	it("tìm người dùng theo email", async () => {
		await makeUser();
		const found = await getUser("nguyenvana@example.com");

		expect(found).not.toBeNull();
		expect(found!.firstName).toBe("Nguyen");
	});

	it("không phân biệt chữ hoa chữ thường khi tìm theo email", async () => {
		await makeUser();
		const found = await getUser("NGUYENVANA@EXAMPLE.COM");

		expect(found).not.toBeNull();
	});

	it("trả về null cho ObjectId hợp lệ nhưng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		const found = await getUser(fakeId);
		expect(found).toBeNull();
	});

	it("trả về null nếu email không tồn tại", async () => {
		const found = await getUser("nobody@example.com");
		expect(found).toBeNull();
	});

	it("nạp dữ liệu cho digitalLibrary và wishList.book", async () => {
		const created = await makeUser();
		const found = await getUser(created._id.toString());

		// Fields should exist (populated, even if empty arrays)
		expect(found).toHaveProperty("digitalLibrary");
		expect(found).toHaveProperty("wishList");
	});
});

// ─── removeUser ───────────────────────────────────────────────────────────────

describe("Xóa người dùng - removeUser()", () => {
	it("xóa người dùng tồn tại và trả về bản ghi đã xóa", async () => {
		const created = await makeUser();
		const deleted = await removeUser(created._id.toString());

		expect(deleted).not.toBeNull();
		expect(deleted!._id.toString()).toBe(created._id.toString());
	});

	it("người dùng không còn tồn tại trong DB sau khi xóa", async () => {
		const created = await makeUser();
		await removeUser(created._id.toString());

		const found = await User.findById(created._id);
		expect(found).toBeNull();
	});

	it("ném lỗi khi không tìm thấy người dùng", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(removeUser(fakeId)).rejects.toThrow("User not found");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(removeUser("not-an-id")).rejects.toThrow("The provided ID not-an-id is invalid.");
	});
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe("Cập nhật người dùng - updateUser()", () => {
	it("cập nhật một trường trực tiếp của user và trả về bản ghi đã cập nhật", async () => {
		const created = await makeUser();
		const updated = await updateUser(created._id.toString(), { firstName: "Minh" });

		expect(updated!.firstName).toBe("Minh");
	});

	it("không thay đổi các trường không có trong dữ liệu cập nhật", async () => {
		const created = await makeUser();
		const updated = await updateUser(created._id.toString(), { firstName: "Minh" });

		expect(updated!.lastName).toBe("Van A");
		expect(updated!.email).toBe("nguyenvana@example.com");
	});

	it("có thể cập nhật vai trò của người dùng", async () => {
		const created = await makeUser();
		const updated = await updateUser(created._id.toString(), { role: "admin" });

		expect(updated!.role).toBe("admin");
	});

	it("ném lỗi khi không tìm thấy người dùng", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateUser(fakeId, { firstName: "Ghost" })).rejects.toThrow("User not found");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(updateUser("bad-id", { firstName: "X" })).rejects.toThrow("The provided ID bad-id is invalid.");
	});
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe("Cập nhật hồ sơ cá nhân - updateProfile()", () => {
	// ── basic field updates ──

	it("cập nhật các trường cơ bản của hồ sơ", async () => {
		const created = await makeUser();
		const updated = await updateProfile(created._id.toString(), {
			firstName: "Thi",
			lastName: "Nguyen",
		});

		expect(updated!.firstName).toBe("Thi");
		expect(updated!.lastName).toBe("Nguyen");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(updateProfile("bad-id", { firstName: "X" })).rejects.toThrow("The provided ID bad-id is invalid.");
	});

	it("ném lỗi khi không tìm thấy người dùng", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateProfile(fakeId, { firstName: "Ghost" })).rejects.toThrow("User not found");
	});

	// ── address management ──

	describe("Quản lý địa chỉ", () => {
		it("lưu danh sách địa chỉ cho người dùng", async () => {
			const created = await makeUser();
			const updated = await updateProfile(created._id.toString(), {
				addresses: [sampleAddress],
			});

			expect(updated!.addresses).toHaveLength(1);
			expect(updated!.addresses[0].recipientName).toBe("Nguyen Van A");
		});

		it("chỉ có một địa chỉ được đánh dấu là isDefault khi chỉ định một địa chỉ mặc định", async () => {
			const created = await makeUser();
			const addresses = [
				{ ...sampleAddress, streetDetails: "1 Nguyen Hue", isDefault: true },
				{ ...sampleAddress, streetDetails: "2 Le Thanh Ton", isDefault: false },
				{ ...sampleAddress, streetDetails: "3 Dong Khoi", isDefault: false },
			];

			const updated = await updateProfile(created._id.toString(), { addresses });
			const defaults = updated!.addresses.filter((a) => a.isDefault);

			expect(defaults).toHaveLength(1);
			expect(defaults[0].streetDetails).toBe("1 Nguyen Hue");
		});

		it("đảm bảo chỉ giữ địa chỉ mặc định đầu tiên khi có nhiều địa chỉ được đánh dấu isDefault", async () => {
			const created = await makeUser();
			// The service picks the first truthy isDefault via findIndex
			const addresses = [
				{ ...sampleAddress, streetDetails: "1 Nguyen Hue", isDefault: true },
				{ ...sampleAddress, streetDetails: "2 Le Thanh Ton", isDefault: true },
			];

			const updated = await updateProfile(created._id.toString(), { addresses });
			const defaults = updated!.addresses.filter((a) => a.isDefault);

			expect(defaults).toHaveLength(1);
			expect(defaults[0].streetDetails).toBe("1 Nguyen Hue");
		});

		it("không thay đổi cờ isDefault nếu không có địa chỉ nào được đặt true", async () => {
			const created = await makeUser();
			const addresses = [
				{ ...sampleAddress, streetDetails: "1 Nguyen Hue", isDefault: false },
				{ ...sampleAddress, streetDetails: "2 Le Thanh Ton", isDefault: false },
			];

			const updated = await updateProfile(created._id.toString(), { addresses });
			const defaults = updated!.addresses.filter((a) => a.isDefault);

			// No default was specified, so none should be set
			expect(defaults).toHaveLength(0);
		});

		it("thay thế toàn bộ danh sách địa chỉ khi cung cấp mảng mới", async () => {
			const created = await makeUser();

			await updateProfile(created._id.toString(), {
				addresses: [{ ...sampleAddress, streetDetails: "Old Street" }],
			});

			const updated = await updateProfile(created._id.toString(), {
				addresses: [{ ...sampleAddress, streetDetails: "New Street" }],
			});

			expect(updated!.addresses).toHaveLength(1);
			expect(updated!.addresses[0].streetDetails).toBe("New Street");
		});

		it("không thay đổi địa chỉ khi trường addresses không có trong cập nhật", async () => {
			const created = await makeUser();

			await updateProfile(created._id.toString(), {
				addresses: [sampleAddress],
			});

			const updated = await updateProfile(created._id.toString(), { firstName: "Only Name" });

			expect(updated!.addresses).toHaveLength(1);
		});
	});
});

// ─── changePassword ───────────────────────────────────────────────────────────

describe("Đổi mật khẩu - changePassword()", () => {
	const CURRENT_PW = "P455word123!@#";
	const NEW_PW = "N3wP455word!@#";

	const makeUserWithRealPassword = async () => {
		return addUser({
			firstName: "Password",
			lastName: "User",
			email: "pwuser@example.com",
			password: CURRENT_PW,
		});
	};

	it("lưu hash mật khẩu mới khi mật khẩu hiện tại đúng", async () => {
		const user = await makeUserWithRealPassword();
		const updated = await changePassword(user._id.toString(), {
			currentPassword: CURRENT_PW,
			newPassword: NEW_PW,
		});

		expect(updated).not.toBeNull();

		console.log(updated);

		expect(await updated.comparePassword(NEW_PW)).toBe(true);
	});

	it("mật khẩu cũ không còn khớp sau khi thay đổi", async () => {
		const user = await makeUserWithRealPassword();
		await changePassword(user._id.toString(), {
			currentPassword: CURRENT_PW,
			newPassword: NEW_PW,
		});

		const reloaded = await User.findById(user._id);
		expect(await reloaded!.comparePassword(CURRENT_PW)).toBe(false);
	});

	it("báo lỗi khi mật khẩu hiện tại không chính xác", async () => {
		const user = await makeUserWithRealPassword();
		await expect(
			changePassword(user._id.toString(), {
				currentPassword: "WrongP455!",
				newPassword: NEW_PW,
			}),
		).rejects.toThrow();
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(
			changePassword("not-an-id", {
				currentPassword: CURRENT_PW,
				newPassword: NEW_PW,
			}),
		).rejects.toThrow(
			"The provided ID not-an-id is invalid.",
		);
	});

	it("trả về null khi id hợp lệ nhưng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(
			changePassword(fakeId, {
				currentPassword: CURRENT_PW,
				newPassword: NEW_PW,
			}),
		).rejects.toThrow("User not found");
	});
});

// ─── addAddress ───────────────────────────────────────────────────────────────

describe("Thêm địa chỉ - addAddress()", () => {
	it("thêm địa chỉ mới vào mảng addresses của người dùng", async () => {
		const user = await makeUser();
		const updated = await addAddress(user._id.toString(), sampleAddress);

		expect(updated!.addresses).toHaveLength(1);
		expect(updated!.addresses[0].streetDetails).toBe(sampleAddress.streetDetails);
	});

	it("tích lũy địa chỉ sau các lần gọi liên tiếp", async () => {
		const user = await makeUser();
		await addAddress(user._id.toString(), { ...sampleAddress, streetDetails: "1 Nguyen Hue" });
		const updated = await addAddress(user._id.toString(), {
			...sampleAddress,
			streetDetails: "2 Le Loi",
			isDefault: false,
		});

		expect(updated!.addresses).toHaveLength(2);
	});

	it("khi isDefault = true, bỏ isDefault trên tất cả địa chỉ đã tồn tại", async () => {
		const user = await makeUser();
		await addAddress(user._id.toString(), { ...sampleAddress, isDefault: true, streetDetails: "First St" });
		const updated = await addAddress(user._id.toString(), {
			...sampleAddress,
			isDefault: true,
			streetDetails: "Second St",
		});

		const defaults = updated!.addresses.filter((a) => a.isDefault);
		expect(defaults).toHaveLength(1);
		expect(defaults[0].streetDetails).toBe("Second St");
	});

	it("khi isDefault = false, không thay đổi các địa chỉ đang là mặc định", async () => {
		const user = await makeUser();
		await addAddress(user._id.toString(), { ...sampleAddress, isDefault: true, streetDetails: "First St" });
		const updated = await addAddress(user._id.toString(), {
			...sampleAddress,
			isDefault: false,
			streetDetails: "Second St",
		});

		const defaults = updated!.addresses.filter((a) => a.isDefault);
		expect(defaults).toHaveLength(1);
		expect(defaults[0].streetDetails).toBe("First St");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(addAddress("not-an-id", sampleAddress)).rejects.toThrow("The provided ID not-an-id is invalid.");
	});

	it("ném lỗi không tìm thấy khi người dùng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(addAddress(fakeId, sampleAddress)).rejects.toThrow();
	});
});

// ─── updateAddress ────────────────────────────────────────────────────────────

describe("Cập nhật địa chỉ - updateAddress()", () => {
	const seedAddresses = async (userId: string) => {
		await updateProfile(userId, {
			addresses: [
				{ ...sampleAddress, streetDetails: "First St", isDefault: true },
				{ ...sampleAddress, streetDetails: "Second St", isDefault: false },
			],
		});
	};

	it("cập nhật trường tại vị trí chỉ định", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await updateAddress(user._id.toString(), 0, { streetDetails: "Updated St" });

		expect(updated!.addresses[0].streetDetails).toBe("Updated St");
	});

	it("không thay đổi địa chỉ ở các vị trí khác", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await updateAddress(user._id.toString(), 0, { streetDetails: "Changed" });

		expect(updated!.addresses[1].streetDetails).toBe("Second St");
	});

	it("khi isDefault được đặt true, bỏ isDefault trên tất cả các địa chỉ khác", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await updateAddress(user._id.toString(), 1, { isDefault: true });
		const defaults = updated!.addresses.filter((a) => a.isDefault);

		expect(defaults).toHaveLength(1);
		expect(defaults[0].streetDetails).toBe("Second St");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(updateAddress("bad-id", 0, { streetDetails: "X" })).rejects.toThrow(
			"The provided ID bad-id is invalid.",
		);
	});

	it("báo lỗi khi chỉ số vượt ngoài phạm vi", async () => {
		const user = await makeUser();
		await expect(updateAddress(user._id.toString(), 99, { streetDetails: "X" })).rejects.toThrow();
	});

	it("ném lỗi không tìm thấy khi người dùng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(updateAddress(fakeId, 0, { streetDetails: "X" })).rejects.toThrow();
	});
});

// ─── deleteAddress ────────────────────────────────────────────────────────────

describe("Xóa địa chỉ - deleteAddress()", () => {
	const seedAddresses = async (userId: string) => {
		await updateProfile(userId, {
			addresses: [
				{ ...sampleAddress, streetDetails: "First St", isDefault: true },
				{ ...sampleAddress, streetDetails: "Second St", isDefault: false },
			],
		});
	};

	it("xóa địa chỉ tại vị trí chỉ định", async () => {
		const user = await makeUser();
		await updateProfile(user._id.toString(), { addresses: [sampleAddress] });

		const updated = await deleteAddress(user._id.toString(), 0);
		expect(updated!.addresses).toHaveLength(0);
	});

	it("giữ nguyên các địa chỉ khác khi xóa một địa chỉ", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await deleteAddress(user._id.toString(), 0);

		expect(updated!.addresses).toHaveLength(1);
		expect(updated!.addresses[0].streetDetails).toBe("Second St");
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(deleteAddress("bad-id", 0)).rejects.toThrow("The provided ID bad-id is invalid.");
	});

	it("báo lỗi khi chỉ số vượt ngoài phạm vi", async () => {
		const user = await makeUser();
		await expect(deleteAddress(user._id.toString(), 99)).rejects.toThrow();
	});

	it("ném lỗi không tìm thấy khi người dùng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(deleteAddress(fakeId, 0)).rejects.toThrow();
	});
});

// ─── setDefaultAddress ────────────────────────────────────────────────────────

describe("Đặt địa chỉ mặc định - setDefaultAddress()", () => {
	const seedAddresses = async (userId: string) => {
		await updateProfile(userId, {
			addresses: [
				{ ...sampleAddress, streetDetails: "First St", isDefault: true },
				{ ...sampleAddress, streetDetails: "Second St", isDefault: false },
				{ ...sampleAddress, streetDetails: "Third St", isDefault: false },
			],
		});
	};

	it("đánh dấu địa chỉ tại vị trí chỉ định là mặc định", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await setDefaultAddress(user._id.toString(), 1);
		console.log(updated.addresses);

		expect(updated.addresses[1].isDefault).toBe(true);
	});

	it("bỏ isDefault trên tất cả các địa chỉ khác", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await setDefaultAddress(user._id.toString(), 2);
		const defaults = updated!.addresses.filter((a) => a.isDefault);

		expect(defaults).toHaveLength(1);
		expect(defaults[0].streetDetails).toBe("Third St");
	});

	it("địa chỉ mặc định trước đó không còn là mặc định nữa", async () => {
		const user = await makeUser();
		await seedAddresses(user._id.toString());

		const updated = await setDefaultAddress(user._id.toString(), 1);
		expect(updated.addresses[0].isDefault).toBe(false);
	});

	it("báo lỗi khi id không phải ObjectId hợp lệ", async () => {
		await expect(setDefaultAddress("bad-id", 0)).rejects.toThrow("The provided ID bad-id is invalid.");
	});

	it("báo lỗi khi chỉ số vượt ngoài phạm vi", async () => {
		const user = await makeUser();
		await expect(setDefaultAddress(user._id.toString(), 99)).rejects.toThrow();
	});

	it("ném lỗi không tìm thấy khi người dùng không tồn tại", async () => {
		const fakeId = new mongoose.Types.ObjectId().toString();
		await expect(setDefaultAddress(fakeId, 0)).rejects.toThrow();
	});
});
