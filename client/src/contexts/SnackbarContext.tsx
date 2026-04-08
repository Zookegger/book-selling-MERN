import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useRef, useState, type ReactNode } from "react";

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

interface SnackbarContextValue {
    showSnackbar: (message: string, severity?: SnackbarState['severity'], autoHideDuration?: number) => void;
    hideSnackbar: () => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    snackbarProps: SnackbarState & { onClose: () => void };
}

export const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export default function SnackbarProvider({ children }: { children: ReactNode }) {
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideSnackbar = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'info', autoHideDuration = 4000) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setSnackbar({ open: true, message, severity });

        if (autoHideDuration) {
            timeoutRef.current = setTimeout(() => {
                setSnackbar(prev => ({ ...prev, open: false }));
            }, autoHideDuration);
        }
    }, []);

    const success = useCallback((message: string, duration?: number) =>
        showSnackbar(message, 'success', duration), [showSnackbar]);

    const error = useCallback((message: string, duration?: number) =>
        showSnackbar(message, 'error', duration), [showSnackbar]);

    const warning = useCallback((message: string, duration?: number) =>
        showSnackbar(message, 'warning', duration), [showSnackbar]);

    const info = useCallback((message: string, duration?: number) =>
        showSnackbar(message, 'info', duration), [showSnackbar]);

    const value = {
        showSnackbar,
        hideSnackbar,
        success,
        error,
        warning,
        info,
        snackbarProps: {
            open: snackbar.open,
            message: snackbar.message,
            severity: snackbar.severity,
            onClose: hideSnackbar
        }
    };

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={hideSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
}