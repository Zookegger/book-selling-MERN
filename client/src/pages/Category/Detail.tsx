import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography, Box, Breadcrumbs,
    Link as MuiLink, Divider,
} from "@mui/material";

import WishlistButton from "@components/common/WishlistButton";
// Import corresponding Services and Types
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

            {/* Book List - Forced to 4 columns on large screens */}
            <Grid 
                 container 
                spacing={3}
                sx={{ justifyContent: 'center' }}  
            >
                {books.length > 0 ? (
                    books.map((book) => (
                        <Grid 
                            key={book.id || book._id} 
                            sx={{ 
                                // Force 25% (4 columns) on medium screens and above (md)
                                width: { xs: '100%', sm: '50%', md: '25%' }, 
                                p: 2,
                                display: 'flex'
                            }}
                        >
                            <Card sx={{ 
                                position: 'relative',
                                width: '100%',
                                borderRadius: 5,
                                border: '1px solid',
                                borderColor: 'grey.200',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                    transform: 'translateY(-12px)', 
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                    borderColor: 'primary.light'
                                }
                            }}>
                                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                                    <WishlistButton bookId={book.id || (book as any)._id} />
                                </Box>
                                {/* 1. Image */}
                                <CardMedia
                                    component="img"
                                    height="380"
                                    image={book.coverImage || 'https://via.placeholder.com/400x600?text=Book+Cover'}
                                    alt={book.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                
                                <CardContent sx={{ 
                                    textAlign: 'center', 
                                    p: 3, 
                                    flexGrow: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: 1.5 
                                }}>
                                    <Box>
                                        {/* 2. Title */}
                                        <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                                            {book.title}
                                        </Typography>
                                        
                                        {/* 3. Subtitle */}
                                        {book.subtitle && (
                                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                                {book.subtitle}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* 4. Category Tags */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                                        {book.categories && book.categories.map((cat: any, idx) => {
                                            const catName = typeof cat === 'string' ? cat : cat.name;
                                            return (
                                                <Chip 
                                                    key={idx} 
                                                    label={catName || "Unknown"} 
                                                    size="small" 
                                                    color="primary" 
                                                    variant="outlined" 
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                                />
                                            );
                                        })}
                                    </Box>

                                    {/* Spacer to push the bottom elements down */}
                                    <Box sx={{ flexGrow: 1 }} />

                                    {/* 5. ISBN (Barcode Style) */}
                                    <Box sx={{ 
                                        bgcolor: '#f5f5f5', 
                                        p: 1, 
                                        borderRadius: 2, 
                                        border: '1px dashed #ccc'
                                    }}>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                fontFamily: 'monospace', 
                                                letterSpacing: 2, 
                                                color: 'text.primary',
                                                display: 'block',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ||||| | ||| || |||
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                            ISBN: {book.isbn || "N/A"}
                                        </Typography>
                                    </Box>
                                    
                                    {/* 6. Price */}
                                    <Typography variant="h5" color="error.main" fontWeight={900}>
                                        ${book.formats && book.formats.length > 0 
                                            ? Number(book.formats[0].price).toLocaleString() 
                                            : "0.00"}
                                    </Typography>
                                </CardContent>
                                
                                <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                    <Typography variant="button" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem' }}>
                                        VIEW DETAILS
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Box sx={{ width: '100%', py: 15, textAlign: 'center' }}>
                        <Typography variant="h5" color="text.disabled" fontWeight={600}>
                            There are currently no books in this category.
                        </Typography>
                        <MuiLink component={Link} to="/categories" sx={{ mt: 2, display: 'inline-block', fontWeight: 700 }}>
                            Return to categories page
                        </MuiLink>
                    </Box>
                )}
            </Grid>
        </Container>
            <BookGrid categorySlug={slug} pageSize={20} />
        </>
    );
};

export default CategoryDetail;