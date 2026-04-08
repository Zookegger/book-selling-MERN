import { useEffect, useState } from "react";
import { Alert, Box, Card, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import OrderService from "@services/order.services";
import type { OrderDto } from "@my-types/order.dto";

const STATUS_LABELS: Record<string, string> = {
	pending: "Chờ xử lý",
	confirmed: "Đã xác nhận",
	processing: "Đang xử lý",
	shipped: "Đang giao",
	delivered: "Đã giao",
	cancelled: "Đã hủy",
	refunded: "Đã hoàn tiền",
};

export default function OrderHistoryTab() {
	const [orders, setOrders] = useState<OrderDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
				<Typography fontWeight={700}>Chưa có đơn hàng nào</Typography>
				<Typography color="text.secondary">Bạn hãy mua sản phẩm để hệ thống lưu lịch sử mua hàng.</Typography>
			</Card>
		);
	}

	return (
		<Stack spacing={2}>
			{orders.map((order) => (
				<Card key={order.id} sx={{ p: 2 }}>
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<Typography fontWeight={700}>Mã đơn: {order.id}</Typography>
						<Typography color="primary" fontWeight={700}>
							{STATUS_LABELS[order.status] ?? order.status}
						</Typography>
					</Box>
					<Typography variant="body2" color="text.secondary" mt={0.5}>
						Ngày đặt: {new Date(order.placedAt).toLocaleString()}
					</Typography>
					<Divider sx={{ my: 1.5 }} />
					{order.items.map((item, idx) => (
						<Box key={`${order.id}-${idx}`} display="flex" justifyContent="space-between" mb={0.75}>
							<Typography variant="body2">
								{item.bookTitle} x {item.quantity}
							</Typography>
							<Typography variant="body2">{Number(item.lineTotal).toLocaleString()} VND</Typography>
						</Box>
					))}
					<Divider sx={{ my: 1.5 }} />
					<Box display="flex" justifyContent="space-between">
						<Typography fontWeight={700}>Tổng cộng</Typography>
						<Typography fontWeight={800} color="primary">
							{Number(order.totalAmount).toLocaleString()} VND
						</Typography>
					</Box>
				</Card>
			))}
		</Stack>
	);
}