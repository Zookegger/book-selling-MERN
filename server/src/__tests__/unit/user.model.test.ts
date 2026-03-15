import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcrypt";
import UserModel from "@models/user.model";

describe("Mô hình người dùng (User Model)", () => {
	describe("Method: comparePassword", () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it("gọi bcrypt.compare với mật khẩu thô và mật khẩu đã lưu, trả về true khi khớp", async () => {
			const candidate = "plainPassword";
			const storedHash = await bcrypt.hash(candidate, 10);

			const userDoc = new UserModel({
				email: "test@example.com",
				firstName: "Nguyen",
				lastName: "An",
				password: storedHash,
			});

			const result = await userDoc.comparePassword(candidate);

			expect(result).toBe(true);
		});

		it("trả về false khi bcrypt.compare xác nhận mật khẩu không khớp", async () => {
			const storedHash = await bcrypt.hash("plainPassword", 10);

			const userDoc = new UserModel({
				email: "test@example.com",
				firstName: "Nguyen",
				lastName: "An",
				password: storedHash,
			});

			const result = await userDoc.comparePassword("wrongPassword");

			expect(result).toBe(false);
		});
	});

	describe('Middleware: pre("save") hook', () => {
		let mongoServer: MongoMemoryServer;

		beforeAll(async () => {
			mongoServer = await MongoMemoryServer.create();
			await mongoose.connect(mongoServer.getUri());
		});

		afterAll(async () => {
			await mongoose.disconnect();
			await mongoServer.stop();
		});

		afterEach(async () => {
			await UserModel.deleteMany({});
		});

		it("tự động băm mật khẩu thô trước khi lưu vào database", async () => {
			const rawPassword = "Password123!";
			const user = new UserModel({
				firstName: "Tran",
				lastName: "Binh",
				email: "binh@example.com",
				password: rawPassword,
			});

			// Giai đoạn 1: Lưu (Kích hoạt pre-save hook thật)
			await user.save();

			// Kiểm tra: Mật khẩu ĐÃ bị biến đổi thành hash
			expect(user.password).not.toBe(rawPassword);
			expect(user.password.startsWith("$2b$")).toBe(true);

			// Giai đoạn 2: So sánh (Kích hoạt method comparePassword thật)
			const isMatch = await user.comparePassword(rawPassword);
			const isWrong = await user.comparePassword("wrong_password");

			expect(isMatch).toBe(true);
			expect(isWrong).toBe(false);
		});

		it("không băm lại mật khẩu nếu trường password không bị chỉnh sửa", async () => {
			const rawPassword = "Password123!";
			const user = new UserModel({
				firstName: "Tran",
				lastName: "Binh",
				email: "binh@example.com",
				password: rawPassword,
			});

			await user.save();
			const firstHash = user.password;

			// Thay đổi trường khác
			user.firstName = "Chien";
			await user.save();

			// Hash không được thay đổi
			expect(user.password).toBe(firstHash);
		});

		it("trả về thông báo lỗi validate số điện thoại khi phoneNumber không hợp lệ", async () => {
			const user = new UserModel({
				firstName: "Tran",
				lastName: "Binh",
				email: "phone-check@example.com",
				password: "Password123!",
				addresses: [
					{
						recipientName: "Tran Binh",
						phoneNumber: "invalid-phone",
						provinceOrCity: "HCM",
						district: "District 1",
						ward: "Ben Nghe",
						streetDetails: "123 Street",
					},
				],
			});

			const err = user.validateSync();
			expect(err).toBeDefined();
			expect(err!.errors["addresses.0.phoneNumber"].message).toContain("is not a valid phone number");
		});

		it("toJSON thêm id và loại bỏ _id, __v", async () => {
			const user = new UserModel({
				firstName: "Json",
				lastName: "User",
				email: "json-user@example.com",
				password: "Password123!",
			});

			await user.save();

			const json = user.toJSON() as unknown as Record<string, unknown>;
			expect(json.id).toBeDefined();
			expect(json._id).toBeUndefined();
			expect(json.__v).toBeUndefined();
		});
	});
});
