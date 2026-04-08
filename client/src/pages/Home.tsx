import { Box, Button, Container, Typography, Card, CardContent, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "@hooks/useAuth";

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <Container sx={{ py: 6 }}>
      {/* Hero */}
      

      {isAdmin && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Quản trị hệ thống
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate("/admin/authors")}
              >
                <CardContent>
                  <Typography variant="h6">Quản lý tác giả</Typography>
                  <Typography variant="body2">
                    Thêm, sửa, xoá và quản lý danh sách tác giả
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate("/admin/categories")}
              >
                <CardContent>
                  <Typography variant="h6">Quản lý thể loại sách</Typography>
                  <Typography variant="body2">
                    Thêm, sửa, xoá và quản lý danh sách thể loại sách
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Home;