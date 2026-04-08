import React, { useEffect, useState } from "react";
import { IconButton, CircularProgress, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite"; 
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"; 
import useSnackbar from "@hooks/useSnackbar";

// BƯỚC QUAN TRỌNG: Import service của Wishlist vào
import { wishlistService } from "@services/wishlist.services"; 

interface WishlistButtonProps {
    bookId: string;
    initialIsFavorite?: boolean; 
    size?: "small" | "medium" | "large";
    onFavoriteChange?: (bookId: string, isFavorite: boolean) => void;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ 
    bookId, 
    initialIsFavorite = false,
    size = "medium",
    onFavoriteChange,
}) => {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);
    const { success, error, warning } = useSnackbar();

    useEffect(() => {
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite]);

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        // Ngăn sự kiện click lan ra thẻ cha (chặn nhảy trang)
        e.preventDefault(); 
        e.stopPropagation();

        setIsLoading(true);
        try {
            if (isFavorite) {
                // ĐÃ MỞ KHÓA: Gọi API xóa
                await wishlistService.removeFromWishlist(bookId);
                setIsFavorite(false);
                onFavoriteChange?.(bookId, false);
                success("Removed from favorites list successfully");
            } else {
                // ĐÃ MỞ KHÓA: Gọi API thêm
                await wishlistService.addToWishlist(bookId);
                setIsFavorite(true);
                onFavoriteChange?.(bookId, true);
                success("Added to favorites list successfully");
            }
        } catch (err: any) {
            // Xử lý lỗi nếu chưa đăng nhập hoặc lỗi server
            if (err.response?.status === 401 || err.response?.status === 403) {
                warning("Please log in to use this feature!");
            } else {
                error("An error occurred while updating your favorites list. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tooltip title={isFavorite ? "Unfavorite" : "Add to Favorites"} arrow>
            <IconButton 
                onClick={handleToggleWishlist} 
                disabled={isLoading}
                size={size}
                sx={{ 
                    color: isFavorite ? 'error.main' : 'text.secondary',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                        bgcolor: 'background.default',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s'
                }}
            >
                {isLoading ? (
                    <CircularProgress size={size === 'small' ? 20 : 24} color="inherit" />
                ) : isFavorite ? (
                    <FavoriteIcon fontSize="inherit" />
                ) : (
                    <FavoriteBorderIcon fontSize="inherit" />
                )}
            </IconButton>
        </Tooltip>
    );
};

export default WishlistButton;