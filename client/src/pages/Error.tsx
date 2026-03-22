import { Box, Container, Typography, Button, useTheme } from '@mui/material';
import { Home, type LucideIcon } from 'lucide-react';

// 1. Define the blueprint strictly. Use '?' for optional props.
type ErrorPageProps = {
    icon: LucideIcon;
    errorCode: string | number;
    title: string;
    message: string;
    primaryActionText?: string;
    onPrimaryAction: () => void;
};

// 2. Apply the type to the arguments, and keep the default value here in the runtime code.
export default function ErrorPage({
    icon: Icon,
    errorCode,
    title,
    message,
    primaryActionText = "Go Back Home",
    onPrimaryAction
}: ErrorPageProps) {
    const theme = useTheme();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}
            >
                <Box
                    sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.action.hover
                    }}
                >
                    <Icon size={64} color={theme.palette.text.secondary} />
                </Box>

                <Typography variant="h1" fontWeight="bold" color="primary" gutterBottom>
                    {errorCode}
                </Typography>

                <Typography variant="h4" fontWeight="600" gutterBottom>
                    {title}
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    {message}
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={<Home size={20} />}
                    onClick={onPrimaryAction}
                    disableElevation
                >
                    {primaryActionText}
                </Button>
            </Box>
        </Container>
    );
}