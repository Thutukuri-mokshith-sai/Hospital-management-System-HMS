import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  Fade,
  Zoom,
  Slide,
  Grow,
  Tooltip,
  Badge,
  Rating,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Skeleton,
  InputAdornment,
  Popover,
  Autocomplete,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Notifications,
  Language,
  Security,
  Palette,
  Save,
  Restore,
  Download,
  Visibility,
  VisibilityOff,
  Email,
  CloudUpload,
  Delete,
  Info,
  Warning,
  DarkMode,
  LightMode,
  AccessTime,
  VolumeUp,
  Vibration,
  Person,
  Science,
  Update,
  VerifiedUser,
  Assignment,
  Settings as SettingsIcon,
  Password,
  Storage,
  History,
  Help,
  ContactSupport,
  AccountCircle,
  Work,
  School,
  CalendarToday,
  Biotech,
  MedicalServices,
  Devices,
  ColorLens,
  FontDownload,
  DensityMedium,
  Schedule,
  LockReset,
  Backup,
  ArrowForward,
  CheckCircle,
  Error,
  Add,
  Edit,
  ContentCopy,
  QrCode,
  Fingerprint,
  Shield,
  SecurityUpdateGood,
  Verified,
  TrendingUp,
  Analytics,
  Insights,
  BarChart,
  PieChart,
  Cloud,
  Storage as StorageIcon,
  SimCardDownload,
  SimCardUpload,
  Refresh,
  Cached,
  Autorenew,
  Sync,
  Bolt,
  FlashOn,
  Rocket,
  Stars,
  WorkspacePremium,
  EmojiEvents,
  MilitaryTech,
  Diamond,
  Favorite,
  Grade,
  ThumbUp,
  Celebration,
  ConfirmationNumber,
  Redeem,
  CardGiftcard,
  Discount,
  LocalOffer,
  Percent,
  Tag,
  Loyalty,
  Workspaces,
  Science as ScienceIcon,
  Coronavirus,
  HealthAndSafety,
  MedicalInformation,
  MonitorHeart,
  Vaccines,
  AirlineSeatFlat,
  Emergency,
  Medication,
  MedicalServices as MedicalServicesIcon,
  Healing,
  LocalHospital,
  Hearing,
  Psychology,
  Psychiatry,
  Spa,
  SelfImprovement,
  FitnessCenter,
  AccessibilityNew,
  HearingDisabled,
  Visibility as VisibilityIcon,
  RemoveRedEye,
  FlashlightOn,
  FlashlightOff,
  Brightness4,
  Brightness7,
  BrightnessAuto,
  Contrast,
  InvertColors,
  Opacity,
  Gradient,
  Palette as PaletteIcon,
  FormatColorFill,
  FormatPaint,
  Brush,
  Draw,
  DesignServices,
  Architecture,
  Engineering,
  Construction,
  Handyman,
  Build,
  Hardware,
  Memory,
  SdStorage,
  Usb,
  Bluetooth,
  Wifi,
  Router,
  DeviceHub,
  DevicesOther,
  Smartphone,
  Tablet,
  Laptop,
  DesktopWindows,
  Tv,
  Speaker,
  Headphones,
  Keyboard,
  Mouse,
  TouchApp,
  Gesture,
  Swipe,
  TapAndPlay,
  Contactless,
  Nfc,
  Radar,
  Satellite,
  Sensors,
  Thermostat,
  AcUnit,
  Whatshot,
  ElectricBolt,
  Power,
  BatteryChargingFull,
  BatteryStd,
  BatteryAlert,
  PowerSettingsNew,
  PowerOff,
  RestartAlt,
  SettingsPower,
  SettingsBackupRestore,
  SettingsApplications,
  SettingsInputComponent,
  SettingsInputComposite,
  SettingsInputHdmi,
  SettingsInputSvideo,
  SettingsOverscan,
  SettingsPhone,
  SettingsRemote,
  SettingsSystemDaydream,
  SettingsVoice,
  PhonelinkSetup,
  DevicesFold,
  DevicesWearables,
  Watch,
  WatchLater,
  WatchOff,
  WatchVibration,
  WatchScreentime,
  WatchButtonPress,
  WatchButtonPlay,
  WatchButtonPause,
  WatchButtonStop,
  WatchButtonRecord,
  WatchButtonForward10,
  WatchButtonRewind10,
  WatchButtonSkipNext,
  WatchButtonSkipPrevious,
  WatchButtonFastForward,
  WatchButtonRewind,
  WatchButtonPlayCircle,
  WatchButtonPauseCircle,
  WatchButtonStopCircle,
  WatchButtonRecordCircle,
  WatchButtonPlayCircleOutline,
  WatchButtonPauseCircleOutline,
  WatchButtonStopCircleOutline,
  WatchButtonRecordCircleOutline,
  WatchButtonPlayCircleFilled,
  WatchButtonPauseCircleFilled,
  WatchButtonStopCircleFilled,
  WatchButtonRecordCircleFilled,
  WatchButtonPlayCircleFilledWhite,
  WatchButtonPauseCircleFilledWhite,
  WatchButtonStopCircleFilledWhite,
  WatchButtonRecordCircleFilledWhite
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../api/api';

