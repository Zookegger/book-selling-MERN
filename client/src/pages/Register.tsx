import Loading from "@components/common/Loading";
import { ROUTER_PATHS } from "@components/common/Router";
import { COUNTRY_CODES } from "@constants/CountryCodes";
import useAuth from "@hooks/useAuth";
import {
    Alert, Box, TextField, Container, Typography,
    Stack, Button, Autocomplete
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [countryCode, setCountryCode] = useState<string>("+84");
    const [codeInputValue, setCodeInputValue] = useState<string>("+84");

    const { isLoading, register } = useAuth();
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [firstNameError, setFirstNameError] = useState<string | null>(null);
    const [lastNameError, setLastNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const [isConfirmTouched, setIsConfirmTouched] = useState(false);
    const isMismatch = confirmPassword.length > 0 && password !== confirmPassword && isConfirmTouched;

    function validateForm(): boolean {
        let isValid = true;
        setFirstNameError(null);
        setLastNameError(null);
        setEmailError(null);
        setPasswordError(null);
        setConfirmPasswordError(null);
        setPhoneError(null);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const localPhoneRegex = /^[0-9]{6,15}$/;

        if (!firstName) { setFirstNameError("First name is required"); isValid = false; }
        if (!lastName) { setLastNameError("Last name is required"); isValid = false; }

        if (!email) {
            setEmailError("Email is required"); isValid = false;
        } else if (!emailRegex.test(email)) {
            setEmailError("Please enter a valid email address"); isValid = false;
        }

        if (!password) {
            setPasswordError("Password is required"); isValid = false;
        } else if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters"); isValid = false;
        }

        if (!confirmPassword) {
            setConfirmPasswordError("Please confirm your password"); isValid = false;
        } else if (confirmPassword !== password) {
            setConfirmPasswordError("Passwords do not match"); isValid = false;
        }

        if (!phone) {
            setPhoneError("Phone number is required"); isValid = false;
        } else if (!localPhoneRegex.test(phone)) {
            setPhoneError("Enter digits only, e.g. 901123456"); isValid = false;
        }

        return isValid;
    }

    async function submitForm(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (validateForm()) {
            try {
                const fullPhone = `${countryCode.replace(/\s/g, "")}${phone}`;
                const res = await register({ firstName, lastName, email, password, confirmPassword, phone: fullPhone });

                setSuccessMessage(res?.message || "Account created! Redirecting...");
                setTimeout(() => {
                    navigate(ROUTER_PATHS.LOGIN, { replace: true });
                }, 5000);
            } catch (error: any) {
                setErrorMessage(error.message || "An unexpected error occurred");
            }
        }
    }

    return (
        <>
            {isLoading ? (
                <Loading />
            ) : (
                <Container maxWidth="xs">
                    {errorMessage && <Alert severity="error" sx={{ mb: 5 }}>{errorMessage}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ mb: 5 }}>{successMessage}</Alert>}

                    <Box
                        component="form"
                        onSubmit={submitForm}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                    >
                        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>Create account</Typography>

                        <Stack direction="row" gap={2} width="100%">
                            <TextField
                                variant="filled" label="First Name" type="text"
                                autoComplete="given-name" fullWidth
                                error={!!firstNameError} helperText={firstNameError}
                                sx={{ mb: 2 }} value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <TextField
                                variant="filled" label="Last Name" type="text"
                                autoComplete="family-name" fullWidth
                                error={!!lastNameError} helperText={lastNameError}
                                sx={{ mb: 2 }} value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Stack>

                        <TextField
                            variant="filled" label="Email" type="email"
                            autoComplete="email" fullWidth
                            error={!!emailError} helperText={emailError}
                            sx={{ mb: 2 }} value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Stack direction="row" gap={1} width="100%" sx={{ mb: 2 }} alignItems="flex-start">
                            <Autocomplete
                                options={COUNTRY_CODES}
                                getOptionLabel={(option) => `${option.name} (${option.code})`}
                                value={COUNTRY_CODES.find((c) => c.code === countryCode) ?? null}
                                onChange={(_, newValue) => {
                                    setCountryCode(newValue?.code ?? "");
                                    setCodeInputValue(newValue?.code ?? "");
                                }}
                                inputValue={codeInputValue}
                                onInputChange={(_, value, reason) => {
                                    if (reason === "input") setCodeInputValue(value);
                                }}
                                filterOptions={(options, { inputValue }) =>
                                    options.filter(
                                        (o) =>
                                            o.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                            o.code.includes(inputValue)
                                    )
                                }
                                sx={{ minWidth: 140 }}
                                slotProps={{ paper: { sx: { minWidth: 260 } } }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="filled"
                                        label="Code"
                                        error={!!phoneError}
                                        helperText={phoneError ?? " "}
                                        autoComplete="off"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={`${option.code}-${option.name}`}>
                                        {option.name} ({option.code})
                                    </li>
                                )}
                            />

                            <TextField
                                variant="filled" label="Phone Number" type="tel"
                                autoComplete="tel-national" fullWidth
                                error={!!phoneError} helperText={phoneError ?? " "}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                placeholder="901123456"
                            />
                        </Stack>

                        <TextField
                            variant="filled" label="Password" type="password"
                            autoComplete="new-password" fullWidth
                            error={!!passwordError} helperText={passwordError}
                            sx={{ mb: 3 }} value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <TextField
                            variant="filled" label="Confirm Password" type="password"
                            autoComplete="new-password" fullWidth
                            error={!!confirmPasswordError || isMismatch}
                            helperText={confirmPasswordError ?? (isMismatch ? "Passwords do not match" : "")}
                            sx={{ mb: 3 }} value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onBlur={() => setIsConfirmTouched(true)}
                        />

                        <Button type="submit" variant="contained" fullWidth sx={{ mb: 2 }}>
                            Create
                        </Button>
                    </Box>
                </Container>
            )}
        </>
    );
};

export default RegisterPage;