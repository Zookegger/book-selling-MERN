// server/src/controllers/wishlist.controller.ts
import { Request, Response, NextFunction } from "express";
import * as wishlistService from "@services/wishlist.services";

export const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const { bookId, format } = req.body;

        const wishlist = await wishlistService.addToWishlist(userId, bookId, format);
        return res.status(200).json({ message: "Added to wishlist", data: wishlist });
    } catch (err) {
        next(err);
    }
};

export const deleteFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const { bookId } = req.params;

        const wishlist = await wishlistService.removeFromWishlist(userId, bookId as string); 
        return res.status(200).json({ message: "Removed from wishlist", data: wishlist });
    } catch (err) {
        next(err);
    }
};

export const getMyWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const wishlist = await wishlistService.getWishlist(userId);
        return res.status(200).json(wishlist);
    } catch (err) {
        next(err);
    }
};