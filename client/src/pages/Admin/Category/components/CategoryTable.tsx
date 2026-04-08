import {
	Table, TableHead, TableBody, TableRow, TableCell,
	TableContainer, Paper, IconButton, Chip, Tooltip,
	Typography, Box, Stack, Button,
} from "@mui/material";
import { Edit, DeleteOutline } from "@mui/icons-material";
import { FolderTree, Layers } from "lucide-react";
import type { CategoryDto } from "@my-types/category.dto";

interface Props {
	categories: CategoryDto[];
	onEdit: (category: CategoryDto) => void;
	onDelete: (id: string) => void;
	currentPage: number;
	pageSize: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export default function CategoryTable({
	categories, onEdit, onDelete, currentPage, pageSize, totalPages, onPageChange,
}: Props) {
	const getCategoryId = (value: string | { id: string } | null | undefined): string | null => {
		if (!value) return null;
		return typeof value === "string" ? value : value.id;
	};

	// Build a lookup map for resolving parent names
	const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
	const getDepth = (cat: CategoryDto) => cat.ancestors?.length ?? 0;

	const getParentName = (cat: CategoryDto) => {
		if (!cat.parent) return null;
		if (typeof cat.parent === "object") {
			return cat.parent.name;
		}
		return categoryMap[cat.parent]?.name ?? "(outside current page data)";
	};

	const compareByOrderThenName = (a: CategoryDto, b: CategoryDto) => {
		if (a.order !== b.order) return a.order - b.order;
		return a.name.localeCompare(b.name, "vi");
	};

	const rows = (() => {
		const childrenMap = new Map<string, CategoryDto[]>();
		const roots: CategoryDto[] = [];
		const dangling: CategoryDto[] = [];

		for (const category of categories) {
			const parentId = getCategoryId(category.parent);
			if (parentId && categoryMap[parentId]) {
				const bucket = childrenMap.get(parentId) ?? [];
				bucket.push(category);
				childrenMap.set(parentId, bucket);
			} else if (parentId) {
				// Parent exists in DB but not in the current paginated payload.
				dangling.push(category);
			} else {
				roots.push(category);
			}
		}

		for (const [, childList] of childrenMap) {
			childList.sort(compareByOrderThenName);
		}

		roots.sort(compareByOrderThenName);

		const flattened: Array<{ category: CategoryDto; depth: number }> = [];

		const traverse = (node: CategoryDto) => {
			flattened.push({ category: node, depth: getDepth(node) });
			const children = childrenMap.get(node.id) ?? [];
			for (const child of children) {
				traverse(child);
			}
		};

		for (const root of roots) {
			traverse(root);
		}

		if (dangling.length > 0) {
			dangling
				.sort((a, b) => {
					const depthDiff = getDepth(a) - getDepth(b);
					if (depthDiff !== 0) return depthDiff;
					return compareByOrderThenName(a, b);
				})
				.forEach((node) => {
					flattened.push({ category: node, depth: getDepth(node) });
				});
		}

		return flattened;
	})();

	if (categories.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
				<FolderTree size={40} strokeWidth={1.2} style={{ marginBottom: 12, opacity: 0.4 }} />
				<Typography variant="body1">No categories found</Typography>
			</Box>
		);
	}

	return (
		<>
			<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "grey.50", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: 0.5 } }}>
							<TableCell sx={{ width: 40, pl: 2 }}>#</TableCell>
							<TableCell>Category</TableCell>
							<TableCell>Description</TableCell>
							<TableCell>Depth</TableCell>
							<TableCell>Parent</TableCell>
							<TableCell>Created At</TableCell>
							<TableCell>Updated At</TableCell>
							<TableCell align="right" sx={{ pr: 2 }}>Thao tác</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map(({ category: cat, depth }, idx) => {
							const parentName = getParentName(cat);
							return (
								<TableRow
									key={cat.id}
									hover
									sx={{
										"&:last-child td": { borderBottom: 0 },
										transition: "background 0.15s",
									}}
								>
									{/* Row number */}
									<TableCell sx={{ pl: 2, color: "text.disabled", fontSize: "0.78rem" }}>
										{(currentPage - 1) * pageSize + idx + 1}
									</TableCell>

									{/* Name with depth indentation */}
									<TableCell>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: depth * 2 }}>
											{depth > 0 && (
												<Box component="span" sx={{ color: "text.disabled", fontSize: 16 }}>
													{"└"}
												</Box>
											)}
											<Typography variant="body2" fontWeight={600}>
												{cat.name}
											</Typography>
										</Box>
									</TableCell>

									{/* Description */}
									<TableCell>
										<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
											{cat.description || "—"}
										</Typography>
									</TableCell>

									{/* Depth badge */}
									<TableCell>
										<Chip
											icon={<Layers size={12} />}
											label={depth === 0 ? "Root" : `Level ${depth}`}
											size="small"
											color={depth === 0 ? "primary" : depth === 1 ? "secondary" : "default"}
											variant={depth === 0 ? "filled" : "outlined"}
											sx={{ fontSize: "0.72rem", height: 22 }}
										/>
									</TableCell>

									{/* Parent */}
									<TableCell>
										{parentName ? (
											<Chip label={parentName} size="small" variant="outlined" sx={{ fontSize: "0.72rem", height: 22 }} />
										) : (
											<Typography variant="caption" color="text.disabled">—</Typography>
										)}
									</TableCell>

									{/* Created At */}
									<TableCell>{new Date(cat.createdAt).toLocaleDateString("vi-VN")} - {new Date(cat.createdAt).toLocaleTimeString("vi-VN")}</TableCell>

									{/* Updated At */}
									<TableCell>{new Date(cat.updatedAt).toLocaleDateString("vi-VN")} - {new Date(cat.updatedAt).toLocaleTimeString("vi-VN")}</TableCell>

									{/* Actions */}
									<TableCell align="right" sx={{ pr: 2 }}>
										<Stack direction="row" spacing={0.5} justifyContent="flex-end">
											<Tooltip title="Edit">
												<IconButton size="small" onClick={() => onEdit(cat)} color="primary">
													<Edit fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Delete">
												<IconButton
													size="small"
													color="error"
													onClick={() => {
														if (window.confirm(`Delete category "${cat.name}"?`)) onDelete(cat.id);
													}}
												>
													<DeleteOutline fontSize="small" />
												</IconButton>
											</Tooltip>
										</Stack>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Pagination */}
			{totalPages > 1 && (
				<Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
					<Button size="small" variant="outlined" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
						← Trước
					</Button>
					<Typography variant="body2" color="text.secondary">
						Trang <strong>{currentPage}</strong> / {totalPages}
					</Typography>
					<Button size="small" variant="outlined" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
						Sau →
					</Button>
				</Box>
			)}
		</>
	);
}