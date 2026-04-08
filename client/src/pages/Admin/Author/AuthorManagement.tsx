import { useState, useEffect } from "react";
import { authorService, type ListAuthorsParams } from "@services/author.services";
import type { AuthorDto, ListAuthorsResponseDto } from "@my-types/author.dto";
import { ApiError } from "@services/api";
import AuthorForm from "./components/AuthorForm";
import AuthorTable from "./components/AuthorTable";
import "./AuthorManagement.css";
import useSnackbar from "@hooks/useSnackbar";

export default function AuthorManagement() {
	const [authors, setAuthors] = useState<AuthorDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(0);
	const [showForm, setShowForm] = useState(false);
	const [selectedAuthor, setSelectedAuthor] = useState<AuthorDto | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { success, error } = useSnackbar();

	// Fetch authors list
	const fetchAuthors = async (page: number = 1, search: string = "") => {
		setLoading(true);
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
			error(message);
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
			success("Author deleted successfully");
			// If the current page becomes empty after deletion, go back to previous page
			if (authors.length === 1 && currentPage > 1) {
				handlePageChange(currentPage - 1);
			}
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Failed to delete author";
			error(message);
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
			success(`Author ${selectedAuthor ? "updated" : "created"} successfully`);
		} catch (err) {
			const message = err instanceof ApiError ? err.message : "Failed to save author";
			error(message);
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
				<h1>Author Management</h1>
				<button
					className="btn btn-primary"
					onClick={handleCreateNew}
				>
					Add New Author
				</button>
			</div>

			<div className="author-management__filters">
					<input
						type="text"
						placeholder="Search by author name..."
					value={searchTerm}
					onChange={handleSearch}
					className="input-search"
				/>
				<select
					value={pageSize}
					onChange={(e) => setPageSize(Number(e.target.value))}
					className="input-select"
				>
						<option value={5}>5 per page</option>
						<option value={10}>10 per page</option>
						<option value={20}>20 per page</option>
						<option value={50}>50 per page</option>
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
				<div className="loading">Loading...</div>
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
								← Prev
							</button>

							<div className="pagination__info">
								Page {currentPage} / {totalPages}
							</div>

							<button
								disabled={currentPage === totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
								className="pagination__btn"
							>
								Next →
							</button>
						</div>
					)}

					{authors.length === 0 && !loading && (
						<div className="empty-state">
							<p>No authors found</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
