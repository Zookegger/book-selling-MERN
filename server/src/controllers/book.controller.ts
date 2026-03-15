import { NextFunction, Request, Response } from "express";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
	// TODO: implement create book (with formats)
	res.status(201).json({ message: "Create book - not implemented" });
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
	// pagination: ?page=&limit=
	const page = Number(req.query.page) || 1;
	const limit = Number(req.query.limit) || 10;
	res.status(200).json({ message: "List books - not implemented", page, limit });
};

const getBook = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId } = req.params;
	res.status(200).json({ message: "Get book - not implemented", bookId });
};

const replaceBook = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId } = req.params;
	res.status(200).json({ message: "Replace book (PUT) - not implemented", bookId });
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId } = req.params;
	res.status(200).json({ message: "Update book (PATCH) - not implemented", bookId });
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId } = req.params;
	res.status(204).send();
};

const addFormat = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId } = req.params;
	res.status(201).json({ message: "Add format - not implemented", bookId });
};

const updateFormat = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId, formatId } = req.params;
	res.status(200).json({ message: "Update format - not implemented", bookId, formatId });
};

const removeFormat = async (req: Request, res: Response, next: NextFunction) => {
	const { bookId, formatId } = req.params;
	res.status(204).send();
};
