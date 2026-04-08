import { NextFunction, Request, Response } from "express";
import * as bookServices from "@services/book.services";
import { HttpError } from "@middleware/error.middleware";

type BookIdParam = { bookId: string };
type BookFormatParam = { bookId: string; formatId: string };

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.createBook(req.body);
		return res.status(201).json(book);
	} catch (err) {
		next(err);
	}
};

export const listBooks = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { page, limit, search, language, order } = req.query as Record<string, string>;

		const result = await bookServices.listBooks({
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
			search,
			language,
			order: order as "asc" | "desc" | undefined,
		});

		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

export const getBook = async (req: Request<BookIdParam>, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.getBook(req.params.bookId);
		if (!book) return next(new HttpError("Book not found", 404));

		return res.status(200).json(book);
	} catch (err) {
		next(err);
	}
};

export const replaceBook = async (req: Request<BookIdParam>, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.replaceBook(req.params.bookId, req.body);
		return res.status(200).json(book);
	} catch (err) {
		next(err);
	}
};

export const updateBook = async (req: Request<BookIdParam>, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.updateBook(req.params.bookId, req.body);
		return res.status(200).json(book);
	} catch (err) {
		next(err);
	}
};

export const deleteBook = async (req: Request<BookIdParam>, res: Response, next: NextFunction) => {
	try {
		await bookServices.deleteBook(req.params.bookId);
		return res.status(204).send();
	} catch (err) {
		next(err);
	}
};

export const addFormat = async (req: Request<BookIdParam>, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.addFormat(req.params.bookId, req.body);
		return res.status(201).json(book);
	} catch (err) {
		next(err);
	}
};

export const updateFormat = async (req: Request<BookFormatParam>, res: Response, next: NextFunction) => {
	try {
		const book = await bookServices.updateFormat(req.params.bookId, req.params.formatId, req.body);
		return res.status(200).json(book);
	} catch (err) {
		next(err);
	}
};

export const removeFormat = async (req: Request<BookFormatParam>, res: Response, next: NextFunction) => {
	try {
		await bookServices.removeFormat(req.params.bookId, req.params.formatId);
		return res.status(204).send();
	} catch (err) {
		next(err);
	}
};
