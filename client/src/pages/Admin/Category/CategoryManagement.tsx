import { useState, useEffect, useCallback } from "react";
import {
	Box, Typography, Button, TextField, MenuItem, Select,
	FormControl, InputLabel, Alert, Snackbar, Skeleton,
	Stack, Paper,
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import { BookMarked } from "lucide-react";
import { categoryService, type ListCategoriesParams } from "@services/category.services";
import type {
	CategoryDto, ListCategoriesResponseDto,
	CreateCategoryDto, UpdateCategoryDto,
} from "@my-types/category.dto";
import { ApiError } from "@services/api";
import CategoryForm from "./components/CategoryForm";
import CategoryTable from "./components/CategoryTable";

export default function CategoryManagement() {
	const [categories, setCategories] = useState<CategoryDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchCategories = useCallback(async (page: number = 1, search: string = "") => {
		setLoading(true);
		setError(null);
		try {
			const params: ListCategoriesParams = { page, limit: pageSize };
			if (search) params.search = search;
			const response: ListCategoriesResponseDto = await categoryService.listCategories(params);
			setCategories(response.data);
			setTotalPages(response.totalPages);
			setCurrentPage(response.page);
			setTotal(response.total);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Unable to load categories");
		} finally {
			setLoading(false);
		}
	}, [pageSize]);

	useEffect(() => {
		fetchCategories(1, searchTerm);
	}, [pageSize]);

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => fetchCategories(1, searchTerm), 300);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	const handleEdit = (category: CategoryDto) => {
		setSelectedCategory(category);
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		try {
			await categoryService.deleteCategory(id);
			setSuccessMsg("Đã xóa thể loại thành công");
			await fetchCategories(currentPage, searchTerm);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Unable to delete category");
		}
	};

	const handleFormSubmit = async (formData: CreateCategoryDto | UpdateCategoryDto) => {
		setIsSubmitting(true);
		try {
			if (selectedCategory?.id) {
				await categoryService.updateCategory(selectedCategory.id, formData as UpdateCategoryDto);
				setSuccessMsg("Cập nhật thể loại thành công");
			} else {
				await categoryService.createCategory(formData as CreateCategoryDto);
				setSuccessMsg("Tạo thể loại mới thành công");
			}
			setShowForm(false);
			setSelectedCategory(null);
			await fetchCategories(currentPage, searchTerm);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Unable to save category");
		} finally {
			setIsSubmitting(false);
		}
	};

	const rootCount = categories.filter((c) => !c.parent).length;
	const childCount = categories.filter((c) => c.parent).length;

	return (
		<>
			{/* Header */}
			<Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
				<Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
						<Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.main", display: "flex", color: "white" }}>
							<BookMarked size={20} />
						</Box>
						<Typography variant="h5" fontWeight={700} color="text.primary">
							Category Management
						</Typography>
					</Box>
					<Typography variant="body2" color="text.secondary">
						Total <strong>{total}</strong> categories — {rootCount} root, {childCount} child
					</Typography>
				</Box>
				<Stack direction="row" spacing={1}>
						<Button
						variant="outlined"
						startIcon={<Refresh />}
						onClick={() => fetchCategories(currentPage, searchTerm)}
						disabled={loading}
						size="small"
					>
							Refresh
					</Button>
					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => { setSelectedCategory(null); setShowForm(true); }}
						disableElevation
					>
							Add Category
					</Button>
				</Stack>
			</Box>

			{/* Error */}
			{error && (
				<Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Filters */}
			<Paper variant="outlined" sx={{ p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
				<TextField
					placeholder="Search categories..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					size="small"
					sx={{ flex: 1, minWidth: 220 }}
					InputProps={{ sx: { borderRadius: 2 } }}
				/>
				<FormControl size="small" sx={{ minWidth: 150 }}>
					<InputLabel>Rows per page</InputLabel>
					<Select
						value={pageSize}
						label="Rows per page"
						onChange={(e) => setPageSize(Number(e.target.value))}
					>
						{[5, 10, 20, 50].map((n) => (
							<MenuItem key={n} value={n}>{n} rows</MenuItem>
						))}
					</Select>
				</FormControl>
			</Paper>

			{/* Table */}
			{loading ? (
				<Stack spacing={1}>
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
					))}
				</Stack>
			) : (
				<CategoryTable
					categories={categories}
					onEdit={handleEdit}
					onDelete={handleDelete}
					currentPage={currentPage}
					pageSize={pageSize}
					totalPages={totalPages}
					onPageChange={(page) => fetchCategories(page, searchTerm)}
				/>
			)}

			{/* Form Dialog */}
			<CategoryForm
				open={showForm}
				category={selectedCategory}
				allCategories={categories}
				onSubmit={handleFormSubmit}
				onCancel={() => { setShowForm(false); setSelectedCategory(null); }}
				isLoading={isSubmitting}
			/>

			{/* Success toast */}
			<Snackbar
				open={!!successMsg}
				autoHideDuration={3000}
				onClose={() => setSuccessMsg(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert severity="success" onClose={() => setSuccessMsg(null)} variant="filled">
					{successMsg}
				</Alert>
			</Snackbar>
		</>
	);
}