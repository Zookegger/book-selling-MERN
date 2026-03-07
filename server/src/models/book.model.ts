import mongoose, { Schema } from "mongoose";
import { IPublisher } from "@models/publisher.model";
import { IAuthor } from "./author.model";
import { ICategory } from "./category.model";

export type BookFormatType = "physical" | "digital" | "audiobook";

export interface IBookFormat {
	formatType: BookFormatType;
	sku: string;
	isbn?: string;
	price: number;
	discountedPrice?: number;
	currency: string;
	active: boolean;
	releaseDate?: Date;

	// Physical
	stockQuantity?: number;
	weight?: number; // in kg (or appropriate unit)
	dimensions?: string; // e.g., "20x13x2 cm"

	// Digital‑specific
	file?: string; // path to the ebook file
	fileFormat?: string; // 'PDF', 'ePub', 'MOBI'
	fileSize?: number; // in bytes
	downloadLimit?: number; // max number of downloads
	sampleFile?: string; // path to a free sample
}

const bookFormatSchema = new Schema<IBookFormat>(
	{
		formatType: {
			type: String,
			enum: ["physical", "digital", "audiobook"],
			required: true,
		},
		sku: { type: String, required: true, unique: true }, // SKU must be globally unique
		isbn: { type: String, unique: true, sparse: true }, // sparse allows nulls/undefined
		price: { type: Number, required: true, min: 0 },
		discountedPrice: { type: Number, min: 0 },
		currency: { type: String, default: "USD", uppercase: true, minlength: 3, maxlength: 3 },
		active: { type: Boolean, default: true },
		releaseDate: { type: Date },

		// Physical fields
		stockQuantity: { type: Number, min: 0 },
		weight: { type: Number, min: 0 },
		dimensions: { type: String },

		// Digital fields
		file: { type: String },
		fileFormat: { type: String, enum: ["PDF", "ePub", "MOBI"] },
		fileSize: { type: Number, min: 0 },
		downloadLimit: { type: Number, min: 1 },
		sampleFile: { type: String },
	},
	{ _id: true }, // each subdocument gets its own _id
);

bookFormatSchema.pre<IBookFormat>("validate", function () {
	if (this.formatType === "physical" && this.file) {
		throw new Error("Physical format cannot have a digital file.");
	}

	if (this.formatType === "digital" && this.stockQuantity != null) {
		throw new Error("Digital format should not have stock quantity.");
	}
});

export interface IBook extends Document {
	title: string;
	subtitle?: string;
	description: string;
	isbn?: string;
	publicationDate: Date;
	language: string;
	pageCount?: number;
	publisher?: IPublisher["_id"];
	authors: IAuthor["_id"][];
	categories: ICategory["_id"][];
	coverImage?: string;
	formats: IBookFormat[];
	createdAt: Date;
	updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
	{
		title: { type: String, required: true, index: true },
		subtitle: { type: String, default: "" },
		description: { type: String, required: true },
		isbn: { type: String, unique: true, sparse: true }, // sparse: true to allow multiple null values while ensuring that any non‑null ISBN is unique across documents.
		publicationDate: { type: Date, required: true },
		language: { type: String, required: true, default: "en" },
		pageCount: { type: Number, min: 1 },
		publisher: { type: Schema.Types.ObjectId, ref: "Publisher" },
		authors: [{ type: Schema.Types.ObjectId, ref: "Author" }],
		categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
		coverImage: { type: String },
		formats: [bookFormatSchema], // embedded array
	},
	{ timestamps: true },
);

// bookSchema.index({ title: "text", description: "text" });
// bookSchema.index({ "formats.sku": 1 }, { unique: true, partialFilterExpression: { "formats.sku": { $exists: true } } });
// The unique index on sku inside the array requires MongoDB 4.2+ with partialFilterExpression to avoid nulls.

export default mongoose.model<IBook>("Book", bookSchema);
