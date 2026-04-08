import mongoose from "mongoose";
import { Book, Cart, Coupon, Order, Payment, User } from "@models";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@models/order.model";
import { HttpError } from "@middleware/error.middleware";
import { EmailService } from "./email.service";

type ShippingAddressInput = {
	recipientName: string;
	phoneNumber: string;
	provinceOrCity: string;
	district: string;
	ward: string;
	streetDetails: string;
	country?: string;
};

type ConfirmOrderInput = {
	paymentMethod?: PaymentMethod;
	note?: string;
	shippingAddress?: ShippingAddressInput;
	couponCode?: string;
	paymentDetails?: {
		bankCode?: string;
		ipAddress?: string;
		locale?: "vn" | "en";
		orderInfo?: string;
		returnUrl?: string;
	};
};

type AdminOrdersQueryInput = {
	page?: number;
	limit?: number;
	search?: string;
	status?: OrderStatus;
	paymentStatus?: PaymentStatus;
	paymentMethod?: PaymentMethod;
};

type StatusCount = {
	status: OrderStatus;
	count: number;
};

type PaymentStatusCount = {
	status: PaymentStatus;
	count: number;
};

type MonthlyRevenue = {
	month: string;
	revenue: number;
	orders: number;
};

export type AdminOrderStatistics = {
	totalOrders: number;
	totalRevenue: number;
	averageOrderValue: number;
	recentOrders: number;
	totalCustomers: number;
	pendingFulfillment: number;
	statusBreakdown: StatusCount[];
	paymentStatusBreakdown: PaymentStatusCount[];
	monthlyRevenue: MonthlyRevenue[];
};

const ensureValidObjectId = (value: string, label = "ID"): void => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw new HttpError(`Invalid ${label}`, 400);
	}
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePositiveInteger = (value: number | undefined, fallback: number, max = 100): number => {
	if (!Number.isFinite(value)) return fallback;
	const normalized = Math.floor(Number(value));
	if (normalized < 1) return fallback;
	return Math.min(normalized, max);
};

const NON_REVENUE_STATUSES: OrderStatus[] = ["cancelled", "refunded"];
const PENDING_FULFILLMENT_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped"];

const calculateCouponDiscount = (subtotal: number, coupon: any): number => {
	if (subtotal < Number(coupon.minOrderAmount ?? 0)) {
		throw new HttpError(`Order does not meet minimum amount for coupon ${coupon.code}`, 400);
	}

	let discount = 0;
	if (coupon.type === "percentage") {
		discount = subtotal * (Number(coupon.value) / 100);
		if (coupon.maxDiscountAmount != null) {
			discount = Math.min(discount, Number(coupon.maxDiscountAmount));
		}
	} else {
		discount = Number(coupon.value);
	}

	discount = Number(discount.toFixed(2));
	return Math.min(discount, subtotal);
};

const resolvePaymentStatus = (paymentMethod: PaymentMethod): PaymentStatus => {
	// COD and VNPay both start as pending; VNPay is finalized by callback.
	return "pending";
};

