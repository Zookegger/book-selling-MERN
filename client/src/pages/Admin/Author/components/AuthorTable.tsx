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
		return d.toLocaleDateString("en-US");
	};

	return (
		<div className="author-table-wrapper">
			<table className="author-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Birth Date</th>
						<th>Website</th>
						<th>Created At</th>
						<th>Updated At</th>
						<th>Actions</th>
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
										View
									</a>
								) : (
									"-"
								)}
							</td>
							<td>{formatDate(author.createdAt)}</td>
							<td>{formatDate(author.updatedAt)}</td>
							<td className="actions">
								<button
									className="btn btn-sm btn-edit"
									onClick={() => onEdit(author)}
									title="Edit"
								>
									✎
								</button>
								<button
									className="btn btn-sm btn-delete"
									onClick={() => onDelete(author.id)}
									title="Delete"
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
