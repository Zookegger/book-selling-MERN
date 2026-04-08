import type { BookFormatType } from "./book.dto";
import type { PaginatedResponseDto } from "./common.dto";

export type OrderStatusDto =
	| "pending"
	| "confirmed"
	| "processing"
	| "shipped"
	| "delivered"
	| "cancelled"
	| "refunded";

export type PaymentMethodDto = "cod" | "vnpay";
export type PaymentStatusDto = "pending" | "paid" | "failed" | "refunded";

export interface OrderAddressDto {
	recipientName: string;
	phoneNumber: string;
	provinceOrCity: string;
	district: string;
	ward: string;
	streetDetails: string;
	country?: string;
}

export interface OrderItemDto {
	book: string;
	bookTitle: string;
	bookSlug: string;
	formatType: BookFormatType;
	sku: string;
	unitPrice: number;
	quantity: number;
	lineTotal: number;
}

export interface OrderDto {
	id: string;
	user: string;
	items: OrderItemDto[];
	shippingAddress: OrderAddressDto;
	status: OrderStatusDto;
	paymentMethod: PaymentMethodDto;
	paymentStatus: PaymentStatusDto;
	couponCode?: string;
	discountAmount: number;
	shippingFee: number;
	subtotal: number;
	totalAmount: number;
	note?: string;
	placedAt: string;
	confirmedAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ConfirmOrderRequestDto {
	paymentMethod?: PaymentMethodDto;
	note?: string;
	shippingAddress?: OrderAddressDto;
	couponCode?: string;
	paymentDetails?: {
		bankCode?: string;
		ipAddress?: string;
		locale?: "vn" | "en";
		orderInfo?: string;
		returnUrl?: string;
	};
}

export interface InitiateVNPayPaymentRequestDto {
	orderId: string;
	additionalData?: {
		ipAddress?: string;
		locale?: "vn" | "en";
		orderInfo?: string;
		bankCode?: string;
		returnUrl?: string;
	};
}

export interface InitiateVNPayPaymentResponseDto {
	paymentUrl: string;
	payment: {
		id: string;
		orderId: string;
		method: PaymentMethodDto;
		status: PaymentStatusDto;
	};
}

export interface ListAdminOrdersQueryDto {
	page?: number;
	limit?: number;
	search?: string;
	status?: OrderStatusDto;
	paymentStatus?: PaymentStatusDto;
	paymentMethod?: PaymentMethodDto;
}

export type ListAdminOrdersResponseDto = PaginatedResponseDto<OrderDto>;

export interface UpdateOrderStatusRequestDto {
	status: OrderStatusDto;
}

export interface StatusCountDto {
	status: OrderStatusDto;
	count: number;
}

export interface PaymentStatusCountDto {
	status: PaymentStatusDto;
	count: number;
}

export interface MonthlyRevenueDto {
	month: string;
	revenue: number;
	orders: number;
}

export interface OrderDashboardStatisticsDto {
	totalOrders: number;
	totalRevenue: number;
	averageOrderValue: number;
	recentOrders: number;
	totalCustomers: number;
	pendingFulfillment: number;
	statusBreakdown: StatusCountDto[];
	paymentStatusBreakdown: PaymentStatusCountDto[];
	monthlyRevenue: MonthlyRevenueDto[];
}

