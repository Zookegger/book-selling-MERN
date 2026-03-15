import { Router } from "express";
import * as authorController from "@controllers/author.controller";

const router = Router();

router.post("/", authorController.createAuthor);
router.get("/", authorController.listAuthors);
router.get("/:id", authorController.getAuthor);
router.patch("/:id", authorController.updateAuthor);
router.delete("/:id", authorController.deleteAuthor);

export default router;
