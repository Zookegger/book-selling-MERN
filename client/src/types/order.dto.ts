import type { BookFormatType } from "./book.dto";

export type OrderStatusDto =
	| "pending"
	| "confirmed"
	| "processing"
	| "shipped"
	| "delivered"
	| "cancelled"
	| "refunded";

export type PaymentMethodDto = "cod" | "credit_card" | "bank_transfer" | "paypal";
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
}

