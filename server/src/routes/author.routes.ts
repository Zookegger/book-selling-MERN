import { Router } from "express";
import * as authorController from "@controllers/author.controller";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";

const router = Router();

router.get("/", authorController.listAuthors);
router.get("/:id", authorController.getAuthor);

router.post("/", authMiddleware, adminMiddleware, authorController.createAuthor);
router.patch("/:id", authMiddleware, adminMiddleware, authorController.updateAuthor);
router.delete("/:id", authMiddleware, adminMiddleware, authorController.deleteAuthor);

export default router;
