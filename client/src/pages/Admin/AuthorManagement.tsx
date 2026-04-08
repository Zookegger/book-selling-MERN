import { useState, useEffect } from "react";
import { authorService, type ListAuthorsParams } from "@services/author.services";
import type { AuthorDto, ListAuthorsResponseDto } from "@my-types/author.dto";
import { ApiError } from "@services/api";
import AuthorForm from "./components/AuthorForm";
import AuthorTable from "./components/AuthorTable";
import "./AuthorManagement.css";

export default function AuthorManagement() {
	const [authors, setAuthors] = useState<AuthorDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [selectedAuthor, setSelectedAuthor] = useState<AuthorDto | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch authors list
	const fetchAuthors = async (page: number = 1, search: string = "") => {
		setLoading(true);
		setError(null);
		try {
			const params: ListAuthorsParams = {
				page,
				limit: pageSize,
			};
			if (search) {
				params.search = search;
			}
			const response: ListAuthorsResponseDto = await authorService.listAuthors(params);
			setAuthors(response.data);
			setTotalPages(response.totalPages);
			setCurrentPage(response.page);
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Failed to fetch authors";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	// Initial load and when page size changes
	useEffect(() => {
		fetchAuthors(1, searchTerm);
	}, [pageSize]);

	// Handle search
	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setCurrentPage(1);
		fetchAuthors(1, value);
	};

	// Handle pagination
	const handlePageChange = (page: number) => {
		fetchAuthors(page, searchTerm);
	};

	// Handle create new author
	const handleCreateNew = () => {
		setSelectedAuthor(null);
		setShowForm(true);
	};

	// Handle edit author
	const handleEdit = (author: AuthorDto) => {
		setSelectedAuthor(author);
		setShowForm(true);
	};

	// Handle delete author
	const handleDelete = async (id: string) => {
		if (!window.confirm("Are you sure you want to delete this author?")) return;

		try {
			await authorService.deleteAuthor(id);
			await fetchAuthors(currentPage, searchTerm);
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Failed to delete author";
			setError(message);
		}
	};

	// Handle form submission
	const handleFormSubmit = async (formData: Partial<AuthorDto>) => {
		setIsSubmitting(true);
		try {
			if (selectedAuthor?.id) {
				// Update existing author
				await authorService.updateAuthor(selectedAuthor.id, formData);
			} else {
				// Create new author
				await authorService.createAuthor(formData as any);
			}
			setShowForm(false);
			setSelectedAuthor(null);
			await fetchAuthors(currentPage, searchTerm);
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Failed to save author";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle form close
	const handleFormClose = () => {
		setShowForm(false);
		setSelectedAuthor(null);
	};

	return (
		<div className="author-management">
			<div className="author-management__header">
				<h1>Quản Lý Tác Giả</h1>
				<button
					className="btn btn-primary"
					onClick={handleCreateNew}
				>
					Thêm Tác Giả Mới
				</button>
			</div>

			{error && (
				<div className="alert alert-error">
					<p>{error}</p>
					<button onClick={() => setError(null)}>✕</button>
				</div>
			)}

			<div className="author-management__filters">
				<input
					type="text"
					placeholder="Tìm kiếm theo tên tác giả..."
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
				<AuthorForm
					author={selectedAuthor}
					onSubmit={handleFormSubmit}
					onCancel={handleFormClose}
					isLoading={isSubmitting}
				/>
			)}

			{loading && !showForm ? (
				<div className="loading">Đang tải dữ liệu...</div>
			) : (
				<>
					<AuthorTable
						authors={authors}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>

					{totalPages > 1 && (
						<div className="pagination">
							<button
								disabled={currentPage === 1}
								onClick={() => handlePageChange(currentPage - 1)}
								className="pagination__btn"
							>
								← Trước
							</button>

							<div className="pagination__info">
								Trang {currentPage} / {totalPages}
							</div>

							<button
								disabled={currentPage === totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
								className="pagination__btn"
							>
								Sau →
							</button>
						</div>
					)}

					{authors.length === 0 && !loading && (
						<div className="empty-state">
							<p>Không tìm thấy tác giả nào</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
