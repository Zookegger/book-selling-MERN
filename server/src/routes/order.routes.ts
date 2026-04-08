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
		body("couponCode").optional().isString().withMessage("Coupon code must be a string"),
		body("shippingAddress").optional().isObject().withMessage("Shipping address must be an object"),
		body("shippingAddress.recipientName")
			.optional()
			.isString()
			.notEmpty()
			.withMessage("Recipient name is required"),
		body("shippingAddress.phoneNumber").optional().isString().notEmpty().withMessage("Phone number is required"),
		body("shippingAddress.provinceOrCity")
			.optional()
			.isString()
			.notEmpty()
			.withMessage("Province/City is required"),
		body("shippingAddress.district").optional().isString().notEmpty().withMessage("District is required"),
		body("shippingAddress.ward").optional().isString().notEmpty().withMessage("Ward is required"),
		body("shippingAddress.streetDetails").optional().isString().notEmpty().withMessage("Street details is required"),
		body("shippingAddress.country").optional().isString(),
	],
	validateRequest,
	orderController.confirmOrder,
	errorHandler,
);

export default orderRouter;

