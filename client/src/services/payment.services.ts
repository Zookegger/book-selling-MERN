import api, { mapApiError } from "@services/api";
import type {
	InitiateVNPayPaymentRequestDto,
	InitiateVNPayPaymentResponseDto,
} from "@my-types/order.dto";

export const paymentService = {
	initiateVNPayPayment: async (
		data: InitiateVNPayPaymentRequestDto,
	): Promise<InitiateVNPayPaymentResponseDto> => {
		try {
			const response = await api.post<InitiateVNPayPaymentResponseDto>("/payments/vnpay/initiate", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not initiate VNPay payment.");
		}
	},
};

export default paymentService;
