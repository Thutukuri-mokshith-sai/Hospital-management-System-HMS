import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Grid,
  Alert,
  Chip,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Language,
  Save,
  Palette,
  Dashboard,
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC+05:30',
    autoSave: true,
    dashboardRefreshRate: 30,
    twoFactorAuth: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      console.log('Settings saved:', settings);
    }, 1000);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
  ];

  const timezones = [
    'UTC+00:00 (GMT)',
    'UTC+05:30 (IST)',
    'UTC-05:00 (EST)',
    'UTC-08:00 (PST)',
    'UTC+01:00 (CET)',
    'UTC+08:00 (CST)',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>System Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your preferences and system options
            </Typography>
          </Box>
        </Stack>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Dashboard sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>General Settings</Typography>
            </Stack>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Timezone"
                  onChange={(e) => handleChange('timezone', e.target.value)}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Dashboard Refresh Rate (seconds)</Typography>
                <Slider
                  value={settings.dashboardRefreshRate}
                  onChange={(e, value) => handleChange('dashboardRefreshRate', value)}
                  min={5}
                  max={120}
                  step={5}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 5, label: '5s' },
                    { value: 30, label: '30s' },
                    { value: 60, label: '1m' },
                    { value: 120, label: '2m' },
                  ]}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSave}
                    onChange={() => handleToggle('autoSave')}
                  />
                }
                label="Auto-save changes"
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Notifications sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>Notifications</Typography>
            </Stack>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                  />
                }
                label="Enable notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    disabled={!settings.notifications}
                  />
                }
                label="Email notifications"
              />

              <Divider sx={{ my: 1 }} />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Notification Types</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Chip label="Appointments" color="primary" variant="outlined" />
                  <Chip label="Messages" color="primary" variant="outlined" />
                  <Chip label="System Updates" color="primary" variant="outlined" />
                  <Chip label="Emergency Alerts" color="primary" variant="outlined" />
                  <Chip label="Reports Ready" color="primary" variant="outlined" />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Security sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>Security</Typography>
            </Stack>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={() => handleToggle('twoFactorAuth')}
                  />
                }
                label="Two-Factor Authentication"
              />
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Session timeout
                </Typography>
                <Chip label="30 minutes" />
              </Box>

              <Button
                variant="outlined"
                color="primary"
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              >
                Change Password
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Palette sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>Appearance</Typography>
            </Stack>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={() => handleToggle('darkMode')}
                  />
                }
                label="Dark Mode"
              />
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Theme Color
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#2c3e50',
                      cursor: 'pointer',
                      border: '3px solid transparent',
                      '&:hover': { borderColor: '#2c3e50' }
                    }}
                  />
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#1976d2',
                      cursor: 'pointer',
                      border: '3px solid transparent',
                      '&:hover': { borderColor: '#1976d2' }
                    }}
                  />
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#388e3c',
                      cursor: 'pointer',
                      border: '3px solid transparent',
                      '&:hover': { borderColor: '#388e3c' }
                    }}
                  />
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#d32f2f',
                      cursor: 'pointer',
                      border: '3px solid transparent',
                      '&:hover': { borderColor: '#d32f2f' }
                    }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={isSaving}
          size="large"
          sx={{ px: 4 }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Container>
  );
};

export default Settings;