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
import bookRouter from "./book.routes";
import publisherRouter from "./publisher.routes";
import categoryRouter from "./category.routes";
import cartRouter from "./cart.routes";
import orderRouter from "./order.routes";
import wishlistRouter from "./wishlist.route";


router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/books", bookRouter);
router.use("/authors", authorRouter);
router.use("/publishers", publisherRouter);
router.use("/categories", categoryRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/wishlist", wishlistRouter);

export default router;
