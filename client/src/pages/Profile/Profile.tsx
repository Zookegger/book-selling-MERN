import {
    Alert,
    Box,
    Container,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
} from "@mui/material";
import React, { useState } from "react";
import ProfileTab from "./ProfileTab";
import AddressesTab from "./AddressesTab";

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
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Box sx={{ flex: 1 }}>
                    {children}
                </Box>
            </Box>
        </div>
    );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [snack, setSnack] = useState<{
        open: boolean;
        msg: string;
        severity: "success" | "error";
    }>({ open: false, msg: "", severity: "success" });

    function handleSnack(msg: string, severity: "success" | "error") {
        setSnack({ open: true, msg, severity });
    }

    return (
        <Container maxWidth="md" sx={{ p: 0, mt: 5 }}>
            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2, mx: 3, mt: 3 }}>
                    {errorMessage}
                </Alert>
            )}
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

                        <ProfileTab
                            setErrorMessage={setErrorMessage}
                            onSnack={handleSnack}
                        />
                    </CustomTabPanel>

                    <CustomTabPanel value={tabValue} index={1}>
                        {/* TODO: OrderHistoryTab */}
                    </CustomTabPanel>

                    <CustomTabPanel value={tabValue} index={2}>
                        <AddressesTab
                            setErrorMessage={setErrorMessage}
                            onSnack={handleSnack}
                        />
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