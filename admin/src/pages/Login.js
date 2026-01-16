import React, { useEffect, useState } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  InputAdornment, IconButton, LinearProgress, Link as MuiLink,
  Fade, Slide, Zoom, Grid, Checkbox, FormControlLabel, CssBaseline
} from '@mui/material';
import {
  Email, Visibility, VisibilityOff, Lock, Login as LoginIcon,
  LocalHospital, HealthAndSafety, EventNote, People, Analytics
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleRoutes = {
  PATIENT: '/patient/dashboard',
  DOCTOR: '/doctor/dashboard',
  NURSE: '/nurse/dashboard',
  ADMIN: '/admin/dashboard',
  LAB_TECH: '/labtech/dashboard',
  PHARMACIST: '/pharmacist/dashboard'
};

const features = [
  { icon: <HealthAndSafety />, text: 'Advanced Patient Care' },
  { icon: <EventNote />, text: 'Smart Appointment System' },
  { icon: <People />, text: 'Multi-Role Management' },
  { icon: <Analytics />, text: 'Real-time Analytics' }
];

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      navigate(roleRoutes[user.role], { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      if (data?.success) {
        navigate(roleRoutes[data.user.role], { replace: true });
      } else {
        setError(data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #121858 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto', // Allows scrolling on small devices
        py: { xs: 4, md: 0 } // Vertical padding for mobile scroll
      }}
    >
      <CssBaseline />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid 
          container 
          component={Paper} 
          elevation={24} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden', 
            minHeight: { xs: 'auto', md: '650px' },
            mx: 'auto'
          }}
        >
          
          {/* LEFT COLUMN - HMS INFO */}
          <Grid item xs={12} md={6} sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            p: 6,
            color: 'white'
          }}>
            <Slide direction="right" in={mounted} timeout={800}>
              <Box>
                <Zoom in={mounted} timeout={1000}>
                  <Box sx={{ mb: 4 }}>
                    <LocalHospital sx={{ fontSize: 60, mb: 2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                      HMS Portal
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 300 }}>
                      Integrated Healthcare Management System
                    </Typography>
                  </Box>
                </Zoom>

                <Box sx={{ mt: 4 }}>
                  {features.map((feature, index) => (
                    <Fade key={index} in={mounted} timeout={1200 + index * 200}>
                      <Box sx={{ 
                        display: 'flex', alignItems: 'center', mb: 2, p: 2, 
                        borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <Box sx={{ mr: 2, display: 'flex', color: 'white' }}>{feature.icon}</Box>
                        <Typography variant="body1">{feature.text}</Typography>
                      </Box>
                    </Fade>
                  ))}
                </Box>
              </Box>
            </Slide>
          </Grid>

          {/* RIGHT COLUMN - LOGIN FORM */}
          <Grid item xs={12} md={6} sx={{ bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
            {loading && <LinearProgress sx={{ height: 4 }} />}
            
            <Box sx={{ p: { xs: 4, md: 8 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please enter your details to access your medical dashboard.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel
                    control={<Checkbox size="small" color="primary" />}
                    label={<Typography variant="body2">Remember me</Typography>}
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={!loading && <LoginIcon />}
                  sx={{ 
                    mt: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold',
                    textTransform: 'none', fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  New to our hospital?{' '}
                  <MuiLink component={RouterLink} to="/signup" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>
                    Create an account
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;