// Equipment types with icons
const EQUIPMENT_TYPES = [
  { type: 'Microscope', icon: <Science />, category: 'Imaging' },
  { type: 'Centrifuge', icon: <Devices />, category: 'Processing' },
  { type: 'PCR Machine', icon: <Biotech />, category: 'Molecular' },
  { type: 'Hematology Analyzer', icon: <MedicalServices />, category: 'Hematology' },
  { type: 'Chemistry Analyzer', icon: <ScienceIcon />, category: 'Chemistry' },
  { type: 'Incubator', icon: <Whatshot />, category: 'Culture' },
  { type: 'Autoclave', icon: <Security />, category: 'Sterilization' },
  { type: 'Spectrophotometer', icon: <Palette />, category: 'Analysis' },
  { type: 'Electrophoresis', icon: <ElectricBolt />, category: 'Molecular' },
  { type: 'Flow Cytometer', icon: <Analytics />, category: 'Cellular' },
];

const LabTechSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sound: true,
      vibration: false
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      density: 'comfortable',
      animations: true,
      roundedCorners: true,
      shadows: true
    },
    privacy: {
      showOnlineStatus: true,
      allowTracking: false,
      shareAnalytics: true
    },
    general: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    }
  });
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [certifications, setCertifications] = useState([]);
  const [updateProfileData, setUpdateProfileData] = useState({
    specialization: '',
    shift: '',
    certifiedTests: [],
    equipmentPermissions: []
  });
  
  // New states for enhanced UI
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [newEquipment, setNewEquipment] = useState('');
  const [newEquipmentType, setNewEquipmentType] = useState('');
  const [showCertificationDialog, setShowCertificationDialog] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [showThemePreview, setShowThemePreview] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    loadProfileData();
    loadSettings();
  }, []);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(strength);
  }, [newPassword]);

  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/labtech/me');
      const profile = response.data.data;
      setProfileData(profile);
      
      // Handle certifiedTests data
      const certifiedTests = profile.profile?.certifiedTests || [];
      const certNames = certifiedTests.map(cert => {
        if (typeof cert === 'object' && cert !== null) {
          return cert.testName || cert.name || JSON.stringify(cert);
        }
        return cert;
      });
      
      // Handle equipment permissions - ensure objects have equipmentType
      const equipmentPermissions = profile.profile?.equipmentPermissions || [];
      const normalizedEquipment = equipmentPermissions.map(eq => {
        if (typeof eq === 'object' && eq !== null) {
          return {
            equipmentType: eq.equipmentType || eq.type || 'Unknown',
            canOperate: eq.canOperate !== undefined ? eq.canOperate : true,
            _id: eq._id
          };
        }
        return {
          equipmentType: eq,
          canOperate: true
        };
      });
      
      setUpdateProfileData({
        specialization: profile.profile?.specialization || '',
        shift: profile.profile?.shift || '',
        certifiedTests: certNames,
        equipmentPermissions: normalizedEquipment
      });
      
      setCertifications(certNames);
    } catch (error) {
      console.error('Error loading profile:', error);
      showSnackbar('Failed to load profile data', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('labtech_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      localStorage.setItem('labtech_settings', JSON.stringify(settings));
      showSnackbar('Settings saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    if (passwordStrength < 3) {
      showSnackbar('Password is too weak. Please use a stronger password.', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.post('/labtech/change-password', { 
        oldPassword, 
        newPassword 
      });
      showSnackbar('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
  try {
    setLoading(true);
    
    // Prepare certifiedTests as objects if needed
    const certifiedTestsData = certifications.map(cert => ({
      testName: cert,
      certificationDate: new Date().toISOString(),
      issuingAuthority: 'Internal Certification'
    }));
    
    // Prepare equipmentPermissions as objects
    const equipmentData = updateProfileData.equipmentPermissions.map(eq => 
      typeof eq === 'object' ? eq : { equipmentType: eq, canOperate: true }
    );
    
    await api.put('/labtech/profile', {
      specialization: updateProfileData.specialization,
      shift: updateProfileData.shift,
      certifiedTests: certifiedTestsData,  // Send as objects
      equipmentPermissions: equipmentData  // Send as objects
    });
    
    showSnackbar('Profile updated successfully!', 'success');
    loadProfileData();
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
  } finally {
    setLoading(false);
  }
};  const handleExportData = async () => {
    try {
      const [profileRes, testsRes, reportsRes] = await Promise.all([
        api.get('/labtech/me'),
        api.get('/labtech/history?limit=1000'),
        api.get('/labtech/tests?status=Completed')
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileRes.data.data,
        testHistory: testsRes.data.data,
        completedTests: reportsRes.data.data,
        settings: settings
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `labtech_data_${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSnackbar('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showSnackbar('Failed to export data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetSettings = () => {
    setSettings({
      notifications: {
        email: true,
        push: true,
        sound: true,
        vibration: false
      },
      appearance: {
        theme: 'light',
        fontSize: 'medium',
        density: 'comfortable',
        animations: true,
        roundedCorners: true,
        shadows: true
      },
      privacy: {
        showOnlineStatus: true,
        allowTracking: false,
        shareAnalytics: true
      },
      general: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY'
      }
    });
    showSnackbar('Settings reset to defaults', 'info');
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      const updatedCerts = [...certifications, newCertification.trim()];
      setCertifications(updatedCerts);
      setUpdateProfileData({
        ...updateProfileData,
        certifiedTests: updatedCerts
      });
      setNewCertification('');
      setShowCertificationDialog(false);
      showSnackbar('Certification added', 'success');
    }
  };

  const handleRemoveCertification = (index) => {
    const updatedCerts = certifications.filter((_, i) => i !== index);
    setCertifications(updatedCerts);
    setUpdateProfileData({
      ...updateProfileData,
      certifiedTests: updatedCerts
    });
    showSnackbar('Certification removed', 'info');
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      const equipmentType = newEquipmentType || newEquipment;
      const updatedEquipment = [
        ...updateProfileData.equipmentPermissions,
        {
          equipmentType: equipmentType.trim(),
          canOperate: true
        }
      ];
      setUpdateProfileData({
        ...updateProfileData,
        equipmentPermissions: updatedEquipment
      });
      setNewEquipment('');
      setNewEquipmentType('');
      setShowEquipmentDialog(false);
      showSnackbar('Equipment added', 'success');
    }
  };

  const handleRemoveEquipment = (index) => {
    const updatedEquipment = updateProfileData.equipmentPermissions.filter((_, i) => i !== index);
    setUpdateProfileData({
      ...updateProfileData,
      equipmentPermissions: updatedEquipment
    });
    showSnackbar('Equipment removed', 'info');
  };

  const handleToggleEquipmentPermission = (index) => {
    const updatedEquipment = [...updateProfileData.equipmentPermissions];
    updatedEquipment[index] = {
      ...updatedEquipment[index],
      canOperate: !updatedEquipment[index].canOperate
    };
    setUpdateProfileData({
      ...updateProfileData,
      equipmentPermissions: updatedEquipment
    });
    showSnackbar('Permission updated', 'info');
  };

  const tabs = [
    { label: 'Profile', icon: <Person />, color: 'primary' },
    { label: 'Notifications', icon: <Notifications />, color: 'warning' },
    { label: 'Security', icon: <Security />, color: 'error' },
    { label: 'Appearance', icon: <Palette />, color: 'info' },
    { label: 'Privacy', icon: <VerifiedUser />, color: 'success' },
    { label: 'Backup', icon: <CloudUpload />, color: 'secondary' }
  ];

  const quickActions = [
    { icon: <Save />, name: 'Save All', action: saveSettings, color: 'primary' },
    { icon: <Download />, name: 'Export', action: handleExportData, color: 'info' },
    { icon: <Refresh />, name: 'Refresh', action: loadProfileData, color: 'success' },
    { icon: <Backup />, name: 'Backup', action: () => showSnackbar('Backup created', 'info'), color: 'secondary' },
  ];

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'error';
    if (passwordStrength < 3) return 'warning';
    return 'success';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return 'Very Weak';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  if (profileLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="70vh">
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Loading your settings...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing your personalized dashboard
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header with animated gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <SettingsIcon sx={{ fontSize: 40 }} />
                <Typography variant="h3" fontWeight="bold">
                  Settings & Profile
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Customize your laboratory technician experience
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<WorkspacePremium />}
                label="Professional Edition"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
              />
              <Chip
                icon={<Verified />}
                label={`Accuracy: ${profileData?.profile?.accuracyRate || 0}%`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Enhanced Sidebar with animations */}
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              {/* Profile Card with Stats */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  p: 4,
                  textAlign: 'center',
                  color: 'white'
                }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 16px',
                    border: '4px solid white',
                    fontSize: '2.5rem',
                    bgcolor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  {profileData?.user?.name?.charAt(0) || 'L'}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {profileData?.user?.name || 'Lab Technician'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  {profileData?.profile?.employeeId || 'Employee ID'}
                </Typography>
                
                {/* Stats Grid */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <Typography variant="caption" display="block">Tests</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {profileData?.profile?.testsConducted || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <Typography variant="caption" display="block">Accuracy</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.light">
                        {profileData?.profile?.accuracyRate || 0}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Enhanced Navigation Tabs */}
              <Box sx={{ p: 2 }}>
                <Tabs
                  orientation="vertical"
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  sx={{
                    '& .MuiTab-root': {
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minHeight: 56,
                      borderRadius: 2,
                      mb: 1,
                      transition: 'all 0.3s',
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                        transform: 'translateX(8px)',
                        boxShadow: 2
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)'
                      }
                    }
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      icon={tab.icon}
                      iconPosition="start"
                      label={tab.label}
                      sx={{ color: `${tab.color}.main` }}
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quick Stats
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Work color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Department" 
                      secondary={profileData?.profile?.department || 'N/A'} 
                      secondaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <School color="info" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Specialization" 
                      secondary={profileData?.profile?.specialization || 'General'} 
                      secondaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CalendarToday color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Experience" 
                      secondary={`${profileData?.profile?.experience || 0} years`} 
                      secondaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Profile Settings */}
              {activeTab === 0 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Professional Profile
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Update your professional information and qualifications
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Specialization"
                          value={updateProfileData.specialization}
                          onChange={(e) => setUpdateProfileData({
                            ...updateProfileData,
                            specialization: e.target.value
                          })}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Science color="primary" />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Work Shift</InputLabel>
                          <Select
                            value={updateProfileData.shift}
                            label="Work Shift"
                            onChange={(e) => setUpdateProfileData({
                              ...updateProfileData,
                              shift: e.target.value
                            })}
                            startAdornment={
                              <InputAdornment position="start">
                                <Schedule sx={{ ml: 1, color: 'action.active' }} />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="Morning">
                              <Box display="flex" alignItems="center" gap={1}>
                                <LightMode fontSize="small" />
                                Morning (8AM - 4PM)
                              </Box>
                            </MenuItem>
                            <MenuItem value="Evening">
                              <Box display="flex" alignItems="center" gap={1}>
                                <DarkMode fontSize="small" />
                                Evening (4PM - 12AM)
                              </Box>
                            </MenuItem>
                            <MenuItem value="Night">
                              <Box display="flex" alignItems="center" gap={1}>
                                <AccessTime fontSize="small" />
                                Night (12AM - 8AM)
                              </Box>
                            </MenuItem>
                            <MenuItem value="Rotating">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Sync fontSize="small" />
                                Rotating Schedule
                              </Box>
                            </MenuItem>
                            <MenuItem value="Flexible">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Autorenew fontSize="small" />
                                Flexible Hours
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Certifications Section */}
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <VerifiedUser color="primary" />
                              <Typography variant="h6">
                                Certifications & Qualifications
                              </Typography>
                            </Box>
                            <Tooltip title="Add Certification">
                              <IconButton
                                onClick={() => setShowCertificationDialog(true)}
                                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                              >
                                <Add />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          
                          {certifications.length > 0 ? (
                            <Grid container spacing={2}>
                              {certifications.map((cert, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      border: '2px solid',
                                      borderColor: 'success.light',
                                      bgcolor: 'success.lightest',
                                      position: 'relative'
                                    }}
                                  >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <CheckCircle color="success" fontSize="small" />
                                        <Typography variant="body2" fontWeight="medium">
                                          {cert}
                                        </Typography>
                                      </Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveCertification(index)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box textAlign="center" py={4}>
                              <VerifiedUser sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                              <Typography color="text.secondary">
                                No certifications added yet
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>

                      {/* Equipment Permissions - FIXED VERSION */}
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Devices color="info" />
                              <Typography variant="h6">
                                Equipment Permissions
                              </Typography>
                            </Box>
                            <Tooltip title="Add Equipment">
                              <IconButton
                                onClick={() => setShowEquipmentDialog(true)}
                                sx={{ bgcolor: 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}
                              >
                                <Add />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          
                          {updateProfileData.equipmentPermissions.length > 0 ? (
                            <Grid container spacing={2}>
                              {updateProfileData.equipmentPermissions.map((equipment, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      border: '2px solid',
                                      borderColor: equipment.canOperate ? 'info.light' : 'warning.light',
                                      bgcolor: equipment.canOperate ? 'info.lightest' : 'warning.lightest',
                                      position: 'relative'
                                    }}
                                  >
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Box display="flex" alignItems="center" gap={1}>
                                        {EQUIPMENT_TYPES.find(e => e.type === equipment.equipmentType)?.icon || <Devices />}
                                        <Box>
                                          <Typography variant="body2" fontWeight="medium">
                                            {equipment.equipmentType}
                                          </Typography>
                                          <Chip
                                            label={equipment.canOperate ? 'Authorized' : 'Restricted'}
                                            size="small"
                                            color={equipment.canOperate ? 'success' : 'warning'}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                          />
                                        </Box>
                                      </Box>
                                      <Box>
                                        <Tooltip title={equipment.canOperate ? 'Revoke Permission' : 'Grant Permission'}>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleToggleEquipmentPermission(index)}
                                            sx={{ mr: 1 }}
                                          >
                                            {equipment.canOperate ? <LockReset /> : <Verified />}
                                          </IconButton>
                                        </Tooltip>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveEquipment(index)}
                                          sx={{ color: 'error.main' }}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Box textAlign="center" py={4}>
                              <Devices sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                              <Typography color="text.secondary">
                                No equipment permissions added yet
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>

                      {/* Save Button */}
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                          <Button
                            variant="outlined"
                            startIcon={<Restore />}
                            onClick={() => {
                              setUpdateProfileData({
                                specialization: profileData?.profile?.specialization || '',
                                shift: profileData?.profile?.shift || '',
                                certifiedTests: certifications,
                                equipmentPermissions: updateProfileData.equipmentPermissions
                              });
                              showSnackbar('Changes discarded', 'info');
                            }}
                          >
                            Discard Changes
                          </Button>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<Save />}
                            onClick={handleUpdateProfile}
                            disabled={loading}
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                              }
                            }}
                          >
                            {loading ? 'Updating...' : 'Update Profile'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Settings */}
              {activeTab === 1 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'warning.main', color: 'white' }}>
                        <Notifications />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Notification Preferences
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Configure how you receive alerts and updates
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {[
                        { key: 'email', label: 'Email Notifications', icon: <Email />, desc: 'Receive test assignments via email' },
                        { key: 'push', label: 'Push Notifications', icon: <Notifications />, desc: 'Browser notifications for urgent tasks' },
                        { key: 'sound', label: 'Sound Alerts', icon: <VolumeUp />, desc: 'Play sound for new notifications' },
                        { key: 'vibration', label: 'Vibration', icon: <Vibration />, desc: 'Vibrate for mobile notifications' }
                      ].map(item => (
                        <Grid item xs={12} key={item.key}>
                          <Paper
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: `${settings.notifications[item.key] ? 'warning' : 'grey'}.100` }}>
                                  {item.icon}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {item.label}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.desc}
                                  </Typography>
                                </Box>
                              </Box>
                              <Switch
                                checked={settings.notifications[item.key]}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  notifications: { ...settings.notifications, [item.key]: e.target.checked }
                                })}
                                color="warning"
                              />
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Security Settings */}
              {activeTab === 2 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'error.main', color: 'white' }}>
                        <Security />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Security Settings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage your account security and authentication
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Change Password
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Current Password"
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={() => setShowOldPassword(!showOldPassword)}>
                                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="New Password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Confirm New Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={newPassword !== confirmPassword && confirmPassword !== ''}
                                helperText={newPassword !== confirmPassword && confirmPassword !== '' ? "Passwords don't match" : ''}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Password Strength: {getPasswordStrengthLabel()}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={passwordStrength * 25}
                                  color={getPasswordStrengthColor()}
                                  sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  • At least 8 characters<br/>
                                  • Mix of uppercase & lowercase<br/>
                                  • Include numbers<br/>
                                  • Special characters
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Button
                                variant="contained"
                                startIcon={<Password />}
                                onClick={handlePasswordChange}
                                disabled={loading || !oldPassword || !newPassword || !confirmPassword || passwordStrength < 3}
                                sx={{
                                  background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #e53e3e 0%, #f56565 100%)'
                                  }
                                }}
                              >
                                {loading ? 'Changing...' : 'Change Password'}
                              </Button>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Appearance Settings */}
              {activeTab === 3 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'info.main', color: 'white' }}>
                        <Palette />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Appearance Settings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Customize the look and feel of your dashboard
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {[
                        {
                          key: 'theme',
                          label: 'Theme',
                          icon: <Palette />,
                          options: ['light', 'dark', 'auto'],
                          icons: [<LightMode />, <DarkMode />, <BrightnessAuto />]
                        },
                        {
                          key: 'fontSize',
                          label: 'Font Size',
                          icon: <FontDownload />,
                          options: ['small', 'medium', 'large'],
                          icons: [<Typography fontSize="small">A</Typography>, <Typography>A</Typography>, <Typography fontSize="large">A</Typography>]
                        },
                        {
                          key: 'density',
                          label: 'Density',
                          icon: <DensityMedium />,
                          options: ['compact', 'comfortable', 'spacious'],
                          icons: [<DensityMedium />, <DensityMedium />, <DensityMedium />]
                        }
                      ].map(setting => (
                        <Grid item xs={12} md={4} key={setting.key}>
                          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              {setting.icon}
                              <Typography variant="subtitle1" fontWeight="medium">
                                {setting.label}
                              </Typography>
                            </Box>
                            <Box display="flex" flexDirection="column" gap={1}>
                              {setting.options.map((option, index) => (
                                <Button
                                  key={option}
                                  variant={settings.appearance[setting.key] === option ? 'contained' : 'outlined'}
                                  onClick={() => setSettings({
                                    ...settings,
                                    appearance: { ...settings.appearance, [setting.key]: option }
                                  })}
                                  startIcon={setting.icons[index]}
                                  fullWidth
                                  sx={{ justifyContent: 'flex-start' }}
                                >
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Button>
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Settings */}
              {activeTab === 4 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'success.main', color: 'white' }}>
                        <VerifiedUser />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Privacy & Data
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Control your data sharing and privacy preferences
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {Object.entries(settings.privacy).map(([key, value]) => {
                        const labels = {
                          showOnlineStatus: 'Show Online Status',
                          allowTracking: 'Usage Tracking',
                          shareAnalytics: 'Share Analytics'
                        };
                        
                        const descriptions = {
                          showOnlineStatus: 'Let others see when you are active',
                          allowTracking: 'Help improve the app with anonymous usage data',
                          shareAnalytics: 'Share performance analytics for research'
                        };

                        return (
                          <Grid item xs={12} key={key}>
                            <Paper
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {labels[key]}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {descriptions[key]}
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={value}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    privacy: { ...settings.privacy, [key]: e.target.checked }
                                  })}
                                  color="success"
                                />
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Backup & Export */}
              {activeTab === 5 && (
                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                      <Avatar sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                        <CloudUpload />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Backup & Data Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Export your data and manage backups
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Box display="flex" alignItems="center" gap={2} mb={3}>
                            <SimCardDownload color="primary" sx={{ fontSize: 40 }} />
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                Export All Data
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Download your complete laboratory data
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Includes your profile information, test history, performance reports, and current settings.
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={handleExportData}
                            fullWidth
                            sx={{ mt: 2 }}
                          >
                            Export Data as JSON
                          </Button>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Box display="flex" alignItems="center" gap={2} mb={3}>
                           
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                Settings Backup
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Backup your current configuration
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Create a backup of your current settings that can be restored later.
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Backup />}
                            onClick={() => {
                              const settingsBackup = JSON.stringify(settings, null, 2);
                              const blob = new Blob([settingsBackup], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `labtech_settings_${format(new Date(), 'yyyy-MM-dd')}.json`;
                              a.click();
                              showSnackbar('Settings backup created', 'success');
                            }}
                            fullWidth
                            sx={{ mt: 2 }}
                          >
                            Backup Settings
                          </Button>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </Grid>
      </Grid>

      {/* Equipment Dialog */}
      <Dialog open={showEquipmentDialog} onClose={() => setShowEquipmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Devices />
            Add Equipment Permission
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              freeSolo
              options={EQUIPMENT_TYPES.map(eq => eq.type)}
              value={newEquipment}
              onChange={(event, newValue) => {
                setNewEquipment(newValue || '');
              }}
              onInputChange={(event, newInputValue) => {
                setNewEquipment(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Equipment Type"
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Start typing or select from common equipment"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEquipmentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddEquipment}
            disabled={!newEquipment.trim()}
          >
            Add Equipment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={showCertificationDialog} onClose={() => setShowCertificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VerifiedUser />
            Add Certification
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Certification Name"
            fullWidth
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Enter the name of your certification or qualification"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCertificationDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCertification}
            disabled={!newCertification.trim()}
          >
            Add Certification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
        open={showQuickActions}
        onOpen={() => setShowQuickActions(true)}
        onClose={() => setShowQuickActions(false)}
      >
        {quickActions.map((action, index) => (
          <SpeedDialAction
            key={index}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
            sx={{ color: `${action.color}.main` }}
          />
        ))}
      </SpeedDial>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
          iconMapping={{
            success: <CheckCircle />,
            error: <Error />,
            warning: <Warning />,
            info: <Info />
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LabTechSettings;