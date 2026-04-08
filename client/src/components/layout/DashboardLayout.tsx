import { ROUTER_PATHS, ROUTES } from "@constants/index";
import useAuth from "@hooks/useAuth";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    AppBar,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useMemo, useState, type MouseEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookCopy, Building2, ListCollapse, List as ListIconLucide } from "lucide-react";

const SIDEBAR_WIDTH = 320;
const COLLAPSED_WIDTH = 80;

type DashboardNavItem = {
    label: string;
    path: string;
    hint: string;
    icon?: React.ReactNode;
};

type DashboardNavGroup = {
    key: string;
    title: string;
    items: DashboardNavItem[];
};

const navGroups: DashboardNavGroup[] = [
    {
        key: "overview",
        title: "Overview",
        items: [{ label: "Dashboard Home", path: ROUTER_PATHS.ADMIN_DASHBOARD, hint: "Overall metrics and admin shortcuts", icon: <DashboardIcon /> }],
    },
    {
        key: "catalog",
        title: "Catalog",
        items: [
            { label: "Publishers", path: ROUTER_PATHS.ADMIN_PUBLISHERS, hint: "Manage publishing partners", icon: <Building2 /> },
            { label: "Books", path: ROUTER_PATHS.ADMIN_BOOKS, hint: "Create and maintain book catalog", icon: <BookCopy /> },
        ],
    },
    // {
    //     key: "user-management",
    //     title: "User Management",
    //     items: [
    //         { label: "Users", path: ROUTER_PATHS.ADMIN_USERS, hint: "View and manage user accounts" },
    //         { label: "Roles & Permissions", path: ROUTER_PATHS.ADMIN_ROLES, hint: "Define roles and access levels" },
    //     ],
    // }, 
    {
        key: "author-management",
        title: "Author Management",
        items: [
            { label: "Authors", path: ROUTER_PATHS.ADMIN_AUTHORS, hint: "View and manage authors", icon: <LocalLibraryIcon /> },
        ],
    }, 
    {
        key: "category-management",
        title: "Category Management",
        items: [
            { label: "Categories", path: ROUTER_PATHS.ADMIN_CATEGORIES, hint: "View and manage book categories", icon: <ListIconLucide /> },
        ],
    }
];

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [expandedPanels, setExpandedPanels] = useState<string[]>(["overview", "catalog"]);

    const userMenuOpen = Boolean(anchorEl);

    const currentWidth = isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    const quickMatches = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return [];

        return navGroups
            .flatMap((group) => group.items)
            .filter((item) => `${item.label} ${item.hint} ${item.path}`.toLowerCase().includes(keyword));
    }, [searchTerm]);

    const handleAccordionToggle = (panelKey: string) => (_event: unknown, isExpanded: boolean) => {
        if (isCollapsed) return; // Prevent accordion toggling when collapsed
        setExpandedPanels((prev) => {
            if (isExpanded) return [...new Set([...prev, panelKey])];
            return prev.filter((key) => key !== panelKey);
        });
    };

    const goToPath = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleSearchSubmit = () => {
        if (quickMatches.length > 0) {
            goToPath(quickMatches[0].path);
        }
    };

    const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const drawerContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#f8fafc", overflowX: "hidden" }}>
            <Box sx={{ px: isCollapsed ? 0 : 2.5, py: 2.5, display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "flex-start", flexDirection: isCollapsed ? "column" : "row", gap: 1.25, transition: "all 0.3s" }}>
                <Avatar sx={{ bgcolor: "#0f172a", width: 34, height: 34 }}>
                    <LocalLibraryIcon fontSize="small" />
                </Avatar>

                {!isCollapsed && (
                    <Box flex={1} sx={{ minWidth: 0, whiteSpace: "nowrap" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                            LuminaBook
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Admin Dashboard
                        </Typography>
                    </Box>
                )}

                <IconButton
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    sx={{ display: { xs: "none", md: "flex" } }}
                >
                    {isCollapsed ? <ListIconLucide fontSize="medium" /> : <ListCollapse fontSize="medium" />}
                </IconButton>
            </Box>

            {!isCollapsed && (
                <Box sx={{ px: 2.5, pb: 1.25 }}>
                    <TextField
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") handleSearchSubmit();
                        }}
                        placeholder="Search and jump to page"
                        size="small"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}

            {!isCollapsed && quickMatches.length > 0 && (
                <Box sx={{ px: 2.5, pb: 1.25 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                        Quick jump
                    </Typography>
                    <List dense disablePadding sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, bgcolor: "white" }}>
                        {quickMatches.slice(0, 5).map((item) => (
                            <ListItemButton key={`search-${item.path}`} onClick={() => goToPath(item.path)}>
                                <ListItemText primary={item.label} secondary={item.path} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            )}

            {/* Navigation */}
            <Box sx={{ px: isCollapsed ? 1 : 1.5, overflowY: "auto", overflowX: "hidden", flex: 1 }}>
                {navGroups.map((group) => (
                    <Accordion
                        key={group.key}
                        disableGutters
                        square
                        expanded={isCollapsed ? true : expandedPanels.includes(group.key)}
                        onChange={handleAccordionToggle(group.key)}
                        sx={{
                            bgcolor: "transparent",
                            boxShadow: "none",
                            "&::before": { display: "none" },
                        }}
                    >
                        {!isCollapsed && (
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {group.title}
                                </Typography>
                            </AccordionSummary>
                        )}
                        <AccordionDetails sx={{ pt: isCollapsed ? 2 : 0.5, pb: 1, px: 0 }}>
                            <List dense disablePadding>
                                {group.items.map((item) => {
                                    const selected = location.pathname === item.path;
                                    return (
                                        <Tooltip title={isCollapsed ? item.label : ""} placement="right" key={item.path}>
                                            <ListItemButton
                                                onClick={() => goToPath(item.path)}
                                                selected={selected}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    mb: 0.5,
                                                    justifyContent: isCollapsed ? "center" : "flex-start",
                                                    px: isCollapsed ? 1 : 2
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 0, mr: isCollapsed ? 0 : 2, justifyContent: "center" }}>
                                                    {item.icon}
                                                </ListItemIcon>
                                                {!isCollapsed && (
                                                    <ListItemText
                                                        primary={item.label}
                                                        secondary={item.hint}
                                                        slotProps={{ primary: { fontWeight: selected ? 700 : 500 } }}
                                                    />
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    );
                                })}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>

            <Divider />

            {/* User Profile */}
            <Box sx={{ p: isCollapsed ? 1 : 2, display: "flex", justifyContent: "center" }}>
                <Button
                    fullWidth={!isCollapsed}
                    onClick={handleUserMenuOpen}
                    sx={{
                        justifyContent: isCollapsed ? "center" : "space-between",
                        textTransform: "none",
                        color: "inherit",
                        border: isCollapsed ? "none" : "1px solid #cbd5e1",
                        borderRadius: 2,
                        px: isCollapsed ? 0 : 1.25,
                        py: 1,
                        minWidth: isCollapsed ? "auto" : "100%"
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: "#0f172a" }}>
                            {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                        </Avatar>
                        {!isCollapsed && (
                            <Box sx={{ textAlign: "left" }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                                    {user?.firstName ?? "User"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user?.email}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    {!isCollapsed && <Chip label={user?.role ?? "user"} size="small" sx={{ textTransform: "uppercase", fontWeight: 700 }} />}
                </Button>

                <Menu open={userMenuOpen} anchorEl={anchorEl} onClose={handleUserMenuClose}>
                    <MenuItem onClick={() => { handleUserMenuClose(); navigate(ROUTER_PATHS.ADMIN_DASHBOARD); }}>Dashboard</MenuItem>
                    <MenuItem onClick={() => { handleUserMenuClose(); navigate(ROUTES.PROFILE); }}>Profile</MenuItem>
                    <Divider />
                    <MenuItem onClick={async () => { handleUserMenuClose(); await logout(); }}>Sign Out</MenuItem>
                </Menu>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexGrow: 1, minHeight: "100vh", bgcolor: "#f1f5f9" }}>
            <Box component="nav" sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: "width 0.3s ease", }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, borderRight: "1px solid #e2e8f0" } }}
                >
                    {drawerContent}
                </Drawer>

                <Drawer
                    variant="permanent"
                    open
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            width: currentWidth,
                            transition: "width 0.3s ease",
                            overflowX: "hidden",
                            boxSizing: "border-box",
                            borderRight: "1px solid #e2e8f0",
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
                <AppBar position="sticky" elevation={0} color="transparent" sx={{ borderBottom: "1px solid #e2e8f0", bgcolor: "rgba(248,250,252,0.9)", backdropFilter: "blur(8px)" }}>
                    <Toolbar>
                        <IconButton sx={{ display: { md: "none" }, mr: 1 }} onClick={() => setMobileOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 800, flex: 1 }}>
                            Admin Workspace
                        </Typography>
                        <Button component={Link} to={ROUTES.HOME} color="inherit" sx={{ textTransform: "none" }}>
                            Go to Storefront
                        </Button>
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;