import mongoose from "mongoose";
import { HttpError } from "@middleware/error.middleware";
import { Book, Cart } from "@models";
import type { BookFormatType } from "@models/book.model";
import type { ICart } from "@models/cart.model";

type AddToCartInput = {
	bookId: string;
	quantity: number;
	selectedFormat: BookFormatType;
};

type UpdateCartInput = {
	bookId: string;
	quantity: number;
	selectedFormat: BookFormatType;
};

type RemoveFromCartInput = {
	bookId: string;
	selectedFormat: BookFormatType;
};

const ensureValidObjectId = (value: string, label = "ID"): void => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		throw new HttpError(`Invalid ${label}`, 400);
	}
};

const ensurePositiveQuantity = (quantity: number): void => {
	if (!Number.isInteger(quantity) || quantity < 1) {
		throw new HttpError("Quantity must be an integer greater than 0", 400);
	}
};

const recalculateTotals = (cart: ICart) => {
	const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	const discountAmount = cart.discountAmount ?? 0;

	cart.subtotal = Number(subtotal.toFixed(2));
	cart.discountAmount = Number(discountAmount.toFixed(2));
	cart.totalAmount = Number((cart.subtotal - cart.discountAmount).toFixed(2));
};

const findOrCreateCart = async (userId: string): Promise<ICart> => {
	let cart = await Cart.findOne({ user: userId }).exec();

	if (!cart) {
		cart = await Cart.create({ user: userId, items: [] });
	}

	// Chuẩn hoá currency về VND cho cả cart cũ đã lưu USD trước đó
	if (cart.currency !== "VND") {
		cart.currency = "VND";
		await cart.save();
	}

	return cart;
};

const resolveUnitPrice = async (bookId: string, selectedFormat: BookFormatType): Promise<number> => {
	const book = await Book.findById(bookId).select("formats").exec();
	if (!book) throw new HttpError("Book not found", 404);

	const format = book.formats.find((item) => item.formatType === selectedFormat && item.active !== false);
	if (!format) throw new HttpError("Selected format is not available for this book", 400);

	return Number((format.discountedPrice ?? format.price).toFixed(2));
};

export const getCart = async (userId: string): Promise<ICart> => {
	ensureValidObjectId(userId, "user ID");

	const cart = await findOrCreateCart(userId);
	return await cart.populate("items.book");
};

export const addToCart = async (userId: string, dto: AddToCartInput): Promise<ICart> => {
	ensureValidObjectId(userId, "user ID");
	ensureValidObjectId(dto.bookId, "book ID");
	ensurePositiveQuantity(dto.quantity);

	const unitPrice = await resolveUnitPrice(dto.bookId, dto.selectedFormat);
	const cart = await findOrCreateCart(userId);

	const existingIndex = cart.items.findIndex(
		(item) => item.book.toString() === dto.bookId && item.selectedFormat === dto.selectedFormat,
	);

	if (existingIndex >= 0) {
		cart.items[existingIndex].quantity += dto.quantity;
		cart.items[existingIndex].unitPrice = unitPrice;
	} else {
		cart.items.push({
			book: new mongoose.Types.ObjectId(dto.bookId),
			quantity: dto.quantity,
			selectedFormat: dto.selectedFormat,
			unitPrice,
			addedAt: new Date(),
		});
	}

	recalculateTotals(cart);
	await cart.save();

	return await cart.populate("items.book");
};

export const updateCart = async (userId: string, dto: UpdateCartInput): Promise<ICart> => {
	ensureValidObjectId(userId, "user ID");
	ensureValidObjectId(dto.bookId, "book ID");
	ensurePositiveQuantity(dto.quantity);

	const unitPrice = await resolveUnitPrice(dto.bookId, dto.selectedFormat);
	const cart = await findOrCreateCart(userId);

	const existingIndex = cart.items.findIndex(
		(item) => item.book.toString() === dto.bookId && item.selectedFormat === dto.selectedFormat,
	);

	if (existingIndex < 0) {
		throw new HttpError("Cart item not found", 404);
	}

	cart.items[existingIndex].quantity = dto.quantity;
	cart.items[existingIndex].unitPrice = unitPrice;

	recalculateTotals(cart);
	await cart.save();

	return await cart.populate("items.book");
};

export const removeFromCart = async (userId: string, dto: RemoveFromCartInput): Promise<ICart> => {
	ensureValidObjectId(userId, "user ID");
	ensureValidObjectId(dto.bookId, "book ID");

	const cart = await findOrCreateCart(userId);
	const previousLength = cart.items.length;

	cart.items = cart.items.filter(
		(item) => !(item.book.toString() === dto.bookId && item.selectedFormat === dto.selectedFormat),
	);

	if (previousLength === cart.items.length) {
		throw new HttpError("Cart item not found", 404);
	}

	recalculateTotals(cart);
	await cart.save();

	return await cart.populate("items.book");
};

export const getItemCount = async (userId: string): Promise<number> => {
    ensureValidObjectId(userId, "user ID");
    const cart = await Cart.findOne({ user: userId }).exec();
    return cart ? cart.items.length : 0;
}