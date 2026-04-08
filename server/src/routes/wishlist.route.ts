import { Router } from "express";
import * as wishlistController from "@controllers/wishlist.controller";

// 1. Dùng đúng tên authMiddleware mà dự án của bạn đang dùng
import { authMiddleware } from "@middleware/auth.middleware"; 

const router = Router();

// 2. Gắn authMiddleware vào để chặn những ai chưa đăng nhập
router.use(authMiddleware); 

router.get("/", wishlistController.getMyWishlist);
router.post("/", wishlistController.toggleWishlist);
router.delete("/:bookId", wishlistController.deleteFromWishlist);

export default router;