const validatePaymentDetails = (paymentMethod: PaymentMethod, details?: ConfirmOrderInput["paymentDetails"]) => {
	if (paymentMethod === "cod") return;

	if (paymentMethod === "vnpay") {
		if (details?.locale && details.locale !== "vn" && details.locale !== "en") {
			throw new HttpError("Locale must be vn or en", 400);
		}
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
	const shippingAddress = dto.shippingAddress ?? (defaultAddress
		? {
				recipientName: defaultAddress.recipientName,
				phoneNumber: defaultAddress.phoneNumber,
				provinceOrCity: defaultAddress.provinceOrCity,
				district: defaultAddress.district,
				ward: defaultAddress.ward,
				streetDetails: defaultAddress.streetDetails,
				country: defaultAddress.country ?? "Vietnam",
			}
		: null);
	if (!shippingAddress) {
		throw new HttpError("Please add a shipping address before confirming order", 400);
	}

	const orderItems = cart.items.map((item: any) => {
		const book = item.book as any;
		if (!book || !book._id) throw new HttpError("Invalid cart item: book not found", 400);

		const matchedFormat = book.formats?.find((f: any) => f.formatType === item.selectedFormat);
		if (!matchedFormat || matchedFormat.active === false) {
			throw new HttpError(`Selected format is not available for book ${book.title}`, 400);
		}

		if (item.selectedFormat === "physical") {
			const stock = Number(matchedFormat.stockQuantity ?? 0);
			if (stock < Number(item.quantity)) {
				throw new HttpError(`Insufficient stock for "${book.title}"`, 400);
			}
		}

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

	const subtotal = Number(cart.items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0).toFixed(2));
	let discountAmount = Number((cart.discountAmount ?? 0).toFixed(2));
	let appliedCouponCode = cart.couponCode;

	if (dto.couponCode) {
		const couponCode = dto.couponCode.trim().toUpperCase();
		const coupon = await Coupon.findOne({ code: couponCode, isActive: true }).exec();
		if (!coupon) throw new HttpError("Coupon is invalid or inactive", 400);

		const now = new Date();
		if (coupon.startsAt && coupon.startsAt > now) throw new HttpError("Coupon is not active yet", 400);
		if (coupon.expiresAt && coupon.expiresAt < now) throw new HttpError("Coupon has expired", 400);
		if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
			throw new HttpError("Coupon usage limit exceeded", 400);
		}

		discountAmount = calculateCouponDiscount(subtotal, coupon);
		appliedCouponCode = coupon.code;
	}

	const shippingFee = 0;
	const totalAmount = Number((subtotal - discountAmount + shippingFee).toFixed(2));
	const paymentMethod = dto.paymentMethod ?? "cod";
	validatePaymentDetails(paymentMethod, dto.paymentDetails);
	const paymentStatus = resolvePaymentStatus(paymentMethod);

	const order = await Order.create({
		user: user._id,
		items: orderItems,
		shippingAddress,
		status: "confirmed",
		confirmedAt: new Date(),
		paymentMethod,
		paymentStatus,
		couponCode: appliedCouponCode,
		discountAmount,
		shippingFee,
		subtotal,
		totalAmount,
		note: dto.note,
		placedAt: new Date(),
	});

	await Payment.create({
		order: order._id,
		user: user._id,
		method: paymentMethod,
		status: paymentStatus,
		amount: totalAmount,
		currency: cart.currency ?? "VND",
		provider: paymentMethod === "vnpay" ? "vnpay" : undefined,
		paidAt: paymentStatus === "paid" ? new Date() : undefined,
		metadata: {
			source: "checkout",
			paymentDetails: dto.paymentDetails ?? {},
		},
	});

	// Trừ tồn kho cho định dạng physical
	for (const item of cart.items as any[]) {
		if (item.selectedFormat !== "physical") continue;
		await Book.updateOne(
			{ _id: item.book._id, "formats.formatType": "physical" },
			{ $inc: { "formats.$.stockQuantity": -Number(item.quantity) } },
		).exec();
	}

	// Ghi nhận sử dụng coupon
	if (appliedCouponCode) {
		await Coupon.findOneAndUpdate(
			{ code: appliedCouponCode },
			{
				$inc: { usageCount: 1 },
				$push: { usageHistory: { user: user._id, order: order._id, usedAt: new Date() } },
			},
		).exec();
	}

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

export const getAdminOrders = async (query: AdminOrdersQueryInput = {}) => {
	const page = normalizePositiveInteger(query.page, 1, 1000000);
	const limit = normalizePositiveInteger(query.limit, 10, 100);

	const filters: Record<string, unknown> = {};
	if (query.status) filters.status = query.status;
	if (query.paymentStatus) filters.paymentStatus = query.paymentStatus;
	if (query.paymentMethod) filters.paymentMethod = query.paymentMethod;

	const keyword = query.search?.trim();
	if (keyword) {
		const regex = new RegExp(escapeRegex(keyword), "i");
		const searchFilters: Record<string, unknown>[] = [
			{ "shippingAddress.recipientName": regex },
			{ "shippingAddress.phoneNumber": regex },
			{ "items.bookTitle": regex },
			{ couponCode: regex },
		];

		if (mongoose.Types.ObjectId.isValid(keyword)) {
			searchFilters.push({ _id: new mongoose.Types.ObjectId(keyword) });
		}

		filters.$or = searchFilters;
	}

	const [total, data] = await Promise.all([
		Order.countDocuments(filters).exec(),
		Order.find(filters)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.exec(),
	]);

	return {
		data,
		total,
		page,
		totalPages: total === 0 ? 0 : Math.ceil(total / limit),
	};
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
	ensureValidObjectId(orderId, "order ID");

	const order = await Order.findById(orderId).exec();
	if (!order) throw new HttpError("Order not found", 404);

	order.status = status;

	const now = new Date();
	if (status === "confirmed") {
		order.confirmedAt = order.confirmedAt ?? now;
	}
	if (status === "shipped") {
		order.shippedAt = order.shippedAt ?? now;
	}
	if (status === "delivered") {
		order.deliveredAt = order.deliveredAt ?? now;
	}
	if (status === "cancelled") {
		order.cancelledAt = order.cancelledAt ?? now;
	}
	if (status === "refunded") {
		order.paymentStatus = "refunded";
	}

	await order.save();
	return order;
};

export const getAdminOrderStatistics = async (): Promise<AdminOrderStatistics> => {
	const now = new Date();
	const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const monthlyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

	const [summaryRaw, uniqueCustomersRaw, statusRaw, paymentStatusRaw, monthlyRaw] = await Promise.all([
		Order.aggregate<{ totalOrders: number; totalRevenue: number; recentOrders: number }>([
			{
				$group: {
					_id: null,
					totalOrders: { $sum: 1 },
					totalRevenue: {
						$sum: {
							$cond: [{ $in: ["$status", NON_REVENUE_STATUSES] }, 0, "$totalAmount"],
						},
					},
					recentOrders: {
						$sum: {
							$cond: [{ $gte: ["$createdAt", recentCutoff] }, 1, 0],
						},
					},
				},
			},
		]),
		Order.aggregate<{ totalCustomers: number }>([{ $group: { _id: "$user" } }, { $count: "totalCustomers" }]),
		Order.aggregate<{ _id: OrderStatus; count: number }>([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]),
		Order.aggregate<{ _id: PaymentStatus; count: number }>([
			{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]),
		Order.aggregate<{ _id: { year: number; month: number }; revenue: number; orders: number }>([
			{ $match: { createdAt: { $gte: monthlyStart } } },
			{
				$group: {
					_id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
					revenue: {
						$sum: {
							$cond: [{ $in: ["$status", NON_REVENUE_STATUSES] }, 0, "$totalAmount"],
						},
					},
					orders: { $sum: 1 },
				},
			},
			{ $sort: { "_id.year": 1, "_id.month": 1 } },
		]),
	]);

	const summary = summaryRaw[0] ?? {
		totalOrders: 0,
		totalRevenue: 0,
		recentOrders: 0,
	};

	const statusBreakdown: StatusCount[] = statusRaw.map((entry) => ({
		status: entry._id,
		count: Number(entry.count ?? 0),
	}));

	const paymentStatusBreakdown: PaymentStatusCount[] = paymentStatusRaw.map((entry) => ({
		status: entry._id,
		count: Number(entry.count ?? 0),
	}));

	const statusMap = new Map(statusBreakdown.map((entry) => [entry.status, entry.count]));
	const pendingFulfillment = PENDING_FULFILLMENT_STATUSES.reduce((sum, status) => sum + (statusMap.get(status) ?? 0), 0);

	const revenueByMonthMap = new Map<string, { revenue: number; orders: number }>();
	for (const item of monthlyRaw) {
		const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
		revenueByMonthMap.set(monthKey, {
			revenue: Number(item.revenue ?? 0),
			orders: Number(item.orders ?? 0),
		});
	}

	const monthlyRevenue: MonthlyRevenue[] = [];
	for (let offset = 5; offset >= 0; offset -= 1) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
		const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
		const monthData = revenueByMonthMap.get(monthKey);

		monthlyRevenue.push({
			month: monthKey,
			revenue: Number(monthData?.revenue ?? 0),
			orders: Number(monthData?.orders ?? 0),
		});
	}

	const totalOrders = Number(summary.totalOrders ?? 0);
	const totalRevenue = Number(summary.totalRevenue ?? 0);

	return {
		totalOrders,
		totalRevenue,
		averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
		recentOrders: Number(summary.recentOrders ?? 0),
		totalCustomers: Number(uniqueCustomersRaw[0]?.totalCustomers ?? 0),
		pendingFulfillment,
		statusBreakdown,
		paymentStatusBreakdown,
		monthlyRevenue,
	};
};

