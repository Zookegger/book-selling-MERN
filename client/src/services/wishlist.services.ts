// client/src/services/wishlist.services.ts
import api from "./api"; // Import instance axios của bạn

export const wishlistService = {
    // Hàm lấy danh sách yêu thích
    getMyWishlist: async () => {
        const response = await api.get("/wishlist"); // Đường dẫn tùy thuộc vào Route Backend của bạn
        return response.data;
    },
    
    // Nếu bạn chưa viết 2 hàm này cho WishlistButton thì thêm vào luôn nhé:
    addToWishlist: async (bookId: string, format?: string) => {
        const response = await api.post("/wishlist", { bookId, format });
        return response.data;
    },
    removeFromWishlist: async (bookId: string) => {
        const response = await api.delete(`/wishlist/${bookId}`);
        return response.data;
    }
};