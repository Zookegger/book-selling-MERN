import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "@middleware/auth.middleware";
import { validateRequest } from "@middleware/validation.middleware";
import { errorHandler } from "@middleware/error.middleware";
import * as orderController from "@controllers/order.controller";

const orderRouter = Router();

orderRouter.get("/my", authMiddleware, orderController.getMyOrders, errorHandler);

orderRouter.post(
	"/confirm",
	authMiddleware,
	[
		body("paymentMethod")
			.optional()
			.isIn(["cod", "credit_card", "bank_transfer", "paypal"])
			.withMessage("Payment method must be cod, credit_card, bank_transfer, or paypal"),
		body("note").optional().isString().withMessage("Note must be a string"),
	],
	validateRequest,
	orderController.confirmOrder,
	errorHandler,
);

export default orderRouter;

