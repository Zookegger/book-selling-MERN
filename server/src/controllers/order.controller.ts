import { NextFunction, Response } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import { HttpError } from "@middleware/error.middleware";
import * as orderServices from "@services/order.services";

export const confirmOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const order = await orderServices.confirmOrder(userId, {
			paymentMethod: req.body.paymentMethod,
			note: req.body.note,
		});

		return res.status(201).json(order);
	} catch (err) {
		next(err);
	}
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const orders = await orderServices.getMyOrders(userId);
		return res.status(200).json(orders);
	} catch (err) {
		next(err);
	}
};

