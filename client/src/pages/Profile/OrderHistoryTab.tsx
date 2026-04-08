import { Box, Typography, Paper, Stack, Divider, Chip } from "@mui/material";

// 🔥 Mock data (sau này thay bằng API)
const mockOrders = [
  {
    id: "ORD001",
    createdAt: "2026-04-08",
    total: 250000,
    status: "Delivered",
    items: [
      { title: "Clean Code", quantity: 1, price: 150000 },
      { title: "Atomic Habits", quantity: 1, price: 100000 },
    ],
  },
  {
    id: "ORD002",
    createdAt: "2026-04-07",
    total: 120000,
    status: "Processing",
    items: [
      { title: "Deep Work", quantity: 1, price: 120000 },
    ],
  },
];

// 🎨 màu theo trạng thái
function getStatusColor(status: string) {
  switch (status) {
    case "Delivered":
      return "success";
    case "Processing":
      return "warning";
    case "Cancelled":
      return "error";
    default:
      return "default";
  }
}

export default function OrderHistoryTab() {
  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Order History
      </Typography>

      <Stack spacing={2}>
        {mockOrders.map((order) => (
          <Paper key={order.id} sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>

              {/* Header */}
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={600}>
                  Order: {order.id}
                </Typography>

                <Chip
                  label={order.status}
                  color={getStatusColor(order.status) as any}
                  size="small"
                />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Date: {order.createdAt}
              </Typography>

              <Divider />

              {/* Items */}
              <Stack spacing={0.5}>
                {order.items.map((item, index) => (
                  <Typography key={index} variant="body2">
                    {item.title} × {item.quantity} — {item.price.toLocaleString()}đ
                  </Typography>
                ))}
              </Stack>

              <Divider />

              {/* Total */}
              <Typography fontWeight={600} textAlign="right">
                Total: {order.total.toLocaleString()}đ
              </Typography>

            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}