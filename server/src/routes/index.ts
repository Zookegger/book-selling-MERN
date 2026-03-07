import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

/**
 * Root router của API:
 * - `GET /health` trả về trạng thái ứng dụng.
 * - Các route liên quan tới xác thực được mount tại `/auth`.
 */
const router = Router();

router.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/users", userRouter);

export default router;
