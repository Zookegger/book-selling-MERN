import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import { HttpError } from "@middleware/error.middleware";
import * as cartServices from "@services/cart.services";

export async function addToCart(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const quantity = req.body.quantity ? Number(req.body.quantity) : 1;
		const cart = await cartServices.addToCart(userId, {
			bookId: req.body.bookId,
			quantity,
			selectedFormat: req.body.selectedFormat,
		});

		return res.status(200).json(cart);
	} catch (err) {
		next(err);
	}
}

export async function updateCart(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const quantity = req.body.quantity ? Number(req.body.quantity) : 1;
		const cart = await cartServices.updateCart(userId, {
			bookId: req.body.bookId,
			quantity,
			selectedFormat: req.body.selectedFormat,
		});

		return res.status(200).json(cart);
	} catch (err) {
		next(err);
	}
}

export async function removeFromCart(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const cart = await cartServices.removeFromCart(userId, {
			bookId: req.body.bookId,
			selectedFormat: req.body.selectedFormat,
		});

		return res.status(200).json(cart);
	} catch (err) {
		next(err);
	}
}

export async function getCart(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const cart = await cartServices.getCart(userId);
		return res.status(200).json(cart);
	} catch (err) {
		next(err);
	}
}

export async function getCartItemCount(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const itemCount = await cartServices.getItemCount(userId);
		return res.status(200).json(itemCount);
	} catch (err) {
		next(err);
	}
}
