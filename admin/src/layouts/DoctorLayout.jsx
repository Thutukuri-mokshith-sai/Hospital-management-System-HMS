import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Divider, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline,
  useTheme, useMediaQuery, Badge, Avatar, Menu, MenuItem, Tooltip,
  Container, Chip, alpha, Stack, Paper, InputBase 
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, CalendarToday, People, LocalHospital, 
  Description, Receipt, Settings, Logout, Notifications, 
  ChevronLeft, Person, TrendingUp, AccessTime, LightMode, DarkMode, 
  Search as SearchIcon, Medication, Science
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

const menuSections = [
  {
    title: 'Overview',
    items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/doctor', badge: null },
      { text: 'Appointments', icon: <CalendarToday />, path: '/doctor/appointments', badge: null },
      { text: 'My Schedule', icon: <AccessTime />, path: '/doctor/schedule', badge: null },
    ]
  },
  {
    title: 'Patient Management',
    items: [
      { text: 'My Patients', icon: <People />, path: '/doctor/patients', badge: null },
      { text: 'Clinical Actions', icon: <LocalHospital />, path: '/doctor/clinical-actions', badge: null },
    ]
  },
  // {
  //   title: 'Results & Reports',
  //   items: [
  //     { text: 'Lab Reports', icon: <Receipt />, path: '/doctor/lab-reports', badge: null },
  //     { text: 'Medical Records', icon: <Description />, path: '/doctor/medical-records', badge: null },
  //   ]
  // }
];

const DoctorLayout = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    todaysAppointments: 0,
    totalPatients: 0,
    pendingPrescriptions: 0,
    pendingLabTests: 0
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [isMobile]);

  useEffect(() => {
    // Fetch doctor dashboard stats
    const fetchDashboardStats = async () => {
      try {
        // Simulating API calls
        // GET /api/v1/doctors/dashboard/stats
        const statsResponse = {
          todaysAppointments: 8,
          totalPatients: 45,
          pendingPrescriptions: 5,
          pendingLabTests: 3
        };
        
        // GET /api/v1/doctors/dashboard/quick-stats
        const quickStatsResponse = {
          criticalPatients: 2,
          upcomingSurgery: 1,
          labResultsPending: 3
        };

        setDashboardStats(statsResponse);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleDrawerToggle = () => setOpen(!open);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  const filteredMenu = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1565c0 0%, #0d47a1 100%)',
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
              <LocalHospital sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>HMS</Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>Doctor Portal</Typography>
            </Box>
          </Stack>
          {!isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', '&:hover': { backgroundColor: alpha('#fff', 0.1) } }}>
              <ChevronLeft />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Doctor Info */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Paper sx={{ 
          p: 2, 
          background: alpha('#fff', 0.1), 
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#fff', 0.2)}`,
          borderRadius: 2 
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
              fontWeight: 700 
            }}>
              {user?.name?.charAt(0) || 'D'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                Dr. {user?.name || 'Doctor'}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                {user?.specialization || 'General Medicine'}
              </Typography>
              <Chip 
                label="Online" 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: 10, 
                  mt: 0.5, 
                  backgroundColor: alpha('#4caf50', 0.9), 
                  color: 'white' 
                }} 
              />
            </Box>
          </Stack>
        </Paper>
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
            placeholder="Search menu..."
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
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: isSelected ? alpha('#fff', 0.15) : 'transparent',
                          border: isSelected ? `1px solid ${alpha('#fff', 0.2)}` : '1px solid transparent',
                          '&:hover': { backgroundColor: alpha('#fff', 0.1), transform: 'translateX(4px)' },
                          transition: 'all 0.3s',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: isSelected ? '#fff' : alpha('#fff', 0.7) }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#fff' : alpha('#fff', 0.85) }}
                        />
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
              No items found matching "{searchQuery}"
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />

      {/* Bottom Section */}
      <Box sx={{ p: 2 }}>
        <ListItemButton 
          onClick={() => handleNavigation('/doctor/profile')} 
          sx={{ borderRadius: 2, backgroundColor: alpha('#fff', 0.08), mb: 1 }}
        >
          <ListItemIcon sx={{ color: alpha('#fff', 0.7) }}><Person /></ListItemIcon>
          <ListItemText 
            primary="My Profile" 
            primaryTypographyProps={{ fontSize: 14, color: alpha('#fff', 0.85) }} 
          />
        </ListItemButton>
        {/* <ListItemButton 
          onClick={() => handleNavigation('/doctor/settings')} 
          sx={{ borderRadius: 2, backgroundColor: alpha('#fff', 0.08), mb: 1 }}
        >
          <ListItemIcon sx={{ color: alpha('#fff', 0.7) }}><Settings /></ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ fontSize: 14, color: alpha('#fff', 0.85) }} 
          />
        </ListItemButton> */}
        <ListItemButton 
          onClick={handleLogout} 
          sx={{ borderRadius: 2, backgroundColor: alpha('#f44336', 0.15), border: `1px solid ${alpha('#f44336', 0.3)}` }}
        >
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
      <AppBar 
        position="fixed" 
        elevation={0} 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(20px)', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#1565c0' }}><MenuIcon /></IconButton>
            <Box>
              <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 700, fontSize: { xs: 16, sm: 20 } }}>
                Hospital Management System
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#1565c0', 0.6) }}>
                Welcome back, Dr. {user?.name || 'Doctor'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Quick Stats">
              <Chip
                icon={<TrendingUp sx={{ fontSize: 16 }} />}
                label={`${dashboardStats.todaysAppointments} Appointments`}
                size="small"
                sx={{ 
                  height: 32,
                  backgroundColor: alpha('#1565c0', 0.1),
                  color: '#1565c0',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Tooltip>
            <Tooltip title="Toggle theme">
              <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ color: '#1565c0' }}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton sx={{ color: '#1565c0' }}>
                <Badge 
                  badgeContent={dashboardStats.pendingLabTests + dashboardStats.pendingPrescriptions} 
                  sx={{ '& .MuiBadge-badge': { backgroundColor: '#f44336', color: 'white' } }}
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
                  {user?.name?.charAt(0) || 'D'}
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
            PaperProps={{
              sx: { width: 240, borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Dr. {user?.name || 'Doctor'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || 'doctor@hospital.com'}
              </Typography>
              <Chip 
                label="Verified" 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: 10, 
                  backgroundColor: alpha('#4caf50', 0.1), 
                  color: '#4caf50', 
                  mt: 0.5 
                }} 
              />
            </Box>
            <MenuItem onClick={() => handleNavigation('/doctor/profile')} sx={{ py: 1.5, gap: 1.5 }}>
              <Person fontSize="small" /> My Profile
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
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.08)' 
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
          backgroundColor: '#f5f7fa', 
          minHeight: '100vh', 
          pt: { xs: 9, sm: 10 }, 
          pb: 8 
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Container>
      </Box>

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
            © {new Date().getFullYear()} Hospital Management System • Doctor Portal
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
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
              Status: <span style={{ color: '#4caf50', fontWeight: 600 }}>●</span> Online • 
              Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default DoctorLayout;