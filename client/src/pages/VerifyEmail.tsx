import Loading from "@components/common/Loading";
import authService from "@services/auth.services";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { CheckCircle, XCircle } from "lucide-react";
import { ROUTER_PATHS } from "@components/common/Router";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token: string | null = searchParams.get("token");

    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            setIsLoading(true);

            if (!token) {
                setErrorMessage("Verification token is missing from the URL.");
                setIsLoading(false);
                return;
            }

            try {
                const res = await authService.verifyEmail({ token });

                if (!res.user || !res.user.isEmailVerified) {
                    setErrorMessage("Verification failed. The token might be expired or invalid.");
                    return;
                }

                setIsSuccess(true);
            } catch (error: any) {
                setErrorMessage(error.message || "An unexpected error occurred during verification.");
            } finally {
                setIsLoading(false);
            }
        };

        verify();
    }, [token]);

    return (
        <>
            {isLoading ? (
                <Loading />
            ) : (
                <Container
                    maxWidth="sm"
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Paper elevation={3} sx={{ p: 5, width: '100%', textAlign: 'center', borderRadius: 3 }}>
                        {isSuccess ? (
                            <Box>
                                <CheckCircle size={64} style={{ color: '#2e7d32', marginBottom: '24px' }} />
                                <Typography variant="h4" gutterBottom fontWeight="bold">
                                    Email Verified!
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 4 }}>
                                    Your email has been successfully verified. You now have full access to the system.
                                </Typography>
                                <Button
                                    component={Link}
                                    to={ROUTER_PATHS.LOGIN}
                                    replace
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disableElevation
                                >
                                    Continue to Login
                                </Button>
                            </Box>
                        ) : (
                            <Box>
                                <XCircle size={64} style={{ color: '#d32f2f', marginBottom: '24px' }} />
                                <Typography variant="h4" gutterBottom fontWeight="bold" color="error">
                                    Verification Failed
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 4 }}>
                                    {errorMessage}
                                </Typography>
                                <Button
                                    component={Link}
                                    to="/resend-verification"
                                    variant="outlined"
                                    color="error"
                                    size="large"
                                    fullWidth
                                >
                                    Request New Link
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Container>
            )}
        </>
    );
}