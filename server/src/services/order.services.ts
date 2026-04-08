import mongoose from "mongoose";
import { Cart, Order, User } from "@models";
import type { PaymentMethod } from "@models/order.model";
import { HttpError } from "@middleware/error.middleware";
import { EmailService } from "./email.service";

type ConfirmOrderInput = {
	paymentMethod?: PaymentMethod;
	note?: string;
};

const ensureValidObjectId = (value: string, label = "ID"): void => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw new HttpError(`Invalid ${label}`, 400);
	}
};

export const confirmOrder = async (userId: string, dto: ConfirmOrderInput = {}) => {
	ensureValidObjectId(userId, "user ID");

	const user = await User.findById(userId).select("firstName email addresses").exec();
	if (!user) throw new HttpError("User not found", 404);

	const cart = await Cart.findOne({ user: userId }).populate("items.book").exec();
	if (!cart || cart.items.length === 0) {
		throw new HttpError("Cart is empty", 400);
	}

	const defaultAddress = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
	if (!defaultAddress) {
		throw new HttpError("Please add a shipping address before confirming order", 400);
	}

	const orderItems = cart.items.map((item: any) => {
		const book = item.book as any;
		if (!book || !book._id) throw new HttpError("Invalid cart item: book not found", 400);

		const matchedFormat = book.formats?.find((f: any) => f.formatType === item.selectedFormat);

		return {
			book: book._id,
			bookTitle: book.title,
			bookSlug: book.slug,
			formatType: item.selectedFormat,
			sku: matchedFormat?.sku ?? `${book._id}-${item.selectedFormat}`,
			unitPrice: item.unitPrice,
			quantity: item.quantity,
			lineTotal: Number((item.unitPrice * item.quantity).toFixed(2)),
		};
	});

	const subtotal = Number(cart.subtotal.toFixed(2));
	const discountAmount = Number((cart.discountAmount ?? 0).toFixed(2));
	const shippingFee = 0;
	const totalAmount = Number((subtotal - discountAmount + shippingFee).toFixed(2));

	const order = await Order.create({
		user: user._id,
		items: orderItems,
		shippingAddress: {
			recipientName: defaultAddress.recipientName,
			phoneNumber: defaultAddress.phoneNumber,
			provinceOrCity: defaultAddress.provinceOrCity,
			district: defaultAddress.district,
			ward: defaultAddress.ward,
			streetDetails: defaultAddress.streetDetails,
			country: defaultAddress.country ?? "Vietnam",
		},
		status: "confirmed",
		confirmedAt: new Date(),
		paymentMethod: dto.paymentMethod ?? "cod",
		paymentStatus: "pending",
		couponCode: cart.couponCode,
		discountAmount,
		shippingFee,
		subtotal,
		totalAmount,
		note: dto.note,
		placedAt: new Date(),
	});

	// Sau khi đặt hàng thành công, làm rỗng giỏ.
	cart.items = [];
	cart.subtotal = 0;
	cart.discountAmount = 0;
	cart.totalAmount = 0;
	cart.couponCode = undefined;
	await cart.save();

	// Gửi email xác nhận đơn hàng theo best-effort: không rollback đơn hàng nếu email lỗi.
	try {
		const emailService = new EmailService();
		await emailService.sendOrderConfirmationEmail({
			email: user.email,
			firstName: user.firstName,
			orderId: order.id,
			totalAmount: order.totalAmount,
			currency: cart.currency ?? "VND",
			itemCount: order.items.length,
		});
	} catch (err) {
		console.error("Failed to send order confirmation email:", err);
	}

	return order;
};

export const getMyOrders = async (userId: string) => {
	ensureValidObjectId(userId, "user ID");
	return await Order.find({ user: userId }).sort({ createdAt: -1 }).exec();
};

