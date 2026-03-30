import Loading from "@components/common/Loading";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import type { AddressDto } from "@my-types/user.dto";
import userService from "@services/user.services";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddressCard from "./AddressCard";
import AddressFormDialog from "./AddressFormDialog";
import ConfirmDialog from "@components/common/ConfirmDialog";

let addressesCache: AddressDto[] | null = null;
let hasAddressesCache = false;
let addressesRequest: Promise<AddressDto[] | null> | null = null;

type AddressFormData = {
    recipientName: string;
    phoneNumber: string;
    streetDetails: string;
    ward: string;
    district: string;
    provinceOrCity: string;
    country: string;
    isDefault: boolean;
};

interface AddressesTabProps {
    setErrorMessage: (errorMsg: string) => void;
    onSnack: (msg: string, severity: "success" | "error") => void;
}

export default function AddressesTab({ setErrorMessage, onSnack }: AddressesTabProps) {
    const initialAddresses = useMemo(() => (hasAddressesCache ? addressesCache : null), []);
    const [addresses, setAddresses] = useState<AddressDto[] | null>(initialAddresses);
    const [isLoading, setIsLoading] = useState<boolean>(!initialAddresses);

    // ── Dialog state ──────────────────────────────────────────────────────────
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchAddresses() {
            if (hasAddressesCache) {
                setAddresses(addressesCache);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                addressesRequest ??= userService.getAddresses();
                const res = await addressesRequest;
                hasAddressesCache = true;
                addressesCache = res ?? null;
                if (isMounted) setAddresses(addressesCache);
            } catch (error: any) {
                if (isMounted) setErrorMessage(error.message);
            } finally {
                addressesRequest = null;
                if (isMounted) setIsLoading(false);
            }
        }

        fetchAddresses();
        return () => { isMounted = false; };
    }, [setErrorMessage]);

    // ── Dialog handlers ───────────────────────────────────────────────────────
    const handleClose = useCallback(() => setDialogOpen(false), []);

    const openCreate = useCallback(() => {
        setEditingAddress(null);
        setDialogOpen(true);
    }, []);


    const openEdit = useCallback((address: AddressDto) => {
        setEditingAddress(address);
        setDialogOpen(true);
    }, [])

    const handleSubmit = useCallback(async (data: AddressFormData, id?: string) => {
        setSaving(true);
        try {
            if (id) {
                const updated = await userService.updateAddress(id, data);
                addressesCache = updated;
            } else {
                const created = await userService.addAddress(data);
                addressesCache = created;
            }
            console.log(addressesCache);

            setAddresses(addressesCache);
            setDialogOpen(false);
            onSnack(id ? "Address updated." : "Address added.", "success");
        } catch (err: any) {
            onSnack(err.message ?? "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    }, [onSnack])

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const handleDeleteClose = useCallback(() => setDeleteTargetId(null), []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTargetId) return;

        try {
            await userService.deleteAddress(deleteTargetId);
            addressesCache = (addressesCache ?? []).filter((a) => a._id !== deleteTargetId);
            setAddresses(addressesCache);
            onSnack("Address removed.", "success");
        } catch (err: any) {
            onSnack(err.message ?? "Failed to delete.", "error");
        } finally {
            setDeleteTargetId(null); // close after done
        }
    }, [deleteTargetId, onSnack]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (isLoading) return <Loading />;

    return (
        <Paper square elevation={0} sx={{ p: 3 }}>
            {addresses === null || addresses.length === 0 ? (
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={2}
                    sx={{
                        py: 6,
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        textAlign: "center",
                    }}
                >
                    <Typography variant="h6" fontWeight={500}>
                        No addresses yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add a shipping address to make checkout faster and easier.
                    </Typography>
                    <Button variant="contained" onClick={openCreate}>
                        Add new address
                    </Button>
                </Stack>
            ) : (
                <Stack spacing={2}>
                    {addresses.map((address) => (
                        <AddressCard
                            key={address._id}
                            address={address}
                            onEdit={openEdit}
                            onDelete={setDeleteTargetId}
                        />
                    ))}
                    <Box>
                        <Button variant="outlined" onClick={openCreate}>
                            Add new address
                        </Button>
                    </Box>
                </Stack>
            )}

            <AddressFormDialog
                open={dialogOpen}
                address={editingAddress}
                onClose={handleClose}
                onSubmit={handleSubmit}
                saving={saving}
            />

            <ConfirmDialog
                open={!!deleteTargetId}
                title="Delete address?"
                description="This action cannot be undone."
                onConfirm={handleDeleteConfirm}
                onClose={handleDeleteClose}
            />
        </Paper>
    );
}