import { Router } from "express";
import { paymentController } from "@controllers";
import { authMiddleware } from "@middleware/auth.middleware";
import { errorHandler } from "@middleware/error.middleware";

const paymentRouter = Router();

/**
 * Initiate VNPay payment for an order. Requires authentication and order ownership.
 * Expects `orderId` and optional `additionalData` in the request body.
 * Returns payment URL or parameters for client to proceed with VNPay payment.
 */
paymentRouter.post("/vnpay/initiate", authMiddleware, paymentController.createVNPayPayment, errorHandler);

/**
 * VNPay return (user redirect). Accepts GET (VNPay redirects users with query params).
 */
paymentRouter.get("/vnpay/return", paymentController.VNPayReturn, errorHandler);

/**
 * VNPay server-to-server notification (IPN). Accept GET/POST depending on gateway config.
 */
paymentRouter.post("/vnpay/ipn", paymentController.VNPayIPN, errorHandler);

paymentRouter.get("/vnpay/ipn", paymentController.VNPayIPN, errorHandler);

export default paymentRouter;
