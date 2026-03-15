import mongoose from "mongoose";
import connectDB from "@config/db";

describe("connectDB", () => {
	const originalMongoUri = process.env.MONGO_URI;

	afterEach(() => {
		jest.restoreAllMocks();
		if (originalMongoUri !== undefined) {
			process.env.MONGO_URI = originalMongoUri;
		} else {
			delete process.env.MONGO_URI;
		}
	});

	it("throws when MONGO_URI is not set", async () => {
		delete process.env.MONGO_URI;

		await expect(connectDB()).rejects.toThrow("MONGO_URI is not set");
	});

	it("connects using mongoose.connect when MONGO_URI exists", async () => {
		process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test-db";
		const connectSpy = jest.spyOn(mongoose, "connect").mockResolvedValue(mongoose as never);

		await connectDB();

		expect(connectSpy).toHaveBeenCalledWith("mongodb://127.0.0.1:27017/test-db");
	});
});
