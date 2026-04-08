import api, { mapApiError } from "@services/api";
import type { ConfirmOrderRequestDto, OrderDto } from "@my-types/order.dto";

export const OrderService = {
	confirmOrder: async (data: ConfirmOrderRequestDto = {}): Promise<OrderDto> => {
		try {
			const response = await api.post<OrderDto>("/orders/confirm", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not confirm order.");
		}
	},

	getMyOrders: async (): Promise<OrderDto[]> => {
		try {
			const response = await api.get<OrderDto[]>("/orders/my");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch order history.");
		}
	},
};

export default OrderService;

