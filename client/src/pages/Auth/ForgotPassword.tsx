import Loading from "@components/common/Loading";
import { ROUTES } from "@constants/index";
import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import authService from "@services/auth.services";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<string | null>(null);

	function validateForm() {
		let isValid = true;

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

		if (!email.trim()) {
			setEmailError("Email is required");
			isValid = false;
		} else if (!emailRegex.test(email.trim())) {
			setEmailError("Please enter a valid email address");
			isValid = false;
		}

		return isValid;
	}

	async function submitForm(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setErrorMessage(null);
		setSuccessMessage(null);
		setEmailError(null);

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await authService.forgotPassword({ email: email.trim() });
			setSuccessMessage(response.message || "If that email exists, a password reset link has been sent");
			setEmail("");
		} catch (error: any) {
			setErrorMessage(error.message || "An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			{isLoading ? (
				<Loading />
			) : (
				<Container maxWidth="xs">
					<Box
						component="form"
						onSubmit={submitForm}
						noValidate
						sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
					>
						<Typography variant="h4" component="h1" sx={{ mb: 1 }}>
							Forgot password
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: "center" }}>
							Enter your email and we will send you a password reset link if an account exists.
						</Typography>

						{errorMessage && (
							<Alert severity="error" sx={{ mb: 2, width: "100%" }}>
								{errorMessage}
							</Alert>
						)}

						{successMessage && (
							<Alert severity="success" sx={{ mb: 2, width: "100%" }}>
								{successMessage}
							</Alert>
						)}

						<TextField
							variant="filled"
							label="Email"
							type="email"
							autoComplete="email"
							fullWidth
							error={!!emailError}
							helperText={emailError}
							sx={{ mb: 2 }}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>

						<Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
							Send reset link
						</Button>

						<Button variant="outlined" fullWidth component={Link} to={ROUTES.LOGIN} replace>
							Back to sign in
						</Button>
					</Box>
				</Container>
			)}
		</>
	);
}
