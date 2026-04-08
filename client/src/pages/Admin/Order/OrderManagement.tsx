import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Refresh, Search, Visibility } from "@mui/icons-material";
import type { OrderDto, OrderStatusDto, PaymentStatusDto } from "@my-types/order.dto";
import OrderService from "@services/order.services";
import useSnackbar from "@hooks/useSnackbar";

const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatusDto; label: string }> = [
	{ value: "pending", label: "Pending" },
	{ value: "confirmed", label: "Confirmed" },
	{ value: "processing", label: "Processing" },
	{ value: "shipped", label: "Shipped" },
	{ value: "delivered", label: "Delivered" },
	{ value: "cancelled", label: "Cancelled" },
	{ value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatusDto; label: string }> = [
	{ value: "pending", label: "Pending" },
	{ value: "paid", label: "Paid" },
	{ value: "failed", label: "Failed" },
	{ value: "refunded", label: "Refunded" },
];

const ORDER_STATUS_COLOR_MAP: Record<OrderStatusDto, "default" | "warning" | "info" | "success" | "error"> = {
	pending: "warning",
	confirmed: "info",
	processing: "info",
	shipped: "info",
	delivered: "success",
	cancelled: "error",
	refunded: "default",
};

const PAYMENT_STATUS_COLOR_MAP: Record<PaymentStatusDto, "warning" | "success" | "error" | "info"> = {
	pending: "warning",
	paid: "success",
	failed: "error",
	refunded: "info",
};

const formatCurrency = (value: number): string => `${Number(value).toLocaleString("en-US")} USD`;

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
};

const getStatusLabel = (status: OrderStatusDto): string => {
	const found = ORDER_STATUS_OPTIONS.find((item) => item.value === status);
	return found?.label ?? status;
};

const getPaymentStatusLabel = (status: PaymentStatusDto): string => {
	const found = PAYMENT_STATUS_OPTIONS.find((item) => item.value === status);
	return found?.label ?? status;
};

