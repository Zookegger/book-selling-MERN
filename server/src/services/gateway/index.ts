import { registerPaymentGateway } from "@services/payment.services";
import { VNPayGateway } from "./vnpayGateway";

import dotenv from "dotenv";

dotenv.config();

console.log("Loaded VNPay config from environment:", {
	VNP_TMN_CODE: process.env.VNPAY_TMN_CODE ? "****" : "MISSING",
	VNP_HASH_SECRET: process.env.VNPAY_HASH_SECRET ? "****" : "MISSING",
	VNP_RETURN_URL: process.env.VNPAY_RETURN_URL ? "****" : "MISSING",
	VNP_URL: process.env.VNPAY_API_URL || "DEFAULT",
	VNP_LOCALE: process.env.VNPAY_LOCALE || "DEFAULT",
});

export const initializePaymentGateways = (): void => {
	registerPaymentGateway("vnpay", new VNPayGateway({
		VNP_TMN_CODE: process.env.VNPAY_TMN_CODE,
		VNP_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
		VNP_RETURN_URL: process.env.VNPAY_RETURN_URL,
		VNP_URL: process.env.VNPAY_API_URL,
		VNP_LOCALE: process.env.VNPAY_LOCALE as "vn" | "en",
	}));
};
