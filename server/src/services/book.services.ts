import { Book } from "@models";
import { HttpError } from "@middleware/error.middleware";
import type { IBook } from "@models/book.model";
import { createBookSchema } from "@schemas/book.schema";

export const createBook = async (dto: IBook): Promise<IBook> => {
	const parsed = createBookSchema.safeParse(dto);
	if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);

	try {
		// If ISBN provided, ensure uniqueness
		if (parsed.data.isbn) {
			const existing = await Book.findOne({ isbn: parsed.data.isbn }).exec();
			if (existing) throw new HttpError("A book with this ISBN already exists", 409);
		}

		const book = await Book.create({ ...parsed.data });
		return book;
	} catch (error: any) {
		if (error.name === "ValidationError") {
			throw new HttpError(error.message, 400);
		}

		throw error;
	}
};

export const listBook = async () => {
	
}