export default function OrderManagement() {
	const [orders, setOrders] = useState<OrderDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [searchInput, setSearchInput] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<OrderStatusDto | "">("");
	const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusDto | "">("");

	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);

	const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
	const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

	const { success, error } = useSnackbar();

	const fetchOrders = useCallback(
		async (page: number) => {
			setLoading(true);
			setErrorMessage(null);
			try {
				const response = await OrderService.getAdminOrders({
					page,
					limit: pageSize,
					search: appliedSearch || undefined,
					status: statusFilter || undefined,
					paymentStatus: paymentStatusFilter || undefined,
				});

				setOrders(response.data);
				setTotal(response.total);
				setCurrentPage(response.page);
				setTotalPages(response.totalPages);
			} catch (err: any) {
				const message = err?.message ?? "Unable to load orders.";
				setErrorMessage(message);
				error(message);
			} finally {
				setLoading(false);
			}
		},
		[appliedSearch, statusFilter, paymentStatusFilter, pageSize, error],
	);

	useEffect(() => {
		void fetchOrders(currentPage);
	}, [fetchOrders, currentPage]);

	const totalItems = useMemo(
		() => orders.reduce((sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0), 0),
		[orders],
	);

	const handleApplySearch = () => {
		setCurrentPage(1);
		setAppliedSearch(searchInput.trim());
	};

	const handleResetFilters = () => {
		setSearchInput("");
		setAppliedSearch("");
		setStatusFilter("");
		setPaymentStatusFilter("");
		setCurrentPage(1);
	};

	const handleStatusUpdate = async (order: OrderDto, nextStatus: OrderStatusDto) => {
		if (order.status === nextStatus) return;

		setUpdatingOrderId(order.id);
		try {
			const updated = await OrderService.updateOrderStatus(order.id, { status: nextStatus });
			setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
			setSelectedOrder((prev) => (prev?.id === updated.id ? updated : prev));
			success(`Order ${updated.id} updated to ${getStatusLabel(updated.status)}.`);
		} catch (err: any) {
			const message = err?.message ?? "Unable to update order status.";
			setErrorMessage(message);
			error(message);
		} finally {
			setUpdatingOrderId(null);
		}
	};

	return (
		<>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
				<Box>
					<Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
						Order Management
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
						Track customer orders, adjust fulfillment status, and review shipping details.
					</Typography>
				</Box>
				<Stack direction="row" spacing={1}>
					<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={() => void fetchOrders(currentPage)}
						disabled={loading}
					>
						Refresh
					</Button>
				</Stack>
			</Box>

			<Paper sx={{ p: 2.5, mb: 2.5 }}>
				<Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
					<TextField
						label="Search orders"
						placeholder="Order ID, recipient, phone, or book"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								handleApplySearch();
							}
						}}
						fullWidth
					/>

					<FormControl size="small" sx={{ minWidth: 180 }}>
						<InputLabel>Order status</InputLabel>
						<Select
							label="Order status"
							value={statusFilter}
							onChange={(event) => {
								setStatusFilter(event.target.value as OrderStatusDto | "");
								setCurrentPage(1);
							}}
						>
							<MenuItem value="">All statuses</MenuItem>
							{ORDER_STATUS_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small" sx={{ minWidth: 190 }}>
						<InputLabel>Payment status</InputLabel>
						<Select
							label="Payment status"
							value={paymentStatusFilter}
							onChange={(event) => {
								setPaymentStatusFilter(event.target.value as PaymentStatusDto | "");
								setCurrentPage(1);
							}}
						>
							<MenuItem value="">All payment states</MenuItem>
							{PAYMENT_STATUS_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small" sx={{ minWidth: 140 }}>
						<InputLabel>Rows</InputLabel>
						<Select
							label="Rows"
							value={pageSize}
							onChange={(event) => {
								setPageSize(Number(event.target.value));
								setCurrentPage(1);
							}}
						>
							{[5, 10, 20, 50].map((size) => (
								<MenuItem key={size} value={size}>
									{size}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Button variant="contained" startIcon={<Search />} onClick={handleApplySearch}>
						Search
					</Button>
					<Button variant="text" onClick={handleResetFilters}>
						Reset
					</Button>
				</Stack>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
					<Chip label={`Orders in page: ${orders.length}`} />
					<Chip label={`Items in page: ${totalItems}`} />
					<Chip label={`Total matching orders: ${total}`} color="primary" />
				</Stack>
			</Paper>

			{errorMessage && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
					{errorMessage}
				</Alert>
			)}

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Order</TableCell>
								<TableCell>Recipient</TableCell>
								<TableCell>Items</TableCell>
								<TableCell>Total</TableCell>
								<TableCell>Payment</TableCell>
								<TableCell>Order Status</TableCell>
								<TableCell>Placed At</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{orders.length > 0 ? (
								orders.map((order) => (
									<TableRow key={order.id} hover>
										<TableCell>
											<Typography sx={{ fontWeight: 700 }}>{order.id.slice(-8).toUpperCase()}</Typography>
											<Typography variant="caption" color="text.secondary">
												{order.id}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography sx={{ fontWeight: 600 }}>{order.shippingAddress.recipientName}</Typography>
											<Typography variant="caption" color="text.secondary">
												{order.shippingAddress.phoneNumber}
											</Typography>
										</TableCell>
										<TableCell>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>{formatCurrency(order.totalAmount)}</TableCell>
										<TableCell>
											<Stack spacing={0.75}>
												<Chip size="small" label={order.paymentMethod.toUpperCase()} variant="outlined" />
												<Chip
													size="small"
													label={getPaymentStatusLabel(order.paymentStatus)}
													color={PAYMENT_STATUS_COLOR_MAP[order.paymentStatus]}
												/>
											</Stack>
										</TableCell>
										<TableCell>
											<FormControl size="small" sx={{ minWidth: 160 }}>
												<Select
													value={order.status}
													disabled={updatingOrderId === order.id}
													onChange={(event) => void handleStatusUpdate(order, event.target.value as OrderStatusDto)}
													renderValue={(value) => (
														<Chip
															size="small"
															label={getStatusLabel(value as OrderStatusDto)}
															color={ORDER_STATUS_COLOR_MAP[value as OrderStatusDto]}
														/>
													)}
												>
													{ORDER_STATUS_OPTIONS.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										</TableCell>
										<TableCell>{formatDateTime(order.placedAt)}</TableCell>
										<TableCell align="right">
											<Tooltip title="View details">
												<IconButton onClick={() => setSelectedOrder(order)}>
													<Visibility fontSize="small" />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={8} sx={{ py: 6 }}>
										<Typography align="center" color="text.secondary">
											No orders found for current filters.
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
				<Typography variant="body2" color="text.secondary">
					Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
				</Typography>
				<Stack direction="row" spacing={1}>
					<Button
						variant="outlined"
						size="small"
						disabled={loading || currentPage <= 1}
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
					>
						Previous
					</Button>
					<Button
						variant="outlined"
						size="small"
						disabled={loading || totalPages === 0 || currentPage >= totalPages}
						onClick={() => setCurrentPage((prev) => prev + 1)}
					>
						Next
					</Button>
				</Stack>
			</Stack>

			<Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
				<DialogTitle>Order Details</DialogTitle>
				<DialogContent>
					{selectedOrder && (
						<Stack spacing={2} sx={{ mt: 0.5 }}>
							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography sx={{ fontWeight: 700, mb: 1 }}>General</Typography>
								<Typography variant="body2">Order ID: {selectedOrder.id}</Typography>
								<Typography variant="body2">Placed: {formatDateTime(selectedOrder.placedAt)}</Typography>
								<Typography variant="body2">Status: {getStatusLabel(selectedOrder.status)}</Typography>
								<Typography variant="body2">
									Payment: {selectedOrder.paymentMethod.toUpperCase()} / {getPaymentStatusLabel(selectedOrder.paymentStatus)}
								</Typography>
								<Typography variant="body2">Total: {formatCurrency(selectedOrder.totalAmount)}</Typography>
							</Paper>

							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography sx={{ fontWeight: 700, mb: 1 }}>Shipping Address</Typography>
								<Typography variant="body2">{selectedOrder.shippingAddress.recipientName}</Typography>
								<Typography variant="body2">{selectedOrder.shippingAddress.phoneNumber}</Typography>
								<Typography variant="body2">
									{selectedOrder.shippingAddress.streetDetails}, {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district}
								</Typography>
								<Typography variant="body2">
									{selectedOrder.shippingAddress.provinceOrCity}, {selectedOrder.shippingAddress.country ?? "Vietnam"}
								</Typography>
							</Paper>

							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography sx={{ fontWeight: 700, mb: 1 }}>Items</Typography>
								<Stack spacing={1}>
									{selectedOrder.items.map((item, index) => (
										<Box key={`${item.sku}-${index}`} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
											<Typography variant="body2">
												{item.bookTitle} x {item.quantity} ({item.formatType})
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 700 }}>
												{formatCurrency(item.lineTotal)}
											</Typography>
										</Box>
									))}
								</Stack>
							</Paper>
						</Stack>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
