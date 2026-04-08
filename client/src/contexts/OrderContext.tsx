import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import CartService from "@services/cart.services";
import type {
	AddCartItemRequestDto,
	CartDto,
	RemoveCartItemRequestDto,
	UpdateCartItemRequestDto,
} from "@my-types/cart.dto";

type OrderContextType = {
	cart: CartDto | null;
	setCart: Dispatch<SetStateAction<CartDto | null>>;
	itemCount: number;
	isLoading: boolean;
	isMutating: boolean;
	fetchCart: () => Promise<CartDto>;
	fetchItemCount: () => Promise<number>;
	addItem: (payload: AddCartItemRequestDto) => Promise<CartDto>;
	updateItem: (payload: UpdateCartItemRequestDto) => Promise<CartDto>;
	removeItem: (payload: RemoveCartItemRequestDto) => Promise<CartDto>;
};

const ORDER_SESSION_KEY = "order_cart_session_v1";

export const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
	const [cart, setCart] = useState<CartDto | null>(null);
	const [itemCount, setItemCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);

	const syncCountFromCart = useCallback((nextCart: CartDto | null) => {
		setItemCount(nextCart?.items?.length ?? 0);
	}, []);

	// Khôi phục trạng thái giỏ hàng trong cùng một session trình duyệt
	useEffect(() => {
		try {
			const raw = sessionStorage.getItem(ORDER_SESSION_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as CartDto | null;
			setCart(parsed);
			syncCountFromCart(parsed);
		} catch {
			// Ignore corrupted session data
		}
	}, [syncCountFromCart]);

	// Lưu giỏ hàng vào sessionStorage mỗi khi cart thay đổi
	useEffect(() => {
		try {
			sessionStorage.setItem(ORDER_SESSION_KEY, JSON.stringify(cart));
		} catch {
			// Ignore quota/security errors
		}
	}, [cart]);

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

	const value = useMemo(
		() => ({
			cart,
			setCart,
			itemCount,
			isLoading,
			isMutating,
			fetchCart,
			fetchItemCount,
			addItem,
			updateItem,
			removeItem,
		}),
		[addItem, cart, fetchCart, fetchItemCount, isLoading, isMutating, itemCount, removeItem, updateItem],
	);

	return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

