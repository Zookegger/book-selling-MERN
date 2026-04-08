import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import OrderService from "@services/order.services";
import paymentService from "@services/payment.services";
import type { OrderDto } from "@my-types/order.dto";

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	confirmed: "Confirmed",
	processing: "Processing",
	shipped: "Shipping",
	delivered: "Delivered",
	cancelled: "Cancelled",
	refunded: "Refunded",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
	pending: "Pending Payment",
	paid: "Paid",
	failed: "Payment Failed",
	refunded: "Refunded",
};

export default function OrderHistoryTab() {
	const [orders, setOrders] = useState<OrderDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

	const handlePayNow = async (order: OrderDto) => {
		try {
			setError(null);
			setPayingOrderId(order.id);
				const { paymentUrl } = await paymentService.initiateVNPayPayment({
					orderId: order.id,
					additionalData: {
						locale: "vn",
						orderInfo: `Payment for order ${order.id}`,
						// point VNPay return to backend so server can verify and update payment
						returnUrl: `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/payments/vnpay/return`,
					},
				});

			window.location.href = paymentUrl;
		} catch (err: any) {
			setError(err?.message ?? "Unable to initiate VNPay payment.");
		} finally {
			setPayingOrderId(null);
		}
	};

	useEffect(() => {
		void (async () => {
			try {
				setIsLoading(true);
				const data = await OrderService.getMyOrders();
				setOrders(data);
				setError(null);
			} catch (err: any) {
				setError(err?.message ?? "Không thể tải lịch sử đơn hàng.");
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" py={4}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Alert severity="error">{error}</Alert>;
	}

	if (orders.length === 0) {
		return (
			<Card sx={{ p: 2 }}>
				<Typography fontWeight={700}>No orders yet</Typography>
				<Typography color="text.secondary">Make a purchase to save your order history.</Typography>
			</Card>
		);
	}

	return (
		<Stack spacing={2}>
			{orders.map((order) => (
				<Card key={order.id} sx={{ p: 2 }}>
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<Typography fontWeight={700}>Order ID: {order.id}</Typography>
						<Typography color="primary" fontWeight={700}>
							{STATUS_LABELS[order.status] ?? order.status}
						</Typography>
					</Box>
					<Typography variant="body2" color="text.secondary" mt={0.5}>
						Placed At: {new Date(order.placedAt).toLocaleString()}
					</Typography>
					<Typography variant="body2" color="text.secondary" mt={0.5}>
						Payment: {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
					</Typography>
					<Divider sx={{ my: 1.5 }} />
					{order.items.map((item, idx) => (
						<Box key={`${order.id}-${idx}`} display="flex" justifyContent="space-between" mb={0.75}>
							<Typography variant="body2">
								{item.bookTitle} x {item.quantity}
							</Typography>
							<Typography variant="body2">${Number(item.lineTotal).toLocaleString()} USD</Typography>
						</Box>
					))}
					<Divider sx={{ my: 1.5 }} />
					<Box display="flex" justifyContent="space-between">
						<Typography fontWeight={700}>Total</Typography>
						<Typography fontWeight={800} color="primary">
							${Number(order.totalAmount).toLocaleString()} USD
						</Typography>
					</Box>
					{order.paymentMethod === "vnpay" && order.paymentStatus === "pending" && (
						<Box mt={1.5}>
							<Button
								variant="contained"
								disabled={payingOrderId === order.id}
								onClick={() => void handlePayNow(order)}
							>
								{payingOrderId === order.id ? "Redirecting to VNPay..." : "Pay with VNPay"}
							</Button>
						</Box>
					)}
				</Card>
			))}
		</Stack>
	);
}