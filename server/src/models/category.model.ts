import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
	name: string;
	slug: string;
	parent?: ICategory["_id"];
}

const CategorySchema = new Schema<ICategory>(
	{
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
	},
	{ timestamps: true },
);

export default mongoose.model<ICategory>("Category", CategorySchema);
