import { ROUTER_PATHS, ROUTES } from "@constants/index";
import useAuth from "@hooks/useAuth";
import useOrder from "@hooks/useOrder";
import { AppBar, Box, Button, Container, Divider, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";

type MainLayoutProps = {
	children?: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
	const { isAuthenticated, user, logout } = useAuth();
	const { itemCount, fetchItemCount } = useOrder();
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
					<Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							<Link to={ROUTES.HOME} style={{ textDecoration: "none", color: "black" }}>Book Store</Link>
						</Typography>

						<Button 
							component={Link} 
							to="/categories" 
							sx={{ 
								color: "text.secondary", 
								textTransform: "none", 
								fontSize: "1rem", 
								fontWeight: 600,
								'&:hover': { color: 'primary.main', bgcolor: 'transparent' }
							}}
						>
							Categories
						</Button>

												<Button 
							component={Link} 
							to="/wishlist" 
							sx={{ 
								color: "text.secondary", 
								textTransform: "none", 
								fontSize: "1rem", 
								fontWeight: 600,
								'&:hover': { color: 'primary.main', bgcolor: 'transparent' }
							}}
						>
							Wishlist
						</Button>
					</Box>

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
								{user?.role === "admin" && (
									<>
										<MenuItem>
											<Link to={ROUTER_PATHS.ADMIN_DASHBOARD} style={{ textDecoration: "none", color: "inherit" }}>
												Dashboard
											</Link>
										</MenuItem>
										<Divider />
									</>
								)}
								<MenuItem><Link to={ROUTER_PATHS.PROFILE} style={{ textDecoration: "none", color: "inherit" }}>Profile</Link></MenuItem>
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
