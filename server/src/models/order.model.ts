import mongoose, { Document, Schema } from "mongoose";
import type { BookFormatType } from "./book.model";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod = "cod" | "credit_card" | "bank_transfer" | "paypal";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderAddress {
	recipientName: string;
	phoneNumber: string;
	provinceOrCity: string;
	district: string;
	ward: string;
	streetDetails: string;
	country?: string;
}

export interface IOrderItem {
	book: mongoose.Types.ObjectId;
	bookTitle: string;
	bookSlug: string;
	formatType: BookFormatType;
	sku: string;
	unitPrice: number;
	quantity: number;
	lineTotal: number;
}

export interface IOrder extends Document {
	user: mongoose.Types.ObjectId;
	items: IOrderItem[];
	shippingAddress: IOrderAddress;
	status: OrderStatus;
	paymentMethod: PaymentMethod;
	paymentStatus: PaymentStatus;
	couponCode?: string;
	discountAmount: number;
	shippingFee: number;
	subtotal: number;
	totalAmount: number;
	note?: string;
	placedAt: Date;
	confirmedAt?: Date;
	shippedAt?: Date;
	deliveredAt?: Date;
	cancelledAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
	{
		book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
		bookTitle: { type: String, required: true, trim: true },
		bookSlug: { type: String, required: true, trim: true },
		formatType: { type: String, enum: ["physical", "digital", "audiobook"], required: true },
		sku: { type: String, required: true, trim: true },
		unitPrice: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 1 },
		lineTotal: { type: Number, required: true, min: 0 },
	},
	{ _id: false },
);

const orderAddressSchema = new Schema<IOrderAddress>(
	{
		recipientName: { type: String, required: true, trim: true },
		phoneNumber: { type: String, required: true, trim: true },
		provinceOrCity: { type: String, required: true, trim: true },
		district: { type: String, required: true, trim: true },
		ward: { type: String, required: true, trim: true },
		streetDetails: { type: String, required: true, trim: true },
		country: { type: String, default: "Vietnam" },
	},
	{ _id: false },
);

const orderSchema = new Schema<IOrder>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		items: {
			type: [orderItemSchema],
			required: true,
			validate: [(items: IOrderItem[]) => items.length > 0, "Order must contain at least one item"],
		},
		shippingAddress: { type: orderAddressSchema, required: true },
		status: {
			type: String,
			enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
			default: "pending",
		},
		paymentMethod: { type: String, enum: ["cod", "credit_card", "bank_transfer", "paypal"], required: true },
		paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
		couponCode: { type: String, trim: true, uppercase: true },
		discountAmount: { type: Number, default: 0, min: 0 },
		shippingFee: { type: Number, default: 0, min: 0 },
		subtotal: { type: Number, required: true, min: 0 },
		totalAmount: { type: Number, required: true, min: 0 },
		note: { type: String, trim: true },
		placedAt: { type: Date, default: Date.now },
		confirmedAt: { type: Date },
		shippedAt: { type: Date },
		deliveredAt: { type: Date },
		cancelledAt: { type: Date },
	},
	{ timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<IOrder>("Order", orderSchema);
