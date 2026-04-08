import { Box, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";

export default function LoadingSkeleton() {
	return (
		<Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
			<Stack spacing={2} sx={{ width: "100%", maxWidth: 420 }}>
				<Skeleton variant="rounded" height={48} />
				<Skeleton variant="rounded" height={220} />
				<Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
					<CircularProgress size={24} />
					<Typography variant="body2" color="text.secondary">
						Loading page
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
}