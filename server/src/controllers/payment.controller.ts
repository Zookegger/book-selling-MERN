import { HttpError } from "@middleware/error.middleware";
import type { AuthRequest } from "@middleware/auth.middleware";
import { Order } from "@models";
import { handlePaymentCallback, initiatePayment, verifyPayment } from "@services/payment.services";
import { NextFunction, Request, Response } from "express";

export const createVNPayPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const { orderId, additionalData } = req.body as {
			orderId?: string;
			additionalData?: Record<string, unknown>;
		};

		if (!orderId) {
			return next(new HttpError("orderId is required", 400));
		}

		const order = await Order.findById(orderId).select("user paymentMethod").exec();
		if (!order || order.user.toString() !== userId) {
			return next(new HttpError("Order not found", 404));
		}

		if (order.paymentMethod !== "vnpay") {
			return next(new HttpError("Order payment method is not vnpay", 400));
		}

		const result = await initiatePayment({
			orderId,
			paymentMethodCode: "vnpay",
			additionalData,
		});

		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
};

/**
 * VNPay return (user redirect) handler.
 * Verifies the callback and processes the payment; then redirects the user to the client.
 * @param req - Express request (query contains VNPay fields)
 * @param res - Express response (redirects to client)
 */
export const VNPayReturn = async (req: Request, res: Response) => {
	// Extract raw callback data from query (VNPay returns via query string)
	const callbackData = req.query;
	const paymentMethodCode = "vnpay";

	try {
		// Verify signature/status with gateway
		const verificationResult = await verifyPayment({
			callbackData,
			paymentMethodCode,
		});

		console.log(`[VNPayReturn] Verification result:`, verificationResult);

		// Process payment update (completed/failed/expired)
		await handlePaymentCallback(verificationResult);

		// Redirect user to frontend with simple status param (adjust path as needed)
		const client_url = process.env.CLIENT_URL || "http://localhost";
		const client_port = process.env.CLIENT_PORT ? `:${process.env.CLIENT_PORT}` : "";
		const status = verificationResult.status === "paid" ? "success" : "failure";

		return res.redirect(`${client_url}${client_port}/payment-result?status=${status}`);
	} catch (err) {
		console.error("[VNPayReturn] Error handling return:", err);
		// On error, redirect to failure page
		const client_url = process.env.CLIENT_URL || "http://localhost";
		const client_port = process.env.CLIENT_PORT ? `:${process.env.CLIENT_PORT}` : "";
		return res.redirect(`${client_url}${client_port}/payment-result?status=error`);
	}
};

/**
 * VNPay IPN / server-to-server notification handler.
 * Verifies signature/status with gateway and processes the payment update.
 * Responds with plain 200 on success so VNPay considers the notification delivered.
 */
export const VNPayIPN = async (req: Request, res: Response) => {
	// VNPay may send GET or POST; accept both
	const callback_data = Object.keys(req.body).length ? req.body : req.query;
	const payment_method_code = "vnpay";

	try {
		// Verify incoming notification
		const verification_result = await verifyPayment({
			paymentMethodCode: payment_method_code,
			callbackData: callback_data,
		});

		// Handle payment update (will mark payment/order/tickets accordingly)
		await handlePaymentCallback(verification_result);

		return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
	} catch (err) {
		console.error("[VNPayIPN] Error handling IPN:", err);
		return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
	}
};
