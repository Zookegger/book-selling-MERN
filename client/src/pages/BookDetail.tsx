import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CircularProgress,
  Divider
} from "@mui/material";

const BookDetail = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/books/${bookId}`)
      .then(res => res.json())
      .then(data => {
        setBook(data); 
      });
  }, [bookId]);

  if (!book)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box display="flex" justifyContent="center" mt={5}>
      <Card
        sx={{
          display: "flex",
          width: 900,
          p: 3,
          gap: 4,
          boxShadow: 3,
          borderRadius: 3
        }}
      >
        <CardMedia
          component="img"
          sx={{ width: 280, borderRadius: 2 }}
          image={book.thumbnail || "https://via.placeholder.com/280"}
          alt={book.title}
        />

        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold" mb={2}>
            {book.title}
          </Typography>

          <Typography variant="h5" color="primary" mb={2}>
            {book.price?.toLocaleString()} VND
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography mb={1}>
            <b>Tác giả:</b> {book.author || "Đang cập nhật"}
          </Typography>

          <Typography mb={1}>
            <b>Đánh giá:</b> {book.rating || "0"} ⭐
          </Typography>

          <Typography mb={1}>
            <b>Năm xuất bản:</b> {book.year || "N/A"}
          </Typography>

          <Typography mb={2}>
            <b>Nhà xuất bản:</b> {book.publisher || "N/A"}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" mb={1}>
            Mô tả
          </Typography>

          <Typography color="text.secondary">
            {book.description}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default BookDetail;