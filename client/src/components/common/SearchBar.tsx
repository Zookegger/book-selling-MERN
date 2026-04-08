import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, InputBase, Button, IconButton, useTheme, useMediaQuery } from "@mui/material";
import { Search, X } from "lucide-react";
import { ROUTES } from "@constants/index";

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // Sync input with URL parameters
    useEffect(() => {
        const queryValue = new URLSearchParams(location.search).get("q") ?? "";
        setSearchQuery(queryValue);
    }, [location.search]);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedQuery = searchQuery.trim();

        if (!normalizedQuery) {
            navigate(ROUTES.BOOKS);
            return;
        }

        navigate(`${ROUTES.BOOKS}?q=${encodeURIComponent(normalizedQuery)}`);
    };

    const handleClear = () => {
        setSearchQuery("");
        navigate(ROUTES.BOOKS);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                maxWidth: 640,
                mx: isMobile ? 0 : "auto",
                px: 1.5,
                py: 0.6,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 999,
                bgcolor: "background.paper",
                transition: "all 0.2s ease-in-out",
                // The magic touch: highlights the whole bar when the input is focused
                '&:focus-within': {
                    borderColor: "primary.main",
                    boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
                }
            }}
        >
            <Search size={18} color={theme.palette.text.secondary} />

            <InputBase
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search books by title or keyword"
                sx={{ flexGrow: 1, ml: 1 }}
                inputProps={{ "aria-label": "Search books" }}
            />

            {/* Only render the clear button if there's actually text to clear */}
            {searchQuery && (
                <IconButton size="small" onClick={handleClear} sx={{ p: 0.5, mr: 0.5 }}>
                    <X size={16} color={theme.palette.text.secondary} />
                </IconButton>
            )}

            <Button
                type="submit"
                variant="contained"
                size="small"
                disableElevation
                sx={{ borderRadius: 999, textTransform: "none", px: 3 }}
            >
                Search
            </Button>
        </Box>
    );
};