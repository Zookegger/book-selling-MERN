import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
    Container, Typography, Box, Grid, Card, 
    CardMedia, CardContent, Button, Divider 
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

// Import Service và Component dùng chung
import { wishlistService } from "@services/wishlist.services";
import WishlistButton from "@components/common/WishlistButton";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";

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
            <Grid container spacing={3} sx={{ justifyContent: 'flex-start' }}>
                {wishlistItems.length > 0 ? (
                    wishlistItems.map((item) => {
                        const book = item.book; // Trích xuất thông tin sách từ item của wishlist
                        
                        return (
                            <Grid key={item._id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' }, p: 1.5, display: 'flex' }}>
                                <Card sx={{ 
                                    width: '100%', borderRadius: 5, border: '1px solid', borderColor: 'grey.200',
                                    display: 'flex', flexDirection: 'column', position: 'relative',
                                    transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }
                                }}>
                                    
                                    {/* Nút Thả tim (Dùng lại component bạn đã tạo) */}
                                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                                        {/* Truyền initialIsFavorite=true vì sách này ĐANG ở trong wishlist */}
                                        <WishlistButton 
                                            bookId={book._id} 
                                            initialIsFavorite={true} 
                                        />
                                    </Box>

                                    <CardMedia
                                        component="img"
                                        height="300"
                                        image={book.coverImage || 'https://via.placeholder.com/400x600?text=Book+Cover'}
                                        alt={book.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    
                                    <CardContent sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h6" fontWeight={800} noWrap sx={{ mb: 1 }}>
                                            {book.title}
                                        </Typography>

                                        {/* Giá sách */}
                                        <Typography variant="h6" color="error.main" fontWeight={900}>
                                            ${book.formats && book.formats.length > 0 ? Number(book.formats[0].price).toLocaleString() : "0.00"}
                                        </Typography>

                                        <Box sx={{ flexGrow: 1 }} />
                                        
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                                            Added on: {new Date(item.addedAt).toLocaleDateString("vi-VN")}
                                        </Typography>
                                    </CardContent>
                                    
                                    <Box sx={{ p: 2, pt: 0 }}>
                                        <Button 
                                            component={Link} 
                                            to={`/book/${book.slug}`} // Chuyển đến trang chi tiết sách
                                            variant="contained" 
                                            fullWidth 
                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                        >
                                            View Details
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })
                ) : (
                    /* Giao diện khi Wishlist trống */
                    <Box sx={{ width: '100%', py: 10, textAlign: 'center' }}>
                        <FavoriteIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h5" color="text.secondary" fontWeight={600} gutterBottom>
                            Your wishlist is empty!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Take a look around and like the books that catch your eye.
                        </Typography>
                        <Button component={Link} to="/categories" variant="outlined" size="large" sx={{ borderRadius: 3, px: 4 }}>
                                Discover books now!
                        </Button>
                    </Box>
                )}
            </Grid>
        </Container>
    );
};

export default WishlistPage;