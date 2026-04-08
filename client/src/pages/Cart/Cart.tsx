import { useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CircularProgress,
	Divider,
	Snackbar,
	TextField,
	Typography,
} from "@mui/material";
import useCart from "@hooks/useCart";
import type { CartItemDto } from "@my-types/cart.dto";
import type { BookDto, BookFormatType } from "@my-types/book.dto";

const formatLabel = (format: BookFormatType) => {
	switch (format) {
		case "physical":
			return "Bản in";
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
	const { cart, setCart, itemCount, isLoading, isMutating, updateItem, removeItem } = useCart({
		autoFetchCart: true,
	});
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
		open: false,
		message: "",
		severity: "success",
	});

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
			setSnackbar({ open: true, message: "Đã cập nhật số lượng.", severity: "success" });
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message ?? "Không thể cập nhật số lượng.",
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
			setSnackbar({ open: true, message: "Đã xoá sản phẩm khỏi giỏ.", severity: "success" });
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message ?? "Không thể xoá sản phẩm.",
				severity: "error",
			});
		}
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
					Giỏ hàng
				</Typography>
				<Typography color="text.secondary">Bạn đang có {itemCount} sản phẩm trong giỏ.</Typography>
			</Box>

			<Box
				display="flex"
				gap={3}
				flexDirection={{ xs: "column", md: "row" }}
				alignItems={{ xs: "stretch", md: "flex-start" }}
			>
				<Box flex={1} minWidth={0}>
					{cart && cart.items.length > 0 ? (
						<Box display="flex" flexDirection="column" gap={2}>
							{cart.items.map((item, idx) => {
								const info = getBookInfo(item);
								return (
									<Card key={`${idx}-${String((item as any)?.addedAt ?? "")}`} sx={{ p: 2 }}>
										<Box display="flex" gap={2} alignItems="center">
											<Box
												sx={{
													width: 72,
													height: 96,
													borderRadius: 1,
													bgcolor: "#f2f2f2",
													overflow: "hidden",
													flexShrink: 0,
												}}
											>
												{info.coverImage ? (
													<img
														src={info.coverImage}
														alt={info.title}
														style={{ width: "100%", height: "100%", objectFit: "cover" }}
													/>
												) : null}
											</Box>

											<Box flex={1} minWidth={0}>
												<Typography fontWeight={700} noWrap title={info.title}>
													{info.title}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Định dạng: {formatLabel(item.selectedFormat)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Đơn giá: {Number(item.unitPrice).toLocaleString()} {DISPLAY_CURRENCY}
												</Typography>
											</Box>

											<Box display="flex" gap={1} alignItems="center">
												{/* Cập nhật số lượng sản phẩm trong giỏ (PATCH /cart/items) */}
												<TextField
													size="small"
													type="number"
													label="SL"
													value={item.quantity}
													inputProps={{ min: 1 }}
													onChange={(e) => {
														const next = Number(e.target.value);
														const safe = Number.isNaN(next) || next < 1 ? 1 : next;
														// Optimistic UI: update local state trước để UX mượt hơn
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

												{/* Xoá sản phẩm khỏi giỏ (DELETE /cart/items) */}
												<Button
													variant="outlined"
													color="error"
													disabled={isMutating}
													onClick={() => void handleRemoveItem(item)}
												>
													Xoá
												</Button>
											</Box>
										</Box>
									</Card>
								);
							})}
						</Box>
					) : (
						<Card sx={{ p: 3 }}>
							<Typography fontWeight={700}>Giỏ hàng trống</Typography>
							<Typography color="text.secondary">Hãy quay lại trang sách và thêm sản phẩm vào giỏ.</Typography>
						</Card>
					)}
				</Box>

				<Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
					<Card sx={{ p: 2 }}>
						<Typography variant="h6" fontWeight={800} mb={1}>
							Tổng tiền
						</Typography>
						<Divider sx={{ mb: 2 }} />

						<Box display="flex" justifyContent="space-between" mb={1}>
							<Typography color="text.secondary">Tạm tính</Typography>
							<Typography fontWeight={700}>
								{Number(cart?.subtotal ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Box display="flex" justifyContent="space-between" mb={1}>
							<Typography color="text.secondary">Giảm giá</Typography>
							<Typography fontWeight={700}>
								- {Number(cart?.discountAmount ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Divider sx={{ my: 2 }} />

						<Box display="flex" justifyContent="space-between" mb={2}>
							<Typography fontWeight={800}>Tổng cộng</Typography>
							<Typography fontWeight={900} color="primary">
								{Number(cart?.totalAmount ?? 0).toLocaleString()} {DISPLAY_CURRENCY}
							</Typography>
						</Box>

						<Button variant="contained" fullWidth disabled={!cart || cart.items.length === 0}>
							Thanh toán
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

