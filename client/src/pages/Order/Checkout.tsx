import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Card,
	CircularProgress,
	Container,
	Divider,
	MenuItem,
	Snackbar,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { ROUTES } from "@constants/index";
import useOrder from "@hooks/useOrder";
import OrderService from "@services/order.services";
import userService from "@services/user.services";
import type { AddressDto } from "@my-types/user.dto";
import type { ConfirmOrderRequestDto, PaymentMethodDto } from "@my-types/order.dto";

const DEFAULT_ADDRESS = {
	recipientName: "",
	phoneNumber: "",
	provinceOrCity: "",
	district: "",
	ward: "",
	streetDetails: "",
	country: "Vietnam",
};

const CheckoutPage = () => {
	const navigate = useNavigate();
	const { cart, fetchCart, isLoading } = useOrder();
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDto>("cod");
	const [couponCode, setCouponCode] = useState("");
	const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
	const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
	const [selectedAddressId, setSelectedAddressId] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [paymentDetails, setPaymentDetails] = useState<{
		cardHolderName: string;
		cardLast4: string;
		bankCode: string;
		transferReference: string;
		paypalEmail: string;
	}>({
		cardHolderName: "",
		cardLast4: "",
		bankCode: "",
		transferReference: "",
		paypalEmail: "",
	});
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		void fetchCart();
		void (async () => {
			try {
				const addresses = await userService.getAddresses();
				setSavedAddresses(addresses);
				const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
				if (defaultAddr?._id) {
					setSelectedAddressId(defaultAddr._id);
					setShippingAddress({
						recipientName: defaultAddr.recipientName,
						phoneNumber: defaultAddr.phoneNumber,
						provinceOrCity: defaultAddr.provinceOrCity,
						district: defaultAddr.district,
						ward: defaultAddr.ward,
						streetDetails: defaultAddr.streetDetails,
						country: defaultAddr.country || "Vietnam",
					});
				}
			} catch {
				setSavedAddresses([]);
			}
		})();
	}, [fetchCart]);

	const isCartEmpty = !cart || cart.items.length === 0;
	const canSubmit = useMemo(() => {
		return (
			!isCartEmpty &&
			shippingAddress.recipientName.trim() &&
			shippingAddress.phoneNumber.trim() &&
			shippingAddress.provinceOrCity.trim() &&
			shippingAddress.district.trim() &&
			shippingAddress.ward.trim() &&
			shippingAddress.streetDetails.trim()
		);
	}, [isCartEmpty, shippingAddress]);

	const validatePaymentInputs = (): string | null => {
		if (paymentMethod === "credit_card") {
			if (!paymentDetails.cardHolderName.trim()) return "Vui lòng nhập tên chủ thẻ.";
			if (!/^\d{4}$/.test(paymentDetails.cardLast4)) return "4 số cuối thẻ không hợp lệ.";
		}

		if (paymentMethod === "bank_transfer") {
			if (!paymentDetails.bankCode.trim()) return "Vui lòng nhập mã ngân hàng.";
			if (!paymentDetails.transferReference.trim()) return "Vui lòng nhập mã giao dịch chuyển khoản.";
		}

		if (paymentMethod === "paypal") {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentDetails.paypalEmail)) {
				return "Email PayPal không hợp lệ.";
			}
		}

		return null;
	};

	const handleConfirmOrder = async () => {
		if (!canSubmit) return;
		setCheckoutError(null);

		const paymentError = validatePaymentInputs();
		if (paymentError) {
			setCheckoutError(paymentError);
			return;
		}

		const payload: ConfirmOrderRequestDto = {
			paymentMethod,
			couponCode: couponCode.trim() || undefined,
			shippingAddress,
			paymentDetails:
				paymentMethod === "cod"
					? undefined
					: {
							cardHolderName: paymentDetails.cardHolderName || undefined,
							cardLast4: paymentDetails.cardLast4 || undefined,
							bankCode: paymentDetails.bankCode || undefined,
							transferReference: paymentDetails.transferReference || undefined,
							paypalEmail: paymentDetails.paypalEmail || undefined,
						},
		};

		try {
			setIsSubmitting(true);
			await OrderService.confirmOrder(payload);
			setSnackbar({
				open: true,
				message: "Đặt hàng thành công. Vui lòng kiểm tra email xác nhận.",
				severity: "success",
			});
			void fetchCart();
			navigate(ROUTES.ORDER_HISTORY);
		} catch (error: any) {
			setCheckoutError(error?.message ?? "Không thể xác nhận đơn hàng.");
			setSnackbar({
				open: true,
				message: error?.message ?? "Không thể xác nhận đơn hàng.",
				severity: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" mt={6}>
				<CircularProgress />
			</Box>
		);
	}

	if (isCartEmpty) {
		return (
			<Container maxWidth="md" sx={{ mt: 4 }}>
				<Alert severity="info">Giỏ hàng trống. Hãy thêm sản phẩm trước khi checkout.</Alert>
				<Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(ROUTES.CART)}>
					Quay lại giỏ hàng
				</Button>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
			<Typography variant="h4" fontWeight={800} mb={2}>
				Checkout
			</Typography>

			<Box display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
				<Card sx={{ p: 2, flex: 1 }}>
					<Typography variant="h6" fontWeight={700} mb={2}>
						Địa chỉ giao hàng
					</Typography>
					{checkoutError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{checkoutError}
						</Alert>
					)}

					<Stack spacing={2}>
						<TextField
							select
							label="Chọn địa chỉ đã lưu"
							value={selectedAddressId}
							onChange={(e) => {
								const id = e.target.value;
								setSelectedAddressId(id);
								const found = savedAddresses.find((a) => a._id === id);
								if (found) {
									setShippingAddress({
										recipientName: found.recipientName,
										phoneNumber: found.phoneNumber,
										provinceOrCity: found.provinceOrCity,
										district: found.district,
										ward: found.ward,
										streetDetails: found.streetDetails,
										country: found.country || "Vietnam",
									});
								}
							}}
						>
							<MenuItem value="">-- Nhập mới --</MenuItem>
							{savedAddresses.map((addr) => (
								<MenuItem key={addr._id} value={addr._id}>
									{addr.recipientName} - {addr.phoneNumber}
								</MenuItem>
							))}
						</TextField>

						<TextField
							label="Người nhận"
							value={shippingAddress.recipientName}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, recipientName: e.target.value }))}
						/>
						<TextField
							label="Số điện thoại"
							value={shippingAddress.phoneNumber}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, phoneNumber: e.target.value }))}
						/>
						<TextField
							label="Tỉnh/Thành phố"
							value={shippingAddress.provinceOrCity}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, provinceOrCity: e.target.value }))}
						/>
						<TextField
							label="Quận/Huyện"
							value={shippingAddress.district}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, district: e.target.value }))}
						/>
						<TextField
							label="Phường/Xã"
							value={shippingAddress.ward}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, ward: e.target.value }))}
						/>
						<TextField
							label="Số nhà, tên đường"
							value={shippingAddress.streetDetails}
							onChange={(e) => setShippingAddress((prev) => ({ ...prev, streetDetails: e.target.value }))}
						/>

						<TextField
							select
							label="Phương thức thanh toán"
							value={paymentMethod}
							onChange={(e) => {
								setPaymentMethod(e.target.value as PaymentMethodDto);
								setCheckoutError(null);
							}}
						>
							<MenuItem value="cod">Thanh toán khi nhận hàng (COD)</MenuItem>
							<MenuItem value="bank_transfer">Chuyển khoản ngân hàng</MenuItem>
							<MenuItem value="credit_card">Thẻ tín dụng</MenuItem>
							<MenuItem value="paypal">PayPal</MenuItem>
						</TextField>

						{paymentMethod === "credit_card" && (
							<>
								<TextField
									label="Tên chủ thẻ"
									value={paymentDetails.cardHolderName}
									onChange={(e) => setPaymentDetails((p) => ({ ...p, cardHolderName: e.target.value }))}
								/>
								<TextField
									label="4 số cuối thẻ"
									value={paymentDetails.cardLast4}
									inputProps={{ maxLength: 4 }}
									onChange={(e) =>
										setPaymentDetails((p) => ({ ...p, cardLast4: e.target.value.replace(/\D/g, "") }))
									}
								/>
							</>
						)}

						{paymentMethod === "bank_transfer" && (
							<>
								<TextField
									label="Mã ngân hàng"
									value={paymentDetails.bankCode}
									onChange={(e) => setPaymentDetails((p) => ({ ...p, bankCode: e.target.value }))}
								/>
								<TextField
									label="Mã giao dịch chuyển khoản"
									value={paymentDetails.transferReference}
									onChange={(e) =>
										setPaymentDetails((p) => ({ ...p, transferReference: e.target.value }))
									}
								/>
							</>
						)}

						{paymentMethod === "paypal" && (
							<TextField
								label="Email PayPal"
								type="email"
								value={paymentDetails.paypalEmail}
								onChange={(e) => setPaymentDetails((p) => ({ ...p, paypalEmail: e.target.value }))}
							/>
						)}

						<TextField
							label="Mã giảm giá (nếu có)"
							value={couponCode}
							onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
						/>
					</Stack>
				</Card>

				<Card sx={{ p: 2, width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
					<Typography variant="h6" fontWeight={700}>
						Tóm tắt đơn hàng
					</Typography>
					<Divider sx={{ my: 2 }} />

					{cart.items.map((item, idx) => (
						<Box key={`${idx}-${item.selectedFormat}`} display="flex" justifyContent="space-between" mb={1}>
							<Typography variant="body2">x{item.quantity}</Typography>
							<Typography variant="body2">{Number(item.quantity * item.unitPrice).toLocaleString()} VND</Typography>
						</Box>
					))}

					<Divider sx={{ my: 2 }} />
					<Box display="flex" justifyContent="space-between" mb={1}>
						<Typography>Tạm tính</Typography>
						<Typography fontWeight={700}>{Number(cart.subtotal).toLocaleString()} VND</Typography>
					</Box>
					<Box display="flex" justifyContent="space-between" mb={1}>
						<Typography>Giảm giá</Typography>
						<Typography fontWeight={700}>- {Number(cart.discountAmount).toLocaleString()} VND</Typography>
					</Box>
					<Box display="flex" justifyContent="space-between" mb={2}>
						<Typography fontWeight={800}>Tổng cộng</Typography>
						<Typography fontWeight={900} color="primary">
							{Number(cart.totalAmount).toLocaleString()} VND
						</Typography>
					</Box>

					<Button fullWidth variant="contained" disabled={!canSubmit || isSubmitting} onClick={handleConfirmOrder}>
						Xác nhận đặt hàng
					</Button>
				</Card>
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
		</Container>
	);
};

export default CheckoutPage;

