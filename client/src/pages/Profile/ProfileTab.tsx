import { COUNTRY_CODES } from "@constants/CountryCodes";
import {
    Autocomplete,
    Box,
    IconButton,
    Paper,
    Stack,
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
import React, { useState } from "react";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function normalizePhonePart(value: string) {
    return value.replace(/\s+/g, "");
}

function splitPhone(fullPhone: string) {
    const normalizedPhone = normalizePhonePart(fullPhone ?? "");
    const defaultCode = "+84";

    const bestMatch = COUNTRY_CODES.map((item) => normalizePhonePart(item.code))
        .sort((a, b) => b.length - a.length)
        .find((code) => normalizedPhone.startsWith(code));

    const code = bestMatch ?? defaultCode;
    return {
        code,
        local: normalizedPhone.startsWith(code)
            ? normalizedPhone.slice(code.length)
            : normalizedPhone,
    };
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

// ─── PhoneField ──────────────────────────────────────────────────────────────

interface PhoneFieldProps {
    countryCode: string;
    codeInputValue: string;
    localPhone: string;
    phoneError: string | null;
    onCountryChange: (code: string) => void;
    onCodeInputChange: (value: string) => void;
    onLocalPhoneChange: (digits: string) => void;
}

function PhoneField({
    countryCode,
    codeInputValue,
    localPhone,
    phoneError,
    onCountryChange,
    onCodeInputChange,
    onLocalPhoneChange,
}: PhoneFieldProps) {
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
                <Phone size={16} />
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
                    Phone
                </Typography>

                <Stack direction="row" gap={1} width="100%" sx={{ mt: 0.25 }} alignItems="flex-start">
                    <Autocomplete
                        options={COUNTRY_CODES}
                        getOptionLabel={(option) => `${option.name} (${option.code})`}
                        value={
                            COUNTRY_CODES.find(
                                (c) => normalizePhonePart(c.code) === countryCode
                            ) ?? null
                        }
                        onChange={(_, newValue) => {
                            onCountryChange(normalizePhonePart(newValue?.code ?? ""));
                        }}
                        inputValue={codeInputValue}
                        onInputChange={(_, value, reason) => {
                            if (reason === "input") {
                                onCodeInputChange(normalizePhonePart(value));
                            }
                        }}
                        filterOptions={(options, { inputValue }) =>
                            options.filter(
                                (o) =>
                                    o.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                                    o.code.includes(inputValue)
                            )
                        }
                        sx={{ minWidth: 140 }}
                        slotProps={{ paper: { sx: { minWidth: 260 } } }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="filled"
                                label="Code"
                                error={!!phoneError}
                                helperText={phoneError ?? " "}
                                autoComplete="off"
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props} key={`${option.code}-${option.name}`}>
                                {option.name} ({option.code})
                            </li>
                        )}
                    />

                    <TextField
                        name="phone"
                        variant="filled"
                        label="Phone Number"
                        type="tel"
                        autoComplete="tel-national"
                        fullWidth
                        error={!!phoneError}
                        helperText={phoneError ?? " "}
                        value={localPhone}
                        onChange={(e) => onLocalPhoneChange(e.target.value.replace(/\D/g, ""))}
                        placeholder="901123456"
                    />
                </Stack>
            </Box>
        </Box>
    );
}

// ─── ProfileTab ──────────────────────────────────────────────────────────────

interface ProfileTabProps {
    profile: UserDto;
    onProfileUpdate: (updated: UserDto) => void;
    onSnack: (msg: string, severity: "success" | "error") => void;
}

export default function ProfileTab({ profile, onProfileUpdate, onSnack }: ProfileTabProps) {
    const [draft, setDraft] = useState<Partial<UserDto>>({});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [countryCode, setCountryCode] = useState("+84");
    const [codeInputValue, setCodeInputValue] = useState("+84");
    const [localPhone, setLocalPhone] = useState("");

    function startEdit() {
        setDraft({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
        const parsed = splitPhone(profile.phone ?? "");
        setCountryCode(parsed.code);
        setCodeInputValue(parsed.code);
        setLocalPhone(parsed.local);
        setPhoneError(null);
        setEditing(true);
    }

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
            if (!localPhoneRegex.test(localPhone)) {
                setPhoneError("Enter digits only, e.g. 901123456");
                return;
            }
            payload.phone = `${normalizePhonePart(countryCode)}${localPhone}`;

            const res = await userService.updateProfile(payload);
            if (!res) throw new Error("Something went wrong while updating your profile");

            onProfileUpdate(res);
            setDraft({});
            setEditing(false);
            onSnack("Profile updated successfully.", "success");
        } catch (err: any) {
            onSnack(err.message ?? "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    }

    const firstName = editing ? (draft.firstName ?? "") : profile.firstName;
    const lastName = editing ? (draft.lastName ?? "") : profile.lastName;
    const phone = editing ? (draft.phone ?? "") : profile.phone;

    return (
        <Box sx={{ flex: 1 }}>
            <Paper square elevation={0} sx={{ px: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 3 }}>
                    <FieldRow
                        icon={<User size={16} />}
                        label="First name"
                        value={firstName}
                        editing={editing}
                        name="firstName"
                        onChange={handleChange}
                    />
                    <FieldRow
                        icon={<User size={16} />}
                        label="Last name"
                        value={lastName}
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
                            value={phone}
                            editing={editing}
                            name="phone"
                            onChange={handleChange}
                        />
                    ) : (
                        <PhoneField
                            countryCode={countryCode}
                            codeInputValue={codeInputValue}
                            localPhone={localPhone}
                            phoneError={phoneError}
                            onCountryChange={(code) => {
                                setCountryCode(code);
                                setCodeInputValue(code);
                                setDraft((prev) => ({ ...prev, phone: `${code}${localPhone}` }));
                            }}
                            onCodeInputChange={setCodeInputValue}
                            onLocalPhoneChange={(digits) => {
                                setLocalPhone(digits);
                                setDraft((prev) => ({
                                    ...prev,
                                    phone: `${normalizePhonePart(countryCode)}${digits}`,
                                }));
                            }}
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
                        { label: "Joined", value: formatDate(profile.createdAt) },
                        { label: "Updated", value: formatDate(profile.updatedAt) },
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
        </Box>
    );
}