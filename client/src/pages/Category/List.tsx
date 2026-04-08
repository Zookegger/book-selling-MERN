import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// Import lẻ để tối ưu hiệu năng và tránh lỗi TypeScript Overload trên Grid v6
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid"; 
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Divider from "@mui/material/Divider";
import MenuBookIcon from '@mui/icons-material/MenuBook';

// Import service và types
import { categoryService, type ICategory } from "@services/category.service";
import LoadingSkeleton from "@components/layout/LoadingSkeleton";

const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                // Lấy trang 1, giới hạn 100 mục để đảm bảo load đủ danh mục phẳng
                const res = await categoryService.getList(1, 100, "");
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return <LoadingSkeleton />;

    return (
        /* BƯỚC 1: Sử dụng maxWidth="xl" (1536px) để nội dung dàn rộng 
           trên màn hình rời to của bạn.
        */
        <Container maxWidth="xl" sx={{ py: 8 }}>
            {/* Header section */}
            <Box sx={{ mb: 10, textAlign: "center" }}>
                <Typography 
                    variant="h3" 
                    fontWeight={900} 
                    gutterBottom 
                    sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}
                >
                    Tất Cả Thể Loại Sách
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
                    Chọn một chủ đề để khám phá kho tri thức của chúng tôi
                </Typography>
            </Box>

            {/* Grid section */}
            <Grid 
    container 
    spacing={3} 
    /* BƯỚC QUAN TRỌNG: Căn giữa tất cả các thẻ con */
    sx={{ justifyContent: "center" }} 
>
    {categories.map((cat) => (
        <Grid 
            key={cat.id} 
            sx={{ 
                // Ép 25% cho màn hình lớn (4 cột), 33.33% cho trung bình (3 cột)
                // Nếu màn hình không đủ rộng cho 4, nó sẽ hiện 3 và TỰ CĂN GIỮA
                width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' }, 
                p: 1.5,
                display: 'flex',
                justifyContent: 'center' // Căn giữa nội dung bên trong mỗi ô Grid
            }}
        >
            <Card sx={{ 
                width: '100%',
                // Giới hạn chiều rộng tối đa của Card để nó không bị quá bè khi ở màn hình siêu to
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
                    to={`/the-loai/${cat.slug}`}
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
                            {cat.description || "Khám phá những cuốn sách hay nhất thuộc chủ đề này."}
                        </Typography>

                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Khám phá ngay ➔
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    ))}
</Grid>
        </Container>
    );
};

export default CategoryList;