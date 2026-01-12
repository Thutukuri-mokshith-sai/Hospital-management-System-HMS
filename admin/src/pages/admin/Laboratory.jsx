import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  Stack,
  LinearProgress,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Import icons individually
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import TimelineIcon from '@mui/icons-material/Timeline';
import ErrorIcon from '@mui/icons-material/Error';

import { BASE_URL } from '../../api/api';

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Laboratory = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [labTechs, setLabTechs] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Dialog states
  const [openTechDialog, setOpenTechDialog] = useState(false);
  const [openTestDialog, setOpenTestDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  
  // Form states
  const [currentLabTech, setCurrentLabTech] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
    department: 'Pathology',
    specialization: 'Blood Tests',
    licenseNumber: '',
    experience: 0,
    shift: 'Morning',
    isActive: true
  });

  const [currentTest, setCurrentTest] = useState({
    patientId: '',
    doctorId: '',
    testName: '',
    notes: '',
    priority: 'Medium'
  });

  const [currentAssignment, setCurrentAssignment] = useState({
    testId: '',
    labTechId: '',
    reason: ''
  });

  const [currentStatus, setCurrentStatus] = useState({
    testId: '',
    status: '',
    labTechId: '',
    estimatedCompletion: ''
  });

  const [currentReport, setCurrentReport] = useState({
    testId: '',
    result: '',
    findings: '',
    interpretation: '',
    recommendations: ''
  });

  // Filter states
  const [testFilters, setTestFilters] = useState({
    status: '',
    priority: '',
    labTechId: '',
    startDate: '',
    endDate: ''
  });

  const token = localStorage.getItem('token');

  // Color functions
  const getStatusColor = (status) => {
    const colors = {
      'Requested': '#3b82f6',
      'Processing': '#f59e0b',
      'Completed': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'Pathology': '#3b82f6',
      'Radiology': '#8b5cf6',
      'Biochemistry': '#ec4899',
      'Microbiology': '#10b981',
      'Hematology': '#ef4444',
      'General': '#6b7280'
    };
    return colors[department] || '#6b7280';
  };

  // Fetch data functions
  const fetchLabTechs = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab-techs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch lab technicians');
      const data = await res.json();
      setLabTechs(data.data || []);
    } catch (error) {
      console.error('Error fetching lab technicians:', error);
      setLabTechs([]);
    }
  }, [token]);

  const fetchLabTests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(testFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (search) params.append('search', search);

      const res = await fetch(`${BASE_URL}/admin/lab/tests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch lab tests');
      const data = await res.json();
      setLabTests(data.data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setLabTests([]);
    }
  }, [token, testFilters, search]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  }, [token]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  }, [token]);

  // Load data based on active tab
  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        switch (activeTab) {
          case 0: // Overview
            await Promise.all([
              fetchLabTechs(),
              fetchLabTests(),
              fetchAnalytics()
            ]);
            break;
          case 1: // Lab Technicians
            await fetchLabTechs();
            break;
          case 2: // Lab Tests
            await Promise.all([
              fetchLabTests(),
              fetchPatients(),
              fetchDoctors()
            ]);
            break;
          case 3: // Analytics
            await fetchAnalytics();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, refreshKey, fetchLabTechs, fetchLabTests, fetchPatients, fetchDoctors, fetchAnalytics]);

  // Calculate dashboard stats
  const dashboardStats = React.useMemo(() => {
    const totalTests = labTests.length;
    const completedTests = labTests.filter(t => t.status === 'Completed').length;
    const pendingTests = labTests.filter(t => t.status === 'Requested').length;
    const processingTests = labTests.filter(t => t.status === 'Processing').length;
    
    const totalLabTechs = labTechs.length;
    const activeLabTechs = labTechs.filter(t => t.labTech?.isActive).length;

    return {
      totalTests,
      completedTests,
      pendingTests,
      processingTests,
      totalLabTechs,
      activeLabTechs,
      completionRate: totalTests > 0 ? (completedTests / totalTests * 100).toFixed(1) : 0,
      avgTurnaroundTime: '3.2 hours' // This would come from analytics API
    };
  }, [labTests, labTechs]);

  // Handler functions
  const handleCreateLabTech = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab-techs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentLabTech)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create lab technician');
      }

      setOpenTechDialog(false);
      setRefreshKey(prev => prev + 1);
      setCurrentLabTech({
        name: '',
        email: '',
        password: '',
        phone: '',
        employeeId: '',
        department: 'Pathology',
        specialization: 'Blood Tests',
        licenseNumber: '',
        experience: 0,
        shift: 'Morning',
        isActive: true
      });
    } catch (error) {
      console.error('Error creating lab technician:', error);
      alert(error.message);
    }
  };

  const handleCreateLabTest = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentTest)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create lab test');
      }

      setOpenTestDialog(false);
      setRefreshKey(prev => prev + 1);
      setCurrentTest({
        patientId: '',
        doctorId: '',
        testName: '',
        notes: '',
        priority: 'Medium'
      });
    } catch (error) {
      console.error('Error creating lab test:', error);
      alert(error.message);
    }
  };

  const handleAssignLabTech = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab-techs/tests/${currentAssignment.testId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          labTechId: currentAssignment.labTechId,
          reason: currentAssignment.reason
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign lab technician');
      }

      setOpenAssignDialog(false);
      setRefreshKey(prev => prev + 1);
      setCurrentAssignment({
        testId: '',
        labTechId: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error assigning lab technician:', error);
      alert(error.message);
    }
  };

  const handleUpdateTestStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab/tests/${currentStatus.testId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: currentStatus.status,
          labTechId: currentStatus.labTechId || undefined,
          estimatedCompletion: currentStatus.estimatedCompletion || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update test status');
      }

      setOpenStatusDialog(false);
      setRefreshKey(prev => prev + 1);
      setCurrentStatus({
        testId: '',
        status: '',
        labTechId: '',
        estimatedCompletion: ''
      });
    } catch (error) {
      console.error('Error updating test status:', error);
      alert(error.message);
    }
  };

  const handleSubmitReport = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab/tests/${currentReport.testId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Completed',
          result: currentReport.result,
          findings: currentReport.findings,
          interpretation: currentReport.interpretation,
          recommendations: currentReport.recommendations
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit report');
      }

      setOpenReportDialog(false);
      setRefreshKey(prev => prev + 1);
      setCurrentReport({
        testId: '',
        result: '',
        findings: '',
        interpretation: '',
        recommendations: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error.message);
    }
  };

  const handleDeleteLabTech = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lab technician?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/lab-techs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete lab technician');
      }

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting lab technician:', error);
      alert(error.message);
    }
  };

  const handleToggleLabTechStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/lab-techs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating lab technician status:', error);
      alert(error.message);
    }
  };

  // Dialog openers
  const openCreateTestDialog = () => {
    setCurrentTest({
      patientId: '',
      doctorId: '',
      testName: '',
      notes: '',
      priority: 'Medium'
    });
    setOpenTestDialog(true);
  };

  const openAssignDialogForTest = (testId) => {
    setCurrentAssignment({
      testId,
      labTechId: '',
      reason: ''
    });
    setOpenAssignDialog(true);
  };

  const openStatusDialogForTest = (testId, currentStatus) => {
    setCurrentStatus({
      testId,
      status: currentStatus === 'Requested' ? 'Processing' : 'Completed',
      labTechId: '',
      estimatedCompletion: ''
    });
    setOpenStatusDialog(true);
  };

  const openReportDialogForTest = (testId) => {
    setCurrentReport({
      testId,
      result: '',
      findings: '',
      interpretation: '',
      recommendations: ''
    });
    setOpenReportDialog(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <ScienceIcon sx={{ fontSize: 36 }} />
          Laboratory Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage lab technicians, tests, reports, and laboratory operations
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            },
            '& .Mui-selected': {
              color: '#667eea !important'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea'
            }
          }}
        >
          <Tab icon={<BarChartIcon />} label="Dashboard" />
          <Tab icon={<GroupIcon />} label="Lab Technicians" />
          <Tab icon={<ScienceIcon />} label="Lab Tests" />
          <Tab icon={<TimelineIcon />} label="Analytics" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Tests
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardStats.totalTests}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {dashboardStats.completedTests} completed
                      </Typography>
                    </Box>
                  </Box>
                  <ScienceIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Pending Tests
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardStats.pendingTests}
                    </Typography>
                    <Typography variant="caption">
                      {dashboardStats.processingTests} in progress
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Lab Technicians
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardStats.totalLabTechs}
                    </Typography>
                    <Typography variant="caption">
                      {dashboardStats.activeLabTechs} active
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Completion Rate
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {dashboardStats.completionRate}%
                    </Typography>
                    <Typography variant="caption">
                      Avg: {dashboardStats.avgTurnaroundTime}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={dashboardStats.completionRate} 
                  sx={{ 
                    mt: 2, 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalHospitalIcon /> Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenTechDialog(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Add Lab Technician
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateTestDialog}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }}
              >
                Create Lab Test
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AssignmentIcon />}
                onClick={() => setActiveTab(2)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                }}
              >
                View All Tests
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<BarChartIcon />}
                onClick={() => setActiveTab(3)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                }}
              >
                View Analytics
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Recent Tests */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScienceIcon /> Recent Lab Tests
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labTests.slice(0, 5).map((test) => (
                      <TableRow key={test._id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{test.testName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {test.patientId?.userId?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(test.status), 0.1),
                              color: getStatusColor(test.status),
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.priority}
                            size="small"
                            sx={{
                              bgcolor: alpha(getPriorityColor(test.priority), 0.1),
                              color: getPriorityColor(test.priority),
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(test.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon /> Active Lab Technicians
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {labTechs.filter(tech => tech.labTech?.isActive).slice(0, 5).map((tech) => (
                    <React.Fragment key={tech.user?.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getDepartmentColor(tech.labTech?.department) }}>
                            {tech.user?.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography fontWeight={500}>
                              {tech.user?.name}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScienceIcon sx={{ fontSize: 14 }} />
                                {tech.labTech?.department}
                              </Typography>
                              <Chip
                                label={tech.labTech?.employeeId}
                                size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Lab Technicians Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search lab technicians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              width: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenTechDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Add Technician
            </Button>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {labTechs.map((tech) => (
              <Grid item xs={12} sm={6} md={4} key={tech.user?.id}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getDepartmentColor(tech.labTech?.department),
                          width: 56,
                          height: 56,
                          mr: 2
                        }}
                      >
                        {tech.user?.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {tech.user?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tech.user?.email}
                        </Typography>
                        <Chip
                          label={tech.labTech?.employeeId}
                          size="small"
                          sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Box>
                        <Switch
                          checked={tech.labTech?.isActive}
                          onChange={() => handleToggleLabTechStatus(tech.labTech._id, tech.labTech?.isActive)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Chip
                          label={tech.labTech?.department}
                          size="small"
                          sx={{
                            mt: 0.5,
                            bgcolor: alpha(getDepartmentColor(tech.labTech?.department), 0.1),
                            color: getDepartmentColor(tech.labTech?.department)
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Specialization
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tech.labTech?.specialization}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Shift
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tech.labTech?.shift}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Experience
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tech.labTech?.experience} years
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tests Conducted
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {tech.labTech?.testsConducted || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Accuracy Rate
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="#10b981">
                          {tech.labTech?.accuracyRate || 0}%
                        </Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteLabTech(tech.labTech._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Lab Tests Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                width: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Filter
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateTestDialog}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Create Test
              </Button>
            </Stack>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={testFilters.status}
                    label="Status"
                    onChange={(e) => setTestFilters({ ...testFilters, status: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Requested">Requested</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={testFilters.priority}
                    label="Priority"
                    onChange={(e) => setTestFilters({ ...testFilters, priority: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lab Technician</InputLabel>
                  <Select
  value={currentAssignment.labTechId}
  onChange={(e) =>
    setCurrentAssignment({
      ...currentAssignment,
      labTechId: e.target.value
    })
  }
>
  {labTechs.map((tech) => (
    <MenuItem
      key={tech.user._id}
      value={tech.user._id}   // ✅ USER ID ONLY
    >
      {tech.user.name} ({tech.labTech.employeeId})
    </MenuItem>
  ))}
</Select>

                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setTestFilters({
                        status: '',
                        priority: '',
                        labTechId: '',
                        startDate: '',
                        endDate: ''
                      });
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    startIcon={<RefreshIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Test Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labTests.map((test) => (
                  <TableRow key={test._id} hover>
                    <TableCell>
                      <Box>
                        <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                          {test.testName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {test.notes}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {test.patientId?.userId?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {test.doctorId?.userId?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.status}
                        size="small"
                        icon={
                          test.status === 'Completed' ? <CheckCircleIcon /> :
                          test.status === 'Processing' ? <AccessTimeIcon /> :
                          <PendingIcon />
                        }
                        sx={{
                          bgcolor: alpha(getStatusColor(test.status), 0.1),
                          color: getStatusColor(test.status),
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.priority}
                        size="small"
                        icon={<PriorityHighIcon />}
                        sx={{
                          bgcolor: alpha(getPriorityColor(test.priority), 0.1),
                          color: getPriorityColor(test.priority),
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(test.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {test.status === 'Requested' && (
                          <>
                            <Tooltip title="Assign Technician">
                              <IconButton
                                size="small"
                                onClick={() => openAssignDialogForTest(test._id)}
                                sx={{ color: '#3b82f6' }}
                              >
                                <AssignmentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Start Processing">
                              <IconButton
                                size="small"
                                onClick={() => openStatusDialogForTest(test._id, test.status)}
                                sx={{ color: '#f59e0b' }}
                              >
                                <ScheduleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {test.status === 'Processing' && (
                          <Tooltip title="Complete Test">
                            <IconButton
                              size="small"
                              onClick={() => openReportDialogForTest(test._id)}
                              sx={{ color: '#10b981' }}
                            >
                              <AssignmentTurnedInIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {test.status === 'Completed' && (
                          <Tooltip title="View Report">
                            <IconButton
                              size="small"
                              sx={{ color: '#8b5cf6' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={3}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Tests
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#3b82f6' }}>
                      {analytics.summary?.totalTests || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScienceIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                      <Typography variant="body2">
                        {analytics.summary?.testsCompleted || 0} completed
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Completion Rate
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#10b981' }}>
                      {analytics.summary?.overallCompletionRate || 0}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={analytics.summary?.overallCompletionRate || 0}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: alpha('#10b981', 0.1),
                        '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                      }} 
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Avg Turnaround Time
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#f59e0b' }}>
                      {analytics.summary?.avgTurnaroundTime || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                      <Typography variant="body2">Average completion time</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Pending Tests
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#ef4444' }}>
                      {analytics.summary?.testsPending || 0}
                    </Typography>
                    <Typography variant="body2" color="error">
                      {analytics.alerts?.delayedTests || 0} delayed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Department Performance */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon /> Department Performance
              </Typography>
              <Grid container spacing={3}>
                {analytics.departmentPerformance?.map((dept) => (
                  <Grid item xs={12} sm={6} md={4} key={dept.department}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getDepartmentColor(dept.department),
                              mr: 1.5
                            }}
                          />
                          <Typography variant="h6" fontWeight={600}>
                            {dept.department}
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Tests
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {dept.totalTests}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Completion Rate
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="#10b981">
                              {dept.completionRate}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Time
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {dept.avgTime}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Completed
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {dept.completed}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Top Performing Technicians */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> Top Performing Technicians
              </Typography>
              <Grid container spacing={3}>
                {analytics.topPerformingTechs?.slice(0, 3).map((tech, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: getDepartmentColor(tech.department), mr: 2 }}>
                            {tech.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{tech.name}</Typography>
                            <Chip
                              label={tech.department}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(getDepartmentColor(tech.department), 0.1),
                                color: getDepartmentColor(tech.department)
                              }}
                            />
                          </Box>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Tests Completed
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                              {tech.testsCompleted}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Accuracy Rate
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="#10b981">
                              {tech.accuracyRate}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No analytics data available. Please check back later.
          </Alert>
        )}
      </TabPanel>

      {/* Dialogs */}
      
      {/* Create Lab Technician Dialog */}
      <Dialog open={openTechDialog} onClose={() => setOpenTechDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Lab Technician</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              value={currentLabTech.name}
              onChange={(e) => setCurrentLabTech({ ...currentLabTech, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={currentLabTech.email}
              onChange={(e) => setCurrentLabTech({ ...currentLabTech, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={currentLabTech.password}
              onChange={(e) => setCurrentLabTech({ ...currentLabTech, password: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={currentLabTech.phone}
              onChange={(e) => setCurrentLabTech({ ...currentLabTech, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Employee ID"
              value={currentLabTech.employeeId}
              onChange={(e) => setCurrentLabTech({ ...currentLabTech, employeeId: e.target.value })}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={currentLabTech.department}
                    label="Department"
                    onChange={(e) => setCurrentLabTech({ ...currentLabTech, department: e.target.value })}
                  >
                    <MenuItem value="Pathology">Pathology</MenuItem>
                    <MenuItem value="Radiology">Radiology</MenuItem>
                    <MenuItem value="Biochemistry">Biochemistry</MenuItem>
                    <MenuItem value="Microbiology">Microbiology</MenuItem>
                    <MenuItem value="Hematology">Hematology</MenuItem>
                    <MenuItem value="General">General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={currentLabTech.specialization}
                    label="Specialization"
                    onChange={(e) => setCurrentLabTech({ ...currentLabTech, specialization: e.target.value })}
                  >
                    <MenuItem value="Blood Tests">Blood Tests</MenuItem>
                    <MenuItem value="X-Ray">X-Ray</MenuItem>
                    <MenuItem value="MRI">MRI</MenuItem>
                    <MenuItem value="CT Scan">CT Scan</MenuItem>
                    <MenuItem value="Urine Analysis">Urine Analysis</MenuItem>
                    <MenuItem value="Tissue Analysis">Tissue Analysis</MenuItem>
                    <MenuItem value="General">General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="License Number"
                  value={currentLabTech.licenseNumber}
                  onChange={(e) => setCurrentLabTech({ ...currentLabTech, licenseNumber: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={currentLabTech.experience}
                  onChange={(e) => setCurrentLabTech({ ...currentLabTech, experience: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Shift</InputLabel>
              <Select
                value={currentLabTech.shift}
                label="Shift"
                onChange={(e) => setCurrentLabTech({ ...currentLabTech, shift: e.target.value })}
              >
                <MenuItem value="Morning">Morning</MenuItem>
                <MenuItem value="Evening">Evening</MenuItem>
                <MenuItem value="Night">Night</MenuItem>
                <MenuItem value="Rotating">Rotating</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTechDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateLabTech}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Create Technician
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Lab Test Dialog */}
      <Dialog open={openTestDialog} onClose={() => setOpenTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Lab Test</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select
                value={currentTest.patientId}
                label="Patient"
                onChange={(e) => setCurrentTest({ ...currentTest, patientId: e.target.value })}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.user?.id} value={patient.user?.id}>
                    {patient.user?.name} ({patient.user?.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={currentTest.doctorId}
                label="Doctor"
                onChange={(e) => setCurrentTest({ ...currentTest, doctorId: e.target.value })}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                    Dr. {doctor.user?.name} ({doctor.doctor?.specialization})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Test Name"
              value={currentTest.testName}
              onChange={(e) => setCurrentTest({ ...currentTest, testName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notes"
              value={currentTest.notes}
              onChange={(e) => setCurrentTest({ ...currentTest, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={currentTest.priority}
                label="Priority"
                onChange={(e) => setCurrentTest({ ...currentTest, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateLabTest}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Create Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Lab Technician Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Assign Lab Technician</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Lab Technician</InputLabel>
              
<Select
  value={currentAssignment.labTechId}
  label="Lab Technician"
  onChange={(e) =>
    setCurrentAssignment({
      ...currentAssignment,
      labTechId: e.target.value
    })
  }
>
  {labTechs
    .filter(tech => tech.labTech?.isActive)
    .map((tech) => (
      <MenuItem
        key={tech.labTech._id}
        value={tech.labTech._id}  // This should be the LabTech._id
      >
        {tech.user.name} – {tech.labTech.specialization} ({tech.labTech.department})
      </MenuItem>
    ))}
</Select>
            </FormControl>

            <TextField
              label="Reason for Assignment"
              value={currentAssignment.reason}
              onChange={(e) => setCurrentAssignment({ ...currentAssignment, reason: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignLabTech}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Test Status Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Update Test Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={currentStatus.status}
                label="Status"
                onChange={(e) => setCurrentStatus({ ...currentStatus, status: e.target.value })}
              >
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
            {currentStatus.status === 'Processing' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Assign to Technician</InputLabel>
                  <Select
                    value={currentStatus.labTechId}
                    label="Assign to Technician"
                    onChange={(e) => setCurrentStatus({ ...currentStatus, labTechId: e.target.value })}
                  >
                    {labTechs.filter(tech => tech.labTech?.isActive).map((tech) => (
                      <MenuItem key={tech.user?.id} value={tech.user?.id}>
                        {tech.user?.name} - {tech.labTech?.department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Estimated Completion Time"
                  type="datetime-local"
                  value={currentStatus.estimatedCompletion}
                  onChange={(e) => setCurrentStatus({ ...currentStatus, estimatedCompletion: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateTestStatus}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Submit Lab Test Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Results"
              value={currentReport.result}
              onChange={(e) => setCurrentReport({ ...currentReport, result: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder="Enter test results here..."
            />
            <TextField
              label="Findings"
              value={currentReport.findings}
              onChange={(e) => setCurrentReport({ ...currentReport, findings: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Key findings from the test..."
            />
            <TextField
              label="Interpretation"
              value={currentReport.interpretation}
              onChange={(e) => setCurrentReport({ ...currentReport, interpretation: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Interpretation of the results..."
            />
            <TextField
              label="Recommendations"
              value={currentReport.recommendations}
              onChange={(e) => setCurrentReport({ ...currentReport, recommendations: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Recommendations for next steps..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenReportDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReport}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Laboratory;