import { ROUTER_PATHS } from "@components/common/Router";
import useAuth from "@hooks/useAuth";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: "100vw" }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            <Link to={ROUTER_PATHS.HOME} replace style={{ textDecoration: "none", color: "black" }}>Book Store</Link>
          </Typography>


          {!isAuthenticated ? (
            <Box>
              <Button><Link to={ROUTER_PATHS.LOGIN} replace style={{ textDecoration: "none", color: "inherit" }}>Sign in</Link></Button>
              <Button><Link to={ROUTER_PATHS.REGISTER} replace style={{ textDecoration: "none", color: "inherit" }}>Sign up</Link></Button>
            </Box>
          ) : (
            <Button>{user?.firstName}</Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth={"xl"}><Outlet /></Container>
    </Box>
  );
};

export default MainLayout;
