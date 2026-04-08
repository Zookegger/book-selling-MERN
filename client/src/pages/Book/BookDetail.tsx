import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Box,
	Typography,
	Card,
	CardMedia,
	CircularProgress,
	Divider
} from "@mui/material";
import { BookService } from "@services/book.services";
import type { BookDto } from "@my-types/book.dto";

const BookDetail = () => {
	const { bookId } = useParams();
	const [book, setBook] = useState<BookDto | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const loadBook = async () => {
			if (!bookId) {
				if (isMounted) setIsLoading(false);
				return;
			}

			try {
				const detail = await BookService.fetchDetail(bookId);
				if (isMounted) setBook(detail);
			} catch {
				if (isMounted) setBook(null);
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		void loadBook();
		return () => {
			isMounted = false;
		};
	}, [bookId]);

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" mt={5}>
				<CircularProgress />
			</Box>
		);
	}

	if (!book) {
		return (
			<Box display="flex" justifyContent="center" mt={5}>
				<Typography color="text.secondary">Book not found.</Typography>
			</Box>
		);
	}

	const authorText =
		Array.isArray(book.authors) && book.authors.length > 0
			? book.authors
				.map((a) => (typeof a === "string" ? a : (a?.name as string | undefined) ?? ""))
				.filter(Boolean)
				.join(", ")
			: "Đang cập nhật";

	const publisherText =
		typeof book.publisher === "string"
			? book.publisher
			: ((book.publisher as { name?: string } | undefined)?.name ?? "N/A");

	const displayPrice = book.formats?.[0]?.price;

	return (
		<Box display="flex" justifyContent="center" mt={5}>
			<Card
				sx={{
					display: "flex",
					width: 900,
					p: 3,
					gap: 4,
					boxShadow: 3,
					borderRadius: 3
				}}
			>
				{
					book.coverImage &&

					<CardMedia
						component="img"
						sx={{ width: 280, borderRadius: 2 }}
						image={book.coverImage || "https://via.placeholder.com/280"}
						alt={book.title}
					/>
				}

				<Box flex={1}>
					<Typography variant="h4" fontWeight="bold" mb={2}>
						{book.title}
					</Typography>

					<Typography variant="h5" color="primary" mb={2}>
						{displayPrice != null ? `${displayPrice.toLocaleString()} VND` : "N/A"}
					</Typography>

					<Divider sx={{ my: 2 }} />

					<Typography mb={1}>
						<b>Tác giả:</b> {authorText}
					</Typography>

					<Typography mb={1}>
						<b>Năm xuất bản:</b> {book.publicationDate ? new Date(book.publicationDate).getFullYear() : "N/A"}
					</Typography>

					<Typography mb={2}>
						<b>Nhà xuất bản:</b> {publisherText}
					</Typography>

					<Divider sx={{ my: 2 }} />

					<Typography variant="h6" mb={1}>
						Mô tả
					</Typography>

					<Typography color="text.secondary">
						{book.description}
					</Typography>
				</Box>
			</Card>
		</Box>
	);
};

export default BookDetail;