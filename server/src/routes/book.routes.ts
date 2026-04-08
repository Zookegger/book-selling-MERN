/**
 * Method	Endpoint	Description
 * POST	/api/books	Create a new book (with formats)
 * GET	/api/books	List all books (with pagination)
 * GET	/api/books/:bookId	Get a single book by ID
 * PUT	/api/books/:bookId	Fully update a book
 * PATCH	/api/books/:bookId	Partially update a book
 * DELETE	/api/books/:bookId	Delete a book
 * POST	/api/books/:bookId/formats	Add a new format to an existing book
 * PUT	/api/books/:bookId/formats/:formatId	Update a specific format
 * DELETE	/api/books/:bookId/formats/:formatId	Remove a format
 */
import { Router } from "express";
import * as bookController from "@controllers/book.controller";
import { errorHandler } from "@middleware/error.middleware";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";

const router = Router();

// Routes
router.get("/", bookController.listBooks, errorHandler);
router.get("/:bookId", bookController.getBook, errorHandler);
router.post("/", authMiddleware, adminMiddleware, bookController.createBook, errorHandler);
router.put("/:bookId", authMiddleware, adminMiddleware, bookController.replaceBook, errorHandler);
router.patch("/:bookId", authMiddleware, adminMiddleware, bookController.updateBook, errorHandler);
router.delete("/:bookId", authMiddleware, adminMiddleware, bookController.deleteBook, errorHandler);

router.post("/:bookId/formats", authMiddleware, adminMiddleware, bookController.addFormat, errorHandler);
router.put("/:bookId/formats/:formatId", authMiddleware, adminMiddleware, bookController.updateFormat, errorHandler);
router.delete("/:bookId/formats/:formatId", authMiddleware, adminMiddleware, bookController.removeFormat, errorHandler);

export default router;
