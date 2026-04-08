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
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import publisherService from "@services/publisher.services";
import { useForm } from "react-hook-form";
import type {
	CreatePublisherDto,
	PublisherDto,
} from "@my-types/publisher.dto";
import useSnackbar from "@hooks/useSnackbar";
import { DeleteOutline, Edit } from "@mui/icons-material";

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
			error("Unable to load publisher list.");
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
			success(`Publisher ${editingPublisher ? "updated" : "created"} successfully.`);
		} catch (error: any) {
			const message = error?.message ?? "An error occurred while saving.";
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
		const confirmed = window.confirm("Are you sure you want to delete this publisher?");
		if (!confirmed) return;

		setLoading(true);
		try {
			await publisherService.deletePublisher(id);
			await fetchPublishers();
			success("Publisher deleted successfully.");
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	const title = editingPublisher ? "Edit publisher" : "Add publisher";

	return (
		<Box>

			<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
				<Box>
					<Typography variant="h4" component="h1">
						Publisher Management
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Create, edit, delete, and search publishers.
					</Typography>
				</Box>

				<Button variant="contained" onClick={openCreateDialog}>
					Add New
				</Button>
			</Stack>

			<Paper sx={{ p: 3, mb: 3 }}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
					<TextField
						label="Search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						fullWidth
					/>
					<Button variant="outlined" onClick={fetchPublishers}>
						Search
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
								<TableCell>Name</TableCell>
								<TableCell>Contact email</TableCell>
								<TableCell>Website</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Created At</TableCell>
								<TableCell>Updated At</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{hasPublishers ? (
								publishers.map((publisher) => (
									<TableRow key={publisher.id}>
										<TableCell>{publisher.name}</TableCell>
										<TableCell>{publisher.contactEmail}</TableCell>
										<TableCell>{publisher.website || "-"}</TableCell>
										<TableCell>{publisher.isActive ? "Active" : "Inactive"}</TableCell>
										<TableCell>{new Date(publisher.createdAt).toLocaleDateString("vi-VN")} - {new Date(publisher.createdAt).toLocaleTimeString("vi-VN")}</TableCell>
										<TableCell>{new Date(publisher.updatedAt).toLocaleDateString("vi-VN")} - {new Date(publisher.updatedAt).toLocaleTimeString("vi-VN")}</TableCell>
										<TableCell align="right" sx={{ pr: 2 }}>
											<Stack direction="row" spacing={0.5} justifyContent="flex-end">
												<Tooltip title="Edit">
													<IconButton size="small" onClick={() => openEditDialog(publisher)} color="primary">
														<Edit fontSize="small" />
													</IconButton>
												</Tooltip>
												<Tooltip title="Delete">
													<IconButton
														size="small"
														color="error"
														onClick={() => {
															if (window.confirm(`Delete Publisher "${publisher.name}"?`)) handleDelete(publisher.id);
														}}
													>
														<DeleteOutline fontSize="small" />
													</IconButton>
												</Tooltip>
											</Stack>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} sx={{ px: 4, py: 5 }}>
										<Typography align="center" color="text.secondary">
											No publishers found.
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
									label="Publisher name"
									{...register("name", {
										required: "Publisher name is required.",
										validate: (value) =>
											value.trim().length > 0 || "Publisher name is required.",
									})}
									fullWidth
									required
									error={!!formErrors.name}
									helperText={formErrors.name?.message ?? " "}
								/>
								<TextField
									label="Contact email"
									{...register("contactEmail", {
										required: "Contact email is required.",
										validate: (value) =>
											emailRegex.test((value ?? "").trim()) ||
											"Contact email must be a valid email address.",
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
												return "Website must be a valid URL.";
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
									label="Active"
								/>
							</Stack>

							<TextField
								label="Description"
								{...register("description")}
								fullWidth
								multiline
								minRows={3}
							/>

							<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
								<TextField
									label="Address"
									{...register("location.address")}
									fullWidth
								/>
								<TextField
									label="City"
									{...register("location.city")}
									fullWidth
								/>
								<TextField
									label="Country"
									{...register("location.country")}
									fullWidth
								/>
							</Stack>
						</Stack>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={closeDialog} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button variant="contained" onClick={handleSubmit(handleSave)} disabled={isSubmitting}>
						{editingPublisher ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
