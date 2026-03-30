import Loading from "@components/common/Loading";
import {
    Alert,
    Box,
    Container,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import type { UserDto } from "@my-types/user.dto";
import userService from "@services/user.services";
import React, { useEffect, useState } from "react";
import ProfileTab from "./ProfileTab";

// ─── CustomTabPanel ───────────────────────────────────────────────────────────

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{ flexGrow: 1 }}
            {...other}
        >
            {value === index && (
                <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [snack, setSnack] = useState<{
        open: boolean;
        msg: string;
        severity: "success" | "error";
    }>({ open: false, msg: "", severity: "success" });

    useEffect(() => {
        async function fetchProfile() {
            setIsLoading(true);
            try {
                const res = await userService.fetchProfile();
                if (res) setProfile(res);
            } catch (error: any) {
                setErrorMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    function handleSnack(msg: string, severity: "success" | "error") {
        setSnack({ open: true, msg, severity });
    }

    if (isLoading) return <Loading />;

    if (!profile) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
                <Typography color="text.secondary">No profile found.</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ p: 0 }}>
            <Paper>
                <Stack direction="row">
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        orientation="vertical"
                        slotProps={{
                            indicator: {
                                sx: {
                                    left: 0,
                                    right: "unset"
                                }
                            }
                        }}
                    >
                        <Tab value={0} label="Profile" />
                        <Tab value={1} label="Order History" />
                        <Tab value={2} label="Addresses" />
                    </Tabs>

                    <CustomTabPanel value={tabValue} index={0}>
                        {errorMessage && (
                            <Alert severity="error" sx={{ mb: 2, mx: 3, mt: 3 }}>
                                {errorMessage}
                            </Alert>
                        )}
                        <ProfileTab
                            profile={profile}
                            onProfileUpdate={setProfile}
                            onSnack={handleSnack}
                        />
                    </CustomTabPanel>

                    <CustomTabPanel value={tabValue} index={1}>
                        {/* TODO: OrderHistoryTab */}
                    </CustomTabPanel>

                    <CustomTabPanel value={tabValue} index={2}>
                        {/* TODO: AddressesTab */}
                    </CustomTabPanel>
                </Stack>
            </Paper>

            <Snackbar
                open={snack.open}
                autoHideDuration={3500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
}