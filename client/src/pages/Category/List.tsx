import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Divider from "@mui/material/Divider";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { categoryService, type ICategory } from "@services/category.service";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import { ROUTES } from "@constants";

const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const res = await categoryService.getList(1, 100, "");
                setCategories(res.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return <LoadingSkeleton />;

    return (
        <>
            {/* Header section */}
            <Box sx={{ mb: 8, textAlign: "center" }}>
                <Typography
                    variant="h3"
                    fontWeight={900}
                    gutterBottom
                    sx={{ letterSpacing: "-0.02em", color: "text.primary" }}
                >
                    All Book Categories
                </Typography>
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 400, opacity: 0.75 }}
                >
                    Choose a topic to explore our collection
                </Typography>
            </Box>

            {/* Grid section */}
            <Grid container spacing={3}>
                {categories.map((cat) => (
                    <Grid
                        key={cat.id}
                        size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                    >
                        <Card
                            sx={{
                                height: "100%",
                                borderRadius: 4,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-6px)",
                                    boxShadow: "0 16px 32px rgba(25,118,210,0.14)",
                                    borderColor: "primary.main",
                                    "& .cat-arrow": { opacity: 1, transform: "translateX(4px)" },
                                    "& .cat-icon-box": { bgcolor: "primary.dark" },
                                },
                            }}
                        >
                            <CardActionArea
                                component={Link}
                                to={ROUTES.CATEGORY_DETAIL(cat.slug)}
                                sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                            >
                                <CardContent
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        p: 3.5,
                                        flexGrow: 1,
                                    }}
                                >
                                    {/* Icon */}
                                    <Box
                                        className="cat-icon-box"
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 2.5,
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mb: 2.5,
                                            flexShrink: 0,
                                            boxShadow: "0 4px 12px rgba(25,118,210,0.28)",
                                            transition: "background-color 0.25s ease",
                                        }}
                                    >
                                        <MenuBookIcon sx={{ fontSize: 24 }} />
                                    </Box>

                                    {/* Name */}
                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        sx={{ mb: 1, color: "text.primary", lineHeight: 1.3 }}
                                    >
                                        {cat.name}
                                    </Typography>

                                    <Divider
                                        sx={{
                                            my: 1.5,
                                            width: "28px",
                                            mx: "auto",
                                            borderBottomWidth: 2.5,
                                            borderColor: "primary.light",
                                            borderRadius: 1,
                                        }}
                                    />

                                    {/* Description */}
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            flexGrow: 1,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            mb: 2.5,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {cat.description || "Discover the best books in this topic."}
                                    </Typography>

                                    {/* CTA row */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            color: "primary.main",
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.8,
                                                fontSize: "0.7rem",
                                            }}
                                        >
                                            Explore now
                                        </Typography>
                                        <ArrowForwardIcon
                                            className="cat-arrow"
                                            sx={{
                                                fontSize: 14,
                                                opacity: 0.6,
                                                transition: "all 0.2s ease",
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

export default CategoryList;