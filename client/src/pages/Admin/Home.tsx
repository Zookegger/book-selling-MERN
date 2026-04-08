import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import useAuth from "@hooks/useAuth";
import OrderService from "@services/order.services";
import type { OrderDashboardStatisticsDto } from "@my-types/order.dto";

const formatCurrency = (value: number): string => `${Number(value).toLocaleString("en-US")} USD`;

const formatMonthLabel = (value: string): string => {
    const [year, month] = value.split("-");
    if (!year || !month) return value;
    return `${month}/${year}`;
};

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
    return (
        <Card sx={{ height: "100%", border: "1px solid #e2e8f0", borderRadius: 2.5, boxShadow: "none" }}>
            <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.75 }}>
                    {value}
                </Typography>
                {subtitle ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </CardContent>
        </Card>
    );
}

export default function AdminHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState<OrderDashboardStatisticsDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        void (async () => {
            try {
                setIsLoading(true);
                const result = await OrderService.getAdminOrderStatistics();
                setStats(result);
                setErrorMessage(null);
            } catch (error: any) {
                setErrorMessage(error?.message ?? "Unable to load dashboard statistics.");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const maxMonthlyRevenue = useMemo(() => {
        if (!stats || stats.monthlyRevenue.length === 0) return 0;
        return Math.max(...stats.monthlyRevenue.map((entry) => entry.revenue));
    }, [stats]);

    return (
        <Stack spacing={2.5}>
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", boxShadow: "none" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <DashboardIcon fontSize="small" />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Home Dashboard
                    </Typography>
                </Stack>
                <Typography color="text.secondary">
                    Welcome back, {user?.firstName}. This page summarizes order performance, fulfillment workload, and payment health.
                </Typography>
            </Paper>

            {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : errorMessage ? (
                <Alert severity="error">{errorMessage}</Alert>
            ) : stats ? (
                <>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <MetricCard
                                title="Total Revenue"
                                value={formatCurrency(stats.totalRevenue)}
                                subtitle="Excludes cancelled and refunded orders"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <MetricCard
                                title="Total Orders"
                                value={stats.totalOrders.toLocaleString("vi-VN")}
                                subtitle={`${stats.recentOrders.toLocaleString("vi-VN")} in the last 7 days`}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <MetricCard
                                title="Average Order Value"
                                value={formatCurrency(stats.averageOrderValue)}
                                subtitle="Average value per order"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <MetricCard
                                title="Pending Fulfillment"
                                value={stats.pendingFulfillment.toLocaleString("vi-VN")}
                                subtitle={`${stats.totalCustomers.toLocaleString("vi-VN")} unique customers`}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", boxShadow: "none", height: "100%" }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                                    Monthly Revenue (Last 6 Months)
                                </Typography>
                                <Stack spacing={1.25}>
                                    {stats.monthlyRevenue.map((entry) => {
                                        const percentage = maxMonthlyRevenue > 0 ? Math.max((entry.revenue / maxMonthlyRevenue) * 100, 4) : 4;
                                        return (
                                            <Box key={entry.month}>
                                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {formatMonthLabel(entry.month)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatCurrency(entry.revenue)} ({entry.orders} orders)
                                                    </Typography>
                                                </Stack>
                                                <Box
                                                    sx={{
                                                        height: 10,
                                                        borderRadius: 999,
                                                        bgcolor: "#e2e8f0",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            height: "100%",
                                                            width: `${percentage}%`,
                                                            bgcolor: "#2563eb",
                                                            transition: "width 0.4s ease",
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #e2e8f0", boxShadow: "none", height: "100%" }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                                    Order Status Breakdown
                                </Typography>
                                <Stack spacing={1}>
                                    {stats.statusBreakdown.map((entry) => (
                                        <Stack key={entry.status} direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                                                {entry.status}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {entry.count.toLocaleString("vi-VN")}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>

                                <Divider sx={{ my: 1.75 }} />

                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                                    Payment Status Breakdown
                                </Typography>
                                <Stack spacing={1}>
                                    {stats.paymentStatusBreakdown.map((entry) => (
                                        <Stack key={entry.status} direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                                                {entry.status}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                {entry.count.toLocaleString("vi-VN")}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            ) : null}
        </Stack>
    );
}