import { useState, useEffect } from "react";
import type { AuthorDto } from "@my-types/author.dto";
import "./AuthorForm.css";

interface AuthorFormProps {
	author?: AuthorDto | null;
	onSubmit: (data: Partial<AuthorDto>) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function AuthorForm({ author, onSubmit, onCancel, isLoading = false }: AuthorFormProps) {
	const [formData, setFormData] = useState<Partial<AuthorDto>>({
		name: "",
		email: "",
		bio: "",
		birthDate: undefined,
		website: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (author) {
			setFormData({
				name: author.name || "",
				email: author.email || "",
				bio: author.bio || "",
				birthDate: author.birthDate ? new Date(author.birthDate).toISOString().split("T")[0] as any : undefined,
				website: author.website || "",
			});
		}
	}, [author]);

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name?.trim()) {
			newErrors.name = "Name is required";
		}

		if (!formData.email?.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value || undefined,
		}));
		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate()) {
			return;
		}

		try {
			await onSubmit(formData);
		} catch (err) {
			// Error handling is done in the parent component
		}
	};

	return (
		<div className="author-form-overlay">
			<div className="author-form">
				<div className="author-form__header">
					<h2>{author ? "Chỉnh Sửa Tác Giả" : "Thêm Tác Giả Mới"}</h2>
					<button
						type="button"
						className="author-form__close"
						onClick={onCancel}
						disabled={isLoading}
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="author-form__body">
					<div className="form-group">
						<label htmlFor="name">
							Tên Tác Giả <span className="required">*</span>
						</label>
						<input
							id="name"
							type="text"
							name="name"
							placeholder="Nhập tên tác giả"
							value={formData.name || ""}
							onChange={handleChange}
							disabled={isLoading}
							className={errors.name ? "input-error" : ""}
						/>
						{errors.name && <span className="error-message">{errors.name}</span>}
					</div>

					<div className="form-group">
						<label htmlFor="email">
							Email <span className="required">*</span>
						</label>
						<input
							id="email"
							type="email"
							name="email"
							placeholder="Nhập email"
							value={formData.email || ""}
							onChange={handleChange}
							disabled={isLoading || !!author} // Email không thể chỉnh sửa khi cập nhật
							className={errors.email ? "input-error" : ""}
						/>
						{errors.email && <span className="error-message">{errors.email}</span>}
					</div>

					<div className="form-group">
						<label htmlFor="birthDate">Ngày Sinh</label>
						<input
							id="birthDate"
							type="date"
							name="birthDate"
							value={
								formData.birthDate
									? new Date(formData.birthDate as any).toISOString().split("T")[0]
									: ""
							}
							onChange={handleChange}
							disabled={isLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="website">Website</label>
						<input
							id="website"
							type="url"
							name="website"
							placeholder="https://example.com"
							value={formData.website || ""}
							onChange={handleChange}
							disabled={isLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="bio">Tiểu Sử</label>
						<textarea
							id="bio"
							name="bio"
							placeholder="Nhập tiểu sử tác giả"
							value={formData.bio || ""}
							onChange={handleChange}
							disabled={isLoading}
							rows={4}
						/>
					</div>

					<div className="author-form__footer">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={onCancel}
							disabled={isLoading}
						>
							Hủy
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isLoading}
						>
							{isLoading ? "Đang lưu..." : author ? "Cập Nhật" : "Thêm Mới"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
