import { Box, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";

export default function DashboardLoadingSkeleton() {
    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f1f5f9" }}>
            <Box
                sx={{
                    width: { xs: 0, md: 320 },
                    borderRight: { md: "1px solid #e2e8f0" },
                    bgcolor: "#f8fafc",
                    display: { xs: "none", md: "block" },
                    p: 2,
                }}
            >
                <Stack spacing={2}>
                    <Skeleton variant="rounded" height={42} />
                    <Skeleton variant="rounded" height={38} />
                    <Skeleton variant="rounded" height={92} />
                    <Skeleton variant="rounded" height={92} />
                </Stack>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ borderBottom: "1px solid #e2e8f0", px: { xs: 2, md: 3 }, py: 1.5, bgcolor: "rgba(248,250,252,0.9)" }}>
                    <Skeleton variant="rounded" height={44} />
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack spacing={2}>
                        <Skeleton variant="rounded" height={56} width="50%" />
                        <Skeleton variant="rounded" height={170} />
                        <Skeleton variant="rounded" height={260} />
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CircularProgress size={22} />
                            <Typography variant="body2" color="text.secondary">
                                Loading dashboard workspace
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}