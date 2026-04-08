import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Breadcrumbs, Chip, Link as MuiLink, Typography } from "@mui/material";

import { ROUTES } from "@constants/index";
import BookGrid from "@pages/Book/BookGrid";

const SearchResults: React.FC = () => {
    const location = useLocation();

    const query = useMemo(() => {
        const value = new URLSearchParams(location.search).get("q") ?? "";
        return value.trim();
    }, [location.search]);

    return (
        <>
            <Breadcrumbs sx={{ mb: 3 }}>
                <MuiLink component={Link} to={ROUTES.HOME} underline="hover" color="inherit">
                    Home
                </MuiLink>
                <Typography color="text.primary">Search</Typography>
            </Breadcrumbs>

            <Box sx={{ mb: 5 }}>
                <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-0.02em" }}>
                    Search Results
                </Typography>
                {query ? (
                    <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography color="text.secondary">Showing matches for</Typography>
                        <Chip label={query} color="primary" variant="outlined" />
                    </Box>
                ) : (
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Enter a keyword in the search bar to find books by title or description.
                    </Typography>
                )}
            </Box>

            {query ? (
                <BookGrid
                    searchTerm={query}
                    pageSize={20}
                    emptyStateTitle={`No books found for "${query}".`}
                    emptyStateActionLabel="Browse categories"
                    emptyStateActionTo={ROUTES.CATEGORY}
                />
            ) : (
                <Box sx={{ py: 10, textAlign: "center" }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No search keyword provided.
                    </Typography>
                    <MuiLink component={Link} sx={{ textDecoration: "none" }} to={ROUTES.CATEGORY} fontWeight={700}>
                        Explore categories
                    </MuiLink>
                </Box>
            )}
        </>
    );
};

export default SearchResults;
