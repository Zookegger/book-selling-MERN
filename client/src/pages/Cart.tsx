import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import useCart from "@hooks/useCart";

const CartPage = () => {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Giỏ Hàng
      </Typography>

      {items.length === 0 ? (
        <Typography color="text.secondary">Giỏ hàng đang trống.</Typography>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography color="text.secondary">
                      {item.price.toLocaleString("vi-VN")} VND
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      aria-label="decrease quantity"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>

                    {/* Cập nhật số lượng trực tiếp trong cart */}
                    <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                      {item.quantity}
                    </Typography>

                    <IconButton
                      aria-label="increase quantity"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon />
                    </IconButton>

                    {/* Xóa sản phẩm khỏi cart */}
                    <IconButton aria-label="remove item" onClick={() => removeFromCart(item.id)}>
                      <DeleteOutlineIcon color="error" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tổng tiền: {totalPrice.toLocaleString("vi-VN")} VND
            </Typography>
            <Button variant="outlined" color="error" onClick={clearCart}>
              Xóa toàn bộ giỏ hàng
            </Button>
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default CartPage;

