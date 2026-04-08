import { ROUTES } from "@constants/index";
import useAuth from "@hooks/useAuth";
import useCart from "@hooks/useCart";
import { AppBar, Box, Button, Container, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";

type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
	const { isAuthenticated, user, logout } = useAuth();
	const { itemCount, fetchItemCount } = useCart();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	function handleClick(event: MouseEvent<HTMLElement>) {
		setAnchorEl(event.currentTarget);
	};

	function handleClose() {
		setAnchorEl(null);
	};

	useEffect(() => {
		if (!isAuthenticated) return;
		void fetchItemCount();
	}, [fetchItemCount, isAuthenticated]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: "100vw" }}>
			<AppBar position="static" color="transparent" elevation={0}>
				<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						<Link to={ROUTES.HOME} style={{ textDecoration: "none", color: "black" }}>Book Store</Link>
					</Typography>


					{!isAuthenticated ? (
						<Box>
							<Button component={Link} to={ROUTES.LOGIN} style={{ textDecoration: "none", color: "inherit" }}>Sign in</Button>
							<Button component={Link} to={ROUTES.REGISTER} style={{ textDecoration: "none", color: "inherit" }}>Sign up</Button>
						</Box>
					) : (
						<>
							<Button
								component={Link}
								to={ROUTES.CART}
								style={{ textDecoration: "none", color: "inherit" }}
							>
								Giỏ hàng ({itemCount})
							</Button>
							<Button onClick={handleClick} sx={{ color: "black" }}>{user?.firstName}</Button>
							<Menu open={open} anchorEl={anchorEl} onClose={handleClose}>
								<MenuItem><Link to={ROUTES.PROFILE} style={{ textDecoration: "none", color: "inherit" }}>Profile</Link></MenuItem>
								<MenuItem onClick={async () => {
									handleClose();
									await logout()
								}}>Sign Out</MenuItem>
							</Menu>
						</>
					)}
				</Toolbar>
			</AppBar>
			<Container maxWidth={"xl"}>{children ?? <Outlet />}</Container>
		</Box>
	);
};

export default MainLayout;
