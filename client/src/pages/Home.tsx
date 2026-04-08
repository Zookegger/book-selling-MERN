import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import { ROUTES } from "@constants/index";
import BookGrid from "@pages/Book/BookGrid";
import { BookService } from "@services/book.services";
import type { BookDto } from "@my-types/book.dto";

const getBestSellerScore = (book: BookDto): number => {
  const discountScores = (book.formats ?? []).map((format) => {
    if (
      format.price == null ||
      format.discountedPrice == null ||
      format.discountedPrice >= format.price
    ) {
      return 0;
    }

    return ((format.price - format.discountedPrice) / format.price) * 100;
  });

  const maxDiscountScore = discountScores.length > 0 ? Math.max(...discountScores) : 0;
  const formatCount = book.formats?.length ?? 0;
  const categoryCount = book.categories?.length ?? 0;

  return maxDiscountScore * 100 + formatCount * 8 + categoryCount * 2;
};

const Home = () => {
  const [catalog, setCatalog] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHomeCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await BookService.fetchAll({ page: 1, limit: 40, order: "desc" });
        setCatalog(response.data ?? []);
      } catch (err) {
        console.error("Could not load home catalog:", err);
        setError("Unable to load featured books right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadHomeCatalog();
  }, []);

  const bestSellers = useMemo(() => {
    return [...catalog]
      .sort((a, b) => {
        const scoreDiff = getBestSellerScore(b) - getBestSellerScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 8);
  }, [catalog]);

  const newArrivals = useMemo(() => {
    return [...catalog]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [catalog]);

  if (loading) return <LoadingSkeleton />;

  return (
    <>
      <Box
        sx={{
          p: { xs: 3, md: 5 },
          mb: 6,
          borderRadius: 5,
          background:
            "linear-gradient(135deg, rgba(255,244,230,1) 0%, rgba(255,255,255,1) 55%, rgba(231,245,255,1) 100%)",
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(25,118,210,0.08)",
            right: -70,
            top: -70,
          },
        }}
      >
        <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.03em", mb: 1 }}>
          Discover Your Next Favorite Book
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760, mb: 3 }}>
          Browse curated best sellers, fresh releases, and hand-picked titles across every category.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
          <Button component={Link} to={ROUTES.BOOKS} variant="contained" size="large" sx={{ textTransform: "none", fontWeight: 700 }}>
            Browse all books
          </Button>
          <Button component={Link} to={ROUTES.CATEGORY} variant="outlined" size="large" sx={{ textTransform: "none", fontWeight: 700 }}>
            Explore categories
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${catalog.length} titles loaded`} color="primary" variant="outlined" />
          <Chip label="Curated best sellers" color="secondary" variant="outlined" />
          <Chip label="Updated daily" variant="outlined" />
        </Stack>
      </Box>

      {error && (
        <Box sx={{ mb: 6 }}>
          <Typography color="error.main" fontWeight={600}>{error}</Typography>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
          Best Sellers
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Ranked by catalog momentum: discount value, format depth, and category reach.
        </Typography>
      </Box>

      <BookGrid
        books={bestSellers}
        pageSize={8}
        emptyStateTitle="No best-seller recommendations are available yet."
        emptyStateActionLabel="Browse all books"
        emptyStateActionTo={ROUTES.BOOKS}
      />

      <Box sx={{ mt: 8, mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
          New Arrivals
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Fresh titles recently added to our catalog.
        </Typography>
      </Box>

      <BookGrid
        books={newArrivals}
        pageSize={8}
        emptyStateTitle="No recent arrivals yet."
        emptyStateActionLabel="Browse all books"
        emptyStateActionTo={ROUTES.BOOKS}
      />
    </>
  );
};

export default Home;