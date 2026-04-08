import { NextFunction, Response } from "express";
import { AuthRequest } from "@middleware/auth.middleware";
import { HttpError } from "@middleware/error.middleware";
import * as orderServices from "@services/order.services";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@models/order.model";

export const confirmOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.userId;
		if (!userId) return next(new HttpError("Unauthorized", 401));

		const order = await orderServices.confirmOrder(userId, {
			paymentMethod: req.body.paymentMethod,
			note: req.body.note,
			shippingAddress: req.body.shippingAddress,
			couponCode: req.body.couponCode,
			paymentDetails: req.body.paymentDetails,
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

export const getAdminOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const result = await orderServices.getAdminOrders({
			page: req.query.page ? Number(req.query.page) : undefined,
			limit: req.query.limit ? Number(req.query.limit) : undefined,
			search: req.query.search as string | undefined,
			status: req.query.status as OrderStatus | undefined,
			paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
			paymentMethod: req.query.paymentMethod as PaymentMethod | undefined,
		});

		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const orderId = req.params.orderId as string;
		const order = await orderServices.updateOrderStatus(orderId, req.body.status as OrderStatus);
		return res.status(200).json(order);
	} catch (err) {
		next(err);
	}
};

export const getAdminOrderStatistics = async (_req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const stats = await orderServices.getAdminOrderStatistics();
		return res.status(200).json(stats);
	} catch (err) {
		next(err);
	}
};

