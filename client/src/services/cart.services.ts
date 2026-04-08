import api, { mapApiError } from "@services/api";
import type { AddCartItemRequestDto, CartDto, RemoveCartItemRequestDto } from "@my-types/cart.dto";

export const CartService = {
	getCart: async (): Promise<CartDto> => {
		try {
			const response = await api.get<CartDto>("/cart");
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not fetch cart.");
		}
	},

	addItem: async (data: AddCartItemRequestDto): Promise<CartDto> => {
		try {
			const response = await api.post<CartDto>("/cart/items", data);
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not add item to cart.");
		}
	},

	removeItem: async (data: RemoveCartItemRequestDto): Promise<CartDto> => {
		try {
			const response = await api.delete<CartDto>("/cart/items", { data });
			return response.data;
		} catch (error: any) {
			throw mapApiError(error, "Network error: Could not remove item from cart.");
		}
	},
};

export default CartService;