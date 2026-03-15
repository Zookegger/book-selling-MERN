import mongoose from "mongoose";
import { User } from "@models";
import type { IUser, IAddress, IUserRole } from "../models/user.model";
import { HttpError } from "@middleware/error.middleware";
import bcrypt from "bcrypt";
import {
	createUserSchema,
	updateProfileSchema,
	changePasswordSchema,
	addressSchema,
	updateAddressSchema,
	CreateUserInput,
	UpdateUserInput,
	UpdateProfileInput,
	ChangePasswordInput,
	UpdateAddressInput,
	AddAddressInput,
} from "@schemas/user.schema";

/**
 * Lấy thông tin người dùng theo id hoặc email.
 *
 * - Nếu `identifier` là ObjectId hợp lệ, tìm theo id và populate `digitalLibrary` và `wishList.book`.
 * - Nếu không, tìm theo trường `email` (chuyển về chữ thường).
 *
 * @param {string} identifier - ObjectId hoặc email người dùng.
 * @returns Promise chứa document người dùng nếu tìm được, ngược lại `null`.
 */
export const getUser = async (identifier: string) => {
	if (mongoose.Types.ObjectId.isValid(identifier)) {
		return User.findById(identifier).populate("digitalLibrary").populate("wishList.book").exec();
	}

	return User.findOne({ email: identifier.toLowerCase() })
		.populate("digitalLibrary")
		.populate("wishList.book")
		.exec();
};

/**
 * Tạo người dùng mới.
 *
 * - Validate dữ liệu đầu vào bằng `createUserSchema`.
 * - Kiểm tra email đã tồn tại hay chưa.
 * - Tạo và lưu người dùng mới (mật khẩu được hash bởi hook pre-save của Mongoose).
 * - Trả về document người dùng vừa tạo.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError|Error} 409 khi email đã được sử dụng.
 * @returns Người dùng vừa tạo.
 */
export const addUser = async (dto: CreateUserInput): Promise<IUser> => {
	const parsed = createUserSchema.safeParse(dto);
	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(messages, 400);
	}

	const email = parsed.data.email;
	const existing = await User.findOne({ email }).exec();
	if (existing) throw new Error("Email already in use");

	const user = new User({ ...parsed.data, email });
	await user.save();
	return user;
};

/**
 * Xóa người dùng theo id.
 *
 * - Kiểm tra `id` có phải ObjectId hợp lệ hay không.
 * - Gọi `findByIdAndDelete` để xóa.
 *
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @returns Document người dùng đã xóa hoặc `null` nếu không tìm thấy.
 */
export const removeUser = async (id: string): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}
	const user = await User.findByIdAndDelete(id).exec();

	if (!user) throw new HttpError("User not found", 404);

	return user;
};

/**
 * Cập nhật người dùng bằng `findByIdAndUpdate`.
 *
 * - Kiểm tra `id` hợp lệ.
 * - Thực hiện cập nhật với `runValidators` để đảm bảo tính hợp lệ của dữ liệu.
 *
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @returns Người dùng sau khi cập nhật (nếu có).
 */
export const updateUser = async (id: string, dto: UpdateUserInput): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const user = await User.findByIdAndUpdate(id, dto, { returnDocument: "after", runValidators: true }).exec();

	if (!user) throw new HttpError("User not found", 404);

	return user;
};

/**
 * Cập nhật profile người dùng.
 *
 * - Validate `profile` bằng `updateProfileSchema`.
 * - Chuẩn hoá `addresses` (sao cho chỉ có một `isDefault`).
 * - Gọi `findByIdAndUpdate` để cập nhật và trả về document sau cập nhật.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @returns Người dùng sau khi cập nhật.
 */
export const updateProfile = async (id: string, profile: UpdateProfileInput): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const parsed = updateProfileSchema.safeParse(profile);
	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(messages, 400);
	}

	const cleanProfile = parsed.data as Partial<IUser>;

	if (cleanProfile.email) {
		const existingUser = await User.findOne({
			email: cleanProfile.email,
			_id: { $ne: id },
		});
		if (existingUser) {
			throw new HttpError("Email is already in use by another account", 409);
		}
	}

	if (Array.isArray(cleanProfile.addresses)) {
		const addresses: IAddress[] = cleanProfile.addresses.map((a: IAddress) => ({ ...a }));
		const defaultIndex = addresses.findIndex((a: IAddress) => a.isDefault);
		if (defaultIndex !== -1) {
			addresses.forEach((a: IAddress, idx: number) => (a.isDefault = idx === defaultIndex));
		}
		cleanProfile.addresses = addresses;
	}

	const user = await User.findByIdAndUpdate(
		id,
		{ $set: cleanProfile },
		{ returnDocument: "after", runValidators: true },
	).exec();

	if (!user) throw new HttpError("User not found", 404);

	return user;
};

