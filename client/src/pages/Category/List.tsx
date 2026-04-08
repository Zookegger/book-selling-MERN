import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Divider from "@mui/material/Divider";
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Import service and types
import { categoryService, type ICategory } from "@services/category.service";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";
import { Paper } from "@mui/material";
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
            <Box sx={{ mb: 10, textAlign: "center" }}>
                <Typography
                    variant="h3"
                    fontWeight={900}
                    gutterBottom
                    sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}
                >
                    All Book Categories
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
                    Choose a topic to explore our collection
                </Typography>
            </Box>

            {/* Grid section */}
            <Grid
                container
                spacing={3}
                sx={{ justifyContent: "center" }}
            >
                {categories.map((cat) => (
                    <Grid
                        key={cat.id}
                        sx={{
                            minWidth: 280,
                            p: 1.5,
                            display: 'flex',
                            justifyContent: 'center' // Center content inside each Grid cell
                        }}
                    >
                        <Card sx={{
                            width: '100%',
                            // Limit max width of Card so it doesn't stretch too much on ultra-wide screens
                            maxWidth: 340,
                            borderRadius: 5,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                                transform: "translateY(-5px)",
                                boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                                borderColor: 'primary.main'
                            }
                        }}>
                            <CardActionArea
                                component={Link}
                                to={ROUTES.CATEGORY_DETAIL(cat.slug)}
                                sx={{ height: '100%', p: 1 }}
                            >
                                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                    <Box sx={{
                                        width: 50, height: 50, borderRadius: 2,
                                        bgcolor: 'primary.main', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        mx: 'auto', mb: 2,
                                        boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
                                    }}>
                                        <MenuBookIcon />
                                    </Box>

                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
                                        {cat.name}
                                    </Typography>

                                    <Divider sx={{ my: 2, width: '20%', mx: 'auto', borderBottomWidth: 2, borderColor: 'primary.light' }} />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            minHeight: '3em',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            mb: 2
                                        }}
                                    >
                                        {cat.description || "Discover the best books in this topic."}
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Explore now ➔
                                    </Typography>
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