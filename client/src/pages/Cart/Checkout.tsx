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
	Grid,
	MenuItem,
	Stepper,
	Step,
	StepLabel,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import { ROUTES } from "@constants/index";
import useOrder from "@hooks/useOrder";
import OrderService from "@services/order.services";
import paymentService from "@services/payment.services";
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

const CHECKOUT_STEPS = ["Shipping", "Payment", "Review"] as const;

const formatLabel = (format: string) => {
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

const CheckoutPage = () => {
	const navigate = useNavigate();
	const { cart, fetchCart, isLoading } = useOrder();
	const [activeStep, setActiveStep] = useState(0);
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDto>("cod");
	const [couponCode, setCouponCode] = useState("");
	const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
	const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
	const [selectedAddressId, setSelectedAddressId] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [paymentDetails, setPaymentDetails] = useState<{
		bankCode: string;
		locale: "vn" | "en";
	}>({
		bankCode: "",
		locale: "vn",
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
		if (paymentMethod === "vnpay" && paymentDetails.locale !== "vn" && paymentDetails.locale !== "en") {
			return "Locale must be vn or en.";
		}

		return null;
	};

	const handleNext = () => {
		setCheckoutError(null);

		if (activeStep === 0 && !canSubmit) {
			setCheckoutError("Please complete all required shipping fields.");
			return;
		}

		if (activeStep === 1) {
			const paymentError = validatePaymentInputs();
			if (paymentError) {
				setCheckoutError(paymentError);
				return;
			}
		}

		setActiveStep((prev) => Math.min(prev + 1, CHECKOUT_STEPS.length - 1));
	};

	const handleBack = () => {
		setCheckoutError(null);
		setActiveStep((prev) => Math.max(prev - 1, 0));
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
							bankCode: paymentDetails.bankCode || undefined,
							locale: paymentDetails.locale,
							orderInfo: "Book order payment",
							// returnUrl must point to the backend return endpoint so server can verify the callback
							returnUrl: `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/payments/vnpay/return`,
						},
		};

		try {
			setIsSubmitting(true);
			const order = await OrderService.confirmOrder(payload);

			if (paymentMethod === "vnpay") {
				const vnpay = await paymentService.initiateVNPayPayment({
					orderId: order.id,
					additionalData: {
						bankCode: paymentDetails.bankCode || undefined,
						locale: paymentDetails.locale,
						orderInfo: `Payment for order ${order.id}`,
						returnUrl: `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/payments/vnpay/return`,
					},
				});

				window.location.href = vnpay.paymentUrl;
				return;
			}

			setSnackbar({
				open: true,
				message: "Order placed successfully. Please check your confirmation email.",
				severity: "success",
			});
			void fetchCart();
			navigate(ROUTES.PROFILE);
		} catch (error: any) {
			setCheckoutError(error?.message ?? "Unable to confirm order.");
			setSnackbar({
				open: true,
				message: error?.message ?? "Unable to confirm order.",
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
				<Alert severity="info">Your cart is empty. Add items before checking out.</Alert>
				<Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(ROUTES.CART)}>
					Back to cart
				</Button>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
			<Typography variant="h4" fontWeight={800} mb={2}>
				Checkout
			</Typography>

			<Stepper activeStep={activeStep} sx={{ mb: 3 }}>
				{CHECKOUT_STEPS.map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
				<Card sx={{ p: 2, flex: 1 }}>
					<Typography variant="h6" fontWeight={700} mb={2}>
						{CHECKOUT_STEPS[activeStep]}
					</Typography>
					{checkoutError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{checkoutError}
						</Alert>
					)}

					<Stack spacing={2}>
						{activeStep === 0 && (
							<>
								<Grid container spacing={2}>
									<Grid size={12}>
										<TextField
											select
											label="Select saved address"
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
											fullWidth
										>
											<MenuItem value="">-- Enter new address --</MenuItem>
											{savedAddresses.map((addr) => (
												<MenuItem key={addr._id} value={addr._id}>
													{addr.recipientName} - {addr.phoneNumber}
												</MenuItem>
											))}
										</TextField>
									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="Recipient"
											value={shippingAddress.recipientName}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, recipientName: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="Phone number"
											value={shippingAddress.phoneNumber}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, phoneNumber: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="Province/City"
											value={shippingAddress.provinceOrCity}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, provinceOrCity: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="District"
											value={shippingAddress.district}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, district: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="Ward"
											value={shippingAddress.ward}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, ward: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											label="Street details"
											value={shippingAddress.streetDetails}
											onChange={(e) => setShippingAddress((prev) => ({ ...prev, streetDetails: e.target.value }))}
											fullWidth
										/>
									</Grid>
								</Grid>
							</>
						)}

						{activeStep === 1 && (
							<>
								<Grid container spacing={2}>
									<Grid size={12}>
										<TextField
											select
											label="Payment method"
											value={paymentMethod}
											onChange={(e) => {
												setPaymentMethod(e.target.value as PaymentMethodDto);
												setCheckoutError(null);
											}}
											fullWidth
										>
											<MenuItem value="cod">Cash on delivery (COD)</MenuItem>
											<MenuItem value="vnpay">VNPay</MenuItem>
										</TextField>
									</Grid>

										{paymentMethod === "vnpay" && (
										<>
											<Grid size={{ xs: 12, md: 6 }}>
												<TextField
														label="Bank code (optional)"
													value={paymentDetails.bankCode}
													onChange={(e) => setPaymentDetails((p) => ({ ...p, bankCode: e.target.value }))}
													fullWidth
												/>
											</Grid>
											<Grid size={{ xs: 12, md: 6 }}>
												<TextField
														select
														label="Locale"
														value={paymentDetails.locale}
														onChange={(e) =>
															setPaymentDetails((p) => ({ ...p, locale: e.target.value as "vn" | "en" }))
														}
													fullWidth
													>
														<MenuItem value="vn">Vietnamese</MenuItem>
														<MenuItem value="en">English</MenuItem>
													</TextField>
											</Grid>
										</>
									)}

									<Grid size={12}>
										<TextField
											label="Coupon code (optional)"
											value={couponCode}
											onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
											fullWidth
										/>
									</Grid>
								</Grid>
							</>
						)}

						{activeStep === 2 && (
							<Stack spacing={1.5}>


								<Typography variant="subtitle2" color="text.secondary">
									Cart items
								</Typography>
								<TableContainer sx={{ overflowX: "auto" }}>
									<Table size="small" sx={{ minWidth: 700 }}>
										<TableHead>
											<TableRow>
												<TableCell>Book</TableCell>
												<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Format</TableCell>
												<TableCell align="right">Qty</TableCell>
												<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>Unit price</TableCell>
												<TableCell align="right">Total</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{cart.items.map((item, idx) => {
												const bookData = item.book as any;
												const title =
													typeof bookData === "string"
														? "Book"
														: (bookData?.title ?? "Book");

												return (
													<TableRow key={`${idx}-${item.selectedFormat}`}>
														<TableCell sx={{ maxWidth: 240 }}>
															<Typography noWrap title={title}>{title}</Typography>
														</TableCell>
														<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
															{formatLabel(item.selectedFormat)}
														</TableCell>
														<TableCell align="right">{item.quantity}</TableCell>
														<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>
															{Number(item.unitPrice).toLocaleString()} VND
														</TableCell>
														<TableCell align="right">{Number(item.quantity * item.unitPrice).toLocaleString()} VND</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</TableContainer>

								<Divider sx={{ my: 1 }} />

								<Typography variant="subtitle2" color="text.secondary">
									Payment
								</Typography>
								<Typography>
									{paymentMethod === "cod"
										? "Cash on delivery (COD)"
										: "VNPay"}
								</Typography>
								{couponCode && (
									<Typography color="text.secondary">Coupon: {couponCode}</Typography>
								)}

								<Divider sx={{ my: 1 }} />

								<Typography variant="subtitle2" color="text.secondary">
									Shipping to
								</Typography>
								<Typography>
									{shippingAddress.recipientName} - {shippingAddress.phoneNumber}
								</Typography>
								<Typography color="text.secondary">
									{shippingAddress.streetDetails}, {shippingAddress.ward}, {shippingAddress.district}, {shippingAddress.provinceOrCity}, {shippingAddress.country}
								</Typography>
							</Stack>
						)}
					</Stack>

					<Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
						<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || isSubmitting}>
							Back
						</Button>

						{activeStep < CHECKOUT_STEPS.length - 1 ? (
							<Button variant="contained" onClick={handleNext}>
								Next
							</Button>
						) : (
							<Button variant="contained" disabled={!canSubmit || isSubmitting} onClick={handleConfirmOrder}>
								{isSubmitting ? "Placing order..." : "Confirm order"}
							</Button>
						)}
					</Stack>
				</Card>

				<Card sx={{ p: 2, width: { xs: "100%", md: 360 }, flexShrink: 0 }}>
					<Typography variant="h6" fontWeight={700}>
						Order Summary
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
						<Typography>Subtotal</Typography>
						<Typography fontWeight={700}>{Number(cart.subtotal).toLocaleString()} VND</Typography>
					</Box>
					<Box display="flex" justifyContent="space-between" mb={1}>
						<Typography>Discount</Typography>
						<Typography fontWeight={700}>- {Number(cart.discountAmount).toLocaleString()} VND</Typography>
					</Box>
					<Box display="flex" justifyContent="space-between" mb={2}>
						<Typography fontWeight={800}>Total</Typography>
						<Typography fontWeight={900} color="primary">
							{Number(cart.totalAmount).toLocaleString()} VND
						</Typography>
					</Box>
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

