import { Box, Container, Typography } from "@mui/material";
import OrderHistoryTab from "@pages/Profile/OrderHistoryTab";

export default function OrderHistoryPage() {
	return (
		<Container maxWidth="md" sx={{ mt: 4 }}>
			<Box mb={2}>
				<Typography variant="h4" fontWeight={800}>
					Lịch sử mua hàng
				</Typography>
				<Typography color="text.secondary">Danh sách các đơn hàng đã đặt thành công.</Typography>
			</Box>

			<OrderHistoryTab />
		</Container>
	);
}

