import api, { mapApiError } from "@services/api";
import type {
	AddCartItemRequestDto,
	CartDto,
	RemoveCartItemRequestDto,
	UpdateCartItemRequestDto,
} from "@my-types/cart.dto";

export const CartService = {
	// Lấy toàn bộ thông tin giỏ hàng hiện tại của người dùng
	getCart: async (): Promise<CartDto> => {
		try {
			const response = await api.get<CartDto>("/cart");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch cart.");
		}
	},

	// Thêm sản phẩm vào giỏ (nếu đã tồn tại thì tăng quantity lên)
	addItem: async (data: AddCartItemRequestDto): Promise<CartDto> => {
		try {
			const response = await api.post<CartDto>("/cart/items", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not add item to cart.");
		}
	},

	// Cập nhật lại số lượng cho một sản phẩm cụ thể trong giỏ
	updateItem: async (data: UpdateCartItemRequestDto): Promise<CartDto> => {
		try {
			const response = await api.patch<CartDto>("/cart/items", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not update cart item quantity.");
		}
	},

	// Xoá một sản phẩm khỏi giỏ
	removeItem: async (data: RemoveCartItemRequestDto): Promise<CartDto> => {
		try {
			const response = await api.delete<CartDto>("/cart/items", { data });
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not remove item from cart.");
		}
	},

	// Lấy tổng số lượng dòng sản phẩm trong giỏ (dùng hiển thị badge ở icon giỏ hàng)
	getItemCount: async (): Promise<number> => {
		try {
			const response = await api.get<number>("/cart/count");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch cart item count.");
		}
	},
};

export default CartService;