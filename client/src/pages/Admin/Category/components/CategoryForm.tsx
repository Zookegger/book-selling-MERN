import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
	Dialog, DialogTitle, DialogContent, DialogActions,
	Button, TextField, Autocomplete, Stack, Typography,
	Divider, Box, CircularProgress,
} from "@mui/material";
import { Save, Close } from "@mui/icons-material";
import { FolderTree } from "lucide-react";
import type { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "@my-types/category.dto";

interface Props {
	open: boolean;
	category: CategoryDto | null;
	allCategories: CategoryDto[];
	onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
	onCancel: () => void;
	isLoading: boolean;
}

interface FormValues {
	name: string;
	description: string;
	parent: string;
	order: number;
}

const getCategoryId = (value: string | { id: string } | null | undefined): string | null => {
	if (!value) return null;
	return typeof value === "string" ? value : value.id;
};

export default function CategoryForm({ open, category, allCategories, onSubmit, onCancel, isLoading }: Props) {
	const isEdit = !!category;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			name: "",
			description: "",
			parent: "",
			order: 0,
		},
	});

	// Sync form state whenever the dialog opens or category changes
	useEffect(() => {
		if (open) {
			reset(
				category
					? {
						name: category.name,
						description: category.description ?? "",
						parent: getCategoryId(category.parent) ?? "",
						order: category.order,
					}
					: { name: "", description: "", parent: "", order: 0 }
			);
		}
	}, [open, category, reset]);

	const getParentOptions = () => {
		if (!isEdit) return allCategories;
		const selfId = category!.id;
		return allCategories.filter((c) => {
			if (c.id === selfId) return false;
			const ancestorIds = (c.ancestors ?? []).map((ancestor) => getCategoryId(ancestor)).filter(Boolean);
			return !ancestorIds.includes(selfId);
		});
	};

	const getLabelWithDepth = (cat: CategoryDto) => {
		const depth = cat.ancestors?.length ?? 0;
		return `${"  ".repeat(depth)}${depth > 0 ? "└ " : ""}${cat.name}`;
	};

	const parentOptions = getParentOptions();

	const onValid = async (values: FormValues) => {
		const normalizedOrder = Number.isFinite(values.order) ? values.order : 0;
		await onSubmit({
			name: values.name.trim(),
			description: values.description.trim() || undefined,
			parent: values.parent || null,
			order: normalizedOrder,
		});
	};

	return (
		<Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
			<DialogTitle sx={{ pb: 1 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "primary.main", display: "flex", color: "white" }}>
						<FolderTree size={18} />
					</Box>
					<Box>
						<Typography variant="h6" fontWeight={700} lineHeight={1.2}>
							{isEdit ? "Edit Category" : "Create Category"}
						</Typography>
						{isEdit && (
							<Typography variant="caption" color="text.secondary">
								ID: {category!.id}
							</Typography>
						)}
					</Box>
				</Box>
			</DialogTitle>

			<Divider />

			<DialogContent sx={{ pt: 3 }}>
				<Stack spacing={2.5}>
					{/* Name */}
					<Controller
						name="name"
						control={control}
						rules={{ required: "Category name is required" }}
						render={({ field: { onChange, ...field } }) => (
							<TextField
								{...field}
								label="Category name"
								required
								fullWidth
								size="small"
								onChange={(e) => onChange(e.target.value)}
								error={!!errors.name}
								helperText={errors.name?.message}
							/>
						)}
					/>

					{/* Description */}
					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Description"
								fullWidth
								multiline
								rows={3}
								size="small"
							/>
						)}
					/>

					<Stack direction="row" spacing={2}>
						{/* Parent */}
						<Controller
							name="parent"
							control={control}
							render={({ field }) => (
								<Autocomplete
									fullWidth
									size="small"
									options={parentOptions}
									value={parentOptions.find((cat) => cat.id === field.value) ?? null}
									onChange={(_event, newValue) => field.onChange(newValue?.id ?? "")}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => getLabelWithDepth(option)}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Parent category"
											helperText="Leave empty for root category"
										/>
									)}
								/>
							)}
						/>
					</Stack>
				</Stack>
			</DialogContent>

			<Divider />

			<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
				<Button onClick={onCancel} startIcon={<Close />} variant="outlined" color="inherit" disabled={isLoading}>
					Hủy
				</Button>
				<Button
					onClick={handleSubmit(onValid)}
					variant="contained"
					disableElevation
					startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
					disabled={isLoading}
				>
					{isLoading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}