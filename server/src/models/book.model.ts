import mongoose, { Schema } from "mongoose";
import { IPublisher } from "@models/publisher.model";
import { IAuthor } from "./author.model";
import { ICategory } from "./category.model";
import slugify from "slugify";

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

	createdAt: Date;
	updatedAt: Date;
}

const bookFormatSchema = new Schema<IBookFormat>(
	{
		formatType: {
			type: String,
			enum: ["physical", "digital", "audiobook"],
			required: true,
		},
		sku: { type: String, required: true },
		isbn: { type: String },
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
	id: string;
	title: string;
	slug: string;
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
		slug: { type: String, required: true, unique: true },
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

bookSchema.index({ title: "text", description: "text" });

bookSchema.index({ "formats.sku": 1 }, { unique: true }); // SKU must be globally unique
bookSchema.index({ "formats.isbn": 1 }, { unique: true, sparse: true }); // sparse allows nulls/undefined

bookSchema.set("toJSON", {
	transform: (_doc, ret: any) => {
		delete ret.__v;
		return ret;
	},
});

bookSchema.pre("validate", async function () {
	// Only burn database cycles if the title was actually modified
	if (this.isModified("title")) {
		try {
			let slugString = this.title;

			// Grab the primary author's ID (assuming the first author in the array is primary)
			const primaryAuthorId = this.authors[0];

			if (primaryAuthorId) {
				// Dynamically fetch the Author model to avoid circular dependency imports
				const AuthorModel = mongoose.model("Author");
				const authorDoc: any = await AuthorModel.findById(primaryAuthorId).select("name").lean().exec();

				if (authorDoc) {
					slugString = `${this.title}-${authorDoc.name}`;
				}
			}

			// Generate the final clean string
			this.slug = slugify(slugString, { lower: true, strict: true });
		} catch (error: any) {
			throw error;
		}
	}
});

export default mongoose.model<IBook>("Book", bookSchema);
