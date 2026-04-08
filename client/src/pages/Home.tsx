import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { bookService } from "@services/book.services";
import type { BookDto } from "@my-types/book.dto";
import useCart from "@hooks/useCart";

const Home = () => {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await bookService.listBooks({ page: 1, limit: 12 });
        setBooks(response.data);
      } catch (fetchError) {
        setError("Không thể tải danh sách sách.");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    void fetchBooks();
  }, []);

  if (loading) {
    return (
      <Container sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Danh Sách Sách
        </Typography>
        <Typography color="text.secondary">
          Chọn sách và bấm "Thêm vào giỏ" để kiểm tra chức năng giỏ hàng.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {books.map((book) => {
          const selectedFormat = book.formats[0];
          const price = selectedFormat?.discountedPrice ?? selectedFormat?.price ?? 0;
          const bookId = book.id ?? book._id;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={bookId}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {book.description}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {price.toLocaleString("vi-VN")} VND
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      if (!bookId) return;
                      // Chức năng thêm vào giỏ: nếu đã có sản phẩm thì tự cộng số lượng.
                      addToCart({
                        id: bookId,
                        title: book.title,
                        price,
                        coverImage: book.coverImage,
                      });
                    }}
                  >
                    Thêm vào giỏ
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default Home;
