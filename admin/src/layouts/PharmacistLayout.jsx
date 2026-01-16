import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Divider, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline,
  useTheme, useMediaQuery, Badge, Avatar, Menu, MenuItem, Tooltip,
  Container, Chip, alpha, Stack, Paper, InputBase 
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, LocalPharmacy, Receipt, Inventory,
  Assessment, Settings, Logout, Notifications, ChevronLeft, Person,
  LightMode, DarkMode, Search as SearchIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

// Exactly 4 pages as specified
const menuSections = [
  {
    title: 'Dashboard',
    items: [
      { 
        text: 'Dashboard', 
        icon: <Dashboard />, 
        path: '/pharmacist', 
        badge: null,
        description: 'Overview of pharmacy operations'
      },
    ]
  },
  {
    title: 'Prescriptions',
    items: [
      { 
        text: 'Process Prescriptions', 
        icon: <Receipt />, 
        path: '/pharmacist/prescriptions', 
        badge: '12',
        description: 'Handle doctor prescriptions'
      },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { 
        text: 'Medicine Inventory', 
        icon: <Inventory />, 
        path: '/pharmacist/inventory', 
        badge: 'Low',
        description: 'Manage pharmacy stock'
      },
    ]
  },
  {
    title: 'Billing & Reports',
    items: [
      { 
        text: 'Billing & Reports', 
        icon: <Assessment />, 
        path: '/pharmacist/billing', 
        badge: null,
        description: 'Billing and analytics'
      },
    ]
  }
];

