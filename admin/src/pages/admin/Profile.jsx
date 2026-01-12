import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  Avatar,
  TextField,
  Button,
  Divider,
  Grid,
  Alert,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit,
  CameraAlt,
  Save,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Badge,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@hospital.com',
    phone: '+1 (555) 123-4567',
    role: 'System Administrator',
    department: 'Administration',
    location: 'New York, USA',
    joinDate: 'January 15, 2023',
    bio: 'System administrator with full access to all hospital management modules.',
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPassword((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      console.log('Profile saved:', profile);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (password.new !== password.confirm) {
      alert('New passwords do not match!');
      return;
    }
    // Handle password change logic
    console.log('Password change requested');
    setPassword({ current: '', new: '', confirm: '' });
  };

  const stats = [
    { label: 'Total Logins', value: '1,247' },
    { label: 'Last Login', value: 'Today, 09:42 AM' },
    { label: 'Active Sessions', value: '2' },
    { label: 'Account Age', value: '1 year, 3 months' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>My Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your personal information and account settings
              </Typography>
            </Box>
          </Stack>
          <Button
            variant={isEditing ? 'outlined' : 'contained'}
            startIcon={isEditing ? <Save /> : <Edit />}
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={isSaving}
          >
            {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
          </Button>
        </Stack>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: 48,
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {profile.firstName[0]}{profile.lastName[0]}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <CameraAlt fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="h5" fontWeight={700}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Chip
                label={profile.role}
                color="primary"
                size="small"
                sx={{ mt: 1, mb: 2 }}
              />

              <Stack spacing={1.5} sx={{ width: '100%', mt: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{profile.email}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Phone sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{profile.phone}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Badge sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{profile.department}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocationOn sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{profile.location}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CalendarToday sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">Joined {profile.joinDate}</Typography>
                </Stack>
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Stats */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Account Statistics
              </Typography>
              <Grid container spacing={2}>
                {stats.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Editable Info */}
        <Grid item xs={12} md={8}>
          {/* Personal Information */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={profile.location}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  disabled={!isEditing}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Change Password */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPassword.current ? 'text' : 'password'}
                  label="Current Password"
                  value={password.current}
                  onChange={(e) => handlePasswordChange('current', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility('current')}>
                          {showPassword.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type={showPassword.new ? 'text' : 'password'}
                  label="New Password"
                  value={password.new}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility('new')}>
                          {showPassword.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type={showPassword.confirm ? 'text' : 'password'}
                  label="Confirm New Password"
                  value={password.confirm}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                          {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleChangePassword}
                  disabled={!password.current || !password.new || !password.confirm}
                >
                  Update Password
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;