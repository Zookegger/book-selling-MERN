// server/src/services/wishlist.services.ts
import User from "@models/user.model";
import { HttpError } from "@middleware/error.middleware";

/**
 * Thêm một cuốn sách vào Wishlist
 */
export const addToWishlist = async (userId: string, bookId: string, format?: string) => {
    const user = await User.findById(userId);
    if (!user) throw new HttpError("User not found", 404);

    // Kiểm tra xem sách đã có trong Wishlist chưa
    const isExisted = user.wishList.some(item => item.book.toString() === bookId);
    if (isExisted) {
        throw new HttpError("Book already in wishlist", 400);
    }

    user.wishList.push({
        book: bookId as any,
        addedAt: new Date(),
        desiredFormat: format
    });

    await user.save();
    return user.wishList;
};

/**
 * Xóa một cuốn sách khỏi Wishlist
 */
export const removeFromWishlist = async (userId: string, bookId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new HttpError("User not found", 404);

    user.wishList = user.wishList.filter(item => item.book.toString() !== bookId) as any;
    
    await user.save();
    return user.wishList;
};

/**
 * Lấy danh sách Wishlist của người dùng (có populate thông tin sách)
 */
export const getWishlist = async (userId: string) => {
    const user = await User.findById(userId)
        .populate({
            path: "wishList.book",
            select: "title coverImage formats slug" // Chỉ lấy các trường cần thiết
        });
    
    if (!user) throw new HttpError("User not found", 404);
    return user.wishList;
};