import type { BookDto, BookFormatType } from "@my-types/book.dto";

export interface CartItemDto {
	book: string | BookDto;
	quantity: number;
	selectedFormat: BookFormatType;
	unitPrice: number;
	addedAt: string;
}

export interface CartDto {
	id: string;
	user: string;
	items: CartItemDto[];
	couponCode?: string;
	subtotal: number;
	discountAmount: number;
	totalAmount: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
}

export interface AddCartItemRequestDto {
	bookId: string;
	selectedFormat: BookFormatType;
	quantity?: number;
}

export interface RemoveCartItemRequestDto {
	bookId: string;
	selectedFormat: BookFormatType;
}