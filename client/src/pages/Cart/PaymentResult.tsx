import { Alert, Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import { ROUTES } from "@constants/index";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type PaymentResultStatus = "success" | "failure" | "error" | "unknown";

const PaymentResultPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const status = useMemo<PaymentResultStatus>(() => {
		const params = new URLSearchParams(location.search);
		const raw = (params.get("status") ?? "").toLowerCase();
		if (raw === "success") return "success";
		if (raw === "failure") return "failure";
		if (raw === "error") return "error";
		return "unknown";
	}, [location.search]);

	const view = useMemo(() => {
		if (status === "success") {
			return {
				severity: "success" as const,
				title: "Payment successful",
				description: "Your VNPay transaction is completed and your order payment has been confirmed.",
			};
		}

		if (status === "failure") {
			return {
				severity: "warning" as const,
				title: "Payment was not completed",
				description: "VNPay reported the payment as unsuccessful. You can retry from checkout.",
			};
		}

		if (status === "error") {
			return {
				severity: "error" as const,
				title: "Payment processing error",
				description: "An error occurred while processing the payment callback.",
			};
		}

		return {
			severity: "info" as const,
			title: "Payment status unavailable",
			description: "No VNPay payment status was found in the redirect URL.",
		};
	}, [status]);

	return (
		<Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
			<Card sx={{ p: 3 }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography variant="h4" fontWeight={800}>
							VNPay Result
						</Typography>
						<Typography color="text.secondary">
							Review your payment status and choose the next action.
						</Typography>
					</Box>

					<Alert severity={view.severity}>
						<Typography fontWeight={700}>{view.title}</Typography>
						<Typography variant="body2">{view.description}</Typography>
					</Alert>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
						<Button variant="contained" onClick={() => navigate(ROUTES.PROFILE)}>
							Go to profile
						</Button>
						<Button variant="outlined" onClick={() => navigate(ROUTES.CART)}>
							Back to cart
						</Button>
						<Button variant="text" onClick={() => navigate(ROUTES.HOME)}>
							Home
						</Button>
					</Stack>
				</Stack>
			</Card>
		</Container>
	);
};

export default PaymentResultPage;
