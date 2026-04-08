import { ROUTER_PATHS } from "@components/common/Router";
import useAuth from "@hooks/useAuth";
import useCart from "@hooks/useCart";
import { AppBar, Badge, Box, Button, Container, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

const MainLayout = () => {
	const { isAuthenticated, user, logout } = useAuth();
	const { totalItems } = useCart();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	function handleClick(event: React.MouseEvent<HTMLElement>) {
		setAnchorEl(event.currentTarget);
	};

	function handleClose() {
		setAnchorEl(null);
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: "100vw" }}>
			<AppBar position="static" color="transparent" elevation={0}>
				<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						<Link to={ROUTER_PATHS.HOME} style={{ textDecoration: "none", color: "black" }}>Book Store</Link>
					</Typography>

					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<Button component={Link} to={ROUTER_PATHS.CATEGORIES} style={{ textDecoration: "none", color: "inherit" }}>
							Thể Loại
						</Button>
						<Button component={Link} to={ROUTER_PATHS.CART} style={{ textDecoration: "none", color: "inherit" }}>
							<Badge badgeContent={totalItems} color="error">
								Giỏ hàng
							</Badge>
						</Button>

						{!isAuthenticated ? (
							<Box>
								<Button component={Link} to={ROUTER_PATHS.LOGIN} style={{ textDecoration: "none", color: "inherit" }}>Sign in</Button>
								<Button component={Link} to={ROUTER_PATHS.REGISTER} style={{ textDecoration: "none", color: "inherit" }}>Sign up</Button>
							</Box>
						) : (
							<>
								<Button onClick={handleClick} sx={{ color: "black" }}>{user?.firstName}</Button>
								<Menu open={open} anchorEl={anchorEl} onClose={handleClose}>
									<MenuItem><Link to={ROUTER_PATHS.PROFILE} style={{ textDecoration: "none", color: "inherit" }}>Profile</Link></MenuItem>
									<MenuItem onClick={async () => {
										handleClose();
										await logout()
									}}>Sign Out</MenuItem>
								</Menu>
							</>
						)}
					</Box>
				</Toolbar>
			</AppBar>
			<Container maxWidth={"xl"}><Outlet /></Container>
		</Box>
	);
};

export default MainLayout;
