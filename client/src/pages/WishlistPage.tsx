import React, { useEffect, useState } from "react";
import {
    Container, Typography, Box, Divider
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

// Import Service và Component dùng chung
import { wishlistService } from "@services/wishlist.services";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import BookGrid from "./Book/BookGrid";

const WishlistPage: React.FC = () => {
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Lấy dữ liệu khi vào trang
    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const data = await wishlistService.getMyWishlist();
            // Data trả về là mảng các { book: {...}, addedAt, desiredFormat }
            setWishlistItems(data || []);
        } catch (error) {
            console.error("Lỗi khi tải Wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    if (loading) return <LoadingSkeleton />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            {/* Header của trang */}
            <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FavoriteIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
                        Wishlist
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        You currently have the book {wishlistItems.length} in your wishlist.
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Hiển thị danh sách */}
            <BookGrid books={wishlistItems.map(item => item.book)} wishlistMode />
        </Container>
    );
};

export default WishlistPage;