import { PhoneField, splitPhone, type PhoneValue } from "@components/input/PhoneField";
import {
    Button, Dialog, DialogActions, DialogContent,
    DialogTitle, Divider, Grid, IconButton,
    MenuItem, TextField
} from "@mui/material";
import type { AddressDto } from "@my-types/user.dto";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AddressFormData = Omit<AddressDto, "_id">;

interface FieldErrors {
    recipientName?: string;
    phoneNumber?: string;
    streetDetails?: string;
    district?: string;
    provinceOrCity?: string;
    country?: string;
}

interface AddressFormDialogProps {
    open: boolean;
    address?: AddressDto | null;   // null/undefined = create mode, value = edit mode
    onClose: () => void;
    onSubmit: (data: AddressFormData, id?: string) => Promise<void>;
    saving?: boolean;
}

export default function AddressFormDialog({
    open,
    address,
    onClose,
    onSubmit,
    saving = false,
}: AddressFormDialogProps) {
    const isEdit = !!address;
    const [recipientName, setRecipientName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState<PhoneValue>({ countryCode: "", localNumber: "", fullNumber: "" });
    const [streetDetails, setStreetDetails] = useState("");
    const [ward, setWard] = useState("");
    const [district, setDistrict] = useState("");
    const [provinceOrCity, setProvinceOrCity] = useState("");
    const [country, setCountry] = useState("");
    const [isDefault, setIsDefault] = useState(false);

    const [errors, setErrors] = useState<FieldErrors>({});

    useEffect(() => {
        if (!open) return;

        if (address) {
            const { code, local } = splitPhone(address.phoneNumber ?? "");
            setRecipientName(address.recipientName ?? "");
            setPhoneNumber({ countryCode: code, localNumber: local, fullNumber: address.phoneNumber ?? "" });
            setStreetDetails(address.streetDetails ?? "");
            setWard(address.ward ?? "");
            setDistrict(address.district ?? "");
            setProvinceOrCity(address.provinceOrCity ?? "");
            setCountry(address.country ?? "");
            setIsDefault(address.isDefault ?? false);
        } else {
            setRecipientName("");
            setPhoneNumber({ countryCode: "", localNumber: "", fullNumber: "" });
            setStreetDetails("");
            setWard("");
            setDistrict("");
            setProvinceOrCity("");
            setCountry("");
            setIsDefault(false);
        }

        setErrors({});
    }, [open, address]);

    function buildFormData(): AddressFormData {
        return {
            recipientName,
            phoneNumber: phoneNumber.fullNumber,
            streetDetails,
            ward,
            district,
            provinceOrCity,
            country,
            isDefault,
        };
    }

    function validate(): boolean {
        const next: FieldErrors = {};
        if (!recipientName.trim()) next.recipientName = "Required";
        if (!phoneNumber.fullNumber.trim()) next.phoneNumber = "Required";
        if (!streetDetails.trim()) next.streetDetails = "Required";
        if (!district.trim()) next.district = "Required";
        if (!provinceOrCity.trim()) next.provinceOrCity = "Required";
        if (!country.trim()) next.country = "Required";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        await onSubmit(buildFormData(), address?._id);
    }

    const handlePhoneChange = useCallback((newPhone: PhoneValue) => {
        setPhoneNumber(newPhone);
        if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }, [errors.phoneNumber]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                }}
            >
                {isEdit ? "Edit address" : "Add new address"}
                <IconButton size="small" onClick={onClose}>
                    <X size={17} />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2.5 }}>
                <Grid container spacing={2}>
                    <Grid size={12}>
                        <TextField
                            label="Recipient name"
                            value={recipientName}
                            onChange={(e) => {
                                setRecipientName(e.target.value);
                                if (errors.recipientName) setErrors((prev) => ({ ...prev, recipientName: undefined }));
                            }}
                            error={!!errors.recipientName}
                            helperText={errors.recipientName ?? " "}
                            fullWidth
                            autoFocus
                            autoComplete="name"
                        />
                    </Grid>

                    <Grid size={12}>
                        <PhoneField
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            required
                            error={phoneNumber.localNumber.length > 0 && phoneNumber.localNumber.length < 6}
                            helperText={
                                phoneNumber.localNumber.length > 0 && phoneNumber.localNumber.length < 6
                                    ? "Phone number must be at least 6 digits"
                                    : errors.phoneNumber ?? undefined
                            }
                            variant="outlined"
                            label=""
                            size="medium"
                            showIcon={false}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            label="Street / house number"
                            value={streetDetails}
                            onChange={(e) => {
                                setStreetDetails(e.target.value);
                                if (errors.streetDetails) setErrors((prev) => ({ ...prev, streetDetails: undefined }));
                            }}
                            error={!!errors.streetDetails}
                            helperText={errors.streetDetails ?? " "}
                            fullWidth
                            autoComplete="street-address"
                        />
                    </Grid>

                    <Grid size={4}>
                        <TextField
                            label="Ward"
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                            helperText=" "
                            fullWidth
                        />
                    </Grid>

                    <Grid size={4}>
                        <TextField
                            label="District"
                            value={district}
                            onChange={(e) => {
                                setDistrict(e.target.value);
                                if (errors.district) setErrors((prev) => ({ ...prev, district: undefined }));
                            }}
                            error={!!errors.district}
                            helperText={errors.district ?? " "}
                            fullWidth
                        />
                    </Grid>

                    <Grid size={4}>
                        <TextField
                            label="Province / city"
                            value={provinceOrCity}
                            onChange={(e) => {
                                setProvinceOrCity(e.target.value);
                                if (errors.provinceOrCity) setErrors((prev) => ({ ...prev, provinceOrCity: undefined }));
                            }}
                            error={!!errors.provinceOrCity}
                            helperText={errors.provinceOrCity ?? " "}
                            fullWidth
                            autoComplete="address-level1"
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            label="Country"
                            value={country}
                            onChange={(e) => {
                                setCountry(e.target.value);
                                if (errors.country) setErrors((prev) => ({ ...prev, country: undefined }));
                            }}
                            error={!!errors.country}
                            helperText={errors.country ?? " "}
                            fullWidth
                            autoComplete="country-name"
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            select
                            label="Set as default address"
                            value={isDefault ? "yes" : "no"}
                            onChange={(e) => setIsDefault(e.target.value === "yes")}
                            helperText=" "
                            fullWidth
                        >
                            <MenuItem value="yes">Yes</MenuItem>
                            <MenuItem value="no">No</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    loading={saving}
                >
                    {isEdit ? "Save changes" : "Add address"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}