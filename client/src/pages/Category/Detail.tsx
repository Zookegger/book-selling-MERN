import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography, Box, Breadcrumbs,
    Link as MuiLink, Divider,
} from "@mui/material";

import { categoryService, type ICategory } from "@services/category.service";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import BookGrid from "@pages/Book/BookGrid";

const CategoryDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [category, setCategory] = useState<ICategory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const catRes = await categoryService.getList(1, 100, "");
                const currentCat = catRes.data?.find((c: any) => c.slug === slug);

                if (currentCat) {
                    setCategory(currentCat);
                } else {
                    console.warn("Category not found for this slug:", slug);
                }
            } catch (error) {
                console.error("Data loading error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [slug]);

    if (loading) return <LoadingSkeleton />;

    return (
        <>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 4, px: 0.5 }}>
                <MuiLink component={Link} to="/categories" underline="hover" color="inherit">
                    Categories
                </MuiLink>
                <Typography color="primary.main" sx={{ fontWeight: 700 }}>
                    {category?.name || "Details"}
                </Typography>
            </Breadcrumbs>

            {/* Header Banner */}
            <Box
                sx={{
                    mb: 8,
                    p: { xs: 4, md: 6 },
                    bgcolor: "primary.main",
                    color: "white",
                    borderRadius: 5,
                    textAlign: "center",
                    boxShadow: "0 12px 40px rgba(25,118,210,0.22)",
                    position: "relative",
                    overflow: "hidden",
                    // Subtle decorative ring
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -60,
                        right: -60,
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.07)",
                        pointerEvents: "none",
                    },
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: -80,
                        left: -40,
                        width: 280,
                        height: 280,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.05)",
                        pointerEvents: "none",
                    },
                }}
            >
                <Typography
                    variant="h2"
                    fontWeight={900}
                    gutterBottom
                    sx={{ letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}
                >
                    {category?.name}
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        opacity: 0.88,
                        fontWeight: 400,
                        maxWidth: 680,
                        mx: "auto",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    {category?.description || "Explore our special collection of books in this topic."}
                </Typography>
            </Box>

            <Divider sx={{ mb: 6 }}>
                <Typography
                    variant="overline"
                    fontWeight={800}
                    color="text.secondary"
                    sx={{ px: 3, fontSize: "0.75rem", letterSpacing: 2 }}
                >
                    BOOK LIST
                </Typography>
            </Divider>

            <BookGrid categorySlug={slug} pageSize={20} />
        </>
    );
};

export default CategoryDetail;