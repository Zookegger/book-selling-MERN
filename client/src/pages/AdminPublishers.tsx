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
import type {
  CreatePublisherDto,
  PublisherDto,
} from "@my-types/publisher.dto";

const defaultFormState: CreatePublisherDto = {
  name: "",
  contactEmail: "",
  website: "",
  description: "",
  location: { address: "", city: "", country: "" },
  isActive: true,
};

export default function AdminPublishersPage() {
  const [publishers, setPublishers] = useState<PublisherDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<PublisherDto | null>(null);
  const [formState, setFormState] = useState<CreatePublisherDto>(defaultFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingPublisher(null);
    setFormState(defaultFormState);
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEditDialog(publisher: PublisherDto) {
    setEditingPublisher(publisher);
    setFormState({
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
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPublisher(null);
    setFormErrors({});
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

  function validatePublisherForm(form: CreatePublisherDto) {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Tên nhà xuất bản không được để trống.";
    }

    const email = form.contactEmail?.trim() ?? "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      nextErrors.contactEmail = "Email liên hệ không được để trống.";
    } else if (!emailRegex.test(email)) {
      nextErrors.contactEmail = "Email liên hệ phải là một địa chỉ hợp lệ.";
    }

    if (form.website) {
      const website = form.website.trim();
      try {
        new URL(website);
      } catch {
        nextErrors.website = "Website phải là một URL hợp lệ.";
      }
    }

    return nextErrors;
  }

  function validatePublisherField(field: keyof CreatePublisherDto, value: string) {
    if (field === "name") {
      if (!value.trim()) return "Tên nhà xuất bản không được để trống.";
      return "";
    }

    if (field === "contactEmail") {
      const email = value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) return "Email liên hệ không được để trống.";
      if (!emailRegex.test(email)) return "Email liên hệ phải là một địa chỉ hợp lệ.";
      return "";
    }

    if (field === "website") {
      if (!value) return "";
      try {
        new URL(value);
        return "";
      } catch {
        return "Website phải là một URL hợp lệ.";
      }
    }

    return "";
  }

  async function handleSave() {
    setSaving(true);
    setFormErrors({});
    setSubmitError(null);

    const validationErrors = validatePublisherForm(formState);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setSaving(false);
      return;
    }

    const payload = normalizePublisherPayload(formState);

    try {
      if (editingPublisher) {
        await publisherService.updatePublisher(editingPublisher.id, payload);
      } else {
        await publisherService.createPublisher(payload);
      }
      await fetchPublishers();
      closeDialog();
    } catch (error: any) {
      const message = error?.message ?? "Có lỗi xảy ra khi lưu.";
      setSubmitError(message);

      if (message.includes("Invalid website URL") || message.includes("website")) {
        setFormErrors((prev) => ({ ...prev, website: message }));
      }
      if (message.includes("Invalid email address") || message.includes("email")) {
        setFormErrors((prev) => ({ ...prev, contactEmail: message }));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa nhà xuất bản này?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await publisherService.deletePublisher(id);
      await fetchPublishers();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const title = editingPublisher ? "Sửa nhà xuất bản" : "Thêm nhà xuất bản";

  return (
    <Box sx={{ py: 4 }}>
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

      <Paper>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
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
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Stack spacing={2}>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Tên nhà xuất bản"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  fullWidth
                  required
                  error={!!formErrors.name}
                  helperText={formErrors.name ?? " "}
                />
                <TextField
                  label="Email liên hệ"
                  value={formState.contactEmail}
                  onChange={(event) => setFormState({ ...formState, contactEmail: event.target.value })}
                  fullWidth
                  required
                  error={!!formErrors.contactEmail}
                  helperText={formErrors.contactEmail ?? " "}
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Website"
                  value={formState.website}
                  onChange={(event) => setFormState({ ...formState, website: event.target.value })}
                  fullWidth
                  error={!!formErrors.website}
                  helperText={formErrors.website ?? " "}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formState.isActive}
                      onChange={(event) => setFormState({ ...formState, isActive: event.target.checked })}
                    />
                  }
                  label="Hoạt động"
                />
              </Stack>

              <TextField
                label="Mô tả"
                value={formState.description}
                onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                fullWidth
                multiline
                minRows={3}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Địa chỉ"
                  value={formState.location?.address ?? ""}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      location: { ...formState.location, address: event.target.value },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Thành phố"
                  value={formState.location?.city ?? ""}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      location: { ...formState.location, city: event.target.value },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Quốc gia"
                  value={formState.location?.country ?? ""}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      location: { ...formState.location, country: event.target.value },
                    })
                  }
                  fullWidth
                />
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {editingPublisher ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
