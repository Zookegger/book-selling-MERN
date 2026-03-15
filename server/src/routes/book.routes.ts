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
import { bookServices } from "@services";
import { upload } from "@middleware/upload.middleware";

const router = Router();

const uploadFields = upload.fields([
	{ name: "coverImage", maxCount: 1 },
	{ name: "file", maxCount: 1 },
	{ name: "sampleFile", maxCount: 1 },
]);


// Routes
router.post("/", bookServices.createBook);
router.get("/", bookServices.listBooks);
router.get("/:bookId", bookServices.getBook);
router.put("/:bookId", bookServices.replaceBook);
router.patch("/:bookId", bookServices.updateBook);
router.delete("/:bookId", bookServices.deleteBook);

// router.post("/:bookId/formats", addFormat);
// router.put("/:bookId/formats/:formatId", updateFormat);
// router.delete("/:bookId/formats/:formatId", removeFormat);

export default router;
