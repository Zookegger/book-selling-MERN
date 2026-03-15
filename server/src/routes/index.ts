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

import authorRouter from "./author.routes";
import publisherRouter from "./publisher.routes";
import categoryRouter from "./category.routes";

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/authors", authorRouter);
router.use("/publishers", publisherRouter);
router.use("/categories", categoryRouter);

export default router;
