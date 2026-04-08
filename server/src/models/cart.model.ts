import mongoose, { Document, Schema } from "mongoose";
import type { BookFormatType } from "./book.model";

export interface ICartItem {
	book: mongoose.Types.ObjectId;
	quantity: number;
	selectedFormat: BookFormatType;
	unitPrice: number;
	addedAt: Date;
}

export interface ICart extends Document {
	user: mongoose.Types.ObjectId;
	items: ICartItem[];
	couponCode?: string;
	subtotal: number;
	discountAmount: number;
	totalAmount: number;
	currency: string;
	updatedAt: Date;
	createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
	{
		book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
		quantity: { type: Number, required: true, min: 1, default: 1 },
		selectedFormat: { type: String, enum: ["physical", "digital", "audiobook"], required: true },
		unitPrice: { type: Number, required: true, min: 0 },
		addedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);

const cartSchema = new Schema<ICart>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
		items: { type: [cartItemSchema], default: [] },
		couponCode: { type: String, trim: true, uppercase: true },
		subtotal: { type: Number, default: 0, min: 0 },
		discountAmount: { type: Number, default: 0, min: 0 },
		totalAmount: { type: Number, default: 0, min: 0 },
		currency: { type: String, default: "USD", uppercase: true, trim: true },
	},
	{ timestamps: true },
);

cartSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<ICart>("Cart", cartSchema);
