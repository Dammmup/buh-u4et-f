import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalculateIcon from "@mui/icons-material/Calculate";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/store/AuthContext";

const navItems = [
  { label: "Кабинет", to: "/dashboard", icon: <AccountBalanceWalletIcon /> },
  { label: "Услуги", to: "/services", icon: <CalculateIcon /> },
  { label: "Заказы", to: "/orders", icon: <AssignmentIcon /> }
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const adminItem =
    user?.role === "admin"
      ? [{ label: "Админ", to: "/admin", icon: <AdminPanelSettingsIcon /> }]
      : [];
  const items = [...navItems, ...adminItem];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const drawer = (
    <Box width={280} role="presentation" onClick={() => setOpen(false)}>
      <Box px={3} py={2.5}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>
          Bukhuchet.kz
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={location.pathname.startsWith(item.to)}
            sx={{
              mx: 1.5,
              my: 0.5,
              borderRadius: 2,
              "&.Mui-selected": {
                bgcolor: "primary.light",
                color: "primary.main",
                "& .MuiListItemIcon-root": { color: "primary.main" }
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton onClick={handleLogout} sx={{ mx: 1.5, my: 0.5, borderRadius: 2 }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Выйти" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #E5E7EB", bgcolor: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)" }}>
        <Toolbar sx={{ minHeight: 64 }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Открыть меню">
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            component={RouterLink}
            to="/dashboard"
            variant="h6"
            color="primary"
            sx={{ textDecoration: "none", fontWeight: 900, mr: 4 }}
          >
            Bukhuchet.kz
          </Typography>
          {!isMobile && (
            <Box display="flex" gap={1.5} flex={1}>
              {items.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  startIcon={item.icon}
                  color={location.pathname.startsWith(item.to) ? "primary" : "inherit"}
                  variant={location.pathname.startsWith(item.to) ? "contained" : "text"}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          {!isMobile && (
            <Button onClick={handleLogout} startIcon={<LogoutIcon />} color="inherit">
              Выйти
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        {drawer}
      </Drawer>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
