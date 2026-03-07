import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import { initializeAuth } from "@middleware/auth.middleware";

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

const start = async (): Promise<void> => {
	try {
		await connectDB();
		app.listen(port, () => {
			console.log(`Server Running on port ${port}`);
		});

		initializeAuth();
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

start();
