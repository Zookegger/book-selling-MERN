import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import publisherService from "@services/publisher.services";
import { useForm } from "react-hook-form";
import type {
	CreatePublisherDto,
	PublisherDto,
} from "@my-types/publisher.dto";
import useSnackbar from "@hooks/useSnackbar";

const defaultFormState: CreatePublisherDto = {
	name: "",
	contactEmail: "",
	website: "",
	description: "",
	location: { address: "", city: "", country: "" },
	isActive: true,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminPublishersPage() {
	const [publishers, setPublishers] = useState<PublisherDto[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPublisher, setEditingPublisher] = useState<PublisherDto | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { success, error } = useSnackbar();

	const {
		register,
		handleSubmit,
		reset,
		setError,
		watch,
		formState: { errors: formErrors, isSubmitting },
	} = useForm<CreatePublisherDto>({
		defaultValues: defaultFormState,
	});

	const hasPublishers = useMemo(() => publishers.length > 0, [publishers]);

	useEffect(() => {
		fetchPublishers();
	}, []);

	async function fetchPublishers() {
		setLoading(true);
		try {
			const result = await publisherService.listPublishers({
				search: search.trim() || undefined,
			});
			setPublishers(result.data);
		} catch (err) {
			console.error(err);
			error("Không thể tải danh sách nhà xuất bản.");
		} finally {
			setLoading(false);
		}
	}

	function openCreateDialog() {
		setEditingPublisher(null);
		reset(defaultFormState);
		setSubmitError(null);
		setDialogOpen(true);
	}

	function openEditDialog(publisher: PublisherDto) {
		setEditingPublisher(publisher);
		reset({
			name: publisher.name,
			contactEmail: publisher.contactEmail,
			website: publisher.website ?? "",
			description: publisher.description ?? "",
			location: {
				address: publisher.location?.address ?? "",
				city: publisher.location?.city ?? "",
				country: publisher.location?.country ?? "",
			},
			isActive: publisher.isActive,
		});
		setSubmitError(null);
		setDialogOpen(true);
	}

	function closeDialog() {
		setDialogOpen(false);
		setEditingPublisher(null);
		reset(defaultFormState);
		setSubmitError(null);
	}

	function normalizePublisherPayload(form: CreatePublisherDto) {
		const payload: any = {
			name: form.name.trim(),
			contactEmail: form.contactEmail?.trim() || undefined,
			website: form.website?.trim() || undefined,
			description: form.description?.trim() || undefined,
			logo: form.logo?.trim() || undefined,
			isActive: form.isActive,
		};

		const location = {
			address: form.location?.address?.trim() || undefined,
			city: form.location?.city?.trim() || undefined,
			country: form.location?.country?.trim() || undefined,
		};

		if (location.address || location.city || location.country) {
			payload.location = location;
		}

		return payload as CreatePublisherDto;
	}

	async function handleSave(formValues: CreatePublisherDto) {
		setSubmitError(null);

		const payload = normalizePublisherPayload(formValues);

		try {
			if (editingPublisher) {
				await publisherService.updatePublisher(editingPublisher.id, payload);
			} else {
				await publisherService.createPublisher(payload);
			}
			await fetchPublishers();
			closeDialog();
			success(`Nhà xuất bản đã được ${editingPublisher ? "cập nhật" : "tạo"} thành công.`);
		} catch (error: any) {
			const message = error?.message ?? "Có lỗi xảy ra khi lưu.";
			setSubmitError(message);

			if (message.includes("Invalid website URL") || message.includes("website")) {
				setError("website", { type: "server", message });
			}
			if (message.includes("Invalid email address") || message.includes("email")) {
				setError("contactEmail", { type: "server", message });
			}


		}
	}

	async function handleDelete(id: string) {
		const confirmed = window.confirm("Bạn có chắc muốn xóa nhà xuất bản này?");
		if (!confirmed) return;

		setLoading(true);
		try {
			await publisherService.deletePublisher(id);
			await fetchPublishers();
			success("Nhà xuất bản đã được xóa thành công.");
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	const title = editingPublisher ? "Sửa nhà xuất bản" : "Thêm nhà xuất bản";

	return (
		<Box>

			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
				<Box>
					<Typography variant="h4" component="h1">
						Quản lý nhà xuất bản
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Thêm, sửa, xóa và tìm kiếm nhà xuất bản.
					</Typography>
				</Box>

				<Button variant="contained" onClick={openCreateDialog}>
					Thêm mới
				</Button>
			</Stack>

			<Paper sx={{ p: 3, mb: 3 }}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
					<TextField
						label="Tìm kiếm"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						fullWidth
					/>
					<Button variant="outlined" onClick={fetchPublishers}>
						Tìm
					</Button>
				</Stack>
			</Paper>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Tên</TableCell>
								<TableCell>Email liên hệ</TableCell>
								<TableCell>Website</TableCell>
								<TableCell>Trạng thái</TableCell>
								<TableCell align="right">Hành động</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{hasPublishers ? (
								publishers.map((publisher) => (
									<TableRow key={publisher.id}>
										<TableCell>{publisher.name}</TableCell>
										<TableCell>{publisher.contactEmail}</TableCell>
										<TableCell>{publisher.website || "-"}</TableCell>
										<TableCell>{publisher.isActive ? "Hoạt động" : "Ngừng"}</TableCell>
										<TableCell align="right">
											<Stack direction="row" spacing={1} justifyContent="flex-end">
												<Button size="small" variant="outlined" onClick={() => openEditDialog(publisher)}>
													Sửa
												</Button>
												<Button
													size="small"
													variant="contained"
													color="error"
													onClick={() => handleDelete(publisher.id)}
												>
													Xóa
												</Button>
											</Stack>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} sx={{ px: 4, py: 5 }}>
										<Typography align="center" color="text.secondary">
											Không tìm thấy nhà xuất bản.
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent>
					<Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit(handleSave)}>
						<Stack spacing={2}>
							{submitError && (
								<Alert severity="error" sx={{ mb: 2 }}>
									{submitError}
								</Alert>
							)}
							<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
								<TextField
									label="Tên nhà xuất bản"
									{...register("name", {
										required: "Tên nhà xuất bản không được để trống.",
										validate: (value) =>
											value.trim().length > 0 || "Tên nhà xuất bản không được để trống.",
									})}
									fullWidth
									required
									error={!!formErrors.name}
									helperText={formErrors.name?.message ?? " "}
								/>
								<TextField
									label="Email liên hệ"
									{...register("contactEmail", {
										required: "Email liên hệ không được để trống.",
										validate: (value) =>
											emailRegex.test((value ?? "").trim()) ||
											"Email liên hệ phải là một địa chỉ hợp lệ.",
									})}
									fullWidth
									required
									error={!!formErrors.contactEmail}
									helperText={formErrors.contactEmail?.message ?? " "}
								/>
							</Stack>

							<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
								<TextField
									label="Website"
									{...register("website", {
										validate: (value) => {
											if (!value || !value.trim()) return true;
											try {
												new URL(value.trim());
												return true;
											} catch {
												return "Website phải là một URL hợp lệ.";
											}
										},
									})}
									fullWidth
									error={!!formErrors.website}
									helperText={formErrors.website?.message ?? " "}
								/>
								<FormControlLabel
									control={
										<Checkbox
											{...register("isActive")}
											checked={!!watch("isActive")}
										/>
									}
									label="Hoạt động"
								/>
							</Stack>

							<TextField
								label="Mô tả"
								{...register("description")}
								fullWidth
								multiline
								minRows={3}
							/>

							<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
								<TextField
									label="Địa chỉ"
									{...register("location.address")}
									fullWidth
								/>
								<TextField
									label="Thành phố"
									{...register("location.city")}
									fullWidth
								/>
								<TextField
									label="Quốc gia"
									{...register("location.country")}
									fullWidth
								/>
							</Stack>
						</Stack>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={closeDialog} disabled={isSubmitting}>
						Hủy
					</Button>
					<Button variant="contained" onClick={handleSubmit(handleSave)} disabled={isSubmitting}>
						{editingPublisher ? "Cập nhật" : "Tạo mới"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
