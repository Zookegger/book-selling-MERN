import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: "100vw" }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Book Store
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth={"xl"}><Outlet /></Container>
    </Box>
  );
};

export default MainLayout;
