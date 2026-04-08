import { Router } from "express";
import { body, param, query } from "express-validator";
import { authMiddleware } from "@middleware/auth.middleware";
import { adminMiddleware } from "@middleware/admin.middleware";
import { validateRequest } from "@middleware/validation.middleware";
import { errorHandler } from "@middleware/error.middleware";
import * as orderController from "@controllers/order.controller";

const orderRouter = Router();

orderRouter.get("/my", authMiddleware, orderController.getMyOrders, errorHandler);

orderRouter.get(
	"/admin",
	authMiddleware,
	adminMiddleware,
	[
		query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
		query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
		query("search").optional().isString().withMessage("Search must be a string"),
		query("status")
			.optional()
			.isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
			.withMessage("Invalid order status"),
		query("paymentStatus")
			.optional()
			.isIn(["pending", "paid", "failed", "refunded"])
			.withMessage("Invalid payment status"),
		query("paymentMethod").optional().isIn(["cod", "vnpay"]).withMessage("Invalid payment method"),
	],
	validateRequest,
	orderController.getAdminOrders,
	errorHandler,
);

orderRouter.get(
	"/admin/statistics",
	authMiddleware,
	adminMiddleware,
	orderController.getAdminOrderStatistics,
	errorHandler,
);

orderRouter.post(
	"/confirm",
	authMiddleware,
	[
		body("paymentMethod").optional().isIn(["cod", "vnpay"]).withMessage("Payment method must be cod or vnpay"),
		body("note").optional().isString().withMessage("Note must be a string"),
		body("couponCode").optional().isString().withMessage("Coupon code must be a string"),
		body("paymentDetails").optional().isObject().withMessage("Payment details must be an object"),
		body("paymentDetails.bankCode").optional().isString(),
		body("paymentDetails.ipAddress").optional().isString(),
		body("paymentDetails.locale").optional().isIn(["vn", "en"]).withMessage("Locale must be vn or en"),
		body("paymentDetails.orderInfo").optional().isString(),
		body("paymentDetails.returnUrl").optional().isString(),
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
		body("shippingAddress.streetDetails")
			.optional()
			.isString()
			.notEmpty()
			.withMessage("Street details is required"),
		body("shippingAddress.country").optional().isString(),
	],
	validateRequest,
	orderController.confirmOrder,
	errorHandler,
);

orderRouter.patch(
	"/:orderId/status",
	authMiddleware,
	adminMiddleware,
	[
		param("orderId").isMongoId().withMessage("Invalid order ID"),
		body("status")
			.isIn(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
			.withMessage("Invalid order status"),
	],
	validateRequest,
	orderController.updateOrderStatus,
	errorHandler,
);

export default orderRouter;
