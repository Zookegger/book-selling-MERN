import { ROUTER_PATHS, ROUTES } from "@constants/index";
import useAuth from "@hooks/useAuth";
import useOrder from "@hooks/useOrder";
import { Person } from "@mui/icons-material";
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Stack, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { MenuIcon, ShoppingCart } from "lucide-react";
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
	const [mobileOpen, setMobileOpen] = useState(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	function handleClick(event: MouseEvent<HTMLElement>) {
		setAnchorEl(event.currentTarget);
	};

	function handleClose() {
		setAnchorEl(null);
	};

	const handleDrawerToggle = () => {
		setMobileOpen((prevState) => !prevState);
	};

	useEffect(() => {
		if (!isAuthenticated) return;
		void fetchItemCount();
	}, [fetchItemCount, isAuthenticated]);

	const drawerContent = (
		<Box onClick={handleDrawerToggle} sx={{ textAlign: "center", display: "flex", flexDirection: "column", flexGrow: 1 }}>
			<Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
				Book Store
			</Typography>
			<Divider />
			<List component="nav" sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
				<Box gap={1} mb={2} mt={1} sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
					<ListItem disablePadding>
						<ListItemButton component={Link} to="/categories">
							<ListItemText primary="Categories" />
						</ListItemButton>
					</ListItem>
				</Box>
				{!isAuthenticated ? (
					<>
						<ListItem disablePadding>
							<ListItemButton component={Link} to={ROUTES.LOGIN}>
								<ListItemText primary="Sign in" />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton component={Link} to={ROUTES.REGISTER}>
								<ListItemText primary="Sign up" />
							</ListItemButton>
						</ListItem>
					</>
				) : (
					<>
						<ListItem disablePadding>
							<ListItemButton component={Link} to={ROUTES.CART}>
								<ListItemText primary={`Cart (${itemCount})`} />
							</ListItemButton>
						</ListItem>
						{user?.role === "admin" && (
							<ListItem disablePadding>
								<ListItemButton component={Link} to={ROUTER_PATHS.ADMIN_DASHBOARD}>
									<ListItemText primary="Dashboard" />
								</ListItemButton>
							</ListItem>
						)}
						<ListItem disablePadding>
							<ListItemButton component={Link} to={ROUTER_PATHS.PROFILE}>
								<ListItemText primary="Profile" />
							</ListItemButton>
						</ListItem>
						<ListItem disablePadding>
							<ListItemButton onClick={async () => await logout()}>
								<ListItemText primary="Sign Out" />
							</ListItemButton>
						</ListItem>
					</>
				)}
			</List>
		</Box>
	);

	return (
		<Box sx={{ display: "flex", flexDirection: "column" }}>
			<AppBar position="static" color="transparent" elevation={0}>
				<Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
					{/* Left Side: Hamburger (Mobile) + Logo + Categories (Desktop) */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
						{isMobile && (
							<IconButton
								color="inherit"
								aria-label="open drawer"
								edge="start"
								onClick={handleDrawerToggle}
								sx={{ color: 'black' }}
							>
								<MenuIcon />
							</IconButton>
						)}

						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							<Link to={ROUTES.HOME} style={{ textDecoration: "none", color: "black" }}>Book Store</Link>
						</Typography>

						{!isMobile && (
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
						)}

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

					{!isMobile && (
						<>
							{!isAuthenticated ? (
								<Box>
									<Button component={Link} to={ROUTES.LOGIN} style={{ textDecoration: "none", color: "inherit" }}>Sign in</Button>
									<Button component={Link} to={ROUTES.REGISTER} style={{ textDecoration: "none", color: "inherit" }}>Sign up</Button>
								</Box>
							) : (
								<>
									<Stack direction="row" spacing={2} alignItems="center">
										<Button
											component={Link}
											to={ROUTES.CART}
											style={{ textDecoration: "none", color: "inherit" }}
											startIcon={<ShoppingCart />}
										>
											Cart ({itemCount})
										</Button>
										<Button onClick={handleClick} sx={{ color: "black" }} startIcon={<Person />}>
											{user?.firstName}
										</Button>
									</Stack>
									<Menu open={open} anchorEl={anchorEl} onClose={handleClose}>
										{user?.role === "admin" && [
											<MenuItem key="admin-dash" onClick={handleClose}>
												<Link to={ROUTER_PATHS.ADMIN_DASHBOARD} style={{ textDecoration: "none", color: "inherit" }}>
													Dashboard
												</Link>
											</MenuItem>,
											<Divider key="admin-divider" />
										]}
										<MenuItem onClick={handleClose}>
											<Link to={ROUTER_PATHS.PROFILE} style={{ textDecoration: "none", color: "inherit" }}>
												Profile
											</Link>
										</MenuItem>
										<MenuItem onClick={async () => {
											handleClose();
											await logout();
										}}>
											Sign Out
										</MenuItem>
									</Menu>
								</>
							)}
						</>
					)}
				</Toolbar>
			</AppBar>

			<nav>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true, // Better open performance on mobile
					}}
					sx={{
						display: { xs: 'block', md: 'none' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
					}}
				>
					{drawerContent}
				</Drawer>
			</nav>

			<Container maxWidth={"xl"} sx={{ py: 6 }}>
				{children ?? <Outlet />}
			</Container>
		</Box>
	);
};

export default MainLayout;