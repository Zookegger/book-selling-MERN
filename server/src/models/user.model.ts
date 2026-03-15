import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

/**
 * Định nghĩa kiểu `IAddress` cho thông tin địa chỉ người dùng.
 */
export interface IAddress {
	recipientName: string;
	phoneNumber: string;
	provinceOrCity: string;
	district: string;
	ward: string;
	streetDetails: string;
	country?: string;
	isDefault: boolean;
}

export interface IWishlistItem {
	book: mongoose.Types.ObjectId;
	addedAt: Date;
	desiredFormat?: string;
}

export type IUserRole = "customer" | "admin";

/**
 * Kiểu dữ liệu `IUser` mở rộng `Document` mô tả tài liệu User.
 */
export interface IUser extends Document {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role: IUserRole;
	isEmailVerified: boolean;
	emailVerificationToken?: string;
	emailVerificationExpires?: Date;
	passwordResetToken?: string;
	passwordResetExpires?: Date;
	addresses: IAddress[];
	wishList: IWishlistItem[];
	digitalLibrary: {
		book: mongoose.Types.ObjectId;
		formatIndex?: number;
		purchasedAt: Date;
	}[];
	createdAt: Date;
	updatedAt: Date;

	/**
	 * So sánh mật khẩu thô do người dùng nhập với mật khẩu đã băm lưu trong DB.
	 *
	 * @param {string} candidate - Mật khẩu thô cần kiểm tra.
	 * @returns {Promise<boolean>} Trả về `true` nếu mật khẩu khớp, `false` nếu không.
	 */
	comparePassword(candidate: string): Promise<boolean>;
}

/**
 * Schema cho địa chỉ nhúng trong tài liệu User.
 */
const addressSchema = new Schema<IAddress>(
	{
		recipientName: { type: String, required: true, trim: true },
		phoneNumber: {
			type: String,
			required: true,
			trim: true,
			validate: {
				validator: (v: string) => /^[0-9+\-\s]{8,}$/.test(v),
				message: (props) => `${props.value} is not a valid phone number!`,
			},
		},
		provinceOrCity: { type: String, required: true, trim: true },
		district: { type: String, required: true, trim: true },
		ward: { type: String, required: true, trim: true },
		streetDetails: { type: String, required: true, trim: true },
		country: { type: String, default: "Vietnam" },
		isDefault: { type: Boolean, default: false },
	},
	{ _id: false }, // Giữ _id: false nếu bạn không cần thao tác trên từng địa chỉ
);

const wishlistItemSchema = new Schema<IWishlistItem>({
	book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
	addedAt: { type: Date, default: Date.now },
	desiredFormat: { type: String, enum: ["physical", "digital", "audiobook"] },
});

/**
 * Schema và model `User`.
 * - Chứa email, tên, mật khẩu, danh sách địa chỉ, wishList và digitalLibrary.
 */
const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
			trim: true,
		},
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		emailVerificationToken: String,
		emailVerificationExpires: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
		addresses: [addressSchema],
		wishList: [wishlistItemSchema], // Sử dụng subdocument để lưu thêm thông tin
		digitalLibrary: [
			{
				book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
				formatIndex: { type: Number, min: 0 }, // Index of the format in book.formats array
				purchasedAt: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true },
);

// userSchema.index({ email: "text", firstName: "text", lastName: "text" });

userSchema.pre("validate", async function () {
	if (!this.isModified("password")) return;

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// ==================== METHODS ====================

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
	return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<IUser>("User", userSchema);
