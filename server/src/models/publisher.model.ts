import mongoose, { Document, Schema } from "mongoose";

export interface IPublisher extends Document {
	name: string;
	address?: string;
	contactEmail?: string;
}

const PublisherSchema = new Schema<IPublisher>(
	{
		name: { type: String, required: true },
		address: { type: String, default: "" },
		contactEmail: { type: String, match: /.+\@.+\..+/ }, // simple email validation
	},
	{ timestamps: true },
);

export default mongoose.model<IPublisher>("Publisher", PublisherSchema);
