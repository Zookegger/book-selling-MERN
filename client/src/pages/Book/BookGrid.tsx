import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Grid, Card, CardContent, CardActionArea,
    Typography, Box, Chip,
    CardMedia, CircularProgress, Pagination,
    Stack,
} from "@mui/material";
import type { BookDto } from "@my-types/book.dto";
import { ROUTES } from "@constants";
import { BookIcon, Headphones, TabletSmartphone } from "lucide-react";
import { BookService } from "@services/book.services";
import WishlistButton from "@components/common/WishlistButton";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface BookGridProps {
    books?: BookDto[];
    categorySlug?: string;
    searchTerm?: string;
    pageSize?: number;
    wishlistMode?: boolean;
    emptyStateTitle?: string;
    emptyStateActionLabel?: string;
    emptyStateActionTo?: string;
}

const BookGrid: React.FC<BookGridProps> = ({
    books: initialBooks,
    categorySlug,
    searchTerm,
    pageSize = 20,
    wishlistMode = false,
    emptyStateTitle,
    emptyStateActionLabel,
    emptyStateActionTo,
}) => {
    const isLocalSource = Array.isArray(initialBooks);
    const [books, setBooks] = useState<BookDto[]>(initialBooks || []);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(!isLocalSource);

    useEffect(() => {
        setPage(1);
    }, [categorySlug, searchTerm]);

    useEffect(() => {
        if (!isLocalSource) return;

        const nextBooks = initialBooks || [];
        const nextTotal = nextBooks.length;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));

        setBooks(nextBooks);
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
        setLoading(false);
    }, [initialBooks, isLocalSource, pageSize]);

    useEffect(() => {
        if (isLocalSource) return;

        const loadBooks = async () => {
            setLoading(true);
            try {
                const response = await BookService.fetchAll({
                    category: categorySlug,
                    search: searchTerm,
                    page,
                    limit: pageSize,
                });

                const nextBooks = response.data ?? [];
                const nextTotal = Number(response.total ?? 0);
                const nextTotalPages = Number(
                    response.totalPages ?? Math.max(1, Math.ceil(nextTotal / pageSize)),
                );

                setBooks(nextBooks);
                setTotal(nextTotal);
                setTotalPages(nextTotalPages);
            } catch (error) {
                console.error("Could not load books:", error);
                setBooks([]);
                setTotal(0);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };

        void loadBooks();
    }, [categorySlug, isLocalSource, page, pageSize, searchTerm]);

    const visibleBooks = isLocalSource
        ? books.slice((page - 1) * pageSize, page * pageSize)
        : books;

    const handleFavoriteChange = (bookId: string, isFavorite: boolean) => {
        if (!(wishlistMode && isLocalSource && !isFavorite)) return;

        setBooks((prev) => {
            const nextBooks = prev.filter((book) => book._id !== bookId);
            const nextTotal = nextBooks.length;
            const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));

            setTotal(nextTotal);
            setTotalPages(nextTotalPages);
            setPage((prevPage) => Math.min(prevPage, nextTotalPages));

            return nextBooks;
        });
    };

    if (loading) {
        return (
            <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (books.length === 0) {
        const resolvedEmptyTitle =
            emptyStateTitle ??
            (searchTerm
                ? `No books matched "${searchTerm}".`
                : "No books found in this category.");
        const resolvedEmptyActionLabel = emptyStateActionLabel ?? "Return to categories";
        const resolvedEmptyActionTo = emptyStateActionTo ?? ROUTES.CATEGORY;

        return (
            <Box sx={{ py: 14, textAlign: "center" }}>
                <Typography variant="h5" color="text.disabled" fontWeight={600} gutterBottom>
                    {resolvedEmptyTitle}
                </Typography>
                <Link to={resolvedEmptyActionTo} style={{ fontWeight: 700 }}>
                    {resolvedEmptyActionLabel}
                </Link>
            </Box>
        );
    }

    return (
        <>
            <Grid container spacing={3}>
                {visibleBooks.map((book) => {
                    const primaryFormat = book.formats?.[0];
                    const price = primaryFormat?.price;
                    const discountedPrice = primaryFormat?.discountedPrice;
                    const hasDiscount =
                        discountedPrice != null && price != null && discountedPrice < price;
                    const discountPct = hasDiscount
                        ? Math.round(((price! - discountedPrice!) / price!) * 100)
                        : 0;

                    const authorNames: string[] = Array.isArray(book.authors)
                        ? book.authors
                            .map((a) => (typeof a === "string" ? a : (a?.name ?? "")))
                            .filter(Boolean)
                        : [];

                    return (
                        <Grid key={book._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    transition: "all 0.25s ease",
                                    "&:hover": {
                                        transform: "translateY(-6px)",
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                                        borderColor: "primary.light",
                                        "& .cover-img": { transform: "scale(1.05)" },
                                    },
                                }}
                            >
                                <CardActionArea
                                    component={Link}
                                    to={ROUTES.BOOK_DETAIL?.(book._id) ?? "#"}
                                    sx={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "stretch" }}
                                >
                                    {/* Cover */}
                                    <CardMedia
                                        sx={{
                                            position: "relative",
                                            flexShrink: 0,
                                            overflow: "hidden",
                                            // 3:4 aspect ratio
                                            aspectRatio: "3 / 4",
                                            bgcolor: "grey.100",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            className="cover-img"
                                            src={API_URL + book.coverImage || "https://via.placeholder.com/300x400?text=No+Cover"}
                                            alt={book.title}
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                transition: "transform 0.4s ease",
                                            }}
                                        />
                                        {/* Discount badge */}
                                        {hasDiscount && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    top: 10,
                                                    left: 10,
                                                    bgcolor: "error.main",
                                                    color: "white",
                                                    fontWeight: 800,
                                                    fontSize: "0.7rem",
                                                    px: 1,
                                                    py: 0.4,
                                                    borderRadius: 1.5,
                                                    lineHeight: 1,
                                                    letterSpacing: 0.3,
                                                    boxShadow: "0 2px 6px rgba(211,47,47,0.4)",
                                                }}
                                            >
                                                -{discountPct}%
                                            </Box>
                                        )}

                                        {book.formats && book.formats.length > 0 && (
                                            book.formats.map((format, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 10 + idx * 40,
                                                        right: 10,
                                                        bgcolor: "grey.700",
                                                        color: "white",
                                                        fontWeight: 800,
                                                        fontSize: "0.7rem",
                                                        px: 1,
                                                        py: 0.4,
                                                        borderRadius: 1.5,
                                                        lineHeight: 1,
                                                        letterSpacing: 0.3,
                                                    }}
                                                >
                                                    {(() => {
                                                        switch (format.formatType) {
                                                            case "physical": return <BookIcon size={14} />;
                                                            case "digital": return <TabletSmartphone size={14} />;
                                                            case "audiobook": return <Headphones size={14} />;
                                                            default: return <></>;
                                                        }
                                                    })()}
                                                </Box>
                                            ))
                                        )}
                                    </CardMedia>

                                    {/* Content */}
                                    <CardContent
                                        sx={{
                                            p: 2,
                                            flexGrow: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 0.75,
                                        }}
                                    >
                                        {/* Title */}
                                        <Stack direction={"row"} gap={3}>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={800}
                                                sx={{
                                                    lineHeight: 1.35,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    color: "text.primary",
                                                    flexGrow: 1,
                                                }}
                                            >
                                                {book.title}
                                            </Typography>
                                            <WishlistButton
                                                bookId={book._id}
                                                initialIsFavorite={wishlistMode}
                                                onFavoriteChange={handleFavoriteChange}
                                            />
                                        </Stack>
                                        {/* Authors */}
                                        {authorNames.length > 0 && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {authorNames.join(", ")}
                                            </Typography>
                                        )}

                                        {/* Category chips */}
                                        {book.categories && book.categories.length > 0 && (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
                                                {book.categories.slice(0, 2).map((cat: any, idx: number) => (
                                                    <Chip
                                                        key={idx}
                                                        label={typeof cat === "string" ? cat : cat.name}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        {/* Spacer */}
                                        <Box sx={{ flexGrow: 1 }} />

                                        {/* Price */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                gap: 1,
                                                mt: 0.5,
                                                pt: 1,
                                                borderTop: "1px solid",
                                                borderColor: "grey.100",
                                            }}
                                        >
                                            {hasDiscount ? (
                                                <>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight={900}
                                                        color="error.main"
                                                        lineHeight={1}
                                                    >
                                                        ${Number(discountedPrice).toFixed(2)}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        sx={{ textDecoration: "line-through" }}
                                                    >
                                                        ${Number(price).toFixed(2)}
                                                    </Typography>
                                                </>
                                            ) : price != null ? (
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight={900}
                                                    color="text.primary"
                                                    lineHeight={1}
                                                >
                                                    ${Number(price).toFixed(2)}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">
                                                    Price unavailable
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {total > 0 && totalPages > 1 && (
                <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
                    <Pagination
                        page={page}
                        count={totalPages}
                        color="primary"
                        shape="rounded"
                        onChange={(_, value) => setPage(value)}
                    />
                </Box>
            )}
        </>
    );
};

export default BookGrid;