import { useCallback, useEffect, useMemo, useState } from "react";
import CartService from "@services/cart.services";
import type {
	AddCartItemRequestDto,
	CartDto,
	RemoveCartItemRequestDto,
	UpdateCartItemRequestDto,
} from "@my-types/cart.dto";

type UseCartOptions = {
	autoFetchCart?: boolean;
	autoFetchCount?: boolean;
};

export default function useCart(options: UseCartOptions = {}) {
	const { autoFetchCart = false, autoFetchCount = false } = options;
	const [cart, setCart] = useState<CartDto | null>(null);
	const [itemCount, setItemCount] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);

	const syncCountFromCart = useCallback((nextCart: CartDto | null) => {
		setItemCount(nextCart?.items?.length ?? 0);
	}, []);

	const fetchCart = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await CartService.getCart();
			setCart(data);
			syncCountFromCart(data);
			return data;
		} finally {
			setIsLoading(false);
		}
	}, [syncCountFromCart]);

	const fetchItemCount = useCallback(async () => {
		const count = await CartService.getItemCount();
		setItemCount(count);
		return count;
	}, []);

	const addItem = useCallback(
		async (payload: AddCartItemRequestDto) => {
			setIsMutating(true);
			try {
				const updatedCart = await CartService.addItem(payload);
				setCart(updatedCart);
				syncCountFromCart(updatedCart);
				return updatedCart;
			} finally {
				setIsMutating(false);
			}
		},
		[syncCountFromCart],
	);

	const updateItem = useCallback(
		async (payload: UpdateCartItemRequestDto) => {
			setIsMutating(true);
			try {
				const updatedCart = await CartService.updateItem(payload);
				setCart(updatedCart);
				syncCountFromCart(updatedCart);
				return updatedCart;
			} finally {
				setIsMutating(false);
			}
		},
		[syncCountFromCart],
	);

	const removeItem = useCallback(
		async (payload: RemoveCartItemRequestDto) => {
			setIsMutating(true);
			try {
				const updatedCart = await CartService.removeItem(payload);
				setCart(updatedCart);
				syncCountFromCart(updatedCart);
				return updatedCart;
			} finally {
				setIsMutating(false);
			}
		},
		[syncCountFromCart],
	);

	useEffect(() => {
		if (!autoFetchCart) return;
		void fetchCart();
	}, [autoFetchCart, fetchCart]);

	useEffect(() => {
		if (!autoFetchCount) return;
		void fetchItemCount();
	}, [autoFetchCount, fetchItemCount]);

	return {
		cart,
		setCart,
		itemCount: useMemo(() => itemCount, [itemCount]),
		isLoading,
		isMutating,
		fetchCart,
		fetchItemCount,
		addItem,
		updateItem,
		removeItem,
	};
}
