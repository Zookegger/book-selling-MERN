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

const router = Router();

// Routes
router.post("/", bookController.createBook, errorHandler);
router.get("/", bookController.listBooks, errorHandler);
router.get("/:bookId", bookController.getBook, errorHandler);
router.put("/:bookId", bookController.replaceBook, errorHandler);
router.patch("/:bookId", bookController.updateBook, errorHandler);
router.delete("/:bookId", bookController.deleteBook, errorHandler);

router.post("/:bookId/formats", bookController.addFormat, errorHandler);
router.put("/:bookId/formats/:formatId", bookController.updateFormat, errorHandler);
router.delete("/:bookId/formats/:formatId", bookController.removeFormat, errorHandler);

export default router;
