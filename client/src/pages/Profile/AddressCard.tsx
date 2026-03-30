import { Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import type { AddressDto } from "@my-types/user.dto";
import { Edit2, MapPin, Phone, Trash2 } from "lucide-react";
import React from "react";

interface AddressCardProps {
    address: AddressDto;
    onEdit?: (address: AddressDto) => void;
    onDelete?: (id: string) => void;
}

const AddressCard = React.memo(({ address, onEdit, onDelete }: AddressCardProps) => {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack spacing={0.5} flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Typography fontWeight={600} noWrap>
                            {address.recipientName}
                        </Typography>
                        {address.isDefault && (
                            <Chip label="Default" size="small" color="primary" />
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center" gap={0.75} color="text.secondary">
                        <Phone size={13} />
                        <Typography variant="body2">{address.phoneNumber}</Typography>
                    </Stack>

                    <Stack direction="row" alignItems="flex-start" gap={0.75} color="text.secondary">
                        <MapPin size={13} style={{ marginTop: 3, flexShrink: 0 }} />
                        <Typography variant="body2">
                            {[
                                address.streetDetails,
                                address.ward,
                                address.district,
                                address.provinceOrCity,
                                address.country,
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        </Typography>
                    </Stack>
                </Stack>

                <Stack direction="row" gap={0.5} flexShrink={0}>
                    {onEdit && (
                        <IconButton size="small" onClick={() => onEdit(address)}>
                            <Edit2 size={15} />
                        </IconButton>
                    )}
                    {onDelete && (
                        <IconButton size="small" onClick={() => onDelete(address._id!)} color="error">
                            <Trash2 size={15} />
                        </IconButton>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
});

export default AddressCard;