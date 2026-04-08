import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
    Container, Typography, Box, Grid, Card, 
    CardMedia, CardContent, Breadcrumbs, 
    Link as MuiLink, Divider
} from "@mui/material";

// Import corresponding Services and Types
import { categoryService, type ICategory } from "@services/category.service";
import { BookService } from "@services/book.services";
import type { BookDto } from "@my-types/book.dto";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";

const CategoryDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [category, setCategory] = useState<ICategory | null>(null);
    const [books, setBooks] = useState<BookDto[]>([]); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                // 1. Fetch all categories (limit 100 to be safe) and find the one matching the slug
                const catRes = await categoryService.getList(1, 100, ""); // Do not pass slug into the search field
                
                // Manually filter out the category that matches the URL slug
                const currentCat = catRes.data?.find((c: any) => c.slug === slug);

                if (currentCat) {
                    setCategory(currentCat); // At this point, Name and Description are guaranteed
                    
                    // 2. Fetch books by slug
                    const bookRes = await BookService.fetchAll({ 
                        category: slug, 
                        limit: 20 
                    });
                    setBooks(bookRes.data || []);
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
        <Container maxWidth="xl" sx={{ py: 6 }}>
            {/* Breadcrumbs - Navigation bar */}
            <Breadcrumbs sx={{ mb: 4, px: 2 }}>
                <MuiLink component={Link} to="/categories" underline="hover" color="inherit">
                    Categories
                </MuiLink>
                <Typography color="primary.main" sx={{ fontWeight: 700 }}>
                    {category?.name || "Details"}
                </Typography>
            </Breadcrumbs>

            {/* Header Banner - Display category name and description */}
            <Box sx={{ 
                mb: 8, p: { xs: 4, md: 6 }, 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: 6,
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(25, 118, 210, 0.2)'
            }}>
                <Typography variant="h2" fontWeight={900} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                    {category?.name}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 800, mx: 'auto' }}>
                    {category?.description || "Explore our special collection of books in this topic."}
                </Typography>
            </Box>

            <Divider sx={{ mb: 6 }}>
                <Typography variant="h5" fontWeight={800} color="text.secondary" sx={{ px: 3 }}>
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
                                <CardMedia
                                    component="img"
                                    height="380"
                                    image={book.coverImage || 'https://via.placeholder.com/400x600?text=Book+Cover'}
                                    alt={book.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ textAlign: 'center', p: 3, flexGrow: 1 }}>
                                    <Typography variant="h6" fontWeight={800} noWrap sx={{ mb: 1.5, color: 'text.primary' }}>
                                        {book.title}
                                    </Typography>
                                    
                                    {/* Display price from the first format (matches BookDto) */}
                                    <Typography variant="h5" color="error.main" fontWeight={900} sx={{ mb: 2 }}>
                                        ${book.formats && book.formats.length > 0 
                                            ? Number(book.formats[0].price).toLocaleString() 
                                            : "0"}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        {book.publisher ? `Publisher: ${typeof book.publisher === 'string' ? book.publisher : (book.publisher as any).name}` : "Publisher: Updating"}
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
    );
};

export default CategoryDetail;