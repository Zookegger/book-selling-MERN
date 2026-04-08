import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, CloudUpload, DeleteOutline, Edit, Refresh, RemoveCircleOutline } from "@mui/icons-material";
import { BookCopy } from "lucide-react";
import { BookService } from "@services/book.services";
import { ApiError } from "@services/api";
import { authorService } from "@services/author.services";
import { categoryService } from "@services/category.services";
import publisherService from "@services/publisher.services";
import uploadService from "@services/upload.services";
import useSnackbar from "@hooks/useSnackbar";
import type { AuthorDto } from "@my-types/author.dto";
import type { BookDto, BookFormatDto, BookFormatType, CreateBookDto, UpdateBookDto } from "@my-types/book.dto";
import type { CategoryDto } from "@my-types/category.dto";
import type { PublisherDto } from "@my-types/publisher.dto";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookFormatFormState {
    formatType: BookFormatType;
    sku: string;
    isbn: string;
    price: string;
    discountedPrice: string;
    currency: string;
    active: boolean;
    releaseDate: string;
    stockQuantity: string;
    weight: string;
    dimensions: string;
    file: string;
    fileFormat: "" | "PDF" | "ePub" | "MOBI";
    fileSize: string;
    downloadLimit: string;
    sampleFile: string;
}

interface BookFormState {
    title: string;
    subtitle: string;
    description: string;
    isbn: string;
    publicationDate: string;
    language: string;
    pageCount: string;
    coverImage: string;
    publisher: string;
    authors: string[];
    categories: string[];
    formats: BookFormatFormState[];
}

type SectionId = "profile" | "publishing" | "cover" | "formats";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: Array<{ value: BookFormatType; label: string }> = [
    { value: "physical", label: "Physical" },
    { value: "digital", label: "Digital" },
    { value: "audiobook", label: "Audiobook" },
];

const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "vi", label: "Vietnamese" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "es", label: "Spanish" },
];

const formatLabelMap: Record<BookFormatType, string> = {
    physical: "Physical",
    digital: "Digital",
    audiobook: "Audiobook",
};

