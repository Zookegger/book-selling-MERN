import { Box, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import useAuth from "@hooks/useAuth";

export default function AdminHome() {
    const { user } = useAuth();

    return (
        <Box sx={{ p: 3, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <DashboardIcon fontSize="small" />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Welcome back, {user?.firstName}
                </Typography>
            </Box>
            <Typography color="text.secondary">
                Use the left panel to navigate quickly, or search a page name and press Enter.
            </Typography>
        </Box>
    );
}