import mongoose, { Schema } from "mongoose";

export interface IAuthor extends mongoose.Document {
	name: string;
	bio?: string;
	birthDate?: Date;
	website?: string;
}

const authorSchema = new Schema<IAuthor>(
	{
		name: { type: String, required: true },
		bio: { type: String, default: "" },
		birthDate: { type: Date },
		website: { type: String },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<IAuthor>("Author", authorSchema);
