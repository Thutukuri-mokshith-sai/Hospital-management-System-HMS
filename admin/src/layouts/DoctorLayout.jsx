// src/layouts/DoctorLayout.jsx
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Paper,
  InputBase,
  Stack,
  Chip
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard,
  People,
  LocalHospital,
  CalendarMonth,
  AccessTime,
  Bed,
  Emergency,
  Assignment,
  Search as SearchIcon,
  Notifications,
  ChevronLeft,
  Settings,
  Logout,
  LightMode,
  DarkMode,
  MonitorHeart,
  Vaccines,
  Bloodtype,
  FileCopy,
  PersonAdd
} from '@mui/icons-material';

import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

/* -------------------- MENU CONFIG -------------------- */

const menuSections = [
  {
    title: 'Dashboard',
    items: [
      { text: 'Overview', icon: <Dashboard />, path: '/doctor/dashboard' },
      { text: "Today's Schedule", icon: <AccessTime />, path: '/doctor/appointments' }
    ]
  },
  {
    title: 'Patient Management',
    items: [
      { text: 'My Patients', icon: <People />, path: '/doctor/patients' },
      { text: 'Admitted Patients', icon: <Bed />, path: '/doctor/admitted' },
      { text: 'New Consultation', icon: <PersonAdd />, path: '/doctor/new-consultation' }
    ]
  },
  {
    title: 'Clinical Workflow',
    items: [
      { text: 'Appointments', icon: <CalendarMonth />, path: '/doctor/appointments' },
      { text: 'Prescriptions', icon: <Vaccines />, path: '/doctor/prescriptions' },
      { text: 'Lab Tests', icon: <Bloodtype />, path: '/doctor/lab-tests' },
      { text: 'Medical Notes', icon: <FileCopy />, path: '/doctor/notes' }
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { text: 'Patient Vitals', icon: <MonitorHeart />, path: '/doctor/vitals' },
      { text: 'Critical Cases', icon: <Emergency />, path: '/doctor/critical' },
      { text: 'Follow-ups', icon: <Assignment />, path: '/doctor/followups' }
    ]
  }
];

/* -------------------- COMPONENT -------------------- */

const DoctorLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPath = location.pathname;

  const handleDrawerToggle = () => setOpen(prev => !prev);
  const handleMenuOpen = e => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNavigation = path => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  const filteredMenu = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const alpha = (opacity) => `rgba(255,255,255,${opacity})`;

  /* -------------------- DRAWER -------------------- */

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0d47a1,#1565c0)' }}>
      {/* Header */}
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#2196f3' }}>
              <LocalHospital />
            </Avatar>
            <Box>
              <Typography color="white" fontWeight={700}>HMS</Typography>
              <Typography variant="caption" sx={{ color: alpha(0.7) }}>Doctor Portal</Typography>
            </Box>
          </Stack>
          {!isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <ChevronLeft />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Search */}
      <Box sx={{ px: 2 }}>
        <Paper sx={{ p: 1, display: 'flex', bgcolor: alpha(0.15) }}>
          <SearchIcon sx={{ color: alpha(0.7), mr: 1 }} />
          <InputBase
            placeholder="Search..."
            fullWidth
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ color: 'white' }}
          />
        </Paper>
      </Box>

      <Divider sx={{ my: 2, borderColor: alpha(0.1) }} />

      {/* Menu */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
        {filteredMenu.map(section => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography variant="overline" sx={{ color: alpha(0.6), px: 2 }}>
              {section.title}
            </Typography>
            <List>
              {section.items.map(item => {
                const active = currentPath.startsWith(item.path);
                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        borderRadius: 2,
                        bgcolor: active ? alpha(0.15) : 'transparent'
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          color: 'white',
                          fontWeight: active ? 600 : 400
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: alpha(0.1) }} />

      {/* Footer Actions */}
      <Box sx={{ p: 2 }}>
        <ListItemButton onClick={() => navigate('/doctor/settings')}>
          <ListItemIcon sx={{ color: 'white' }}><Settings /></ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ color: 'white' }} />
        </ListItemButton>

        <ListItemButton onClick={handleLogout}>
          <ListItemIcon sx={{ color: '#ff5252' }}><Logout /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ color: '#ff5252' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  /* -------------------- LAYOUT -------------------- */

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
            <Typography fontWeight={700}>Hospital Management System</Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>

            <IconButton>
              <Badge badgeContent={3} color="primary">
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton onClick={handleMenuOpen}>
              <Avatar sx={{ bgcolor: '#2196f3' }}>D</Avatar>
            </IconButton>
          </Stack>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => navigate('/doctor/profile')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': { width: drawerWidth }
        }}
      >
        {drawer}
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          ml: { sm: open ? `${drawerWidth}px` : 0 },
          p: 3,
          transition: theme.transitions.create(['margin'])
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DoctorLayout;