const PharmacistLayout = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [isMobile]);

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenu = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1976d2 0%, #0d47a1 100%)',
    }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.4)',
            }}>
              <LocalPharmacy sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>PMS</Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>Pharmacy Portal</Typography>
            </Box>
          </Stack>
          {!isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', '&:hover': { backgroundColor: alpha('#fff', 0.1) } }}>
              <ChevronLeft />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Functional Search Bar */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Paper
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            p: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: alpha('#fff', 0.15),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#fff', 0.2)}`,
            borderRadius: 2,
            transition: 'all 0.3s',
            '&:focus-within': {
              backgroundColor: alpha('#fff', 0.25),
              border: `1px solid ${alpha('#fff', 0.4)}`,
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <SearchIcon sx={{ color: alpha('#fff', 0.7), mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              color: 'white',
              fontSize: 14,
              flex: 1,
              '& .MuiInputBase-input::placeholder': {
                color: alpha('#fff', 0.6),
                opacity: 1,
              },
            }}
          />
        </Paper>
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />

      {/* Menu Items (Filtered) */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>
        {filteredMenu.length > 0 ? (
          filteredMenu.map((section) => (
            <Box key={section.title} sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: alpha('#fff', 0.5), px: 2, fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>
                {section.title}
              </Typography>
              <List sx={{ mt: 1 }}>
                {section.items.map((item) => {
                  const isSelected = location.pathname === item.path;
                  return (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) setOpen(false);
                        }}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: isSelected ? alpha('#fff', 0.15) : 'transparent',
                          border: isSelected ? `1px solid ${alpha('#fff', 0.2)}` : '1px solid transparent',
                          '&:hover': { backgroundColor: alpha('#fff', 0.1), transform: 'translateX(4px)' },
                          transition: 'all 0.3s',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          py: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <ListItemIcon sx={{ minWidth: 40, color: isSelected ? '#fff' : alpha('#fff', 0.7) }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={item.text}
                            primaryTypographyProps={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#fff' : alpha('#fff', 0.85) }}
                          />
                          {item.badge && (
                            <Chip 
                              label={item.badge} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: 11, 
                                fontWeight: 600, 
                                backgroundColor: item.badge === 'Low' 
                                  ? alpha('#ff9800', 0.9) 
                                  : alpha('#f44336', 0.9), 
                                color: 'white' 
                              }} 
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ 
                          color: alpha('#fff', 0.6), 
                          pl: 6, 
                          pt: 0.5,
                          fontSize: 11,
                          display: 'block'
                        }}>
                          {item.description}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))
        ) : (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.5) }}>
              No menu items found matching "{searchQuery}"
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />

      {/* Bottom Section */}
      <Box sx={{ p: 2 }}>
        <ListItemButton onClick={() => navigate('/pharmacist/settings')} sx={{ borderRadius: 2, backgroundColor: alpha('#fff', 0.08), mb: 1 }}>
          <ListItemIcon sx={{ color: alpha('#fff', 0.7) }}><Settings /></ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ fontSize: 14, color: alpha('#fff', 0.85) }}
          />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, backgroundColor: alpha('#f44336', 0.15), border: `1px solid ${alpha('#f44336', 0.3)}` }}>
          <ListItemIcon sx={{ color: '#ff5252' }}><Logout /></ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ fontSize: 14, color: '#ff5252', fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ 
        zIndex: theme.zIndex.drawer + 1, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)' 
      }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#1976d2' }}>
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, fontSize: { xs: 16, sm: 20 } }}>
                Pharmacy Management System
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#1976d2', 0.6) }}>
                Welcome back, {user?.name || 'Pharmacist'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Toggle theme">
              <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ color: '#1976d2' }}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton sx={{ color: '#1976d2' }}>
                <Badge 
                  badgeContent={8} 
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      backgroundColor: '#ff9800', 
                      color: 'white' 
                    } 
                  }}
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Account settings">
              <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)', 
                  fontWeight: 700, 
                  fontSize: 14 
                }}>
                  {user?.name?.charAt(0) || 'P'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={handleMenuClose} 
            onClick={handleMenuClose} 
            transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.name || 'Pharmacist'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || 'pharmacist@hospital.com'}
              </Typography>
              <Chip 
                label="Licensed Pharmacist" 
                size="small" 
                sx={{ 
                  mt: 1, 
                  height: 20, 
                  fontSize: 10, 
                  backgroundColor: '#1976d2', 
                  color: 'white' 
                }} 
              />
            </Box>
            <MenuItem onClick={() => navigate('/pharmacist/profile')} sx={{ py: 1.5, gap: 1.5 }}>
              <Person fontSize="small" /> Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/pharmacist/settings')} sx={{ py: 1.5, gap: 1.5 }}>
              <Settings fontSize="small" /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#f44336', gap: 1.5 }}>
              <Logout fontSize="small" /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={handleDrawerToggle}
        sx={{ 
          width: drawerWidth, 
          flexShrink: 0, 
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            border: 'none', 
            boxShadow: '4px 0 20px rgba(25, 118, 210, 0.15)' 
          } 
        }}
      >
        {drawer}
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` }, 
          transition: theme.transitions.create(['margin', 'width']), 
          marginLeft: { sm: open ? 0 : `-${drawerWidth}px` }, 
          backgroundColor: '#f8fafc', 
          minHeight: '100vh', 
          pt: { xs: 9, sm: 10 }, 
          pb: 8 
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Outlet will render the 4 pages */}
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Paper 
        elevation={0} 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: { sm: open ? drawerWidth : 0 }, 
          right: 0, 
          py: 1.5, 
          px: 3, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)', 
          borderTop: '1px solid rgba(0, 0, 0, 0.08)', 
          zIndex: theme.zIndex.drawer - 1, 
          transition: theme.transitions.create(['left']) 
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" fontSize={13}>
            © {new Date().getFullYear()} Pharmacy Management System
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip 
              label="v3.1.0" 
              size="small" 
              sx={{ 
                height: 22, 
                fontSize: 11, 
                fontWeight: 600, 
                background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)', 
                color: 'white' 
              }} 
            />
            <Typography variant="caption" color="text.secondary">
              Status: <span style={{ color: '#4caf50', fontWeight: 600 }}>●</span> Operational
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PharmacistLayout;