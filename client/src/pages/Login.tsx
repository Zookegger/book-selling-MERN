import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import useAuth from "@hooks/useAuth";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loading from "@components/common/Loading";

const Login = () => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || "/";

	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { isLoading, login } = useAuth();

	function validateForm(): boolean {
		let isValid = true;
		setEmailError("");
		setPasswordError("");

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!email) {
			setEmailError("Email is required");
			isValid = false;
		} else if (!emailRegex.test(email)) {
			setEmailError("Please enter a valid email address");
			isValid = false;
		}

		if (!password) {
			setPasswordError("Password is required");
			isValid = false;
		} else if (password.length < 6) {
			setPasswordError("Password must be at least 6 characters");
			isValid = false;
		}

		return isValid;
	};

	async function submitForm(e: React.SubmitEvent) {
		e.preventDefault();

		setErrorMessage(null);
		setSuccessMessage(null);

		if (validateForm()) {
			try {
				const res = await login({ email, password });

				setSuccessMessage(res?.message || "Successfully logged in! Redirecting...");

				setTimeout(() => {
					navigate(from, { replace: true });
				}, 5000);

			} catch (error: any) {
				setErrorMessage(error.message || "An unexpected error occurred");
			}
		}
	};

	return (
		<>
			{isLoading ? (
				<Loading />
			) : (
				<Container maxWidth={"xs"}>
					{errorMessage !== null && (
						<Alert severity="error" sx={{ mb: 5 }}>
							{errorMessage}
						</Alert>
					)}

					{successMessage !== null && (
						<Alert severity="success" sx={{ mb: 5 }}>
							{successMessage}
						</Alert>
					)}

					<Box
						component="form"
						onSubmit={submitForm}
						noValidate
						sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
					>
						<Typography variant="h4" component={"h1"} sx={{ mb: 4 }}>Log in</Typography>

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

						<TextField
							variant="filled"
							label="Password"
							type="password"
							autoComplete="current-password"
							fullWidth
							error={!!passwordError}
							helperText={passwordError}
							sx={{ mb: 3 }}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>

						<Typography mb={2} >
							<Link to={"/forgot-password"} style={{ color: "#000", textDecoration: "none" }}>
								Forgot your password?
							</Link>
						</Typography>

						<Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
							Sign in
						</Button>

						<Button variant="outlined" fullWidth>
							Sign Up
						</Button>
					</Box>
				</Container>
			)}
		</>
	);
};

export default Login;