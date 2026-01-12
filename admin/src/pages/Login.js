import React, { useState } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  InputAdornment, IconButton, LinearProgress, Link as MuiLink
} from '@mui/material';
import {
  Email, Visibility, VisibilityOff, Lock, Login as LoginIcon, LocalHospital
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);

      if (data?.success) {
        const user = data.user || { name: data.name, role: data.role };
        // Ensure token/header already set by context.login, but fallback:
        const token = data.token || localStorage.getItem('token');
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const routes = {
          'PATIENT': '/patient/dashboard',
          'DOCTOR': '/doctor/dashboard',
          'NURSE': '/nurse/dashboard',
          'ADMIN': 'admin/dashboard',
          'LAB_TECH':'/labtech/dashboard'
        };

        navigate(routes[user.role] || '/dashboard');
      } else {
        setError(data?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={6} sx={{ borderRadius: 3, position: 'relative' }}>
        {loading && <LinearProgress />}
        <Box sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LocalHospital color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h4" fontWeight="bold">HMS Login</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Email /></InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Lock /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              startIcon={<LoginIcon />}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Don’t have an account?{' '}
              <MuiLink component={RouterLink} to="/signup">
                Sign up
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