const SECTIONS: Array<{ id: SectionId; label: string }> = [
    { id: "profile", label: "Book profile" },
    { id: "publishing", label: "Publishing" },
    { id: "cover", label: "Cover media" },
    { id: "formats", label: "Formats" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPublicAssetUrl = (value: string): string => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
    const origin = apiUrl.replace(/\/api\/?$/, "");
    return value.startsWith("/") ? `${origin}${value}` : `${origin}/${value}`;
};

const createEmptyFormatState = (): BookFormatFormState => ({
    formatType: "physical",
    sku: "",
    isbn: "",
    price: "",
    discountedPrice: "",
    currency: "USD",
    active: true,
    releaseDate: "",
    stockQuantity: "",
    weight: "",
    dimensions: "",
    file: "",
    fileFormat: "",
    fileSize: "",
    downloadLimit: "",
    sampleFile: "",
});

const createEmptyBookForm = (): BookFormState => ({
    title: "",
    subtitle: "",
    description: "",
    isbn: "",
    publicationDate: "",
    language: "en",
    pageCount: "",
    coverImage: "",
    publisher: "",
    authors: [],
    categories: [],
    formats: [createEmptyFormatState()],
});

const toDateInput = (value?: string): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const normalizeOptionalText = (value: string): string | undefined => {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
};

const coerceNumber = (value: string): number | undefined => {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const getEntityId = (value: { id?: string; _id?: string } | string | undefined | null): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.id ?? value._id ?? "";
};

const toBookFormState = (book: BookDto): BookFormState => {
    const formatStates =
        book.formats.length > 0
            ? book.formats.map<BookFormatFormState>((format) => ({
                formatType: format.formatType,
                sku: format.sku ?? "",
                isbn: format.isbn ?? "",
                price: format.price?.toString() ?? "",
                discountedPrice: format.discountedPrice?.toString() ?? "",
                currency: format.currency ?? "USD",
                active: format.active ?? true,
                releaseDate: toDateInput(format.releaseDate),
                stockQuantity: format.stockQuantity?.toString() ?? "",
                weight: format.weight?.toString() ?? "",
                dimensions: format.dimensions ?? "",
                file: format.file ?? "",
                fileFormat: (format.fileFormat ?? "") as BookFormatFormState["fileFormat"],
                fileSize: format.fileSize?.toString() ?? "",
                downloadLimit: format.downloadLimit?.toString() ?? "",
                sampleFile: format.sampleFile ?? "",
            }))
            : [createEmptyFormatState()];

    const publisherId = getEntityId(book.publisher as PublisherDto | undefined);
    const authorIds = (book.authors as Array<AuthorDto | string>)
        .map((a) => getEntityId(a as AuthorDto | string))
        .filter(Boolean);
    const categoryIds = (book.categories as Array<CategoryDto | string>)
        .map((c) => getEntityId(c as CategoryDto | string))
        .filter(Boolean);

    return {
        title: book.title,
        subtitle: book.subtitle ?? "",
        description: book.description,
        isbn: book.isbn ?? "",
        publicationDate: toDateInput(book.publicationDate),
        language: book.language ?? "en",
        pageCount: book.pageCount?.toString() ?? "",
        coverImage: book.coverImage ?? "",
        publisher: publisherId,
        authors: authorIds,
        categories: categoryIds,
        formats: formatStates,
    };
};

const validateForm = (formState: BookFormState): string | null => {
    if (!formState.title.trim()) return "Title is required.";
    if (!formState.description.trim()) return "Description is required.";
    if (!formState.publicationDate) return "Publication date is required.";
    if (formState.formats.length === 0) return "At least one book format is required.";

    for (const [index, format] of formState.formats.entries()) {
        if (!format.sku.trim()) return `Format #${index + 1}: SKU is required.`;
        const price = coerceNumber(format.price);
        if (price == null || price < 0) return `Format #${index + 1}: Price must be a valid non-negative number.`;
        const discounted = coerceNumber(format.discountedPrice);
        if (discounted != null && discounted > price) return `Format #${index + 1}: Discounted price cannot exceed price.`;
        const currency = (format.currency.trim() || "USD").toUpperCase();
        if (currency.length !== 3) return `Format #${index + 1}: Currency must be a 3-letter code.`;
        const stock = coerceNumber(format.stockQuantity);
        if (format.formatType === "physical" && stock != null && stock < 0) return `Format #${index + 1}: Stock quantity must be non-negative.`;
        const fileSize = coerceNumber(format.fileSize);
        if (fileSize != null && fileSize < 0) return `Format #${index + 1}: File size must be non-negative.`;
        const downloadLimit = coerceNumber(format.downloadLimit);
        if (format.formatType === "digital" && downloadLimit != null && downloadLimit < 1) return `Format #${index + 1}: Download limit must be at least 1.`;
    }

    return null;
};

const buildPayload = (formState: BookFormState): CreateBookDto | UpdateBookDto => {
    const payload: CreateBookDto = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        publicationDate: formState.publicationDate,
        language: formState.language.trim() || "en",
    };

    const subtitle = normalizeOptionalText(formState.subtitle);
    if (subtitle) payload.subtitle = subtitle;
    const bookIsbn = normalizeOptionalText(formState.isbn);
    if (bookIsbn) payload.isbn = bookIsbn;
    const pageCount = coerceNumber(formState.pageCount);
    if (pageCount != null) payload.pageCount = pageCount;
    const coverImage = normalizeOptionalText(formState.coverImage);
    if (coverImage) payload.coverImage = coverImage;
    if (formState.publisher) payload.publisher = formState.publisher;
    if (formState.authors.length > 0) payload.authors = formState.authors;
    if (formState.categories.length > 0) payload.categories = formState.categories;

    payload.formats = formState.formats.map((format) => {
        const normalizedFormat: BookFormatDto = {
            formatType: format.formatType,
            sku: format.sku.trim(),
            price: Number(format.price),
            currency: (format.currency.trim() || "USD").toUpperCase(),
            active: format.active,
        };

        const formatIsbn = normalizeOptionalText(format.isbn);
        if (formatIsbn) normalizedFormat.isbn = formatIsbn;
        const discountedPrice = coerceNumber(format.discountedPrice);
        if (discountedPrice != null) normalizedFormat.discountedPrice = discountedPrice;
        const releaseDate = normalizeOptionalText(format.releaseDate);
        if (releaseDate) normalizedFormat.releaseDate = releaseDate;

        if (format.formatType === "physical") {
            const stockQuantity = coerceNumber(format.stockQuantity);
            if (stockQuantity != null) normalizedFormat.stockQuantity = stockQuantity;
            const weight = coerceNumber(format.weight);
            if (weight != null) normalizedFormat.weight = weight;
            const dimensions = normalizeOptionalText(format.dimensions);
            if (dimensions) normalizedFormat.dimensions = dimensions;
        }

        if (format.formatType === "digital" || format.formatType === "audiobook") {
            const file = normalizeOptionalText(format.file);
            if (file) normalizedFormat.file = file;
            const fileSize = coerceNumber(format.fileSize);
            if (fileSize != null) normalizedFormat.fileSize = fileSize;
            const sampleFile = normalizeOptionalText(format.sampleFile);
            if (sampleFile) normalizedFormat.sampleFile = sampleFile;
        }

        if (format.formatType === "digital") {
            if (format.fileFormat) normalizedFormat.fileFormat = format.fileFormat;
            const downloadLimit = coerceNumber(format.downloadLimit);
            if (downloadLimit != null) normalizedFormat.downloadLimit = downloadLimit;
        }

        return normalizedFormat;
    });

    return payload;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookManagement() {
    // Table state
    const [books, setBooks] = useState<BookDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [languageFilter, setLanguageFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookDto | null>(null);
    const [formState, setFormState] = useState<BookFormState>(createEmptyBookForm());
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
    const [coverUploadLoading, setCoverUploadLoading] = useState(false);
    const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
    const [isDraggingCover, setIsDraggingCover] = useState(false);

    // Section navigation
    const [activeSection, setActiveSection] = useState<SectionId>("profile");
    const [visitedSections, setVisitedSections] = useState<Set<SectionId>>(new Set(["profile"]));

    // Reference data
    const [authors, setAuthors] = useState<AuthorDto[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [publishers, setPublishers] = useState<PublisherDto[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(false);

    const { success, error: showError } = useSnackbar();

    const authorLookup = useMemo(() => new Map(authors.map((a) => [a.id, a.name])), [authors]);
    const categoryLookup = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
    const publisherLookup = useMemo(() => new Map(publishers.map((p) => [p.id, p.name])), [publishers]);

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchBooks = useCallback(
        async ({ page = 1, search = "", language = "" }: { page?: number; search?: string; language?: string } = {}) => {
            setLoading(true);
            setPageError(null);
            try {
                const response = await BookService.fetchAll({
                    page,
                    limit: pageSize,
                    search: search.trim() || undefined,
                    language: language || undefined,
                    order: "desc",
                });
                setBooks(response.data ?? []);
                setTotal(response.total ?? 0);
                setCurrentPage(response.page ?? page);
                setTotalPages(response.totalPages ?? 0);
            } catch (err) {
                setPageError(err instanceof ApiError ? err.message : "Unable to load books.");
            } finally {
                setLoading(false);
            }
        },
        [pageSize],
    );

    const fetchReferenceData = useCallback(async () => {
        setMetadataLoading(true);
        try {
            const [authorsRes, categoriesRes, publishersRes] = await Promise.all([
                authorService.listAuthors({ page: 1, limit: 200 }),
                categoryService.listCategories({ page: 1, limit: 200 }),
                publisherService.listPublishers({ page: 1, limit: 200 }),
            ]);
            setAuthors(authorsRes.data ?? []);
            setCategories(categoriesRes.data ?? []);
            setPublishers(publishersRes.data ?? []);
        } catch (err) {
            showError(err instanceof ApiError ? err.message : "Unable to load reference data.");
        } finally {
            setMetadataLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        void fetchBooks({ page: 1, search: searchTerm, language: languageFilter });
    }, [fetchBooks, pageSize]);

    useEffect(() => {
        void fetchReferenceData();
    }, [fetchReferenceData]);

    // ── Dialog helpers ─────────────────────────────────────────────────────────

    const goToSection = (id: SectionId) => {
        setActiveSection(id);
        setVisitedSections((prev) => new Set([...prev, id]));
    };

    const sectionProgress = ((SECTIONS.findIndex((s) => s.id === activeSection) + 1) / SECTIONS.length) * 100;

    const openCreateDialog = () => {
        setSelectedBook(null);
        setFormState(createEmptyBookForm());
        setFormError(null);
        setActiveSection("profile");
        setVisitedSections(new Set(["profile"]));
        setDialogOpen(true);
    };

    const openEditDialog = (book: BookDto) => {
        setSelectedBook(book);
        setFormState(toBookFormState(book));
        setFormError(null);
        setActiveSection("profile");
        setVisitedSections(new Set(["profile"]));
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (isSubmitting) return;
        setDialogOpen(false);
        setSelectedBook(null);
        setFormState(createEmptyBookForm());
        setFormError(null);
        setCoverUploadLoading(false);
        setUploadingTarget(null);
        setIsDraggingCover(false);
    };

    // ── Form field helpers ─────────────────────────────────────────────────────

    const updateField = <K extends keyof BookFormState>(field: K, value: BookFormState[K]) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const updateFormatField = <K extends keyof BookFormatFormState>(
        index: number,
        field: K,
        value: BookFormatFormState[K],
    ) => {
        setFormState((prev) => {
            const nextFormats = [...prev.formats];
            const currentFormat = nextFormats[index];
            if (!currentFormat) return prev;

            if (field === "formatType") {
                const nextType = value as BookFormatType;
                nextFormats[index] = {
                    ...currentFormat,
                    formatType: nextType,
                    stockQuantity: "",
                    weight: "",
                    dimensions: "",
                    file: "",
                    fileFormat: nextType === "digital" ? "PDF" : "",
                    fileSize: "",
                    downloadLimit: "",
                    sampleFile: "",
                };
            } else {
                nextFormats[index] = { ...currentFormat, [field]: value } as BookFormatFormState;
            }

            return { ...prev, formats: nextFormats };
        });
    };

    const addFormat = () => {
        setFormState((prev) => ({ ...prev, formats: [...prev.formats, createEmptyFormatState()] }));
    };

    const removeFormat = (index: number) => {
        setFormState((prev) => {
            if (prev.formats.length === 1) return prev;
            return { ...prev, formats: prev.formats.filter((_, i) => i !== index) };
        });
    };

    // ── Upload handlers ────────────────────────────────────────────────────────

    const handleCoverUploadFile = async (file: File) => {
        setCoverUploadLoading(true);
        setFormError(null);
        try {
            const response = await uploadService.uploadFile(file, "cover");
            updateField("coverImage", response.path || response.url);
            success("Cover image uploaded.");
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Could not upload cover image.";
            setFormError(message);
            showError(message);
        } finally {
            setCoverUploadLoading(false);
        }
    };

    const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleCoverUploadFile(file);
        event.target.value = "";
    };

    const handleFormatUpload =
        (index: number, field: "file" | "sampleFile") =>
            async (event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const uploadKey = `${field}-${index}`;
                setUploadingTarget(uploadKey);
                setFormError(null);
                try {
                    const response = await uploadService.uploadFile(file, field === "sampleFile" ? "sample" : "asset");
                    updateFormatField(index, field, response.path || response.url);
                    success(field === "sampleFile" ? "Sample file uploaded." : "Asset file uploaded.");
                } catch (err) {
                    const message = err instanceof ApiError ? err.message : "Could not upload file.";
                    setFormError(message);
                    showError(message);
                } finally {
                    event.target.value = "";
                    setUploadingTarget(null);
                }
            };

    // ── Save / Delete ──────────────────────────────────────────────────────────

    const handleSaveBook = async () => {
        setFormError(null);
        const validationError = validateForm(formState);
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = buildPayload(formState);
            if (selectedBook?._id) {
                await BookService.updateBook(selectedBook._id, payload);
                success("Book updated successfully.");
            } else {
                await BookService.createBook(payload as CreateBookDto);
                success("Book created successfully.");
            }
            setDialogOpen(false);
            setSelectedBook(null);
            setFormState(createEmptyBookForm());
            await fetchBooks({ page: currentPage, search: searchTerm, language: languageFilter });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Unable to save the book.";
            setFormError(message);
            showError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBook = async (book: BookDto) => {
        if (!window.confirm(`Delete "${book.title}"?`)) return;
        setDeletingBookId(book._id);
        try {
            await BookService.deleteBook(book._id);
            success("Book deleted.");
            const nextPage = books.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
            await fetchBooks({ page: nextPage, search: searchTerm, language: languageFilter });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Unable to delete this book.";
            setPageError(message);
            showError(message);
        } finally {
            setDeletingBookId(null);
        }
    };

    const formatCount = useMemo(
        () => books.reduce((count, book) => count + (book.formats?.length ?? 0), 0),
        [books],
    );
    const coverPreviewUrl = useMemo(() => getPublicAssetUrl(formState.coverImage.trim()), [formState.coverImage]);

    // ── Render helpers ─────────────────────────────────────────────────────────

    /** Nav dot color for each section */
    const dotColor = (id: SectionId) => {
        if (id === activeSection) return "text.primary";
        if (visitedSections.has(id)) return "success.main";
        return "divider";
    };

    /** Section header shared between sections */
    const SectionHeader = ({
        title,
        description,
        step,
    }: {
        title: string;
        description: string;
        step: number;
    }) => (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: "nowrap", ml: 2, mt: 0.5 }}>
                {step} / {SECTIONS.length}
            </Typography>
        </Box>
    );

    /** Bottom Back / Next row */
    const SectionNav = ({
        prev,
        next,
        nextLabel,
    }: {
        prev?: SectionId;
        next?: SectionId;
        nextLabel?: string;
    }) => (
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            {prev ? (
                <Button size="small" onClick={() => goToSection(prev)}>
                    ← Back
                </Button>
            ) : (
                <span />
            )}
            {next && (
                <Button size="small" variant="outlined" onClick={() => goToSection(next)}>
                    {nextLabel ?? `Next →`}
                </Button>
            )}
        </Box>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <>
            {/* ── Page header ─────────────────────────────────────────────────── */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 4,
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: "primary.main",
                                color: "white",
                                display: "flex",
                            }}
                        >
                            <BookCopy size={20} />
                        </Box>
                        <Typography variant="h5" fontWeight={700}>
                            Book Management
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Total <strong>{total}</strong> books · <strong>{formatCount}</strong> format entries on this page
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => fetchBooks({ page: currentPage, search: searchTerm, language: languageFilter })}
                        disabled={loading}
                        size="small"
                    >
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} disableElevation>
                        Add Book
                    </Button>
                </Stack>
            </Box>

            {pageError && (
                <Alert severity="error" onClose={() => setPageError(null)} sx={{ mb: 2 }}>
                    {pageError}
                </Alert>
            )}

            {/* ── Filter bar ──────────────────────────────────────────────────── */}
            <Paper
                variant="outlined"
                sx={{ p: 2, mb: 3, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}
            >
                <TextField
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ flex: 1, minWidth: 220 }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            void fetchBooks({ page: 1, search: searchTerm, language: languageFilter });
                        }
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                        value={languageFilter}
                        label="Language"
                        onChange={(e) => setLanguageFilter(e.target.value)}
                    >
                        <MenuItem value="">All languages</MenuItem>
                        {LANGUAGE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Rows per page</InputLabel>
                    <Select
                        value={pageSize}
                        label="Rows per page"
                        onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <MenuItem key={n} value={n}>
                                {n} rows
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        onClick={() => fetchBooks({ page: 1, search: searchTerm, language: languageFilter })}
                    >
                        Apply
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => {
                            setSearchTerm("");
                            setLanguageFilter("");
                            void fetchBooks({ page: 1, search: "", language: "" });
                        }}
                    >
                        Reset
                    </Button>
                </Stack>
            </Paper>

            {/* ── Books table ─────────────────────────────────────────────────── */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow
                                sx={{
                                    "& th": {
                                        fontWeight: 700,
                                        bgcolor: "grey.50",
                                        fontSize: "0.78rem",
                                        textTransform: "uppercase",
                                        letterSpacing: 0.4,
                                    },
                                }}
                            >
                                <TableCell sx={{ width: 50 }}>#</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Language</TableCell>
                                <TableCell>Publisher</TableCell>
                                <TableCell>Authors</TableCell>
                                <TableCell>Formats</TableCell>
                                <TableCell>Published</TableCell>
                                <TableCell align="right" sx={{ pr: 2 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {books.length > 0 ? (
                                books.map((book, index) => {
                                    const authorNames = (book.authors as Array<AuthorDto | string>)
                                        .map((a) => (typeof a === "string" ? a : a.name))
                                        .filter(Boolean)
                                        .join(", ");
                                    const publisherName =
                                        book.publisher && typeof book.publisher === "object"
                                            ? book.publisher.name
                                            : "-";

                                    return (
                                        <TableRow hover key={book._id}>
                                            <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {book.title}
                                                </Typography>
                                                {book.subtitle && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {book.subtitle}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{book.language || "-"}</TableCell>
                                            <TableCell>{publisherName}</TableCell>
                                            <TableCell sx={{ maxWidth: 220 }}>
                                                <Typography variant="body2" noWrap title={authorNames || "-"}>
                                                    {authorNames || "-"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                                                >
                                                    {book.formats.length > 0 ? (
                                                        book.formats.slice(0, 2).map((format, fi) => (
                                                            <Chip
                                                                key={`${book._id}-${fi}`}
                                                                label={`${formatLabelMap[format.formatType]}: $${format.price.toFixed(2)}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ))
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            No formats
                                                        </Typography>
                                                    )}
                                                    {book.formats.length > 2 && (
                                                        <Chip
                                                            label={`+${book.formats.length - 2}`}
                                                            size="small"
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(book.publicationDate).toLocaleDateString("en-US")}
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 2 }}>
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => openEditDialog(book)}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteBook(book)}
                                                            disabled={deletingBookId === book._id}
                                                        >
                                                            <DeleteOutline fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ py: 8 }}>
                                        <Typography align="center" color="text.secondary">
                                            No books found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ── Pagination ──────────────────────────────────────────────────── */}
            {!loading && totalPages > 1 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 1,
                        mt: 2,
                    }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === 1}
                        onClick={() =>
                            fetchBooks({ page: currentPage - 1, search: searchTerm, language: languageFilter })
                        }
                    >
                        Prev
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        Page <strong>{currentPage}</strong> / {totalPages}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                            fetchBooks({ page: currentPage + 1, search: searchTerm, language: languageFilter })
                        }
                    >
                        Next
                    </Button>
                </Box>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                Book Dialog — two-column layout with sticky sidebar nav
            ══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: "90vh", overflow: "hidden" } }}
            >
                {/* Compact title bar */}
                <DialogTitle
                    sx={{
                        py: 1.5,
                        px: 2.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                        {selectedBook ? `Edit — ${selectedBook.title}` : "New Book"}
                    </Typography>
                    <Button size="small" onClick={closeDialog} disabled={isSubmitting} sx={{ color: "text.secondary" }}>
                        Close
                    </Button>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden" }}>
                    {/* ── Sidebar nav (hidden on xs) ──────────────────────── */}
                    <Box
                        sx={{
                            width: 200,
                            flexShrink: 0,
                            borderRight: "1px solid",
                            borderColor: "divider",
                            bgcolor: "grey.50",
                            display: { xs: "none", sm: "flex" },
                            flexDirection: "column",
                        }}
                    >
                        {/* Section list */}
                        <Box sx={{ py: 1.5 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 2,
                                    pb: 1,
                                    display: "block",
                                    color: "text.disabled",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    fontWeight: 600,
                                }}
                            >
                                Sections
                            </Typography>

                            {SECTIONS.map((section) => {
                                const isActive = section.id === activeSection;
                                return (
                                    <Box
                                        key={section.id}
                                        onClick={() => goToSection(section.id)}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.25,
                                            px: 2,
                                            py: 1,
                                            cursor: "pointer",
                                            borderLeft: "2px solid",
                                            borderLeftColor: isActive ? "primary.main" : "transparent",
                                            bgcolor: isActive ? "background.paper" : "transparent",
                                            color: isActive ? "text.primary" : "text.secondary",
                                            fontWeight: isActive ? 600 : 400,
                                            fontSize: "0.8125rem",
                                            transition: "all 0.12s",
                                            "&:hover": {
                                                bgcolor: "background.paper",
                                                color: "text.primary",
                                            },
                                        }}
                                    >
                                        {/* Status dot */}
                                        <Box
                                            sx={{
                                                width: 7,
                                                height: 7,
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                                bgcolor: dotColor(section.id),
                                                transition: "background-color 0.2s",
                                            }}
                                        />
                                        {section.label}
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* Sidebar footer: progress + action buttons */}
                        <Box
                            sx={{
                                mt: "auto",
                                p: 2,
                                borderTop: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.75,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    Progress
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {Math.round(sectionProgress)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={sectionProgress}
                                sx={{ borderRadius: 1, height: 4, mb: 2 }}
                            />

                            {metadataLoading && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                    Loading reference data…
                                </Typography>
                            )}

                            <Stack spacing={1}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="small"
                                    onClick={handleSaveBook}
                                    disabled={isSubmitting}
                                    disableElevation
                                >
                                    {isSubmitting
                                        ? "Saving…"
                                        : selectedBook
                                            ? "Update Book"
                                            : "Create Book"}
                                </Button>
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={closeDialog}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {/* ── Main scrollable content area ───────────────────── */}
                    <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
                        {formError && (
                            <Alert
                                severity="error"
                                onClose={() => setFormError(null)}
                                sx={{ mb: 2.5 }}
                            >
                                {formError}
                            </Alert>
                        )}

                        {/* ╔══════════════════════════════════════════════╗
                            ║  Section 1 — Book Profile                   ║
                            ╚══════════════════════════════════════════════╝ */}
                        {activeSection === "profile" && (
                            <Box>
                                <SectionHeader
                                    title="Book profile"
                                    description="Primary details, metadata, and positioning fields."
                                    step={1}
                                />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                                        gap: 2,
                                    }}
                                >
                                    <TextField
                                        label="Title"
                                        required
                                        fullWidth
                                        size="small"
                                        value={formState.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                    />
                                    <TextField
                                        label="Subtitle"
                                        fullWidth
                                        size="small"
                                        value={formState.subtitle}
                                        onChange={(e) => updateField("subtitle", e.target.value)}
                                    />
                                    <TextField
                                        label="Book ISBN"
                                        fullWidth
                                        size="small"
                                        value={formState.isbn}
                                        onChange={(e) => updateField("isbn", e.target.value)}
                                    />
                                    <TextField
                                        label="Publication date"
                                        type="date"
                                        required
                                        size="small"
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        value={formState.publicationDate}
                                        onChange={(e) => updateField("publicationDate", e.target.value)}
                                    />
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Language</InputLabel>
                                        <Select
                                            value={formState.language}
                                            label="Language"
                                            onChange={(e) => updateField("language", e.target.value)}
                                        >
                                            {LANGUAGE_OPTIONS.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Page count"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        slotProps={{ htmlInput: { min: 1 } }}
                                        value={formState.pageCount}
                                        onChange={(e) => updateField("pageCount", e.target.value)}
                                    />
                                </Box>

                                <TextField
                                    label="Description"
                                    required
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    size="small"
                                    sx={{ mt: 2 }}
                                    value={formState.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                />

                                <SectionNav next="publishing" nextLabel="Next: Publishing →" />
                            </Box>
                        )}

                        {/* ╔══════════════════════════════════════════════╗
                            ║  Section 2 — Publishing Relations           ║
                            ╚══════════════════════════════════════════════╝ */}
                        {activeSection === "publishing" && (
                            <Box>
                                <SectionHeader
                                    title="Publishing relations"
                                    description="Attach publisher, authors, and categories for discoverability."
                                    step={2}
                                />

                                {/* Publisher */}
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                                    Publisher
                                </Typography>
                                <FormControl size="small" fullWidth disabled={metadataLoading} sx={{ mb: 1 }}>
                                    <InputLabel>Select publisher</InputLabel>
                                    <Select
                                        value={formState.publisher}
                                        label="Select publisher"
                                        onChange={(e) => updateField("publisher", e.target.value)}
                                    >
                                        <MenuItem value="">— None —</MenuItem>
                                        {publishers.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {formState.publisher && (
                                    <Chip
                                        label={publisherLookup.get(formState.publisher) ?? formState.publisher}
                                        size="small"
                                        onDelete={() => updateField("publisher", "")}
                                        sx={{ mb: 2.5 }}
                                    />
                                )}

                                {/* Authors */}
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                                    Authors
                                </Typography>
                                <FormControl size="small" fullWidth disabled={metadataLoading} sx={{ mb: 1 }}>
                                    <InputLabel>Add author</InputLabel>
                                    <Select
                                        value=""
                                        label="Add author"
                                        onChange={(e) => {
                                            const val = e.target.value as string;
                                            if (val && !formState.authors.includes(val)) {
                                                updateField("authors", [...formState.authors, val]);
                                            }
                                        }}
                                    >
                                        {authors
                                            .filter((a) => !formState.authors.includes(a.id))
                                            .map((a) => (
                                                <MenuItem key={a.id} value={a.id}>
                                                    {a.name}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                                {formState.authors.length > 0 && (
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2.5 }}>
                                        {formState.authors.map((id) => (
                                            <Chip
                                                key={id}
                                                label={authorLookup.get(id) ?? id}
                                                size="small"
                                                onDelete={() =>
                                                    updateField(
                                                        "authors",
                                                        formState.authors.filter((a) => a !== id),
                                                    )
                                                }
                                            />
                                        ))}
                                    </Stack>
                                )}

                                {/* Categories */}
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
                                    Categories
                                </Typography>
                                <FormControl size="small" fullWidth disabled={metadataLoading} sx={{ mb: 1 }}>
                                    <InputLabel>Add category</InputLabel>
                                    <Select
                                        value=""
                                        label="Add category"
                                        onChange={(e) => {
                                            const val = e.target.value as string;
                                            if (val && !formState.categories.includes(val)) {
                                                updateField("categories", [...formState.categories, val]);
                                            }
                                        }}
                                    >
                                        {categories
                                            .filter((c) => !formState.categories.includes(c.id))
                                            .map((c) => (
                                                <MenuItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                                {formState.categories.length > 0 && (
                                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                        {formState.categories.map((id) => (
                                            <Chip
                                                key={id}
                                                label={categoryLookup.get(id) ?? id}
                                                size="small"
                                                onDelete={() =>
                                                    updateField(
                                                        "categories",
                                                        formState.categories.filter((c) => c !== id),
                                                    )
                                                }
                                            />
                                        ))}
                                    </Stack>
                                )}

                                <SectionNav prev="profile" next="cover" nextLabel="Next: Cover →" />
                            </Box>
                        )}

                        {/* ╔══════════════════════════════════════════════╗
                            ║  Section 3 — Cover Media                   ║
                            ╚══════════════════════════════════════════════╝ */}
                        {activeSection === "cover" && (
                            <Box>
                                <SectionHeader
                                    title="Cover media"
                                    description="Upload a file or paste an image URL."
                                    step={3}
                                />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", md: "160px 1fr" },
                                        gap: 2.5,
                                        alignItems: "start",
                                    }}
                                >
                                    {/* Drag-and-drop / preview box */}
                                    <Box
                                        component="label"
                                        sx={{
                                            height: 220,
                                            border: "1.5px dashed",
                                            borderColor: isDraggingCover ? "primary.main" : "divider",
                                            borderRadius: 2,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 1,
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            position: "relative",
                                            bgcolor: isDraggingCover ? "primary.50" : "grey.50",
                                            transition: "border-color 0.15s, background-color 0.15s",
                                            "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDraggingCover(true);
                                        }}
                                        onDragLeave={() => setIsDraggingCover(false)}
                                        onDrop={async (e) => {
                                            e.preventDefault();
                                            setIsDraggingCover(false);
                                            const file = e.dataTransfer.files[0];
                                            if (file) await handleCoverUploadFile(file);
                                        }}
                                    >
                                        {coverPreviewUrl ? (
                                            <Box
                                                component="img"
                                                src={coverPreviewUrl}
                                                alt="Cover preview"
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <CloudUpload sx={{ color: "text.disabled", fontSize: 28 }} />
                                                <Typography variant="caption" color="text.secondary" align="center" sx={{ px: 1.5, lineHeight: 1.5 }}>
                                                    Drop image here
                                                    <br />
                                                    or click to browse
                                                </Typography>
                                            </>
                                        )}
                                        <input
                                            hidden
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleCoverUpload}
                                        />
                                    </Box>

                                    {/* URL input + actions */}
                                    <Stack spacing={1.5}>
                                        <TextField
                                            label="Cover image URL"
                                            fullWidth
                                            size="small"
                                            value={formState.coverImage}
                                            onChange={(e) => updateField("coverImage", e.target.value)}
                                            placeholder="https://cdn.example.com/cover.jpg"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            Accepted: JPEG, PNG, WebP.
                                            <br />
                                            Recommended: 400 × 600 px.
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                size="small"
                                                startIcon={
                                                    coverUploadLoading ? (
                                                        <CircularProgress size={14} />
                                                    ) : (
                                                        <CloudUpload fontSize="small" />
                                                    )
                                                }
                                                disabled={coverUploadLoading}
                                            >
                                                Upload file
                                                <input
                                                    hidden
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={handleCoverUpload}
                                                />
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => updateField("coverImage", "")}
                                                disabled={coverUploadLoading || !formState.coverImage}
                                            >
                                                Clear
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>

                                <SectionNav prev="publishing" next="formats" nextLabel="Next: Formats →" />
                            </Box>
                        )}

                        {/* ╔══════════════════════════════════════════════╗
                            ║  Section 4 — Book Formats                  ║
                            ╚══════════════════════════════════════════════╝ */}
                        {activeSection === "formats" && (
                            <Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        mb: 2.5,
                                    }}
                                >
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
                                            Book formats
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Add one or more editions — physical, digital, or audiobook.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: "nowrap" }}>
                                            4 / 4
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Add />}
                                            onClick={addFormat}
                                        >
                                            Add
                                        </Button>
                                    </Box>
                                </Box>

                                <Stack spacing={1.5}>
                                    {formState.formats.map((format, index) => {
                                        const assetUploadKey = `file-${index}`;
                                        const sampleUploadKey = `sampleFile-${index}`;

                                        return (
                                            <Paper
                                                key={`${format.sku || "format"}-${index}`}
                                                variant="outlined"
                                                sx={{ borderRadius: 2, overflow: "hidden" }}
                                            >
                                                {/* Format card header */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.5,
                                                        px: 2,
                                                        py: 1.25,
                                                        bgcolor: "grey.50",
                                                        borderBottom: "1px solid",
                                                        borderColor: "divider",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ minWidth: 80 }}>
                                                        Format #{index + 1}
                                                    </Typography>

                                                    {/* Type selector as toggle buttons */}
                                                    <ToggleButtonGroup
                                                        value={format.formatType}
                                                        exclusive
                                                        size="small"
                                                        onChange={(_, newType) => {
                                                            if (newType)
                                                                updateFormatField(
                                                                    index,
                                                                    "formatType",
                                                                    newType as BookFormatType,
                                                                );
                                                        }}
                                                        sx={{
                                                            "& .MuiToggleButton-root": {
                                                                px: 1.5,
                                                                py: 0.4,
                                                                fontSize: "0.75rem",
                                                                textTransform: "none",
                                                                lineHeight: 1.5,
                                                            },
                                                        }}
                                                    >
                                                        {FORMAT_OPTIONS.map((opt) => (
                                                            <ToggleButton key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </ToggleButton>
                                                        ))}
                                                    </ToggleButtonGroup>

                                                    <Tooltip title="Remove format">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => removeFormat(index)}
                                                                disabled={formState.formats.length === 1}
                                                                sx={{ ml: "auto" }}
                                                            >
                                                                <RemoveCircleOutline fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Box>

                                                {/* Format card body */}
                                                <Box sx={{ p: 2 }}>
                                                    {/* Common fields */}
                                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <TextField
                                                                label="SKU"
                                                                required
                                                                size="small"
                                                                fullWidth
                                                                value={format.sku}
                                                                onChange={(e) =>
                                                                    updateFormatField(index, "sku", e.target.value)
                                                                }
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                            <TextField
                                                                label="Format ISBN"
                                                                size="small"
                                                                fullWidth
                                                                value={format.isbn}
                                                                onChange={(e) =>
                                                                    updateFormatField(index, "isbn", e.target.value)
                                                                }
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <TextField
                                                                label="Price"
                                                                type="number"
                                                                required
                                                                size="small"
                                                                fullWidth
                                                                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                                                                value={format.price}
                                                                onChange={(e) =>
                                                                    updateFormatField(index, "price", e.target.value)
                                                                }
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 4 }}>
                                                            <TextField
                                                                label="Discounted price"
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                                                                value={format.discountedPrice}
                                                                onChange={(e) =>
                                                                    updateFormatField(
                                                                        index,
                                                                        "discountedPrice",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 2 }}>
                                                            <TextField
                                                                label="Currency"
                                                                size="small"
                                                                fullWidth
                                                                value={format.currency}
                                                                onChange={(e) =>
                                                                    updateFormatField(
                                                                        index,
                                                                        "currency",
                                                                        e.target.value.toUpperCase(),
                                                                    )
                                                                }
                                                                slotProps={{ htmlInput: { maxLength: 3 } }}
                                                            />
                                                        </Grid>
                                                        <Grid size={{ xs: 12, md: 2 }}>
                                                            <TextField
                                                                label="Release date"
                                                                type="date"
                                                                size="small"
                                                                fullWidth
                                                                slotProps={{ inputLabel: { shrink: true } }}
                                                                value={format.releaseDate}
                                                                onChange={(e) =>
                                                                    updateFormatField(
                                                                        index,
                                                                        "releaseDate",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        </Grid>
                                                    </Grid>

                                                    {/* Active toggle */}
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            py: 1,
                                                            px: 1.5,
                                                            borderRadius: 1.5,
                                                            bgcolor: "grey.50",
                                                            mb: format.formatType !== "physical" || format.formatType === "physical" ? 2 : 0,
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                Active listing
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Visible to customers on the storefront
                                                            </Typography>
                                                        </Box>
                                                        <Switch
                                                            checked={format.active}
                                                            onChange={(e) =>
                                                                updateFormatField(index, "active", e.target.checked)
                                                            }
                                                        />
                                                    </Box>

                                                    {/* Physical-only fields */}
                                                    {format.formatType === "physical" && (
                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <TextField
                                                                    label="Stock quantity"
                                                                    type="number"
                                                                    size="small"
                                                                    fullWidth
                                                                    inputProps={{ min: 0 }}
                                                                    value={format.stockQuantity}
                                                                    onChange={(e) =>
                                                                        updateFormatField(
                                                                            index,
                                                                            "stockQuantity",
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <TextField
                                                                    label="Weight (g)"
                                                                    type="number"
                                                                    size="small"
                                                                    fullWidth
                                                                    inputProps={{ min: 0, step: "0.01" }}
                                                                    value={format.weight}
                                                                    onChange={(e) =>
                                                                        updateFormatField(
                                                                            index,
                                                                            "weight",
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                />
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 4 }}>
                                                                <TextField
                                                                    label="Dimensions"
                                                                    size="small"
                                                                    fullWidth
                                                                    placeholder="21×14×2 cm"
                                                                    value={format.dimensions}
                                                                    onChange={(e) =>
                                                                        updateFormatField(
                                                                            index,
                                                                            "dimensions",
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    )}

                                                    {/* Digital / Audiobook fields */}
                                                    {(format.formatType === "digital" ||
                                                        format.formatType === "audiobook") && (
                                                            <Stack spacing={2}>
                                                                <Grid container spacing={2}>
                                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                                        <TextField
                                                                            label="File URL"
                                                                            size="small"
                                                                            fullWidth
                                                                            value={format.file}
                                                                            onChange={(e) =>
                                                                                updateFormatField(
                                                                                    index,
                                                                                    "file",
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                                        <TextField
                                                                            label="Sample file URL"
                                                                            size="small"
                                                                            fullWidth
                                                                            value={format.sampleFile}
                                                                            onChange={(e) =>
                                                                                updateFormatField(
                                                                                    index,
                                                                                    "sampleFile",
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                    <Grid size={{ xs: 12, md: 4 }}>
                                                                        <TextField
                                                                            label="File size (MB)"
                                                                            type="number"
                                                                            size="small"
                                                                            fullWidth
                                                                            inputProps={{ min: 0 }}
                                                                            value={format.fileSize}
                                                                            onChange={(e) =>
                                                                                updateFormatField(
                                                                                    index,
                                                                                    "fileSize",
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </Grid>
                                                                </Grid>

                                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                                    <Button
                                                                        component="label"
                                                                        variant="outlined"
                                                                        size="small"
                                                                        startIcon={
                                                                            uploadingTarget === assetUploadKey ? (
                                                                                <CircularProgress size={14} />
                                                                            ) : (
                                                                                <CloudUpload fontSize="small" />
                                                                            )
                                                                        }
                                                                        disabled={uploadingTarget !== null}
                                                                    >
                                                                        Upload asset
                                                                        <input
                                                                            hidden
                                                                            type="file"
                                                                            accept="application/pdf,application/epub+zip"
                                                                            onChange={handleFormatUpload(index, "file")}
                                                                        />
                                                                    </Button>
                                                                    <Button
                                                                        component="label"
                                                                        variant="outlined"
                                                                        size="small"
                                                                        startIcon={
                                                                            uploadingTarget === sampleUploadKey ? (
                                                                                <CircularProgress size={14} />
                                                                            ) : (
                                                                                <CloudUpload fontSize="small" />
                                                                            )
                                                                        }
                                                                        disabled={uploadingTarget !== null}
                                                                    >
                                                                        Upload sample
                                                                        <input
                                                                            hidden
                                                                            type="file"
                                                                            accept="application/pdf,application/epub+zip"
                                                                            onChange={handleFormatUpload(
                                                                                index,
                                                                                "sampleFile",
                                                                            )}
                                                                        />
                                                                    </Button>
                                                                </Stack>

                                                                {format.formatType === "digital" && (
                                                                    <Grid container spacing={2}>
                                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                                            <FormControl size="small" fullWidth>
                                                                                <InputLabel>File format</InputLabel>
                                                                                <Select
                                                                                    value={format.fileFormat}
                                                                                    label="File format"
                                                                                    onChange={(e) =>
                                                                                        updateFormatField(
                                                                                            index,
                                                                                            "fileFormat",
                                                                                            e.target.value as
                                                                                            | ""
                                                                                            | "PDF"
                                                                                            | "ePub"
                                                                                            | "MOBI",
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <MenuItem value="">None</MenuItem>
                                                                                    <MenuItem value="PDF">PDF</MenuItem>
                                                                                    <MenuItem value="ePub">ePub</MenuItem>
                                                                                    <MenuItem value="MOBI">MOBI</MenuItem>
                                                                                </Select>
                                                                            </FormControl>
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, md: 6 }}>
                                                                            <TextField
                                                                                label="Download limit"
                                                                                type="number"
                                                                                size="small"
                                                                                fullWidth
                                                                                inputProps={{ min: 1 }}
                                                                                value={format.downloadLimit}
                                                                                onChange={(e) =>
                                                                                    updateFormatField(
                                                                                        index,
                                                                                        "downloadLimit",
                                                                                        e.target.value,
                                                                                    )
                                                                                }
                                                                            />
                                                                        </Grid>
                                                                    </Grid>
                                                                )}
                                                            </Stack>
                                                        )}
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>

                                <SectionNav prev="cover" />

                                {/* Mobile save/cancel (sidebar hidden on xs) */}
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-end"
                                    sx={{ mt: 2, display: { sm: "none" } }}
                                >
                                    <Button onClick={closeDialog} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveBook}
                                        disabled={isSubmitting}
                                        disableElevation
                                    >
                                        {isSubmitting
                                            ? "Saving…"
                                            : selectedBook
                                                ? "Update Book"
                                                : "Create Book"}
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}