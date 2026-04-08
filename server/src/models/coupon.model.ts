import mongoose, { Document, Schema } from "mongoose";

export type CouponType = "percentage" | "fixed_amount";

export interface ICouponUsage {
	user: mongoose.Types.ObjectId;
	order?: mongoose.Types.ObjectId;
	usedAt: Date;
}

export interface ICoupon extends Document {
	code: string;
	description?: string;
	type: CouponType;
	value: number;
	minOrderAmount: number;
	maxDiscountAmount?: number;
	usageLimit?: number;
	usageCount: number;
	startsAt?: Date;
	expiresAt?: Date;
	isActive: boolean;
	usageHistory: ICouponUsage[];
	createdAt: Date;
	updatedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		order: { type: Schema.Types.ObjectId, ref: "Order" },
		usedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);

const couponSchema = new Schema<ICoupon>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true },
		description: { type: String, trim: true },
		type: { type: String, enum: ["percentage", "fixed_amount"], required: true },
		value: { type: Number, required: true, min: 0 },
		minOrderAmount: { type: Number, default: 0, min: 0 },
		maxDiscountAmount: { type: Number, min: 0 },
		usageLimit: { type: Number, min: 1 },
		usageCount: { type: Number, default: 0, min: 0 },
		startsAt: { type: Date },
		expiresAt: { type: Date },
		isActive: { type: Boolean, default: true },
		usageHistory: { type: [couponUsageSchema], default: [] },
	},
	{ timestamps: true },
);

couponSchema.pre("validate", function () {
	if (this.isModified("code")) {
		this.code = this.code.trim().toUpperCase();
	}
});

couponSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<ICoupon>("Coupon", couponSchema);
