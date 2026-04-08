import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
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
import { Refresh, Search } from "@mui/icons-material";
import userService from "@services/user.services";
import useSnackbar from "@hooks/useSnackbar";
import useAuth from "@hooks/useAuth";
import type { AdminUserDto, UserRoleDto } from "@my-types/user.dto";

const ROLE_OPTIONS: Array<{ value: UserRoleDto; label: string }> = [
	{ value: "customer", label: "Customer" },
	{ value: "admin", label: "Admin" },
];

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
};

export default function UserManagement() {
	const { user: currentUser } = useAuth();
	const { success, error } = useSnackbar();

	const [users, setUsers] = useState<AdminUserDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [searchInput, setSearchInput] = useState("");
	const [appliedSearch, setAppliedSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<UserRoleDto | "">("");
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);
	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

	const fetchUsers = useCallback(
		async (page: number) => {
			setLoading(true);
			setErrorMessage(null);
			try {
				const response = await userService.listUsersByAdmin({
					page,
					limit: pageSize,
					search: appliedSearch || undefined,
					role: roleFilter || undefined,
				});

				setUsers(response.data);
				setTotal(response.total);
				setCurrentPage(response.page);
				setTotalPages(response.totalPages);
			} catch (err: any) {
				const message = err?.message ?? "Unable to load users.";
				setErrorMessage(message);
				error(message);
			} finally {
				setLoading(false);
			}
		},
		[appliedSearch, error, pageSize, roleFilter],
	);

	useEffect(() => {
		void fetchUsers(currentPage);
	}, [currentPage, fetchUsers]);

	const handleApplySearch = () => {
		setCurrentPage(1);
		setAppliedSearch(searchInput.trim());
	};

	const handleResetFilters = () => {
		setSearchInput("");
		setAppliedSearch("");
		setRoleFilter("");
		setCurrentPage(1);
	};

	const handleRoleChange = async (targetUser: AdminUserDto, nextRole: UserRoleDto) => {
		if (targetUser.role === nextRole) return;

		setChangingRoleUserId(targetUser.id);
		try {
			const updatedUser = await userService.updateUserRoleByAdmin(targetUser.id, { role: nextRole });
			setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
			success(`Updated role for ${updatedUser.firstName} ${updatedUser.lastName} to ${updatedUser.role}.`);
		} catch (err: any) {
			const message = err?.message ?? "Unable to update user role.";
			setErrorMessage(message);
			error(message);
		} finally {
			setChangingRoleUserId(null);
		}
	};

	const handleDeleteUser = async (targetUser: AdminUserDto) => {
		if (targetUser.id === currentUser?.userId) return;
		const confirmed = window.confirm(`Delete user ${targetUser.email}?`);
		if (!confirmed) return;

		setDeletingUserId(targetUser.id);
		try {
			await userService.deleteUserByAdmin(targetUser.id);
			success(`Deleted user ${targetUser.email}.`);

			const nextTotal = Math.max(total - 1, 0);
			const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / pageSize);
			const nextPage = Math.min(currentPage, Math.max(nextTotalPages, 1));
			setCurrentPage(nextPage);
			void fetchUsers(nextPage);
		} catch (err: any) {
			const message = err?.message ?? "Unable to delete user.";
			setErrorMessage(message);
			error(message);
		} finally {
			setDeletingUserId(null);
		}
	};

	return (
		<>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
				<Box>
					<Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
						User Management
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
						Manage account roles and monitor user verification status.
					</Typography>
				</Box>
				<Button
					variant="outlined"
					startIcon={<Refresh />}
					onClick={() => void fetchUsers(currentPage)}
					disabled={loading}
				>
					Refresh
				</Button>
			</Box>

			<Paper sx={{ p: 2.5, mb: 2.5 }}>
				<Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
					<TextField
						label="Search users"
						placeholder="Name, email, phone"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								handleApplySearch();
							}
						}}
						fullWidth
					/>

					<FormControl size="small" sx={{ minWidth: 180 }}>
						<InputLabel>Role</InputLabel>
						<Select
							label="Role"
							value={roleFilter}
							onChange={(event) => {
								setRoleFilter(event.target.value as UserRoleDto | "");
								setCurrentPage(1);
							}}
						>
							<MenuItem value="">All roles</MenuItem>
							{ROLE_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel>Rows</InputLabel>
						<Select
							label="Rows"
							value={pageSize}
							onChange={(event) => {
								setPageSize(Number(event.target.value));
								setCurrentPage(1);
							}}
						>
							{[5, 10, 20, 50].map((size) => (
								<MenuItem key={size} value={size}>
									{size}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Button variant="contained" startIcon={<Search />} fullWidth onClick={handleApplySearch}>
						Search
					</Button>
					<Button variant="text" onClick={handleResetFilters}>
						Reset
					</Button>
				</Stack>
			</Paper>

			{errorMessage && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
					{errorMessage}
				</Alert>
			)}

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell>Email</TableCell>
								<TableCell>Phone</TableCell>
								<TableCell>Role</TableCell>
								<TableCell>Verified</TableCell>
								<TableCell>Created At</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{users.length > 0 ? (
								users.map((user) => {
									const isCurrentUser = user.id === currentUser?.userId;
									const roleChangeDisabled = changingRoleUserId === user.id || (isCurrentUser && user.role === "admin");
									const deleteDisabled = deletingUserId === user.id || isCurrentUser;

									return (
										<TableRow key={user.id} hover>
											<TableCell>
												<Typography sx={{ fontWeight: 700 }}>{user.firstName} {user.lastName}</Typography>
												{isCurrentUser && <Typography variant="caption" color="text.secondary">Current account</Typography>}
											</TableCell>
											<TableCell>{user.email}</TableCell>
											<TableCell>{user.phone || "-"}</TableCell>
											<TableCell>
												<FormControl size="small" sx={{ minWidth: 140 }}>
													<Select
														value={user.role}
														disabled={roleChangeDisabled}
														onChange={(event) => void handleRoleChange(user, event.target.value as UserRoleDto)}
													>
														{ROLE_OPTIONS.map((option) => (
															<MenuItem key={option.value} value={option.value}>
																{option.label}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											</TableCell>
											<TableCell>
												<Chip
													size="small"
													label={user.isEmailVerified ? "Verified" : "Unverified"}
													color={user.isEmailVerified ? "success" : "warning"}
												/>
											</TableCell>
											<TableCell>{formatDateTime(user.createdAt)}</TableCell>
											<TableCell align="right">
												<Button
													variant="text"
													color="error"
													disabled={deleteDisabled}
													onClick={() => void handleDeleteUser(user)}
												>
													{deletingUserId === user.id ? "Deleting..." : "Delete"}
												</Button>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow>
									<TableCell colSpan={7} sx={{ py: 6 }}>
										<Typography align="center" color="text.secondary">
											No users found for current filters.
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
				<Typography variant="body2" color="text.secondary">
					Total users: {total.toLocaleString("vi-VN")} | Page {totalPages === 0 ? 0 : currentPage} / {totalPages}
				</Typography>
				<Stack direction="row" spacing={1}>
					<Button
						variant="outlined"
						size="small"
						disabled={loading || currentPage <= 1}
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
					>
						Previous
					</Button>
					<Button
						variant="outlined"
						size="small"
						disabled={loading || totalPages === 0 || currentPage >= totalPages}
						onClick={() => setCurrentPage((prev) => prev + 1)}
					>
						Next
					</Button>
				</Stack>
			</Stack>
		</>
	);
}
