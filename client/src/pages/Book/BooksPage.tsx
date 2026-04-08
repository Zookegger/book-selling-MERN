import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Breadcrumbs,
    Button,
    Chip,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { ROUTES } from "@constants/index";
import BookGrid from "@pages/Book/BookGrid";

const BooksPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const query = useMemo(() => {
        const value = new URLSearchParams(location.search).get("q") ?? "";
        return value.trim();
    }, [location.search]);

    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedQuery = searchInput.trim();
        if (!normalizedQuery) {
            navigate(ROUTES.BOOKS);
            return;
        }

        navigate(`${ROUTES.BOOKS}?q=${encodeURIComponent(normalizedQuery)}`);
    };

    return (
        <>
            <Breadcrumbs sx={{ mb: 3 }}>
                <MuiLink component={Link} to={ROUTES.HOME} underline="hover" color="inherit">
                    Home
                </MuiLink>
                <Typography color="text.primary">Books</Typography>
            </Breadcrumbs>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em", mb: 1 }}>
                    Explore Books
                </Typography>
                <Typography color="text.secondary">
                    Search by title and discover the full catalog.
                </Typography>
            </Box>

            <Stack
                component="form"
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                onSubmit={handleSearchSubmit}
                sx={{ mb: 3 }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search books by title"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />
                <Button type="submit" variant="contained" sx={{ textTransform: "none", minWidth: { sm: 120 } }}>
                    Search
                </Button>
                <Button
                    type="button"
                    variant="text"
                    sx={{ textTransform: "none", minWidth: { sm: 80 } }}
                    onClick={() => {
                        setSearchInput("");
                        navigate(ROUTES.BOOKS);
                    }}
                >
                    Clear
                </Button>
            </Stack>

            {query && (
                <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography color="text.secondary">Showing matches for</Typography>
                    <Chip label={query} color="primary" variant="outlined" />
                </Box>
            )}

            <BookGrid
                searchTerm={query || undefined}
                pageSize={20}
                emptyStateTitle={query ? `No books found for "${query}".` : "No books are available right now."}
                emptyStateActionLabel={query ? "Clear search" : "Browse categories"}
                emptyStateActionTo={query ? ROUTES.BOOKS : ROUTES.CATEGORY}
            />
        </>
    );
};

export default BooksPage;
