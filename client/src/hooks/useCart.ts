import { useEffect } from "react";
import useOrder from "./useOrder";

type UseCartOptions = {
	autoFetchCart?: boolean;
	autoFetchCount?: boolean;
};

export default function useCart(options: UseCartOptions = {}) {
	const { autoFetchCart = false, autoFetchCount = false } = options;
	const order = useOrder();
	const { fetchCart, fetchItemCount } = order;

	useEffect(() => {
		if (!autoFetchCart) return;
		void fetchCart();
	}, [autoFetchCart, fetchCart]);

	useEffect(() => {
		if (!autoFetchCount) return;
		void fetchItemCount();
	}, [autoFetchCount, fetchItemCount]);

	return order;
}
