import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
	Box,
	Typography,
	CircularProgress,
	Divider,
	Button,
	TextField,
	Chip,
	Snackbar,
	Alert,
	Breadcrumbs,
	Link as MuiLink,
	Tooltip,
} from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import useOrder from "@hooks/useOrder";
import { BookService } from "@services/book.services";
import type { BookDto, BookFormatType } from "@my-types/book.dto";
import { ROUTES } from "@constants";

// ─── Small helper: labelled meta row ────────────────────────────────────────
const MetaRow = ({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) => (
	<Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
		<Box
			sx={{
				color: "primary.main",
				mt: 0.15,
				display: "flex",
				flexShrink: 0,
			}}
		>
			{icon}
		</Box>
		<Box>
			<Typography variant="caption" color="text.secondary" fontWeight={600} display="block" lineHeight={1.2}>
				{label}
			</Typography>
			<Typography variant="body2" fontWeight={500} color="text.primary">
				{value}
			</Typography>
		</Box>
	</Box>
);

// ─── Format label map ────────────────────────────────────────────────────────
const FORMAT_LABELS: Record<string, string> = {
	physical: "Physical",
	digital: "eBook",
	audiobook: "Audiobook",
};

// ─── Main component ──────────────────────────────────────────────────────────
const BookDetail = () => {
	const { bookId } = useParams();
	const [book, setBook] = useState<BookDto | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [selectedFormat, setSelectedFormat] = useState<BookFormatType | "">("");
	const { addItem, isMutating } = useOrder();
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	}>({ open: false, message: "", severity: "success" });

	useEffect(() => {
		let isMounted = true;
		const loadBook = async () => {
			if (!bookId) { if (isMounted) setIsLoading(false); return; }
			try {
				const detail = await BookService.fetchDetail(bookId);
				if (isMounted) {
					setBook(detail);
					setSelectedFormat((detail.formats?.[0]?.formatType ?? "") as BookFormatType | "");
				}
			} catch {
				if (isMounted) setBook(null);
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};
		void loadBook();
		return () => { isMounted = false; };
	}, [bookId]);

	const handleAddToCart = async () => {
		if (!bookId || !selectedFormat) return;
		try {
			await addItem({ bookId, selectedFormat, quantity });
			setSnackbar({ open: true, message: "Added to cart successfully.", severity: "success" });
		} catch (error: any) {
			setSnackbar({ open: true, message: error?.message ?? "Could not add to cart.", severity: "error" });
		}
	};

	// ── Loading ──
	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
				<CircularProgress />
			</Box>
		);
	}

	// ── Not found ──
	if (!book) {
		return (
			<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
				<AutoStoriesOutlinedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
				<Typography variant="h6" color="text.secondary">Book not found.</Typography>
				<MuiLink component={Link} to={ROUTES.CATEGORY} fontWeight={700}>Browse categories</MuiLink>
			</Box>
		);
	}

	// ── Derived values ──
	const authorNames: string[] = Array.isArray(book.authors)
		? book.authors
			.map<string>((a) => {
				if (typeof a === "string") return a;
				return a?.name ?? "";
			})
			.filter((name): name is string => name.length > 0)
		: [];

	const publisherName =
		typeof book.publisher === "string"
			? book.publisher
			: ((book.publisher as { name?: string } | undefined)?.name ?? "N/A");

	const activeFormat = book.formats?.find((f) => f.formatType === selectedFormat) ?? book.formats?.[0];
	const price = activeFormat?.price;
	const discountedPrice = activeFormat?.discountedPrice;
	const hasDiscount = discountedPrice != null && price != null && discountedPrice < price;
	const savingsAmount = hasDiscount ? (price! - discountedPrice!).toFixed(2) : null;
	const discountPct = hasDiscount ? Math.round(((price! - discountedPrice!) / price!) * 100) : 0;

	const pubYear = book.publicationDate
		? new Date(book.publicationDate).getFullYear()
		: "N/A";

	const langMap: Record<string, string> = { en: "English", vi: "Vietnamese", fr: "French", de: "German", es: "Spanish" };

	return (
		<>
			{/* Breadcrumbs */}
			<Breadcrumbs sx={{ mb: 4 }}>
				<MuiLink component={Link} to={ROUTES.CATEGORY} underline="hover" color="inherit">
					Categories
				</MuiLink>
				<Typography color="primary.main" fontWeight={700} noWrap sx={{ maxWidth: 260 }}>
					{book.title}
				</Typography>
			</Breadcrumbs>

			{/* ── Two-column layout ─────────────────────────────────────── */}
			<Box
				sx={{
					display: "flex",
					gap: { xs: 4, md: 6 },
					flexDirection: { xs: "column", md: "row" },
					alignItems: { xs: "center", md: "flex-start" },
				}}
			>
				{/* ── LEFT: sticky cover ──────────────────────────────────── */}
				<Box
					sx={{
						flexShrink: 0,
						width: { xs: "80%", sm: 280, md: 300 },
						position: { md: "sticky" },
						top: { md: 24 },
						alignSelf: { md: "flex-start" },
					}}
				>
					<Box
						sx={{
							borderRadius: 4,
							overflow: "hidden",
							boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
							aspectRatio: "3 / 4",
							bgcolor: "grey.100",
							position: "relative",
						}}
					>
						<Box
							component="img"
							src={book.coverImage || "https://via.placeholder.com/300x400?text=No+Cover"}
							alt={book.title}
							sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
						/>
						{hasDiscount && (
							<Box
								sx={{
									position: "absolute",
									top: 12,
									right: 12,
									bgcolor: "error.main",
									color: "white",
									fontWeight: 800,
									fontSize: "0.8rem",
									px: 1.25,
									py: 0.5,
									borderRadius: 2,
									boxShadow: "0 4px 12px rgba(211,47,47,0.45)",
								}}
							>
								-{discountPct}%
							</Box>
						)}
					</Box>

					{/* ISBN under cover */}
					{book.isbn && (
						<Typography
							variant="caption"
							color="text.disabled"
							display="block"
							textAlign="center"
							mt={1.5}
						>
							ISBN: {book.isbn}
						</Typography>
					)}
				</Box>

				{/* ── RIGHT: details panel ────────────────────────────────── */}
				<Box sx={{ flex: 1, minWidth: 0 }}>

					{/* Category chips */}
					{book.categories && book.categories.length > 0 && (
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
							{book.categories.map((cat: any, idx: number) => (
								<Chip
									key={idx}
									label={typeof cat === "string" ? cat : cat.name}
									size="small"
									color="primary"
									variant="outlined"
									sx={{ fontWeight: 700, fontSize: "0.68rem" }}
								/>
							))}
						</Box>
					)}

					{/* Title & subtitle */}
					<Typography
						variant="h4"
						fontWeight={900}
						sx={{ letterSpacing: "-0.02em", lineHeight: 1.2, mb: 0.75 }}
					>
						{book.title}
					</Typography>

					{book.subtitle && (
						<Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1.5, fontStyle: "italic" }}>
							{book.subtitle}
						</Typography>
					)}

					{/* Authors */}
					{authorNames.length > 0 && (
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
							by{" "}
							<Box component="span" fontWeight={700} color="text.primary">
								{authorNames.join(" & ")}
							</Box>
						</Typography>
					)}

					<Divider sx={{ mb: 3 }} />

					{/* ── Price block ─────────────────────────────────── */}
					<Box
						sx={{
							display: "inline-flex",
							flexDirection: "column",
							gap: 0.5,
							mb: 3,
							p: 2,
							bgcolor: hasDiscount ? "error.50" : "grey.50",
							border: "1px solid",
							borderColor: hasDiscount ? "error.100" : "grey.200",
							borderRadius: 3,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
							<Typography
								variant="h4"
								fontWeight={900}
								color={hasDiscount ? "error.main" : "text.primary"}
								lineHeight={1}
							>
								${hasDiscount ? Number(discountedPrice).toFixed(2) : Number(price).toFixed(2)}
							</Typography>

							{hasDiscount && (
								<Typography
									variant="h6"
									color="text.disabled"
									sx={{ textDecoration: "line-through" }}
									lineHeight={1}
								>
									${Number(price).toFixed(2)}
								</Typography>
							)}
						</Box>

						{hasDiscount && (
							<Typography variant="caption" color="error.main" fontWeight={700}>
								You save ${savingsAmount} ({discountPct}% off)
							</Typography>
						)}
					</Box>

					{/* ── Format selector ──────────────────────────────── */}
					{book.formats && book.formats.length > 0 && (
						<Box sx={{ mb: 3 }}>
							<Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
								Format
							</Typography>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
								{book.formats.map((fmt) => {
									const isSelected = selectedFormat === fmt.formatType;
									return (
										<Tooltip
											key={fmt.formatType}
											title={`$${Number(fmt.discountedPrice ?? fmt.price).toFixed(2)}`}
											arrow
										>
											<Button
												variant={isSelected ? "contained" : "outlined"}
												disableElevation
												size="small"
												onClick={() => setSelectedFormat(fmt.formatType as BookFormatType)}
												startIcon={<LocalOfferOutlinedIcon sx={{ fontSize: "14px !important" }} />}
												sx={{
													borderRadius: 2.5,
													textTransform: "none",
													fontWeight: 700,
													fontSize: "0.8rem",
													px: 2,
													transition: "all 0.18s ease",
												}}
											>
												{FORMAT_LABELS[fmt.formatType] ?? fmt.formatType}
											</Button>
										</Tooltip>
									);
								})}
							</Box>
						</Box>
					)}

					{/* ── Quantity + Add to cart ───────────────────────── */}
					<Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 4, flexWrap: "wrap" }}>
						<TextField
							type="number"
							label="Qty"
							size="small"
							value={quantity}
							onChange={(e) => {
								const v = Number(e.target.value);
								setQuantity(Number.isNaN(v) || v < 1 ? 1 : v);
							}}
							inputProps={{ min: 1 }}
							sx={{
								width: 90,
								"& .MuiOutlinedInput-root": { borderRadius: 2 },
							}}
						/>
						<Button
							variant="contained"
							color="primary"
							size="large"
							disabled={!selectedFormat || isMutating}
							onClick={handleAddToCart}
							startIcon={<AddShoppingCartIcon />}
							disableElevation
							sx={{
								borderRadius: 2.5,
								textTransform: "none",
								fontWeight: 700,
								px: 3,
								boxShadow: "0 4px 14px rgba(25,118,210,0.35)",
								"&:hover": { boxShadow: "0 6px 20px rgba(25,118,210,0.45)" },
							}}
						>
							{isMutating ? "Adding…" : "Add to Cart"}
						</Button>
					</Box>

					<Divider sx={{ mb: 3 }} />

					{/* ── Book metadata ────────────────────────────────── */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
							gap: 2.5,
							mb: 4,
						}}
					>
						<MetaRow
							icon={<CalendarTodayOutlinedIcon fontSize="small" />}
							label="Published"
							value={pubYear}
						/>
						<MetaRow
							icon={<MenuBookOutlinedIcon fontSize="small" />}
							label="Pages"
							value={book.pageCount ?? "N/A"}
						/>
						<MetaRow
							icon={<LanguageOutlinedIcon fontSize="small" />}
							label="Language"
							value={langMap[book.language ?? ""] ?? book.language ?? "N/A"}
						/>
						<MetaRow
							icon={<BusinessOutlinedIcon fontSize="small" />}
							label="Publisher"
							value={publisherName}
						/>
					</Box>

					<Divider sx={{ mb: 3 }} />

					{/* ── Description ──────────────────────────────────── */}
					<Box>
						<Typography
							variant="overline"
							color="text.secondary"
							fontWeight={800}
							display="block"
							mb={1.5}
							sx={{ letterSpacing: 1.5 }}
						>
							About this book
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ lineHeight: 1.85, whiteSpace: "pre-line" }}
						>
							{book.description}
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* ── Toast ──────────────────────────────────────────────────── */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
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