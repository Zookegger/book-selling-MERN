import { Router } from "express";
import { body } from "express-validator";
import * as cartController from "@controllers/cart.controller";
import { authMiddleware } from "@middleware/auth.middleware";
import { validateRequest } from "@middleware/validation.middleware";
import { errorHandler } from "@middleware/error.middleware";

const cartRouter = Router();

cartRouter.get("/", authMiddleware, cartController.getCart, errorHandler);
cartRouter.get("/count", authMiddleware, cartController.getCartItemCount, errorHandler);

cartRouter.post(
	"/items",
	authMiddleware,
	[
		body("bookId").isMongoId().withMessage("Book ID must be a valid ObjectId"),
		body("selectedFormat")
			.isIn(["physical", "digital", "audiobook"])
			.withMessage("Selected format must be physical, digital, or audiobook"),
		body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be an integer greater than 0"),
	],
	validateRequest,
	cartController.addToCart,
	errorHandler,
);

cartRouter.patch(
	"/items",
	authMiddleware,
	[
		body("bookId").isMongoId().withMessage("Book ID must be a valid ObjectId"),
		body("selectedFormat")
			.isIn(["physical", "digital", "audiobook"])
			.withMessage("Selected format must be physical, digital, or audiobook"),
		body("quantity").isInt({ min: 1 }).withMessage("Quantity must be an integer greater than 0"),
	],
	validateRequest,
	cartController.updateCart,
	errorHandler,
);

cartRouter.delete(
	"/items",
	authMiddleware,
	[
		body("bookId").isMongoId().withMessage("Book ID must be a valid ObjectId"),
		body("selectedFormat")
			.isIn(["physical", "digital", "audiobook"])
			.withMessage("Selected format must be physical, digital, or audiobook"),
	],
	validateRequest,
	cartController.removeFromCart,
	errorHandler,
);

export default cartRouter;
