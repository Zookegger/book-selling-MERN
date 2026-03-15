import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";

export interface ICategory extends Document {
	id: string;
	name: string;
	slug: string;
	description?: string;
	parent?: mongoose.Types.ObjectId;
	ancestors: mongoose.Types.ObjectId[]; // Array of parent, grandparent, etc.
	order: number;
	createdAt: Date;
	updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			index: true,
		},
		description: { type: String, default: "" },
		parent: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			default: null,
		},
		// This allows for high-performance "Breadcrumb" and "Sub-tree" queries
		ancestors: [
			{
				type: Schema.Types.ObjectId,
				ref: "Category",
			},
		],
		order: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

// Indexing for faster tree traversal
categorySchema.index({ ancestors: 1 });

categorySchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		ret.id = ret._id;

		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

categorySchema.pre("validate", function () {
	if (this.isModified("name")) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
});

export default mongoose.model<ICategory>("Category", categorySchema);
