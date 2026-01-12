import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  InputAdornment,
  OutlinedInput
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  PendingActions,
  Analytics,
  History,
  Notifications,
  Person,
  Download,
  PlayArrow,
  Done,
  Report,
  TrendingUp,
  Error,
  Refresh,
  MoreVert,
  Schedule,
  PriorityHigh,
  MedicalServices,
  AccessTime,
  Search,
  FilterList,
  CalendarToday,
  ContentCopy,
  Share,
  Print,
  Email,
  VerifiedUser,
  LocalHospital,
  Science,
  Biotech
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

// Base URL from your API
const BASE_URL = 'http://localhost:5000/api/v1';

const LabTechDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [assignedTests, setAssignedTests] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [startTestDialog, setStartTestDialog] = useState(false);
  const [completeTestDialog, setCompleteTestDialog] = useState(false);
  const [submitReportDialog, setSubmitReportDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [reportResult, setReportResult] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [testHistory, setTestHistory] = useState([]);
  const [statsTimeRange, setStatsTimeRange] = useState('today');

  // API Configuration
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for better performance
      const [dashboardRes, notificationsRes, testsRes, performanceRes, profileRes] = await Promise.all([
        api.get('/labtech/dashboard'),
        api.get('/labtech/notifications'),
        api.get('/labtech/tests'),
        api.get('/labtech/performance'),
        api.get('/labtech/me')
      ]);

      setDashboardData(dashboardRes.data.data);
      setNotifications(notificationsRes.data.data.notifications);
      setAssignedTests(testsRes.data.data || []);
      setPerformanceData(performanceRes.data.data);
      setProfileData(profileRes.data.data);
      
      // Fetch test history for completed tests
      const historyRes = await api.get('/labtech/history?limit=50');
      setTestHistory(historyRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showSnackbar('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Poll for new notifications every 30 seconds
    const notificationInterval = setInterval(async () => {
      try {
        const response = await api.get('/labtech/notifications');
        setNotifications(response.data.data.notifications);
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Test Actions
  const handleStartTest = (test) => {
    setSelectedTest(test);
    setStartTestDialog(true);
  };

  const confirmStartTest = async () => {
    try {
      await api.patch(`/labtech/tests/${selectedTest.id}/start`);
      showSnackbar('Test started successfully');
      fetchDashboardData(); // Refresh data
      setStartTestDialog(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to start test', 'error');
    }
  };

  const handleCompleteTest = (test) => {
    setSelectedTest(test);
    setCompleteTestDialog(true);
  };

  const confirmCompleteTest = async () => {
    try {
      await api.patch(`/labtech/tests/${selectedTest.id}/complete`);
      showSnackbar('Test completed successfully');
      fetchDashboardData(); // Refresh data
      setCompleteTestDialog(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to complete test', 'error');
    }
  };

  const handleSubmitReport = (test) => {
    setSelectedTest(test);
    setReportResult('');
    setAdditionalNotes('');
    setSubmitReportDialog(true);
  };

  const confirmSubmitReport = async () => {
  if (!reportResult.trim()) {
    showSnackbar('Please enter test results before submitting', 'error');
    return;
  }

  try {
    await api.post(`/labtech/tests/${selectedTest.id}/report`, {
      result: reportResult,
      additionalNotes: additionalNotes || ''
    });
    showSnackbar('Report submitted successfully! You can now download the PDF.', 'success');
    fetchDashboardData(); // Refresh data
    setSubmitReportDialog(false);
  } catch (error) {
    if (error.response?.status === 404) {
      showSnackbar('Test must be completed before submitting report', 'error');
    } else {
      showSnackbar(error.response?.data?.message || 'Failed to submit report', 'error');
    }
  }
};
  const handleDownloadPDF = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/report/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${testId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('PDF downloaded successfully');
    } catch (error) {
      showSnackbar('No report available or failed to download', 'error');
    }
  };

  const handleViewReassignmentHistory = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/history`);
      console.log('Reassignment history:', response.data.data);
      showSnackbar('Reassignment history loaded', 'info');
    } catch (error) {
      showSnackbar('Failed to load history', 'error');
    }
  };

  const handleShareReport = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/report/pdf`, {
        responseType: 'blob'
      });
      
      // Create a file from the blob
      const file = new File([response.data], `LabReport_${testId}.pdf`, { type: 'application/pdf' });
      
      // For demonstration, just copy link to clipboard
      const reportLink = `${BASE_URL}/labtech/tests/${testId}/report/pdf`;
      await navigator.clipboard.writeText(reportLink);
      showSnackbar('Report link copied to clipboard');
    } catch (error) {
      showSnackbar('Failed to share report', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Processing': return 'warning';
      case 'Requested': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateCompletionTime = (assignedAt, completedAt) => {
    if (!assignedAt || !completedAt) return 'N/A';
    
    const hours = differenceInHours(completedAt, assignedAt);
    const minutes = differenceInMinutes(completedAt, assignedAt) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Filter tests based on search and filters
  const getFilteredTests = () => {
    let filtered = assignedTests.filter(test => {
      if (activeTab === 0) return test.status === 'Requested';
      if (activeTab === 1) return test.status === 'Processing';
      if (activeTab === 2) return test.status === 'Completed';
      return true; // All
    });

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        test.testName.toLowerCase().includes(term) ||
        test.patient?.name?.toLowerCase().includes(term) ||
        test.doctor?.name?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(test => test.priority === priorityFilter);
    }

    return filtered;
  };

  // Dashboard Stats Cards
  const StatCard = ({ title, value, icon, color, subtext, trend }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtext && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {subtext}
              </Typography>
            )}
          </Box>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center">
            {trend.direction === 'up' ? (
              <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
            ) : (
              <TrendingUp sx={{ color: 'error.main', mr: 0.5, fontSize: 16, transform: 'rotate(180deg)' }} />
            )}
            <Typography variant="caption" color={trend.direction === 'up' ? 'success.main' : 'error.main'}>
              {trend.value}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Filter tests based on active tab
  const filteredTests = getFilteredTests();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <Science sx={{ verticalAlign: 'middle', mr: 1 }} />
            Laboratory Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {profileData?.user?.name || user?.name}!
          </Typography>
          <Box display="flex" alignItems="center" mt={1} gap={2}>
            <Chip 
              icon={<VerifiedUser />} 
              label={`Employee ID: ${profileData?.profile?.employeeId || 'N/A'}`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<LocalHospital />} 
              label={profileData?.profile?.department || 'Department'} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              icon={<Schedule />} 
              label={`Shift: ${profileData?.profile?.shift || 'N/A'}`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={fetchDashboardData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Badge badgeContent={notifications.length} color="error" overlap="circular">
            <Tooltip title="Notifications">
              <IconButton 
                onClick={() => {
                  showSnackbar(`You have ${notifications.length} new notifications`, 'info');
                }}
              >
                <Notifications />
              </IconButton>
            </Tooltip>
          </Badge>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={(e) => setProfileMenuOpen(e.currentTarget)}
            sx={{ borderRadius: 2 }}
          >
            Profile
          </Button>
          <Menu
            anchorEl={profileMenuOpen}
            open={Boolean(profileMenuOpen)}
            onClose={() => setProfileMenuOpen(null)}
          >
            <MenuItem onClick={() => {
              console.log('Profile data:', profileData);
              showSnackbar('Profile details loaded', 'info');
              setProfileMenuOpen(null);
            }}>
              <Person sx={{ mr: 2 }} /> View Profile
            </MenuItem>
            <MenuItem onClick={() => {
              showSnackbar('Settings feature coming soon', 'info');
              setProfileMenuOpen(null);
            }}>
              <PendingActions sx={{ mr: 2 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}>
              <Error sx={{ mr: 2 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tests Assigned"
            value={dashboardData?.summary?.assignedToday || 0}
            icon={<Assignment color="primary" />}
            color="primary"
            subtext="Today"
            trend={{ direction: 'up', value: '+12% from yesterday' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tests"
            value={dashboardData?.summary?.pendingTests || 0}
            icon={<PendingActions color="warning" />}
            color="warning"
            subtext="Awaiting processing"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={dashboardData?.summary?.completedToday || 0}
            icon={<CheckCircle color="success" />}
            color="success"
            subtext="Tests completed"
            trend={{ direction: 'up', value: '+8% from yesterday' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Accuracy Rate"
            value={`${dashboardData?.summary?.accuracyRate || 0}%`}
            icon={<Analytics color="info" />}
            color="info"
            subtext="Overall accuracy"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Assigned Tests & Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                <MedicalServices sx={{ verticalAlign: 'middle', mr: 1 }} />
                Assigned Tests ({filteredTests.length})
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip 
                  label={`${assignedTests.length} total`} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Requested">Requested</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Priority</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {/* Search Bar */}
            <Box mb={3}>
              <TextField
                fullWidth
                placeholder="Search tests by name, patient, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <Error />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>

            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Requested" icon={<PendingActions />} iconPosition="start" />
              <Tab label="Processing" icon={<PlayArrow />} iconPosition="start" />
              <Tab label="Completed" icon={<CheckCircle />} iconPosition="start" />
              <Tab label="All" icon={<Assignment />} iconPosition="start" />
            </Tabs>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Details</TableCell>
                    <TableCell>Patient Info</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow 
                      key={test.id} 
                      hover
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&.MuiTableRow-root': {
                          borderLeft: test.priority === 'Critical' ? '4px solid #f44336' : 'none'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Science sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography fontWeight="bold" gutterBottom>
                              {test.testName}
                            </Typography>
                            {test.notes && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {test.notes.substring(0, 50)}...
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Doctor: {test.doctor?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">{test.patient?.name || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Age: {test.patient?.age || 'N/A'} • {test.patient?.gender || 'N/A'}
                        </Typography>
                        {test.patient?.bloodGroup && (
                          <Chip 
                            label={`Blood: ${test.patient.bloodGroup}`} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mt: 0.5 }} 
                          />
                        )}
                        {test.patient?.phone && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            📞 {test.patient.phone}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={test.priority} 
                          color={getPriorityColor(test.priority)}
                          size="small"
                          icon={test.priority === 'Critical' ? <PriorityHigh /> : undefined}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={test.status} 
                          color={getStatusColor(test.status)}
                          size="small"
                          variant="outlined"
                        />
                        {test.estimatedCompletion && test.status === 'Processing' && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            ⏰ Due: {formatDate(test.estimatedCompletion)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            🗓️ {test.assignedAt ? formatDate(test.assignedAt) : 'Not started'}
                          </Typography>
                          {test.completedAt && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ✅ Completed: {formatDate(test.completedAt)}
                            </Typography>
                          )}
                          {test.assignedAt && test.completedAt && (
                            <Typography variant="caption" color="success.main" display="block">
                              ⏱️ Time: {calculateCompletionTime(
                                parseISO(test.assignedAt), 
                                parseISO(test.completedAt)
                              )}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {test.status === 'Requested' && (
                            <Tooltip title="Start Test">
                              <Button
                                variant="contained"
                                size="small"
                                color="primary"
                                startIcon={<PlayArrow />}
                                onClick={() => handleStartTest(test)}
                                sx={{ minWidth: 'auto' }}
                              >
                                Start
                              </Button>
                            </Tooltip>
                          )}
                          
                          {test.status === 'Processing' && (
  <>
    <Tooltip title="Complete Test">
      <Button
        variant="contained"
        size="small"
        color="success"
        startIcon={<Done />}
        onClick={() => handleCompleteTest(test)}
        sx={{ minWidth: 'auto' }}
      >
        Complete
      </Button>
    </Tooltip>
    <Tooltip title="Complete test first to submit report">
      <Button
        variant="outlined"
        size="small"
        color="info"
        startIcon={<Report />}
        disabled
        sx={{ minWidth: 'auto' }}
      >
        Report
      </Button>
    </Tooltip>
  </>
)}

{test.status === 'Completed' && (
  <Tooltip title="Submit Report">
    <Button
      variant="outlined"
      size="small"
      color="info"
      startIcon={<Report />}
      onClick={() => handleSubmitReport(test)}
      sx={{ minWidth: 'auto' }}
    >
      Report
    </Button>
  </Tooltip>
)}
                          
                          {test.status === 'Completed' && (
                            <>
                              <Tooltip title="Download PDF">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleDownloadPDF(test.id)}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Share Report">
                                <IconButton 
                                  size="small" 
                                  color="secondary"
                                  onClick={() => handleShareReport(test.id)}
                                >
                                  <Share />
                                </IconButton>
                              </Tooltip>
                              
                            </>
                          )}
                          
                          <Tooltip title="More Options">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                setSelectedTest(test);
                                setAnchorEl(e.currentTarget);
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredTests.length === 0 && (
              <Box textAlign="center" py={6}>
                <Biotech sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tests found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 && "All tests have been started or completed."}
                  {activeTab === 1 && "No tests are currently being processed."}
                  {activeTab === 2 && "No tests have been completed yet."}
                  {activeTab === 3 && "No tests have been assigned to you yet."}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Performance Section */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                <Analytics sx={{ verticalAlign: 'middle', mr: 1 }} />
                Performance Overview
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={statsTimeRange}
                  onChange={(e) => setStatsTimeRange(e.target.value)}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Tests Conducted
                      </Typography>
                    </Box>
                    <Typography variant="h2" fontWeight="bold" color="primary">
                      {performanceData?.basicStats?.testsConducted || 0}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUp color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="success.main">
                        {dashboardData?.summary?.completedToday || 0} completed today
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (dashboardData?.summary?.completedToday || 0) * 10)} 
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <AccessTime color="info" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Avg. Completion Time
                      </Typography>
                    </Box>
                    <Typography variant="h2" fontWeight="bold" color="info">
                      {performanceData?.recentPerformance?.averageCompletionTime || 'N/A'}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <Schedule color="info" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="info.main">
                        {performanceData?.recentPerformance?.testsLast30Days || 0} tests last 30 days
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Department Stats */}
            {performanceData?.recentPerformance?.departmentStats && 
             performanceData.recentPerformance.departmentStats.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Most Frequent Tests
                </Typography>
                <Grid container spacing={2}>
                  {performanceData.recentPerformance.departmentStats.slice(0, 4).map((stat, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: '70%' }}>
                            {stat.testName}
                          </Typography>
                          <Chip label={stat.count} size="small" color="primary" />
                        </Box>
                        <Box display="flex" alignItems="center">
                          <AccessTime sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Avg: {stat.avgCompletionTime}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Priority Distribution */}
            {performanceData?.recentPerformance?.priorityStats && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Priority Distribution
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(performanceData.recentPerformance.priorityStats).map(([priority, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={priority}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2,
                          borderLeft: `4px solid ${
                            priority === 'Critical' ? '#f44336' :
                            priority === 'High' ? '#ff9800' :
                            priority === 'Medium' ? '#2196f3' : '#4caf50'
                          }`
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          {priority}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          tests
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Notifications & Recent Activity */}
        <Grid item xs={12} md={4}>
          {/* Notifications */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                <Notifications sx={{ verticalAlign: 'middle', mr: 1 }} />
                Recent Notifications
              </Typography>
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </Box>
            
            <List>
              {notifications.slice(0, 5).map((notification, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{ 
                      py: 1.5,
                      backgroundColor: notification.priority === 'Critical' ? 'error.light' : 'transparent',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: notification.priority === 'Critical' ? 'error.main' : 'primary.main',
                        color: 'white'
                      }}>
                        {notification.priority === 'Critical' ? <PriorityHigh /> : <Assignment />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="medium">
                          {notification.message}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(notification.assignedAt)}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <Chip 
                              label={notification.priority} 
                              size="small" 
                              color={getPriorityColor(notification.priority)}
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {notification.patientName}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && index < 4 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
              
              {notifications.length === 0 && (
                <Box textAlign="center" py={3}>
                  <Notifications sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              )}
            </List>
            
            {notifications.length > 5 && (
              <Button 
                fullWidth 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => showSnackbar('View all notifications feature coming soon', 'info')}
              >
                View All ({notifications.length})
              </Button>
            )}
          </Paper>

          {/* Recent Completed Tests */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              <History sx={{ verticalAlign: 'middle', mr: 1 }} />
              Recently Completed
            </Typography>
            
            <List>
              {dashboardData?.recentCompleted?.slice(0, 5).map((test, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    sx={{ 
                      py: 1.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                        <CheckCircle />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="medium">
                          {test.testName}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block" fontWeight="medium">
                            {test.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(test.completedAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip 
                      label={test.priority} 
                      size="small" 
                      color={getPriorityColor(test.priority)}
                      variant="outlined"
                    />
                  </ListItem>
                  {index < 4 && index < (dashboardData.recentCompleted.length - 1) && <Divider />}
                </React.Fragment>
              ))}
              
              {(!dashboardData?.recentCompleted || dashboardData.recentCompleted.length === 0) && (
                <Box textAlign="center" py={3}>
                  <CheckCircle sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No recently completed tests
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          {/* Quick Stats & Profile */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
              Your Profile Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Critical Tests
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {dashboardData?.summary?.criticalTests || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Experience
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {performanceData?.basicStats?.experience || 0}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      yrs
                    </Typography>
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Certified Tests
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success">
                    {performanceData?.basicStats?.certifiedTests || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Accuracy
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info">
                    {performanceData?.basicStats?.accuracyRate || 0}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Specialization
              </Typography>
              <Chip 
                label={profileData?.profile?.specialization || 'General'} 
                color="primary" 
                variant="outlined"
                sx={{ mr: 1 }}
              />
            </Box>
            
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                License Number
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {profileData?.profile?.licenseNumber || 'Not specified'}
              </Typography>
            </Box>
            
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Join Date
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {profileData?.profile?.joinDate ? format(new Date(profileData.profile.joinDate), 'MMM d, yyyy') : 'N/A'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogs */}
      {/* Start Test Dialog */}
      <Dialog open={startTestDialog} onClose={() => setStartTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PlayArrow sx={{ verticalAlign: 'middle', mr: 1 }} />
          Start Test Processing
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to start processing this test?
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {selectedTest?.testName}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Typography variant="body2" color="text.secondary">
                Patient: <strong>{selectedTest?.patient?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Doctor: <strong>{selectedTest?.doctor?.name}</strong>
              </Typography>
            </Box>
            <Box display="flex" gap={2} mt={1}>
              <Chip 
                label={selectedTest?.priority} 
                size="small" 
                color={getPriorityColor(selectedTest?.priority)} 
              />
              <Chip 
                label={selectedTest?.patient?.bloodGroup || 'No BG'} 
                size="small" 
                variant="outlined"
              />
            </Box>
            {selectedTest?.notes && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Notes:
                </Typography>
                <Typography variant="body2">
                  {selectedTest.notes}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" mt={2}>
            Starting the test will change its status to "Processing" and begin the completion timer.
            Estimated completion: <strong>2 hours from now</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartTestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmStartTest} startIcon={<PlayArrow />}>
            Start Processing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Test Dialog */}
      <Dialog open={completeTestDialog} onClose={() => setCompleteTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Done sx={{ verticalAlign: 'middle', mr: 1 }} />
          Complete Test
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Mark this test as completed:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="success.dark">
              {selectedTest?.testName}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Typography variant="body2">
                Patient: <strong>{selectedTest?.patient?.name}</strong>
              </Typography>
              <Typography variant="body2">
                Started: <strong>{formatDate(selectedTest?.assignedAt)}</strong>
              </Typography>
            </Box>
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                Test Duration:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {selectedTest?.assignedAt ? 
                  calculateCompletionTime(parseISO(selectedTest.assignedAt), new Date()) : 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={2}>
            This will update your performance statistics and allow you to submit the report.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteTestDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={confirmCompleteTest} startIcon={<Done />}>
            Mark as Completed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Report Dialog */}
      <Dialog open={submitReportDialog} onClose={() => setSubmitReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Report sx={{ verticalAlign: 'middle', mr: 1 }} />
          Submit Lab Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {selectedTest?.testName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient: {selectedTest?.patient?.name} • Age: {selectedTest?.patient?.age} • Gender: {selectedTest?.patient?.gender}
              {selectedTest?.patient?.bloodGroup && ` • Blood Group: ${selectedTest.patient.bloodGroup}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requested by: Dr. {selectedTest?.doctor?.name} • Department: {selectedTest?.doctor?.department}
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            margin="dense"
            label="Test Results *"
            fullWidth
            multiline
            rows={8}
            value={reportResult}
            onChange={(e) => setReportResult(e.target.value)}
            placeholder="Enter detailed test results here...

Example Report:
════════════════════════════════════════════════
HEMATOLOGY REPORT:
────────────────────────────────────────────────
• Hemoglobin: 14.2 g/dL (Normal range: 13.5-17.5)
• WBC Count: 7,800/μL (Normal range: 4,500-11,000)
• Platelets: 250,000/μL (Normal range: 150,000-450,000)
• RBC Count: 4.8 million/μL (Normal range: 4.5-5.9)
• Hematocrit: 42% (Normal range: 40-52%)

BIOCHEMISTRY:
────────────────────────────────────────────────
• Glucose: 98 mg/dL (Normal range: 70-100)
• Creatinine: 0.9 mg/dL (Normal range: 0.7-1.2)
• Urea: 25 mg/dL (Normal range: 15-40)

OBSERVATIONS:
────────────────────────────────────────────────
All parameters are within normal physiological limits.
No abnormalities detected.
Sample quality: Good
────────────────────────────────────────────────"
            helperText="Include all measurements, observations, and conclusions"
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Additional Notes"
            fullWidth
            multiline
            rows={3}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional observations, recommendations, or special considerations..."
            helperText="Optional notes for the doctor"
          />
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Note:</strong> After submitting, you can download the PDF report. This report will be sent to the requesting doctor and stored in the patient's medical records.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitReportDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={confirmSubmitReport} 
            disabled={!reportResult.trim()}
            startIcon={<Report />}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedTest?.status === 'Completed' && (
          <MenuItem onClick={() => {
            if (selectedTest) {
              handleDownloadPDF(selectedTest.id);
            }
            setAnchorEl(null);
          }}>
            <Download sx={{ mr: 2 }} fontSize="small" />
            Download PDF Report
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedTest) {
            handleShareReport(selectedTest.id);
          }
          setAnchorEl(null);
        }}>
          <Share sx={{ mr: 2 }} fontSize="small" />
          Share Report
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTest) {
            navigator.clipboard.writeText(selectedTest.id);
            showSnackbar('Test ID copied to clipboard');
          }
          setAnchorEl(null);
        }}>
          <ContentCopy sx={{ mr: 2 }} fontSize="small" />
          Copy Test ID
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTest) {
            handleViewReassignmentHistory(selectedTest.id);
          }
          setAnchorEl(null);
        }}>
          <History sx={{ mr: 2 }} fontSize="small" />
          View History
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          showSnackbar(`Patient: ${selectedTest?.patient?.name}`, 'info');
          setAnchorEl(null);
        }}>
          <Person sx={{ mr: 2 }} fontSize="small" />
          Patient Details
        </MenuItem>
        {selectedTest?.doctor?.name && (
          <MenuItem onClick={() => {
            showSnackbar(`Doctor: ${selectedTest.doctor.name}`, 'info');
            setAnchorEl(null);
          }}>
            <MedicalServices sx={{ mr: 2 }} fontSize="small" />
            Doctor Details
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LabTechDashboard;