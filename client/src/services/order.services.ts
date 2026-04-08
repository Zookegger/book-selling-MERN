import api, { mapApiError } from "@services/api";
import type {
	ConfirmOrderRequestDto,
	ListAdminOrdersQueryDto,
	ListAdminOrdersResponseDto,
	OrderDashboardStatisticsDto,
	OrderDto,
	UpdateOrderStatusRequestDto,
} from "@my-types/order.dto";

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

	getAdminOrders: async (params: ListAdminOrdersQueryDto = {}): Promise<ListAdminOrdersResponseDto> => {
		try {
			const response = await api.get<ListAdminOrdersResponseDto>("/orders/admin", { params });
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch admin orders.");
		}
	},

	updateOrderStatus: async (orderId: string, data: UpdateOrderStatusRequestDto): Promise<OrderDto> => {
		try {
			const response = await api.patch<OrderDto>(`/orders/${orderId}/status`, data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not update order status.");
		}
	},

	getAdminOrderStatistics: async (): Promise<OrderDashboardStatisticsDto> => {
		try {
			const response = await api.get<OrderDashboardStatisticsDto>("/orders/admin/statistics");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch dashboard statistics.");
		}
	},
};

export default OrderService;

