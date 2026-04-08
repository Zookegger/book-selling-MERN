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
import useAuth from "@hooks/useAuth";
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

const getOrderSessionKey = (userId?: string) => `order_cart_session_v1:${userId ?? "guest"}`;

export const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated, user } = useAuth();
	const [cart, setCart] = useState<CartDto | null>(null);
	const [itemCount, setItemCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const sessionKey = getOrderSessionKey(user?.userId);

	const syncCountFromCart = useCallback((nextCart: CartDto | null) => {
		setItemCount(nextCart?.items?.length ?? 0);
	}, []);

	// Khôi phục trạng thái giỏ hàng theo từng tài khoản trong session hiện tại
	useEffect(() => {
		if (!isAuthenticated) return;
		try {
			const raw = sessionStorage.getItem(sessionKey);
			if (!raw) return;
			const parsed = JSON.parse(raw) as CartDto | null;
			setCart(parsed);
			syncCountFromCart(parsed);
		} catch {
			// Ignore corrupted session data
		}
	}, [isAuthenticated, sessionKey, syncCountFromCart]);

	// Lưu giỏ hàng vào sessionStorage để reload trang không mất trạng thái
	useEffect(() => {
		if (!isAuthenticated) return;
		try {
			sessionStorage.setItem(sessionKey, JSON.stringify(cart));
		} catch {
			// Ignore quota/security errors
		}
	}, [cart, isAuthenticated, sessionKey]);

	// Đồng bộ cart từ server mỗi khi đăng nhập để đảm bảo dữ liệu đa thiết bị
	useEffect(() => {
		if (!isAuthenticated || !user?.userId) {
			setCart(null);
			setItemCount(0);
			return;
		}

		void (async () => {
			try {
				const serverCart = await CartService.getCart();
				setCart(serverCart);
				syncCountFromCart(serverCart);
			} catch {
				// Nếu fetch thất bại thì giữ trạng thái hiện tại từ session (nếu có)
			}
		})();
	}, [isAuthenticated, user?.userId, syncCountFromCart]);

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

