import type { BookDto, BookFormatType } from "@my-types/book.dto";

// Thông tin chi tiết của một sản phẩm trong giỏ hàng
export interface CartItemDto {
	book: string | BookDto;
	quantity: number;
	selectedFormat: BookFormatType;
	unitPrice: number;
	addedAt: string;
}

// Cấu trúc dữ liệu giỏ hàng trả về từ API
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

// Payload thêm sản phẩm vào giỏ (quantity mặc định là 1 nếu không truyền)
export interface AddCartItemRequestDto {
	bookId: string;
	selectedFormat: BookFormatType;
	quantity?: number;
}

// Payload cập nhật lại số lượng sản phẩm trong giỏ
export interface UpdateCartItemRequestDto {
	bookId: string;
	selectedFormat: BookFormatType;
	quantity: number;
}

// Payload xoá sản phẩm khỏi giỏ
export interface RemoveCartItemRequestDto {
	bookId: string;
	selectedFormat: BookFormatType;
}