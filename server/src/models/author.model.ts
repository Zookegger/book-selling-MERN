import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

export interface IAuthor extends mongoose.Document {
	id: string;
	name: string;
	slug: string; // URL-friendly identifier
	email: string;
	bio?: string;
	birthDate?: Date;
	website?: string;
	createdAt: Date;
	updatedAt: Date;
}

const authorSchema = new Schema<IAuthor>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true, // This allows 'john-smith' and 'john-smith-1'
			lowercase: true,
		},
		email: {
			type: String,
			required: true,
			unique: true, // Prevents duplicate accounts
			lowercase: true,
			trim: true,
		},
		bio: { type: String, default: "" },
		birthDate: { type: Date },
		website: { type: String },
	},
	{
		timestamps: true,
	},
);

// Indexing for faster search
authorSchema.index({ name: "text" });

authorSchema.pre("validate", function () {
	if (this.isModified("name")) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
});

// Hide __v from JSON result
authorSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export default mongoose.model<IAuthor>("Author", authorSchema);
