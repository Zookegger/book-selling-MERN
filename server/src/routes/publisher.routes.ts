import { Router } from "express";
import * as publisherController from "@controllers/publisher.controller";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post("/", publisherController.createPublisher);
router.get("/", publisherController.listPublishers);
router.get("/:id", publisherController.getPublisher);
router.patch("/:id", publisherController.updatePublisher);
router.delete("/:id", publisherController.deletePublisher);

export default router;
