import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormGroup,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  CalendarToday,
  Work,
  School,
  LocationOn,
  Edit,
  Save,
  Cancel,
  Verified,
  Security,
  History,
  Star,
  EmojiEvents,
  Assignment,
  MedicalServices,
  AccessTime,
  TrendingUp,
  Download,
  Upload,
  CameraAlt,
  Lock,
  Notifications,
  Biotech,
  Science,
  Devices,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const BASE_URL = 'http://localhost:5000/api/v1';

const LabTechProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [formData, setFormData] = useState({
    specialization: '',
    shift: '',
    certifiedTests: [],
    equipmentPermissions: []
  });
  const [newCertifiedTest, setNewCertifiedTest] = useState('');
  const [newEquipment, setNewEquipment] = useState({ equipmentType: '', canOperate: true });
  const [message, setMessage] = useState({ type: '', text: '' });

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchProfile();
    fetchPerformanceStats();
    fetchTestHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labtech/me');
      const data = response.data.data;
      setProfile(data);
      
      // Set form data from profile
      setFormData({
        specialization: data.profile?.specialization || '',
        shift: data.profile?.shift || '',
        certifiedTests: data.profile?.certifiedTests || [],
        equipmentPermissions: data.profile?.equipmentPermissions || []
      });

      // Mock certifications based on certifiedTests
      if (data.profile?.certifiedTests) {
        const mockCerts = data.profile.certifiedTests.map((test, index) => ({
          id: index + 1,
          name: test,
          issuer: 'Hospital Certification Board',
          date: new Date(Date.now() - index * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiry: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          status: 'Active'
        }));
        setCertifications(mockCerts);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceStats = async () => {
    try {
      const response = await api.get('/labtech/performance');
      setPerformanceStats(response.data.data);
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    }
  };

  const fetchTestHistory = async () => {
    try {
      const response = await api.get('/labtech/history?limit=10');
      setTestHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching test history:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await api.put('/labtech/profile', formData);
      showMessage('success', 'Profile updated successfully!');
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCertifiedTest = () => {
    if (newCertifiedTest.trim() && !formData.certifiedTests.includes(newCertifiedTest)) {
      setFormData({
        ...formData,
        certifiedTests: [...formData.certifiedTests, newCertifiedTest.trim()]
      });
      setNewCertifiedTest('');
      showMessage('success', 'Test added to certified list');
    }
  };

  const handleRemoveCertifiedTest = (test) => {
    setFormData({
      ...formData,
      certifiedTests: formData.certifiedTests.filter(t => t !== test)
    });
  };

  const handleAddEquipment = () => {
    if (newEquipment.equipmentType.trim()) {
      setFormData({
        ...formData,
        equipmentPermissions: [...formData.equipmentPermissions, { ...newEquipment }]
      });
      setNewEquipment({ equipmentType: '', canOperate: true });
      showMessage('success', 'Equipment permission added');
    }
  };

  const handleRemoveEquipment = (index) => {
    const updatedEquipment = [...formData.equipmentPermissions];
    updatedEquipment.splice(index, 1);
    setFormData({
      ...formData,
      equipmentPermissions: updatedEquipment
    });
  };

  const getExperienceLevel = (years) => {
    if (years < 1) return 'Trainee';
    if (years < 3) return 'Junior';
    if (years < 5) return 'Intermediate';
    if (years < 10) return 'Senior';
    return 'Expert';
  };

  const getShiftColor = (shift) => {
    switch (shift?.toLowerCase()) {
      case 'morning': return 'success';
      case 'evening': return 'warning';
      case 'night': return 'error';
      case 'rotating': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading profile...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
            Lab Technician Profile
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your professional information and preferences
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => showMessage('info', 'Export feature coming soon')}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Profile Summary */}
        <Grid item xs={12} md={4}>
          {/* Profile Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', pt: 4 }}>
              <Box position="relative" display="inline-block">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: 40,
                    bgcolor: 'primary.main',
                    mb: 2
                  }}
                >
                  {profile?.user?.name?.charAt(0)}
                </Avatar>
              </Box>

              <Typography variant="h5" gutterBottom>
                {profile?.user?.name}
              </Typography>
              
              <Chip 
                icon={<Verified />}
                label={`Employee ID: ${profile?.profile?.employeeId || 'N/A'}`}
                size="small"
                sx={{ mb: 1 }}
              />
              
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                <Chip 
                  label={getExperienceLevel(profile?.profile?.experience || 0)}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`${profile?.profile?.experience || 0} yrs`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <Chip 
                icon={<Science />}
                label={profile?.profile?.specialization || 'General'}
                color="secondary"
                size="small"
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                Performance Metrics
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <Assignment />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Tests Conducted"
                    secondary={
                      <Typography variant="body2" fontWeight="bold">
                        {profile?.profile?.testsConducted || 0}
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Accuracy Rate"
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {profile?.profile?.accuracyRate || 0}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={profile?.profile?.accuracyRate || 0}
                          sx={{ flexGrow: 1, height: 6 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.light' }}>
                      <AccessTime />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Avg. Completion"
                    secondary={
                      <Typography variant="body2" fontWeight="bold">
                        {performanceStats?.recentPerformance?.averageCompletionTime || 'N/A'}
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>
                      <Warning />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Critical Tests"
                    secondary={
                      <Typography variant="body2" fontWeight="bold" color="error">
                        {performanceStats?.recentPerformance?.priorityStats?.Critical || 0}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                Contact Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={
                      <Typography variant="body2" fontWeight="medium">
                        {profile?.user?.email}
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Phone color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={
                      <Typography variant="body2" fontWeight="medium">
                        {profile?.user?.phone || 'Not provided'}
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Work color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Department" 
                    secondary={
                      <Typography variant="body2" fontWeight="medium">
                        {profile?.profile?.department || 'N/A'}
                      </Typography>
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Join Date" 
                    secondary={
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(profile?.profile?.joinDate)}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Professional Details" />
              <Tab label="Certifications" />
              <Tab label="Equipment Permissions" />
              <Tab label="Test History" />
            </Tabs>

            <Box p={3}>
              {/* Tab 1: Professional Details */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      fullWidth
                      InputProps={{
                        startAdornment: <MedicalServices sx={{ mr: 1, color: 'action.active' }} />
                      }}
                      helperText="Your main area of expertise"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Shift Schedule</InputLabel>
                      <Select
                        value={formData.shift}
                        label="Shift Schedule"
                        onChange={(e) => setFormData({...formData, shift: e.target.value})}
                        startAdornment={<AccessTime sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        <MenuItem value="Morning">Morning (7 AM - 3 PM)</MenuItem>
                        <MenuItem value="Evening">Evening (3 PM - 11 PM)</MenuItem>
                        <MenuItem value="Night">Night (11 PM - 7 AM)</MenuItem>
                        <MenuItem value="Rotating">Rotating Shifts</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      License Information
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>License Number:</strong> {profile?.profile?.licenseNumber || 'N/A'}
                      </Typography>
                      {profile?.profile?.lastCertificationCheck && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last verified: {formatDate(profile.profile.lastCertificationCheck)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Current Shift Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Chip 
                        label={formData.shift || 'Not set'}
                        color={getShiftColor(formData.shift)}
                        icon={<AccessTime />}
                      />
                      <Chip 
                        label={profile?.profile?.isActive ? 'Active' : 'Inactive'}
                        color={profile?.profile?.isActive ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Tab 2: Certifications */}
              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Certified Tests
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        List of tests you're certified to perform
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${formData.certifiedTests?.length || 0} tests`}
                      color="primary"
                    />
                  </Box>

                  {/* Add New Certified Test */}
                  <Box display="flex" gap={1} mb={3}>
                    <TextField
                      label="Add new test certification"
                      value={newCertifiedTest}
                      onChange={(e) => setNewCertifiedTest(e.target.value)}
                      fullWidth
                      size="small"
                      helperText="Enter test name you're certified to perform"
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCertifiedTest}
                      disabled={!newCertifiedTest.trim()}
                      sx={{ minWidth: '100px' }}
                    >
                      Add
                    </Button>
                  </Box>

                  {/* Certified Tests List */}
                  {formData.certifiedTests?.length > 0 ? (
                    <Grid container spacing={2}>
                      {formData.certifiedTests.map((test, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircle color="success" fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                  {test}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveCertifiedTest(test)}
                                color="error"
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Certified Tests
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add tests you're certified to perform above
                      </Typography>
                    </Box>
                  )}

                  {/* Training Certifications */}
                  <Divider sx={{ my: 4 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Training Certifications
                  </Typography>
                  
                  {certifications.length > 0 ? (
                    <Grid container spacing={2}>
                      {certifications.map((cert) => (
                        <Grid item xs={12} key={cert.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="start">
                                <Box>
                                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Verified color="primary" fontSize="small" />
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      {cert.name}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {cert.issuer}
                                  </Typography>
                                  <Box display="flex" gap={2} mt={1}>
                                    <Typography variant="caption">
                                      Issued: {format(new Date(cert.date), 'MMM yyyy')}
                                    </Typography>
                                    <Typography variant="caption">
                                      Expires: {format(new Date(cert.expiry), 'MMM yyyy')}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Chip
                                  label={cert.status}
                                  color={cert.status === 'Active' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="text.secondary">
                        No formal training certifications recorded
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 3: Equipment Permissions */}
              {activeTab === 2 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Equipment Permissions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lab equipment you're authorized to operate
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${formData.equipmentPermissions?.length || 0} equipment`}
                      color="primary"
                    />
                  </Box>

                  {/* Add New Equipment */}
                  <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Add Equipment Permission
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Equipment Type"
                          value={newEquipment.equipmentType}
                          onChange={(e) => setNewEquipment({...newEquipment, equipmentType: e.target.value})}
                          fullWidth
                          size="small"
                          placeholder="e.g., Hematology Analyzer, Centrifuge"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={newEquipment.canOperate}
                                onChange={(e) => setNewEquipment({...newEquipment, canOperate: e.target.checked})}
                              />
                            }
                            label="Can Operate"
                          />
                        </FormGroup>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          variant="contained"
                          onClick={handleAddEquipment}
                          disabled={!newEquipment.equipmentType.trim()}
                          fullWidth
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Equipment List */}
                  {formData.equipmentPermissions?.length > 0 ? (
                    <Grid container spacing={2}>
                      {formData.equipmentPermissions.map((equipment, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Devices color={equipment.canOperate ? "success" : "disabled"} />
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {equipment.equipmentType}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {equipment.canOperate ? 'Authorized' : 'Restricted'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveEquipment(index)}
                                color="error"
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Devices sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Equipment Permissions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add equipment permissions above to track what you can operate
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 4: Test History */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recent Test History
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last 10 completed tests
                  </Typography>

                  {testHistory.length > 0 ? (
                    <Box>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Total Tests
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {profile?.profile?.testsConducted || 0}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Last 30 Days
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {performanceStats?.recentPerformance?.testsLast30Days || 0}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Avg. Time
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {performanceStats?.recentPerformance?.averageCompletionTime || 'N/A'}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Accuracy
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                              {profile?.profile?.accuracyRate || 0}%
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <List>
                        {testHistory.map((test, index) => (
                          <React.Fragment key={index}>
                            <ListItem
                              sx={{
                                py: 2,
                                borderLeft: test.priority === 'Critical' ? '4px solid #f44336' : 'none',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.light' }}>
                                  <Biotech />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box display="flex" justifyContent="space-between">
                                    <Typography variant="subtitle2" fontWeight="medium">
                                      {test.testName}
                                    </Typography>
                                    <Chip 
                                      label={test.priority} 
                                      size="small" 
                                      color={
                                        test.priority === 'Critical' ? 'error' :
                                        test.priority === 'High' ? 'warning' :
                                        test.priority === 'Medium' ? 'info' : 'default'
                                      }
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" component="span">
                                      Patient: {test.patientName} • Doctor: {test.doctorName}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                      Completed: {formatDate(test.completedAt)}
                                      {test.hasReport && (
                                        <Chip 
                                          label="Report Generated" 
                                          size="small" 
                                          color="success" 
                                          variant="outlined"
                                          sx={{ ml: 2 }}
                                        />
                                      )}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < testHistory.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Test History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete some tests to see your history here
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Performance Charts (Simplified) */}
          {performanceStats && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Performance Trends
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Most Frequent Tests
                      </Typography>
                      {performanceStats.recentPerformance?.departmentStats?.slice(0, 3).map((stat, index) => (
                        <Box key={index} mb={1}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption">
                              {stat.testName}
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {stat.count}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (stat.count / 10) * 100)} 
                          />
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Priority Distribution
                      </Typography>
                      {Object.entries(performanceStats.recentPerformance?.priorityStats || {}).map(([priority, count]) => (
                        <Box key={priority} display="flex" alignItems="center" mb={1}>
                          <Chip 
                            label={priority} 
                            size="small" 
                            sx={{ width: 80, mr: 2 }}
                            color={
                              priority === 'Critical' ? 'error' :
                              priority === 'High' ? 'warning' :
                              priority === 'Medium' ? 'info' : 'default'
                            }
                          />
                          <Box flex={1}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(100, (count / 20) * 100)} 
                            />
                          </Box>
                          <Typography variant="caption" sx={{ ml: 1, minWidth: 30 }}>
                            {count}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default LabTechProfile;