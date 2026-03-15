import { Router } from "express";
import * as publisherController from "@controllers/publisher.controller";

const router = Router();

router.post("/", publisherController.createPublisher);
router.get("/", publisherController.listPublishers);
router.get("/:id", publisherController.getPublisher);
router.patch("/:id", publisherController.updatePublisher);
router.delete("/:id", publisherController.deletePublisher);

export default router;
