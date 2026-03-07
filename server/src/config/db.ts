import mongoose from "mongoose";

/**
 * Kết nối tới MongoDB bằng Mongoose.
 * - Đọc `MONGO_URI` từ biến môi trường.
 * - Nếu không có `MONGO_URI` sẽ ném lỗi.
 *
 * @throws {Error} khi `MONGO_URI` chưa được cấu hình.
 */
const connectDB = async (): Promise<void> => {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		throw new Error("MONGO_URI is not set");
	}

	await mongoose.connect(mongoUri);
};

export default connectDB;
