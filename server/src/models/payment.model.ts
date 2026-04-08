import mongoose, { Document, Schema } from "mongoose";
import type { PaymentMethod, PaymentStatus } from "./order.model";

export interface IPayment extends Document {
	order: mongoose.Types.ObjectId;
	user: mongoose.Types.ObjectId;
	method: PaymentMethod;
	status: PaymentStatus;
	amount: number;
	currency: string;
	provider?: string;
	transactionId?: string;
	paidAt?: Date;
	failedAt?: Date;
	refundedAt?: Date;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
	{
		order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
		user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		method: { type: String, enum: ["cod", "credit_card", "bank_transfer", "paypal"], required: true },
		status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
		amount: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "USD", uppercase: true, trim: true },
		provider: { type: String, trim: true },
		transactionId: { type: String, trim: true },
		paidAt: { type: Date },
		failedAt: { type: Date },
		refundedAt: { type: Date },
		metadata: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true },
);

paymentSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<IPayment>("Payment", paymentSchema);
