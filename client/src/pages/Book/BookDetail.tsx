import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Box,
	Typography,
	Card,
	CardMedia,
	CircularProgress,
	Divider,
	Button,
	TextField,
	MenuItem,
	FormControl,
	InputLabel,
	Select,
	Snackbar,
	Alert,
} from "@mui/material";
import useOrder from "@hooks/useOrder";
import { BookService } from "@services/book.services";
import type { BookDto, BookFormatType } from "@my-types/book.dto";

const BookDetail = () => {
	const { bookId } = useParams();
	const [book, setBook] = useState<BookDto | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [quantity, setQuantity] = useState<number>(1);
	const [selectedFormat, setSelectedFormat] = useState<BookFormatType | "">("");
	const { addItem, isMutating } = useOrder();
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		let isMounted = true;

		const loadBook = async () => {
			if (!bookId) {
				if (isMounted) setIsLoading(false);
				return;
			}

			try {
				const detail = await BookService.fetchDetail(bookId);
				if (isMounted) {
					setBook(detail);
					const firstActiveFormat = detail.formats?.[0]?.formatType ?? "";
					setSelectedFormat(firstActiveFormat as BookFormatType | "");
				}
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

	const handleAddToCart = async () => {
		if (!bookId || !selectedFormat) return;

		try {
			await addItem({
				bookId,
				selectedFormat,
				quantity,
			});
			setSnackbar({
				open: true,
				message: "Đã thêm sản phẩm vào giỏ hàng.",
				severity: "success",
			});
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message ?? "Không thể thêm sản phẩm vào giỏ hàng.",
				severity: "error",
			});
		}
	};

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
		<>
			<Box display="flex" justifyContent="center" mt={5}>
				<Card
					sx={{
						display: "flex",
						width: 900,
						p: 3,
						gap: 4,
						boxShadow: 3,
						borderRadius: 3,
					}}
				>
					{book.coverImage && (
						<CardMedia
							component="img"
							sx={{ width: 280, borderRadius: 2 }}
							image={book.coverImage || "https://via.placeholder.com/280"}
							alt={book.title}
						/>
					)}

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
							<b>Năm xuất bản:</b>{" "}
							{book.publicationDate ? new Date(book.publicationDate).getFullYear() : "N/A"}
						</Typography>

						<Typography mb={2}>
							<b>Nhà xuất bản:</b> {publisherText}
						</Typography>

						<Divider sx={{ my: 2 }} />

						{/* Khu vực thao tác giỏ hàng: chọn định dạng, số lượng và thêm vào giỏ */}
						<Box display="flex" gap={2} alignItems="center" mb={3}>
							<FormControl size="small" sx={{ minWidth: 160 }}>
								<InputLabel id="book-format-label">Định dạng</InputLabel>
								<Select
									labelId="book-format-label"
									label="Định dạng"
									value={selectedFormat}
									onChange={(e) => setSelectedFormat(e.target.value as BookFormatType | "")}
								>
									{book.formats?.map((format) => (
										<MenuItem key={format.formatType} value={format.formatType}>
											{format.formatType === "physical"
												? "Bản in"
												: format.formatType === "digital"
													? "Ebook"
													: "Audiobook"}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<TextField
								type="number"
								label="Số lượng"
								size="small"
								inputProps={{ min: 1 }}
								value={quantity}
								onChange={(e) => {
									const value = Number(e.target.value);
									setQuantity(Number.isNaN(value) || value < 1 ? 1 : value);
								}}
								sx={{ width: 120 }}
							/>

							<Button
								variant="contained"
								color="primary"
								disabled={!selectedFormat || isMutating}
								onClick={handleAddToCart}
							>
								Thêm vào giỏ
							</Button>
						</Box>

						<Divider sx={{ my: 2 }} />

						<Typography variant="h6" mb={1}>
							Mô tả
						</Typography>

						<Typography color="text.secondary">{book.description}</Typography>
					</Box>
				</Card>
			</Box>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default BookDetail;