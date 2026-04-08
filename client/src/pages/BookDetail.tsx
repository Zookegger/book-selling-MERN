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
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/books/${bookId}`)
      .then(res => res.json())
      .then(data => {
        // 🔥 backend mới trả { book, relatedBooks }
        setBook(data.book);
        setRelated(data.relatedBooks);
      });
  }, [bookId]);

  if (!book)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
      
      {/* ================= CHI TIẾT SÁCH ================= */}
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
        {/* ẢNH */}
        <CardMedia
          component="img"
          sx={{ width: 280, borderRadius: 2 }}
          image={book.thumbnail || "https://via.placeholder.com/280"}
          alt={book.title}
        />

        {/* THÔNG TIN */}
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

      {/* ================= SÁCH LIÊN QUAN ================= */}
      <Box mt={5} width="900px">
        <Typography variant="h5" mb={2}>
          Sách liên quan
        </Typography>

        <Box display="flex" gap={2}>
          {related?.map((item) => (
            <Card
              key={item._id}
              sx={{
                width: 160,
                p: 1,
                cursor: "pointer",
                boxShadow: 2
              }}
              onClick={() => window.location.href = `/books/${item._id}`}
            >
              <CardMedia
                component="img"
                height="120"
                image={item.thumbnail || "https://via.placeholder.com/150"}
              />

              <Typography variant="body2" mt={1}>
                {item.title}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default BookDetail;