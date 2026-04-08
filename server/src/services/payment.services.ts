import mongoose, { type ClientSession } from "mongoose";
import { HttpError } from "@middleware/error.middleware";
import { Order, Payment } from "@models";
import type { PaymentMethod, PaymentStatus, OrderStatus, IOrder } from "@models/order.model";
import type { IPayment } from "@models/payment.model";

export interface GatewayRefundOptions {
	amount?: number;
	originalGatewayTxnId?: string;
	reason?: string;
	ipAddress?: string;
	performedBy?: string;
}

export interface InitiatePaymentDTO {
	orderId: string;
	paymentMethodCode: PaymentMethod;
	additionalData?: Record<string, unknown>;
}

export interface PaymentCallbackDTO {
	paymentMethodCode: string;
	callbackData: Record<string, unknown>;
}

export interface PaymentVerificationResult {
	status: PaymentStatus;
	merchantOrderRef: string;
	gatewayTransactionNo?: string;
	gatewayResponseData?: Record<string, unknown>;
	orderId?: string;
	paymentId?: string;
	paymentMethodCode?: string;
}

export interface PaymentRefundDTO {
	paymentId: string;
	amount?: number;
	reason?: string;
	ipAddress?: string;
	performedBy?: string;
}

export interface PaymentRefundResult {
	isSuccess: boolean;
	transactionId?: string;
	gatewayResponseData?: Record<string, unknown>;
	message?: string;
}

export interface PaymentResponseDTO {
	id: string;
	orderId: string;
	userId: string;
	method: PaymentMethod;
	status: PaymentStatus;
	amount: number;
	currency: string;
	provider?: string;
	transactionId?: string;
	metadata: Record<string, unknown>;
	paidAt?: string;
	failedAt?: string;
	refundedAt?: string;
	createdAt: string;
	updatedAt: string;
	merchantOrderRef?: string;
}

export interface CleanupConfig {
	expiryThresholdMinutes?: number;
	batchSize?: number;
	dryRun?: boolean;
}

export interface CleanupResult {
	expiredPayments: number;
	cancelledOrders: number;
	errors: number;
}

export interface IPaymentGateway {
	createPaymentUrl(payment: IPayment, order: IOrder, config: any, additionalData?: any): Promise<string>;
	verifyCallback(data: any, config: any): Promise<PaymentVerificationResult>;
	refundPayment?(payment: IPayment, config: any, options: GatewayRefundOptions): Promise<PaymentRefundResult>;
	getName(): string;
}

class PaymentGatewayRegistry {
	private gateways = new Map<string, IPaymentGateway>();

	register(code: string, gateway: IPaymentGateway): void {
		this.gateways.set(code.toLowerCase(), gateway);
	}

	get(code: string): IPaymentGateway | undefined {
		return this.gateways.get(code.toLowerCase());
	}

	has(code: string): boolean {
		return this.gateways.has(code.toLowerCase());
	}

	list(): string[] {
		return Array.from(this.gateways.keys());
	}
}

const gatewayRegistry = new PaymentGatewayRegistry();

const ACTIVE_PAYMENT_STATES: PaymentStatus[] = ["pending"];
const FINISHED_PAYMENT_STATES: PaymentStatus[] = ["paid", "failed", "refunded"];

const toObjectId = (value: string, label: string): mongoose.Types.ObjectId => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw new HttpError(`Invalid ${label}`, 400);
	}

	return new mongoose.Types.ObjectId(value);
};

