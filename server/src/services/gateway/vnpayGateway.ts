import crypto from "crypto";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { IOrder } from "@models/order.model";
import type { IPayment } from "@models/payment.model";
import type {
	GatewayRefundOptions,
	IPaymentGateway,
	PaymentRefundResult,
	PaymentVerificationResult,
} from "@services/payment.services";

interface VNPayConfig {
	VNP_TMN_CODE: string;
	VNP_HASH_SECRET: string;
	VNP_URL: string;
	VNP_RETURN_URL: string;
	VNP_ORDER_TYPE?: string;
	VNP_LOCALE?: "vn" | "en";
}

interface VNPayAdditionalData {
	orderInfo?: string;
	locale?: "vn" | "en";
	ipAddress?: string;
	bankCode?: string;
	expireDate?: string;
	returnUrl?: string;
}

interface VNPayParams {
	vnp_Version: "2.1.0";
	vnp_Command: "pay";
	vnp_TmnCode: string;
	vnp_Amount: number;
	vnp_CurrCode: "VND" | "USD";
	vnp_TxnRef: string;
	vnp_OrderInfo: string;
	vnp_OrderType: string;
	vnp_ReturnUrl: string;
	vnp_IpAddr: string;
	vnp_CreateDate: string;
	vnp_Locale?: "vn" | "en";
	vnp_BankCode?: string;
	vnp_ExpireDate?: string;
}

type VNPayBaseParams = VNPayParams;

const stringifyAndSortParams = (params: object): string => {
	const entries = Object.entries(params as Record<string, unknown>)
		.filter(([_, value]) => value !== undefined && value !== null && value !== "")
		.map(([key, value]) => [key, String(value)] as [string, string]);

	entries.sort(([key1], [key2]) => {
		if (key1 > key2) return 1;
		if (key1 < key2) return -1;
		return 0;
	});

	return entries
		.map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
		.join("&");
};

const calculateSecureHash = (queryString: string, secret: string): string => {
	return crypto.createHmac("sha512", secret).update(Buffer.from(queryString, "utf-8")).digest("hex");
};

const sanitizeEndpoint = (endpoint: string): string => endpoint.replace(/\/$/, "");

const getVietnamTime = (): Date => toZonedTime(new Date(), "Asia/Ho_Chi_Minh");

export class VNPayGateway implements IPaymentGateway {
	private readonly config: VNPayConfig;

	constructor(config?: Partial<VNPayConfig>) {
		this.config = {
			VNP_TMN_CODE: config?.VNP_TMN_CODE ?? process.env.VNP_TMN_CODE ?? "",
			VNP_HASH_SECRET: config?.VNP_HASH_SECRET ?? process.env.VNP_HASH_SECRET ?? "",
			VNP_URL: config?.VNP_URL ?? process.env.VNP_URL ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
			VNP_RETURN_URL: config?.VNP_RETURN_URL ?? process.env.VNP_RETURN_URL ?? "",
			VNP_ORDER_TYPE: config?.VNP_ORDER_TYPE ?? process.env.VNP_ORDER_TYPE ?? "other",
			VNP_LOCALE: (config?.VNP_LOCALE ?? process.env.VNP_LOCALE ?? "vn") as "vn" | "en",
		};
	}

	getName(): string {
		return "vnpay";
	}

	async createPaymentUrl(
		payment: IPayment,
		order: IOrder,
		_config: unknown,
		additionalData?: VNPayAdditionalData,
	): Promise<string> {
		if (!this.config.VNP_TMN_CODE || !this.config.VNP_HASH_SECRET || !this.config.VNP_RETURN_URL) {
			throw new Error("VNPay configuration is missing. Please set VNP_TMN_CODE, VNP_HASH_SECRET and VNP_RETURN_URL.");
		}

		const merchantOrderRef =
			typeof payment.metadata?.merchantOrderRef === "string" ? payment.metadata.merchantOrderRef : payment._id.toString();

		const createDate = format(getVietnamTime(), "yyyyMMddHHmmss");
        const usd = payment.amount;
        const amount = usd * 24000;

		const baseParams: VNPayBaseParams = {
			vnp_Version: "2.1.0",
			vnp_Command: "pay",
			vnp_TmnCode: this.config.VNP_TMN_CODE,
			vnp_Amount: Math.round(amount * 100),
			vnp_CurrCode: "VND",
			vnp_TxnRef: merchantOrderRef,
			vnp_OrderInfo: additionalData?.orderInfo || `Payment for order ${order._id.toString()}`,
			vnp_OrderType: this.config.VNP_ORDER_TYPE || "other",
			vnp_ReturnUrl: additionalData?.returnUrl || this.config.VNP_RETURN_URL,
			vnp_IpAddr:
				additionalData?.ipAddress && additionalData.ipAddress !== "::1" ? additionalData.ipAddress : "127.0.0.1",
			vnp_CreateDate: createDate,
		};

		if (additionalData?.locale || this.config.VNP_LOCALE) {
			baseParams.vnp_Locale = (additionalData?.locale || this.config.VNP_LOCALE || "vn") as "vn" | "en";
		}
		if (additionalData?.bankCode) {
			baseParams.vnp_BankCode = additionalData.bankCode;
		}
		if (additionalData?.expireDate) {
			baseParams.vnp_ExpireDate = additionalData.expireDate;
		}

		const queryString = stringifyAndSortParams(baseParams);
		const signature = calculateSecureHash(queryString, this.config.VNP_HASH_SECRET);

		return `${sanitizeEndpoint(this.config.VNP_URL)}?${queryString}&vnp_SecureHash=${signature}`;
	}

	async verifyCallback(data: Record<string, unknown>): Promise<PaymentVerificationResult> {
		const receivedHash = typeof data.vnp_SecureHash === "string" ? data.vnp_SecureHash : undefined;

		const checksumParams: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data)) {
			if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
				checksumParams[key] = value;
			}
		}

		const canonical = stringifyAndSortParams(checksumParams);
		const expectedHash = calculateSecureHash(canonical, this.config.VNP_HASH_SECRET);
		const isValid = receivedHash === expectedHash;

		const status = isValid && data.vnp_ResponseCode === "00" ? "paid" : "failed";
		const gatewayTransactionNo = typeof data.vnp_TransactionNo === "string" ? data.vnp_TransactionNo : undefined;

		return {
			status,
			merchantOrderRef: String(data.vnp_TxnRef ?? ""),
			gatewayTransactionNo,
			gatewayResponseData: {
				...data,
				signatureValid: isValid,
			},
		};
	}

	async refundPayment(
		payment: IPayment,
		_config: unknown,
		_options: GatewayRefundOptions,
	): Promise<PaymentRefundResult> {
		return {
			isSuccess: false,
			transactionId: payment.transactionId,
			message: "VNPay refund API is not configured in this project.",
		};
	}
}
