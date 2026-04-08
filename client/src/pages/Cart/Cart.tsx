import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Card,
	CircularProgress,
	Divider,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import useOrder from "@hooks/useOrder";
import { ROUTES } from "@constants/index";
import type { CartItemDto } from "@my-types/cart.dto";
import type { BookDto, BookFormatType } from "@my-types/book.dto";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const formatLabel = (format: BookFormatType) => {
	switch (format) {
		case "physical":
			return "Physical";
		case "digital":
			return "Ebook";
		case "audiobook":
			return "Audiobook";
		default:
			return format;
	}
};

const getBookInfo = (item: CartItemDto): { title: string; coverImage?: string } => {
	const book = item.book as any;
	if (typeof book === "string") return { title: book };

	const dto = book as BookDto;
	return {
		title: dto.title ?? "N/A",
		coverImage: dto.coverImage,
	};
};

const DISPLAY_CURRENCY = "VND";

const CartPage = () => {
	const navigate = useNavigate();
	const { cart, setCart, itemCount, isLoading, isMutating, updateItem, removeItem, fetchCart } = useOrder();
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		void fetchCart();
	}, [fetchCart]);

	const handleUpdateQuantity = async (item: CartItemDto, nextQuantity: number) => {
		if (isMutating) return;

		const bookId = typeof item.book === "string" ? item.book : ((item.book as any)?._id ?? (item.book as any)?.id);
		if (!bookId) return;

		try {
			await updateItem({
				bookId: String(bookId),
				selectedFormat: item.selectedFormat,
				quantity: nextQuantity,
			});
			setSnackbar({ open: true, message: "Quantity updated.", severity: "success" });
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message ?? "Unable to update quantity.",
				severity: "error",
			});
		}
	};

	const handleRemoveItem = async (item: CartItemDto) => {
		if (isMutating) return;

		const bookId = typeof item.book === "string" ? item.book : ((item.book as any)?._id ?? (item.book as any)?.id);
		if (!bookId) return;

		try {
			await removeItem({
				bookId: String(bookId),
				selectedFormat: item.selectedFormat,
			});
			setSnackbar({ open: true, message: "Item removed from cart.", severity: "success" });
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message ?? "Unable to remove item.",
				severity: "error",
			});
		}
	};

	const handleGoToCheckout = () => {
		navigate(ROUTES.CHECKOUT);
	};

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" mt={6}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<>
			<Box mt={4} mb={2}>
				<Typography variant="h4" fontWeight={800}>
					Shopping Cart
				</Typography>
				<Typography color="text.secondary">You have {itemCount} items in your cart.</Typography>
			</Box>

			<Box
				display="flex"
				gap={3}
				flexDirection={{ xs: "column", md: "row" }}
				alignItems={{ xs: "stretch", md: "flex-start" }}
			>
				<Box flex={1} minWidth={0}>
					{cart && cart.items.length > 0 ? (
						<TableContainer component={Card} sx={{ overflowX: "auto" }}>
							<Table size="small" sx={{ minWidth: 760 }}>
								<TableHead>
									<TableRow>
										<TableCell>Book</TableCell>
										<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Format</TableCell>
										<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>Unit price</TableCell>
										<TableCell align="right">Quantity</TableCell>
										<TableCell align="right">Total</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{cart.items.map((item, idx) => {
										const info = getBookInfo(item);

										return (
											<TableRow key={`${idx}-${String((item as any)?.addedAt ?? "")}`}>
												<TableCell>
													<Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
														<Box
															sx={{
																width: 44,
																height: 60,
																borderRadius: 1,
																bgcolor: "#f2f2f2",
																overflow: "hidden",
																flexShrink: 0,
															}}
														>
															{info.coverImage ? (
																<img
																	src={API_URL + info.coverImage}
																	alt={info.title}
																	style={{ width: "100%", height: "100%", objectFit: "cover" }}
																/>
															) : null}
														</Box>
														<Typography fontWeight={600} noWrap title={info.title}>
															{info.title}
														</Typography>
													</Box>
												</TableCell>

												<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
													{formatLabel(item.selectedFormat)}
												</TableCell>

												<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>
													{Number(item.unitPrice).toLocaleString()} {DISPLAY_CURRENCY}
												</TableCell>

												<TableCell align="right">
													<TextField
														size="small"
														type="number"
														label="Qty"
														value={item.quantity}
														inputProps={{ min: 1 }}
														onChange={(e) => {
															const next = Number(e.target.value);
															const safe = Number.isNaN(next) || next < 1 ? 1 : next;

															setCart((prev) => {
																if (!prev) return prev;
																const items = [...prev.items];
																items[idx] = { ...items[idx], quantity: safe };
																return { ...prev, items };
															});
														}}
														onBlur={() => {
															const safe = item.quantity < 1 ? 1 : item.quantity;
															void handleUpdateQuantity(item, safe);
														}}
														sx={{ width: 90 }}
													/>
												</TableCell>

												<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
													{Number(item.quantity * item.unitPrice).toLocaleString()} {DISPLAY_CURRENCY}
												</TableCell>

												<TableCell align="right">
													<Button
														variant="outlined"
														color="error"
														disabled={isMutating}
														onClick={() => void handleRemoveItem(item)}
													>
														Remove
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					) : (
						<Card sx={{ p: 3 }}>
							<Typography fontWeight={700}>Empty Cart</Typography>
							<Typography color="text.secondary">Please go back to the books page and add items to your cart.</Typography>
						</Card>
					)}
				</Box>

				<Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
					<Card sx={{ p: 2 }}>
						<Typography variant="h6" fontWeight={800} mb={1}>
							Order Summary
						</Typography>
						<Divider sx={{ mb: 2 }} />

						<Box display="flex" justifyContent="space-between" mb={1}>
							<Typography color="text.secondary">Subtotal</Typography>
							<Typography fontWeight={700}>
								{Number(cart?.subtotal ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Box display="flex" justifyContent="space-between" mb={1}>
							<Typography color="text.secondary">Discount</Typography>
							<Typography fontWeight={700}>
								- {Number(cart?.discountAmount ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Divider sx={{ my: 2 }} />

						<Box display="flex" justifyContent="space-between" mb={2}>
							<Typography fontWeight={800}>Total</Typography>
							<Typography fontWeight={900} color="primary">
								{Number(cart?.totalAmount ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Button
							variant="contained"
							fullWidth
							disabled={!cart || cart.items.length === 0 || isMutating}
							onClick={handleGoToCheckout}
						>
							Go to Checkout
						</Button>
					</Card>
				</Box>
			</Box>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default CartPage;