/**
 * Đổi mật khẩu cho người dùng.
 *
 * - Validate `currentPassword` và `newPassword` bằng `changePasswordSchema`.
 * - Kiểm tra `id` hợp lệ và tìm user.
 * - So khớp mật khẩu hiện tại rồi hash mật khẩu mới và lưu.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {HttpError} 403 khi mật khẩu hiện tại không đúng.
 * @throws {HttpError} 404 khi không tìm thấy user.
 * @returns Người dùng sau khi đổi mật khẩu.
 */
export const changePassword = async (id: string, dto: ChangePasswordInput): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const parsed = changePasswordSchema.safeParse(dto);
	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(messages, 400);
	}

	const user = await User.findById(id);

	if (!user) throw new HttpError("User not found", 404);

	const isMatch = await user.comparePassword(parsed.data.currentPassword);
	if (!isMatch) {
		throw new HttpError("Password is invalid", 403);
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(parsed.data.newPassword, salt);

	const updatedUser = await User.findByIdAndUpdate(
		id,
		{ password: hashedPassword },
		{ returnDocument: "after", runValidators: true },
	).exec();

	if (!updatedUser) throw new HttpError("User not found after update", 404);
	return updatedUser;
};

/**
 * Thêm địa chỉ cho người dùng.
 *
 * - Validate `address` bằng `addressSchema`.
 * - Nếu `isDefault` được đặt, reset `isDefault` cho các địa chỉ khác.
 * - Thêm địa chỉ vào mảng `addresses` và lưu người dùng.
 *
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @throws {HttpError} 404 khi không tìm thấy user.
 * @returns Người dùng sau khi thêm địa chỉ.
 */
export const addAddress = async (id: string, address: AddAddressInput): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const parsed = addressSchema.safeParse(address);
	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(messages, 400);
	}

	const user = await User.findById(id);

	if (!user) throw new HttpError("User not found", 404);

	if (parsed.data.isDefault) {
		user.addresses.forEach((address) => {
			address.isDefault = false;
		});
	}

	user.addresses.push(parsed.data);

	await user.save();

	return user;
};

/**
 * Cập nhật địa chỉ của người dùng theo chỉ số trong mảng `addresses`.
 *
 * - Validate `updates` bằng `updateAddressSchema`.
 * - Kiểm tra `index` hợp lệ.
 * - Nếu `isDefault` được đặt trong `updates`, reset `isDefault` cho các địa chỉ khác.
 * - Cập nhật trực tiếp subdocument (không thay thế bằng plain object) và lưu user.
 *
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @throws {HttpError} 400 khi dữ liệu không hợp lệ.
 * @throws {RangeError} khi `index` vượt quá phạm vi.
 * @throws {HttpError} 404 khi không tìm thấy user.
 * @returns Người dùng sau khi cập nhật địa chỉ.
 */
export const updateAddress = async (id: string, index: number, updates: UpdateAddressInput): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const parsed = updateAddressSchema.safeParse(updates);
	if (!parsed.success) {
		const messages = parsed.error.issues.map((i) => i.message).join(", ");
		throw new HttpError(messages, 400);
	}

	const user = await User.findById(id);

	if (!user) throw new HttpError("User not found", 404);

	if (index < 0 || index >= user.addresses.length) throw new RangeError("Index out of range");

	if (parsed.data.isDefault) {
		user.addresses.forEach((address) => {
			address.isDefault = false;
		});
	}

	Object.assign(user.addresses[index], parsed.data);

	await user.save();
	return user;
};

/**
 * Xóa địa chỉ theo chỉ số khỏi user.
 *
 * - Kiểm tra `id` hợp lệ và `index` nằm trong phạm vi.
 * - Xóa phần tử khỏi `addresses` và lưu người dùng.
 *
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @throws {RangeError} khi `index` vượt quá phạm vi.
 * @throws {HttpError} 404 khi không tìm thấy user.
 * @returns Người dùng sau khi xóa địa chỉ.
 */
export const deleteAddress = async (id: string, index: number): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const user = await User.findById(id);

	if (!user) throw new HttpError("User not found", 404);

	if (index < 0 || index >= user.addresses.length) throw new RangeError("Index out of range");

	user.addresses.splice(index, 1);

	await user.save();

	return user;
};

/**
 * Đặt một địa chỉ là mặc định theo chỉ số.
 *
 * - Kiểm tra `id` hợp lệ và `index` nằm trong phạm vi.
 * - Cập nhật flag `isDefault` cho từng địa chỉ.
 *
 * @throws {mongoose.Error.CastError} khi `id` không hợp lệ.
 * @throws {RangeError} khi `index` vượt quá phạm vi.
 * @throws {HttpError} 404 khi không tìm thấy user.
 * @returns Người dùng sau khi cập nhật địa chỉ mặc định.
 */
export const setDefaultAddress = async (id: string, index: number): Promise<IUser> => {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new mongoose.Error.CastError("ObjectId", id, "id");
		error.message = `The provided ID ${id} is invalid.`;
		throw error;
	}

	const user = await User.findById(id);

	if (!user) throw new HttpError("User not found", 404);

	if (index < 0 || index >= user.addresses.length) throw new RangeError("Index out of range");

	user.addresses.forEach((address, i) => {
		address.isDefault = i === index;
	});

	await user.save();

	return user;
};
