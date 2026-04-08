import type { AuthorDto } from "@my-types/author.dto";
import "./AuthorTable.css";

interface AuthorTableProps {
	authors: AuthorDto[];
	onEdit: (author: AuthorDto) => void;
	onDelete: (id: string) => void;
}

export default function AuthorTable({ authors, onEdit, onDelete }: AuthorTableProps) {
	const formatDate = (date: Date | string | undefined) => {
		if (!date) return "-";
		const d = new Date(date);
		return d.toLocaleDateString("vi-VN");
	};

	return (
		<div className="author-table-wrapper">
			<table className="author-table">
				<thead>
					<tr>
						<th>Tên</th>
						<th>Email</th>
						<th>Ngày Sinh</th>
						<th>Website</th>
						<th>Ngày Tạo</th>
						<th>Hành Động</th>
					</tr>
				</thead>
				<tbody>
					{authors.map((author) => (
						<tr key={author.id}>
							<td className="column-name">
								<strong>{author.name}</strong>
								{author.slug && <span className="slug">({author.slug})</span>}
							</td>
							<td>{author.email}</td>
							<td>{formatDate(author.birthDate)}</td>
							<td>
								{author.website ? (
									<a href={author.website} target="_blank" rel="noopener noreferrer">
										Xem
									</a>
								) : (
									"-"
								)}
							</td>
							<td>{formatDate(author.createdAt)}</td>
							<td className="actions">
								<button
									className="btn btn-sm btn-edit"
									onClick={() => onEdit(author)}
									title="Chỉnh sửa"
								>
									✎
								</button>
								<button
									className="btn btn-sm btn-delete"
									onClick={() => onDelete(author.id)}
									title="Xóa"
								>
									🗑
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
