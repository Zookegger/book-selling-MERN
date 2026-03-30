import Loading from "@components/common/Loading";
import {
    PhoneField,
    type PhoneValue,
    splitPhone,
} from "@components/input/PhoneField";
import {
    Box,
    Container,
    IconButton,
    Paper,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import type { UserDto } from "@my-types/user.dto";
import userService from "@services/user.services";
import {
    CheckCircle,
    Edit2,
    Mail,
    Phone,
    Save,
    User,
    X,
    XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ─── FieldRow ────────────────────────────────────────────────────────────────

interface FieldRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    editing: boolean;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    endAdornment?: React.ReactNode;
}

function FieldRow({
    icon,
    label,
    value,
    editing,
    name,
    onChange,
    disabled,
    endAdornment,
}: FieldRowProps) {
    const isEditable = editing && !disabled;

    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
                sx={{
                    mt: 0.5,
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        display: "block",
                    }}
                >
                    {label}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                    {isEditable ? (
                        <TextField
                            name={name}
                            value={value}
                            onChange={onChange}
                            variant="standard"
                            fullWidth
                            size="small"
                            sx={{
                                "& .MuiInput-underline:before": { borderColor: "divider" },
                            }}
                        />
                    ) : (
                        <Typography
                            variant="body1"
                            noWrap
                            sx={{
                                flex: 1,
                                color: disabled && editing ? "text.disabled" : "text.primary",
                            }}
                        >
                            {value || "—"}
                        </Typography>
                    )}

                    {endAdornment && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            {endAdornment}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

let profileCache: UserDto | null = null;
let hasProfileCache = false;
let profileRequest: Promise<UserDto | null> | null = null;

// ─── ProfileTab ──────────────────────────────────────────────────────────────

interface ProfileTabProps {
    setErrorMessage: (errorMsg: string) => void;
    onSnack: (msg: string, severity: "success" | "error") => void;
}

export default function ProfileTab({ setErrorMessage, onSnack }: ProfileTabProps) {
    const initialProfile = useMemo(() => (hasProfileCache ? profileCache : null), []);
    const [profile, setProfile] = useState<UserDto | null>(initialProfile);
    const [isLoading, setIsLoading] = useState(!initialProfile);
    const [draft, setDraft] = useState<Partial<UserDto>>({});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [phoneValue, setPhoneValue] = useState<PhoneValue>({
        countryCode: "+84",
        localNumber: "",
        fullNumber: "+84",
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchProfile() {
            if (hasProfileCache) {
                setProfile(profileCache);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                profileRequest ??= userService.fetchProfile();
                const res = await profileRequest;
                hasProfileCache = true;
                profileCache = res ?? null;
                if (isMounted) {
                    setProfile(profileCache);
                }
            } catch (error: any) {
                if (isMounted) {
                    setErrorMessage(error.message);
                }
            } finally {
                profileRequest = null;
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchProfile();
        return () => {
            isMounted = false;
        };
    }, [setErrorMessage]);

    function cancelEdit() {
        setDraft({});
        setPhoneError(null);
        setEditing(false);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        const nextValue = name === "phone" ? value.replace(/\D/g, "") : value;
        setDraft((prev) => ({ ...prev, [name]: nextValue }));
    }

    async function handleSave() {
        setSaving(true);
        setPhoneError(null);
        try {
            const payload = { ...draft };

            const localPhoneRegex = /^[0-9]{6,15}$/;
            if (!localPhoneRegex.test(phoneValue.localNumber)) {
                setPhoneError("Enter digits only, e.g. 901123456");
                return;
            }
            payload.phone = phoneValue.fullNumber;

            const res = await userService.updateProfile(payload);
            if (!res) throw new Error("Something went wrong while updating your profile");

            if (profile) {
                const nextProfile: UserDto = {
                    ...profile,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                };
                setProfile(nextProfile);
                profileCache = nextProfile;
                hasProfileCache = true;
            }

            setDraft({});
            setEditing(false);
            onSnack("Profile updated successfully.", "success");
        } catch (err: any) {
            onSnack(err.message ?? "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    }

    const viewModel = useMemo(() => {
        if (!profile) return null;

        return {
            firstName: editing ? (draft.firstName ?? "") : profile.firstName,
            lastName: editing ? (draft.lastName ?? "") : profile.lastName,
            phone: editing ? (draft.phone ?? "") : profile.phone,
            joinedAt: formatDate(profile.createdAt),
            updatedAt: formatDate(profile.updatedAt),
        };
    }, [draft.firstName, draft.lastName, draft.phone, editing, profile]);

    if (isLoading) {
        return <Loading />;
    }

    if (!profile || !viewModel) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
                <Typography color="text.secondary">No profile found.</Typography>
            </Container>
        );
    }

    function startEdit() {
        if (profile) {
            setDraft({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
            const parsed = splitPhone(profile.phone ?? "");
            setPhoneValue({
                countryCode: parsed.code,
                localNumber: parsed.local,
                fullNumber: `${parsed.code}${parsed.local}`,
            });
            setPhoneError(null);
            setEditing(true);
        }
    }

    return (
        <>
            <Paper square elevation={0} sx={{ px: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 3 }}>
                    <FieldRow
                        icon={<User size={16} />}
                        label="First name"
                        value={viewModel.firstName}
                        editing={editing}
                        name="firstName"
                        onChange={handleChange}
                    />
                    <FieldRow
                        icon={<User size={16} />}
                        label="Last name"
                        value={viewModel.lastName}
                        editing={editing}
                        name="lastName"
                        onChange={handleChange}
                    />
                    <FieldRow
                        icon={<Mail size={16} />}
                        label="Email"
                        value={profile.email}
                        editing={editing}
                        name="email"
                        onChange={handleChange}
                        disabled
                        endAdornment={
                            <>
                                {profile.isEmailVerified ? (
                                    <CheckCircle size={14} color="#22c55e" />
                                ) : (
                                    <XCircle size={14} color="#ef4444" />
                                )}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: "0.7rem",
                                        color: profile.isEmailVerified ? "success.main" : "error.main",
                                        ml: 0.5,
                                    }}
                                >
                                    {profile.isEmailVerified ? "Email verified" : "Email not verified"}
                                </Typography>
                            </>
                        }
                    />

                    {!editing ? (
                        <FieldRow
                            icon={<Phone size={16} />}
                            label="Phone"
                            value={viewModel.phone}
                            editing={editing}
                            name="phone"
                            onChange={handleChange}
                        />
                    ) : (
                        <PhoneField
                            value={phoneValue}
                            onChange={(nextValue) => {
                                setPhoneValue(nextValue);
                                setDraft((prev) => ({ ...prev, phone: nextValue.fullNumber }));
                            }}
                            error={!!phoneError}
                            helperText={phoneError ?? undefined}
                            variant="filled"
                            size="small"
                        />
                    )}
                </Box>
            </Paper>

            {/* Footer bar */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: "grey.50",
                    px: 3,
                    py: 1,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {!editing ? (
                        <Tooltip title="Edit profile">
                            <IconButton onClick={startEdit} size="small" sx={{ color: "text.secondary" }}>
                                <Edit2 size={17} />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Save changes">
                                <IconButton onClick={handleSave} disabled={saving} size="small" color="primary">
                                    <Save size={17} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <IconButton onClick={cancelEdit} size="small" sx={{ color: "text.secondary" }}>
                                    <X size={17} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    {[
                        { label: "Joined", value: viewModel.joinedAt },
                        { label: "Updated", value: viewModel.updatedAt },
                    ].map(({ label, value }) => (
                        <Box key={label}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: "0.6rem",
                                    color: "text.disabled",
                                    letterSpacing: 0.8,
                                    textTransform: "uppercase",
                                }}
                            >
                                {label}
                            </Typography>
                            <Typography
                                variant="caption"
                                display="block"
                                sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                            >
                                {value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </>
    );
}