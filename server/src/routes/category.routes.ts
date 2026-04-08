import { Router } from "express";
import * as categoryController from "@controllers/category.controller";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";

const router = Router();

// Các route cho danh mục
router.get("/", categoryController.listCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/:id", categoryController.getCategory);

// Thêm middleware vào trước controller để bảo vệ các route yêu cầu xác thực
router.post("/", authMiddleware, adminMiddleware, categoryController.createCategory);
router.patch("/:id", authMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, categoryController.deleteCategory);

export default router;
