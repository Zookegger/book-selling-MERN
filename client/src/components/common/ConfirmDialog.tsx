import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

// components/common/ConfirmDialog.tsx
interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
    confirmColor?: "error" | "primary" | "warning";
}

export default function ConfirmDialog({ open, title, description, onConfirm, onClose, loading, confirmColor = "error" }: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogContent><DialogContentText>{description}</DialogContentText></DialogContent>}
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm} loading={loading}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}