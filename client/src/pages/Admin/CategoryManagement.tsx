import { useState, useEffect } from "react";
import { categoryService, type ListCategoriesParams } from "@services/category.services";
import type { CategoryDto, ListCategoriesResponseDto, CreateCategoryDto, UpdateCategoryDto } from "@my-types/category.dto";
import { ApiError } from "@services/api";
import CategoryForm from "./components/CategoryForm";
import CategoryTable from "./components/CategoryTable";
import "./CategoryManagement.css";

export default function CategoryManagement() {
	const [categories, setCategories] = useState<CategoryDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchCategories = async (page: number = 1, search: string = "") => {
		setLoading(true);
		setError(null);
		try {
			const params: ListCategoriesParams = {
				page,
				limit: pageSize,
			};
			if (search) params.search = search;
			const response: ListCategoriesResponseDto = await categoryService.listCategories(params);
			setCategories(response.data);
			setTotalPages(response.totalPages);
			setCurrentPage(response.page);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Failed to fetch categories");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories(1, searchTerm);
	}, [pageSize]);

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setCurrentPage(1);
		fetchCategories(1, value);
	};

	const handlePageChange = (page: number) => {
		fetchCategories(page, searchTerm);
	};

	const handleCreateNew = () => {
		setSelectedCategory(null);
		setShowForm(true);
	};

	const handleEdit = (category: CategoryDto) => {
		setSelectedCategory(category);
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm("Bạn có chắc chắn muốn xóa thể loại này không?")) return;
		try {
			await categoryService.deleteCategory(id);
			await fetchCategories(currentPage, searchTerm);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Failed to delete category");
		}
	};

	const handleFormSubmit = async (formData: CreateCategoryDto | UpdateCategoryDto) => {
		setIsSubmitting(true);
		try {
			if (selectedCategory?.id) {
				await categoryService.updateCategory(selectedCategory.id, formData as UpdateCategoryDto);
			} else {
				await categoryService.createCategory(formData as CreateCategoryDto);
			}
			setShowForm(false);
			setSelectedCategory(null);
			await fetchCategories(currentPage, searchTerm);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Failed to save category");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFormClose = () => {
		setShowForm(false);
		setSelectedCategory(null);
	};

	return (
		<div className="category-management">
			<div className="category-management__header">
				<h1>Quản Lý Thể Loại Sách</h1>
				<button className="btn btn-primary" onClick={handleCreateNew}>
					Thêm Thể Loại Mới
				</button>
			</div>

			{error && (
				<div className="alert alert-error">
					<p>{error}</p>
					<button onClick={() => setError(null)}>✕</button>
				</div>
			)}

			<div className="category-management__filters">
				<input
					type="text"
					placeholder="Tìm kiếm theo thể loại..."
					value={searchTerm}
					onChange={handleSearch}
					className="input-search"
				/>
				<select
					value={pageSize}
					onChange={(e) => setPageSize(Number(e.target.value))}
					className="input-select"
				>
					<option value={5}>5 mỗi trang</option>
					<option value={10}>10 mỗi trang</option>
					<option value={20}>20 mỗi trang</option>
					<option value={50}>50 mỗi trang</option>
				</select>
			</div>

			{showForm && (
				<CategoryForm
					category={selectedCategory}
                    categories={categories}
					onSubmit={handleFormSubmit}
					onCancel={handleFormClose}
					isLoading={isSubmitting}
				/>
			)}

			{loading && !showForm ? (
				<div className="loading">Đang tải dữ liệu...</div>
			) : (
				<>
					<CategoryTable categories={categories} onEdit={handleEdit} onDelete={handleDelete} />

					{totalPages > 1 && (
						<div className="pagination">
							<button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="pagination__btn">
								← Trước
							</button>
							<div className="pagination__info">Trang {currentPage} / {totalPages}</div>
							<button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="pagination__btn">
								Sau →
							</button>
						</div>
					)}

					{categories.length === 0 && !loading && (
						<div className="empty-state">
							<p>Không tìm thấy thể loại nào</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
