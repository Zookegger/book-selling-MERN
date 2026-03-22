import Loading from "@components/common/Loading";
import { TextField, Container, Button, Box, Alert } from "@mui/material";
import authService from "@services/auth.services";
import React, { useState } from "react";

export default function ResendVerificationPage() {
    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    function validateForm() {
        let isValid = true;

        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

        if (!email || email.length < 0) {
            setEmailError("Email is required");
            isValid = false;
        } else if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email address");
            isValid = false;
        }
        return isValid;
    }

    async function submitForm(e: React.SubmitEvent) {
        e.preventDefault();

        setErrorMessage(null);
        setSuccessMessage(null);
        setEmailError(null);
        setIsLoading(true);

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await authService.resendVerification({ email });

            if (!response.user) throw new Error("Failed to resend your verification, please try again");

            setSuccessMessage("Verification sent, please check your email!");
        } catch (error: any) {
            setErrorMessage(error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {isLoading ?
                (
                    <Loading />
                ) : (
                    <Container maxWidth="xs">
                        <Box component="form"
                            onSubmit={submitForm}
                            noValidate
                        >
                            {errorMessage !== null && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {errorMessage}
                                </Alert>
                            )}

                            {successMessage !== null && (
                                <Alert severity="success" sx={{ mb: 2 }}>
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
                            <Button type="submit" variant="contained" fullWidth>Send</Button>
                        </Box>
                    </Container>
                )}
        </>
    )
}