const createMerchantOrderRef = (): string => `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;

const normalizePaymentStatus = (value: unknown): PaymentStatus => {
	const normalized = String(value ?? "").toLowerCase();

	if (normalized === "paid" || normalized === "completed" || normalized === "success" || normalized === "successful") {
		return "paid";
	}

	if (normalized === "refunded") return "refunded";
	if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled" || normalized === "expired") {
		return "failed";
	}

	return "pending";
};

const buildPaymentResponse = (payment: IPayment & { _id: mongoose.Types.ObjectId }): PaymentResponseDTO => {
	const metadata = (payment.metadata ?? {}) as Record<string, unknown>;
	const merchantOrderRef = typeof metadata.merchantOrderRef === "string" ? metadata.merchantOrderRef : undefined;

	return {
		id: payment._id.toString(),
		orderId: payment.order.toString(),
		userId: payment.user.toString(),
		method: payment.method,
		status: payment.status,
		amount: Number(payment.amount),
		currency: payment.currency,
		provider: payment.provider,
		transactionId: payment.transactionId,
		metadata,
		paidAt: payment.paidAt?.toISOString(),
		failedAt: payment.failedAt?.toISOString(),
		refundedAt: payment.refundedAt?.toISOString(),
		createdAt: payment.createdAt.toISOString(),
		updatedAt: payment.updatedAt.toISOString(),
		merchantOrderRef,
	};
};

const getPaymentLookupQuery = (value: string) => ({
	$or: [
		{ "metadata.merchantOrderRef": value },
		{ transactionId: value },
		{ "metadata.transactionId": value },
	],
});

export const registerPaymentGateway = (code: string, gateway: IPaymentGateway): void => {
	gatewayRegistry.register(code, gateway);
};

export const isGatewayRegistered = (code: string): boolean => gatewayRegistry.has(code);

export const listRegisteredGateways = (): string[] => gatewayRegistry.list();

export const initiatePayment = async (
	dto: InitiatePaymentDTO,
	session?: ClientSession,
): Promise<{ paymentUrl: string; payment: PaymentResponseDTO }> => {
	const { orderId, paymentMethodCode, additionalData } = dto;
	const orderObjectId = toObjectId(orderId, "order ID");

	const order = await Order.findById(orderObjectId).session(session ?? null).exec();
	if (!order) {
		throw new HttpError("Order not found", 404);
	}

	const gateway = gatewayRegistry.get(paymentMethodCode);
	if (!gateway) {
		throw new HttpError(`No gateway handler registered for ${paymentMethodCode}`, 400);
	}

	let payment = await Payment.findOne({ order: orderObjectId }).session(session ?? null).exec();
	const paymentMethod = paymentMethodCode;
	const merchantOrderRef = createMerchantOrderRef();
	const paymentMetadata = {
		merchantOrderRef,
		additionalData: additionalData ?? {},
	};

	if (!payment) {
		payment = new Payment({
			order: orderObjectId,
			user: order.user,
			method: paymentMethod,
			status: "pending",
			amount: order.totalAmount,
			currency: "VND",
			provider: gateway.getName(),
			metadata: paymentMetadata,
		});
	} else {
		if (payment.status === "paid") {
			throw new HttpError("This order has already been paid", 409);
		}

		payment.method = paymentMethod;
		payment.status = "pending";
		payment.amount = order.totalAmount;
		payment.currency = payment.currency ?? "VND";
		payment.provider = gateway.getName();
		payment.metadata = {
			...(payment.metadata ?? {}),
			...paymentMetadata,
		};
		payment.paidAt = undefined;
		payment.failedAt = undefined;
		payment.refundedAt = undefined;
	}

	if (session) {
		await payment.save({ session });
	} else {
		await payment.save();
	}

	const paymentUrl = await gateway.createPaymentUrl(payment, order, {}, additionalData);
	if (!paymentUrl) {
		throw new HttpError("Failed to generate payment url", 500);
	}

	return {
		paymentUrl,
		payment: buildPaymentResponse(payment),
	};
};

export const getPaymentById = async (paymentId: string): Promise<PaymentResponseDTO | null> => {
	if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;

	const payment = await Payment.findById(paymentId).exec();
	return payment ? buildPaymentResponse(payment as IPayment & { _id: mongoose.Types.ObjectId }) : null;
};

export const verifyPayment = async (dto: PaymentCallbackDTO): Promise<PaymentVerificationResult> => {
	const { paymentMethodCode, callbackData } = dto;
	const gateway = gatewayRegistry.get(paymentMethodCode);
	if (!gateway) {
		throw new HttpError(`No gateway handler registered for ${paymentMethodCode}`, 400);
	}

	console.log(`[${new Date().toISOString()}] Verifying payment callback for method ${paymentMethodCode} with data:`, callbackData);

	// Call gateway verification and log the raw result for diagnostics
	const verification = await gateway.verifyCallback(callbackData as any, {});
	console.log(`[${new Date().toISOString()}] Verification result from gateway (${paymentMethodCode}):`, verification);
	return verification;
};

export const handlePaymentCallback = async (verificationResult: PaymentVerificationResult): Promise<IPayment | null> => {
	const merchantOrderRef = verificationResult.merchantOrderRef?.trim();
	if (!merchantOrderRef) {
		console.error(`[${new Date().toISOString()}] Missing merchantOrderRef in verification result:`, verificationResult);
		throw new HttpError("Merchant order reference is required", 400);
	}
	console.log(`[${new Date().toISOString()}] Looking up payment using merchantOrderRef: ${merchantOrderRef}`);
	const payment = await Payment.findOne(getPaymentLookupQuery(merchantOrderRef)).exec();
	if (!payment) {
		console.error(`[${new Date().toISOString()}] No payment found for merchantOrderRef: ${merchantOrderRef}`);
		console.error("Verification result:", verificationResult);
		return null;
	}
	if (!payment) {
		return null;
	}

	console.log(`[${new Date().toISOString()}] Handling payment callback for merchantOrderRef ${merchantOrderRef}. Current payment status: ${payment.status}, verification result status: ${verificationResult.status}`);

	const nextStatus = normalizePaymentStatus(verificationResult.status);
	const nextMetadata = {
		...(payment.metadata ?? {}),
		...(verificationResult.gatewayResponseData ?? {}),
		merchantOrderRef,
	};

	console.log(`[${new Date().toISOString()}] Updating payment ${payment._id.toString()} status from ${payment.status} to ${nextStatus}`);
	payment.status = nextStatus;
	payment.metadata = nextMetadata;

	if (verificationResult.gatewayTransactionNo) {
		payment.transactionId = verificationResult.gatewayTransactionNo;
	}

	if (nextStatus === "paid") {
		payment.paidAt = payment.paidAt ?? new Date();
		payment.failedAt = undefined;
		payment.refundedAt = undefined;
	} else if (nextStatus === "failed") {
		payment.failedAt = payment.failedAt ?? new Date();
	} else if (nextStatus === "refunded") {
		payment.refundedAt = payment.refundedAt ?? new Date();
	}

	await payment.save();

	const order = await Order.findById(payment.order).exec();
	if (!order) {
		return payment;
	}

	if (nextStatus === "paid") {
		order.paymentStatus = "paid";
		if (order.status === "pending") {
			order.status = "confirmed";
		}
	} else if (nextStatus === "failed") {
		order.paymentStatus = "failed";
		order.status = "cancelled" as OrderStatus;
		order.cancelledAt = order.cancelledAt ?? new Date();
	} else if (nextStatus === "refunded") {
		order.paymentStatus = "refunded";
		order.status = "refunded" as OrderStatus;
	}

	await order.save();
	return payment;
};

export const getPaymentByMerchantOrderRef = async (merchantOrderRef: string): Promise<IPayment | null> => {
	return Payment.findOne(getPaymentLookupQuery(merchantOrderRef)).exec();
};

export const processRefund = async (dto: PaymentRefundDTO, session?: ClientSession): Promise<PaymentRefundResult> => {
	const payment = await Payment.findById(dto.paymentId).session(session ?? null).exec();
	if (!payment) {
		throw new HttpError(`Payment with ID ${dto.paymentId} not found`, 404);
	}

	if (payment.status !== "paid") {
		throw new HttpError("Cannot refund a payment that is not paid", 400);
	}

	const gateway = gatewayRegistry.get(payment.method);
	const gatewaySupportsRefunds = gateway && typeof gateway.refundPayment === "function";

	if (gatewaySupportsRefunds) {
		const refundResult = await gateway!.refundPayment!(payment, {}, {
			amount: dto.amount,
			reason: dto.reason,
			ipAddress: dto.ipAddress,
			performedBy: dto.performedBy,
			originalGatewayTxnId: payment.transactionId,
		});

		if (!refundResult.isSuccess) {
			throw new HttpError(refundResult.message || "Gateway refund failed", 400);
		}

		payment.status = "refunded";
		payment.refundedAt = new Date();
		await payment.save({ session: session ?? undefined });

		const order = await Order.findById(payment.order).session(session ?? null).exec();
		if (order) {
			order.paymentStatus = "refunded";
			order.status = "refunded" as OrderStatus;
			await order.save({ session: session ?? undefined });
		}

		return refundResult;
	}

	payment.status = "refunded";
	payment.refundedAt = new Date();
	await payment.save({ session: session ?? undefined });

	const order = await Order.findById(payment.order).session(session ?? null).exec();
	if (order) {
		order.paymentStatus = "refunded";
		order.status = "refunded" as OrderStatus;
		await order.save({ session: session ?? undefined });
	}

	return {
		isSuccess: true,
		transactionId: payment.transactionId,
		gatewayResponseData: {
			message: "Refund processed locally.",
		},
	};
};

export const cleanupExpiredPayments = async (config: CleanupConfig = {}): Promise<CleanupResult> => {
	const { expiryThresholdMinutes = 30, batchSize = 100, dryRun = false } = config;
	const cutoff = new Date(Date.now() - expiryThresholdMinutes * 60 * 1000);

	const expiredPayments = await Payment.find({
		status: { $in: ACTIVE_PAYMENT_STATES },
		createdAt: { $lt: cutoff },
	})
		.limit(batchSize)
		.exec();

	const result: CleanupResult = {
		expiredPayments: expiredPayments.length,
		cancelledOrders: 0,
		errors: 0,
	};

	if (dryRun) {
		return result;
	}

	for (const payment of expiredPayments) {
		try {
			payment.status = "failed";
			payment.failedAt = payment.failedAt ?? new Date();
			await payment.save();

			const order = await Order.findById(payment.order).exec();
			if (order && FINISHED_PAYMENT_STATES.includes(order.paymentStatus) === false) {
				order.paymentStatus = "failed";
				order.status = "cancelled" as OrderStatus;
				order.cancelledAt = order.cancelledAt ?? new Date();
				await order.save();
				result.cancelledOrders += 1;
			}
		} catch (error) {
			result.errors += 1;
		}
	}

	return result;
};
