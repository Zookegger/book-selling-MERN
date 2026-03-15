import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";

export interface IPublisher extends Document {
	id: string;
	name: string;
	slug: string;
	description?: string;
	location: {
		address?: string;
		city?: string;
		country?: string;
	};
	contactEmail: string;
	website?: string;
	logo?: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const publisherSchema = new Schema<IPublisher>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true, // Usually, company names in a specific region are unique
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		description: { type: String },
		location: {
			address: { type: String },
			city: { type: String },
			country: { type: String },
		},
		contactEmail: {
			type: String,
			required: true,
			lowercase: true,
			match: [/.+\@.+\..+/, "Please fill a valid email address"],
		},
		website: { type: String },
		logo: { type: String }, // URL to S3/Cloudinary
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

// Index for searchability
publisherSchema.index({ name: "text" });
publisherSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

publisherSchema.pre("validate", function () {
	if (this.isModified("name")) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
});

export default mongoose.model<IPublisher>("Publisher", publisherSchema);
