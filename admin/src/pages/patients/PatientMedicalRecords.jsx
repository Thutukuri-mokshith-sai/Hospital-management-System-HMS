import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Button,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  ExpandMore,
  Download,
  Visibility,
  LocalPharmacy,
  Science,
  Assignment,
  MonitorHeart,
  History,
  CalendarToday,
  Person,
  TrendingUp,
  Warning,
  CheckCircle,
  Pending,
  Close,
  Refresh,
  FilterList,
  Search,
  PictureAsPdf,
  FileDownload
} from '@mui/icons-material';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/api';
// Color palettes for charts
const CHART_COLORS = {
  primary: '#4caf50',
  secondary: '#2196f3',
  tertiary: '#ff9800',
  danger: '#f44336',
  warning: '#ffc107',
  info: '#00bcd4',
  purple: '#9c27b0',
  pink: '#e91e63'
};

const STATUS_COLORS = {
  'Active': '#4caf50',
  'Completed': '#2196f3',
  'Pending': '#ff9800',
  'Administered': '#4caf50',
  'Requested': '#ff9800',
  'Processing': '#2196f3',
  'Paid': '#4caf50',
  'Cancelled': '#f44336',
  'Normal': '#4caf50',
  'High': '#ff9800',
  'Critical': '#f44336'
};

const PatientMedicalRecords = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState({
    prescriptions: true,
    labTests: true,
    vitals: true,
    medicalHistory: true
  });
  const [data, setData] = useState({
    prescriptions: [],
    labTests: [],
    vitals: [],
    medicalHistory: null,
    statistics: null
  });
  const [error, setError] = useState('');
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [vitalTrends, setVitalTrends] = useState([]);
  const [filterDate, setFilterDate] = useState({
    from: '',
    to: ''
  });
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const navigate = useNavigate();

  // Set up axios interceptor
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
  }, [navigate]);

  // Fetch all medical records data
  const fetchMedicalRecords = async () => {
    try {
      setError('');
      
      // Fetch prescriptions
      const prescriptionsResponse = await axios.get(`${BASE_URL}/patients/prescriptions`);
      if (prescriptionsResponse.data.success) {
        setData(prev => ({ ...prev, prescriptions: prescriptionsResponse.data.data }));
      }

      // Fetch lab tests
      const labTestsResponse = await axios.get(`${BASE_URL}/patients/lab-tests`);
      if (labTestsResponse.data.success) {
        setData(prev => ({ ...prev, labTests: labTestsResponse.data.data }));
      }

      // Fetch vitals
      const vitalsResponse = await axios.get(`${BASE_URL}/patients/vitals`);
      if (vitalsResponse.data.success) {
        setData(prev => ({ ...prev, vitals: vitalsResponse.data.data }));
        processVitalTrends(vitalsResponse.data.data);
      }

      // Fetch medical history summary
      const historyResponse = await axios.get(`${BASE_URL}/patients/medical-history`);
      if (historyResponse.data.success) {
        setData(prev => ({ 
          ...prev, 
          medicalHistory: historyResponse.data.data,
          statistics: historyResponse.data.data.statistics
        }));
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medical records');
      console.error('Medical records fetch error:', err);
    } finally {
      setLoading({
        prescriptions: false,
        labTests: false,
        vitals: false,
        medicalHistory: false
      });
    }
  };

  const processVitalTrends = (vitals) => {
    // Process last 7 days of vitals for trends
    const last7Days = vitals.slice(0, 7).reverse();
    const trends = last7Days.map(v => ({
      date: new Date(v.recordedAt).toLocaleDateString('en-US', { weekday: 'short' }),
      heartRate: v.heartRate,
      systolic: v.bloodPressure?.systolic,
      diastolic: v.bloodPressure?.diastolic,
      temperature: v.temperature,
      oxygen: v.oxygenSaturation
    }));
    setVitalTrends(trends);
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewDetails = (type, item) => {
    setDialogType(type);
    if (type === 'labTest') {
      setSelectedLabTest(item);
    } else if (type === 'prescription') {
      setSelectedPrescription(item);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLabTest(null);
    setSelectedPrescription(null);
  };

  const handleDownloadReport = async (labTestId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/patients/lab-reports/${labTestId}/download-pdf`,
        {
          responseType: 'blob' // Important for file downloads
        }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabReport_${labTestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Failed to download report');
    }
  };

  const handleViewReport = async (labTestId) => {
    try {
      setReportLoading(true);
      const response = await axios.get(`${BASE_URL}/patients/lab-reports/${labTestId}`);
      if (response.data.success) {
        setReportData(response.data.data);
        setReportDialogOpen(true);
      }
    } catch (err) {
      setError('Failed to fetch report details');
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportDialog = () => {
    setReportDialogOpen(false);
    setReportData(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSimpleDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Statistics cards
  const statCards = [
    {
      title: 'Total Prescriptions',
      value: data.statistics?.totalPrescriptions || 0,
      icon: <LocalPharmacy />,
      color: CHART_COLORS.primary,
      description: 'Active and completed'
    },
    {
      title: 'Lab Tests',
      value: data.statistics?.totalLabTests || 0,
      icon: <Science />,
      color: CHART_COLORS.secondary,
      description: 'Tests conducted'
    },
    {
      title: 'Vitals Records',
      value: data.statistics?.totalVitalsRecords || 0,
      icon: <MonitorHeart />,
      color: CHART_COLORS.danger,
      description: 'Health measurements'
    },
    {
      title: 'Medical Visits',
      value: data.statistics?.totalAppointments || 0,
      icon: <History />,
      color: CHART_COLORS.purple,
      description: 'Doctor appointments'
    }
  ];

  if (loading.medicalHistory) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Medical Records
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive view of your health history, prescriptions, lab tests, and vital signs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchMedicalRecords}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${stat.color}20 0%, ${alpha(stat.color, 0.05)} 100%)`,
                border: `1px solid ${alpha(stat.color, 0.2)}`,
                borderRadius: 3,
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 16px ${alpha(stat.color, 0.15)}`
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(stat.color, 0.2), color: stat.color }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="text.primary" gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tabs Section */}
      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Tab icon={<LocalPharmacy />} label="Prescriptions" />
          <Tab icon={<Science />} label="Lab Tests" />
          <Tab icon={<MonitorHeart />} label="Vital Signs" />
          <Tab icon={<History />} label="Medical History" />
          <Tab icon={<TrendingUp />} label="Health Trends" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Prescriptions Tab */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  All Prescriptions ({data.prescriptions.length})
                </Typography>
                <Chip 
                  label={`${data.prescriptions.filter(p => p.medicines?.some(m => m.administrationStatus === 'Pending')).length} Pending`} 
                  color="warning" 
                  size="small" 
                />
              </Box>

              {loading.prescriptions ? (
                <LinearProgress />
              ) : data.prescriptions.length === 0 ? (
                <Alert severity="info">No prescriptions found</Alert>
              ) : (
                <Grid container spacing={3}>
                  {data.prescriptions.map((prescription, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card sx={{ 
                        borderLeft: `4px solid ${STATUS_COLORS[prescription.medicines?.[0]?.administrationStatus || 'Pending']}`,
                        borderRadius: 2,
                        '&:hover': { boxShadow: 3 }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="600">
                                Dr. {prescription.doctorId?.userId?.name || 'Unknown Doctor'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(prescription.createdAt)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={prescription.medicines?.[0]?.administrationStatus || 'Pending'} 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(STATUS_COLORS[prescription.medicines?.[0]?.administrationStatus || 'Pending'], 0.1),
                                color: STATUS_COLORS[prescription.medicines?.[0]?.administrationStatus || 'Pending']
                              }}
                            />
                          </Box>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="body2" gutterBottom>
                            <strong>Medications:</strong>
                          </Typography>
                          <Box sx={{ ml: 2, mb: 2 }}>
                            {prescription.medicines?.slice(0, 2).map((med, medIndex) => (
                              <Typography key={medIndex} variant="body2" color="text.secondary">
                                • {med.name} - {med.dosage} ({med.frequency})
                              </Typography>
                            ))}
                            {prescription.medicines?.length > 2 && (
                              <Typography variant="body2" color="text.secondary">
                                • +{prescription.medicines.length - 2} more medications
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewDetails('prescription', prescription)}
                            >
                              View Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Lab Tests Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  Lab Tests & Reports ({data.labTests.length})
                </Typography>
                <Chip 
                  label={`${data.labTests.filter(t => t.status === 'Pending').length} Pending`} 
                  color="warning" 
                  size="small" 
                />
              </Box>

              {loading.labTests ? (
                <LinearProgress />
              ) : data.labTests.length === 0 ? (
                <Alert severity="info">No lab tests found</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell><strong>Test Name</strong></TableCell>
                        <TableCell><strong>Doctor</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Results</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.labTests.map((test, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{test.testName}</TableCell>
                          <TableCell>Dr. {test.doctorId?.userId?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(test.createdAt)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={test.status} 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(STATUS_COLORS[test.status] || '#666', 0.1),
                                color: STATUS_COLORS[test.status] || '#666'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {test.status === 'Completed' ? (
                              <Chip label="Available" color="success" size="small" />
                            ) : (
                              <Chip label="Pending" color="warning" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewDetails('labTest', test)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {test.status === 'Completed' && (
                                <Tooltip title="Download Report">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDownloadReport(test._id)}
                                  >
                                    <FileDownload fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Vital Signs Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  Vital Signs History ({data.vitals.length} records)
                </Typography>
              </Box>

              {loading.vitals ? (
                <LinearProgress />
              ) : data.vitals.length === 0 ? (
                <Alert severity="info">No vital signs recorded</Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Vital Signs Overview
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vitalTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="heartRate" 
                              name="Heart Rate (bpm)"
                              stroke={CHART_COLORS.danger} 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="systolic" 
                              name="Systolic BP"
                              stroke={CHART_COLORS.primary} 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Latest Reading
                      </Typography>
                      {data.vitals[0] && (
                        <Box>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(CHART_COLORS.danger, 0.1) }}>
                                <Typography variant="h4" color={CHART_COLORS.danger} fontWeight="bold">
                                  {data.vitals[0].heartRate || '--'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Heart Rate</Typography>
                                <Typography variant="caption">bpm</Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={6}>
                              <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(CHART_COLORS.primary, 0.1) }}>
                                <Typography variant="h4" color={CHART_COLORS.primary} fontWeight="bold">
                                  {data.vitals[0].bloodPressure ? 
                                    `${data.vitals[0].bloodPressure.systolic}/${data.vitals[0].bloodPressure.diastolic}` : '--/--'
                                  }
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Blood Pressure</Typography>
                                <Typography variant="caption">mmHg</Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={6}>
                              <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(CHART_COLORS.warning, 0.1) }}>
                                <Typography variant="h4" color={CHART_COLORS.warning} fontWeight="bold">
                                  {data.vitals[0].temperature || '--'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Temperature</Typography>
                                <Typography variant="caption">°F</Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={6}>
                              <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(CHART_COLORS.info, 0.1) }}>
                                <Typography variant="h4" color={CHART_COLORS.info} fontWeight="bold">
                                  {data.vitals[0].oxygenSaturation || '--'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Oxygen</Typography>
                                <Typography variant="caption">%</Typography>
                              </Card>
                            </Grid>
                          </Grid>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Recorded: {formatDate(data.vitals[0].recordedAt)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Recent Vital Signs Table */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Vital Signs
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date & Time</TableCell>
                              <TableCell align="right">Heart Rate</TableCell>
                              <TableCell align="right">Blood Pressure</TableCell>
                              <TableCell align="right">Temperature</TableCell>
                              <TableCell align="right">Oxygen</TableCell>
                              <TableCell>Recorded By</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.vitals.slice(0, 5).map((vital, index) => (
                              <TableRow key={index} hover>
                                <TableCell>{formatDate(vital.recordedAt)}</TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="medium">{vital.heartRate || '--'}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="medium">
                                    {vital.bloodPressure ? 
                                      `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}` : '--/--'
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="medium">{vital.temperature || '--'}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="medium">{vital.oxygenSaturation || '--'}</Typography>
                                </TableCell>
                                <TableCell>
                                  {vital.nurseId?.userId?.name || 'System'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* Medical History Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Complete Medical History
              </Typography>
              
              {data.medicalHistory ? (
                <Grid container spacing={3}>
                  {/* Summary Card */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: alpha(CHART_COLORS.primary, 0.05) }}>
                      <Typography variant="h6" gutterBottom>
                        Health Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Admission Status</Typography>
                          <Typography variant="h6" fontWeight="600">
                            {data.medicalHistory.patientInfo?.admissionStatus || 'Not Admitted'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Total Visits</Typography>
                          <Typography variant="h6" fontWeight="600">
                            {data.medicalHistory.statistics?.totalAppointments || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Prescriptions</Typography>
                          <Typography variant="h6" fontWeight="600">
                            {data.medicalHistory.statistics?.totalPrescriptions || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">Lab Tests</Typography>
                          <Typography variant="h6" fontWeight="600">
                            {data.medicalHistory.statistics?.totalLabTests || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Recent Appointments */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Appointments
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {data.medicalHistory.history?.appointments?.map((appointment, index) => (
                          <Accordion key={index} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ width: '100%' }}>
                                <Typography fontWeight="medium">
                                  Dr. {appointment.doctorId?.userId?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(appointment.date)}
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2">
                                <strong>Reason:</strong> {appointment.reason || 'General checkup'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Status:</strong> {appointment.status}
                              </Typography>
                              {appointment.notes && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <strong>Notes:</strong> {appointment.notes}
                                </Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                        {(!data.medicalHistory.history?.appointments || data.medicalHistory.history.appointments.length === 0) && (
                          <Alert severity="info">No appointment history</Alert>
                        )}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Recent Nursing Care */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Nursing Care
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {data.medicalHistory.history?.nursingCare?.map((care, index) => (
                          <Card key={index} sx={{ mb: 2, p: 2 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {care.careType}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              By: {care.nurseId?.userId?.name || 'Nurse'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {care.notes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(care.createdAt)}
                            </Typography>
                          </Card>
                        ))}
                        {(!data.medicalHistory.history?.nursingCare || data.medicalHistory.history.nursingCare.length === 0) && (
                          <Alert severity="info">No nursing care records</Alert>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">No medical history data available</Alert>
              )}
            </Box>
          )}

          {/* Health Trends Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Health Trends & Analytics
              </Typography>
              
              <Grid container spacing={3}>
                {/* Vital Trends Over Time */}
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Vital Signs Trends (Last 7 Days)
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={vitalTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area 
                            type="monotone" 
                            dataKey="heartRate" 
                            name="Heart Rate"
                            stroke={CHART_COLORS.danger} 
                            fill={CHART_COLORS.danger}
                            fillOpacity={0.3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="systolic" 
                            name="Systolic BP"
                            stroke={CHART_COLORS.primary} 
                            fill={CHART_COLORS.primary}
                            fillOpacity={0.3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="oxygen" 
                            name="Oxygen Level"
                            stroke={CHART_COLORS.info} 
                            fill={CHART_COLORS.info}
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                {/* Health Status Distribution */}
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Health Status Overview
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Normal', value: 75, color: CHART_COLORS.primary },
                              { name: 'Attention Needed', value: 15, color: CHART_COLORS.warning },
                              { name: 'Critical', value: 5, color: CHART_COLORS.danger },
                              { name: 'Excellent', value: 5, color: CHART_COLORS.info }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Normal', value: 75, color: CHART_COLORS.primary },
                              { name: 'Attention Needed', value: 15, color: CHART_COLORS.warning },
                              { name: 'Critical', value: 5, color: CHART_COLORS.danger },
                              { name: 'Excellent', value: 5, color: CHART_COLORS.info }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                {/* Activity Summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Activity Summary
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Medication Adherence', value: '92%', color: CHART_COLORS.primary },
                        { label: 'Appointment Attendance', value: '88%', color: CHART_COLORS.secondary },
                        { label: 'Lab Test Completion', value: '95%', color: CHART_COLORS.info },
                        { label: 'Follow-up Compliance', value: '85%', color: CHART_COLORS.purple }
                      ].map((item, index) => (
                        <Grid item xs={6} md={3} key={index}>
                          <Card sx={{ 
                            textAlign: 'center', 
                            p: 3,
                            bgcolor: alpha(item.color, 0.1),
                            border: `1px solid ${alpha(item.color, 0.2)}`
                          }}>
                            <Typography variant="h3" fontWeight="bold" color={item.color}>
                              {item.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.label}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Lab Test Details Dialog */}
      <Dialog 
        open={openDialog && dialogType === 'labTest'} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lab Test Details
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedLabTest && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600">Test Information</Typography>
                  <Typography><strong>Test Name:</strong> {selectedLabTest.testName}</Typography>
                  <Typography><strong>Type:</strong> {selectedLabTest.testType || 'General'}</Typography>
                  <Typography><strong>Status:</strong> {selectedLabTest.status}</Typography>
                  <Typography><strong>Requested By:</strong> Dr. {selectedLabTest.doctorId?.userId?.name || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600">Timeline</Typography>
                  <Typography><strong>Requested:</strong> {formatDate(selectedLabTest.createdAt)}</Typography>
                  {selectedLabTest.completedAt && (
                    <Typography><strong>Completed:</strong> {formatDate(selectedLabTest.completedAt)}</Typography>
                  )}
                </Grid>
                {selectedLabTest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="600">Doctor's Notes</Typography>
                    <Typography>{selectedLabTest.notes}</Typography>
                  </Grid>
                )}

                {/* Report Section */}
                {selectedLabTest.status === 'Completed' && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="600">Report</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                          variant="contained" 
                          startIcon={<Visibility />}
                          onClick={() => handleViewReport(selectedLabTest._id)}
                          disabled={reportLoading}
                        >
                          {reportLoading ? 'Loading...' : 'View Report'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          startIcon={<FileDownload />} 
                          onClick={() => handleDownloadReport(selectedLabTest._id)}
                        >
                          Download PDF
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Download the complete lab report in PDF format for your records.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Prescription Details Dialog */}
      <Dialog 
        open={openDialog && dialogType === 'prescription'} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Prescription Details
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedPrescription && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600">Prescription Information</Typography>
                  <Typography><strong>Prescribing Doctor:</strong> Dr. {selectedPrescription.doctorId?.userId?.name}</Typography>
                  <Typography><strong>Date:</strong> {formatDate(selectedPrescription.createdAt)}</Typography>
                  <Typography><strong>Status:</strong> {selectedPrescription.medicines?.[0]?.administrationStatus || 'Active'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600">Associated Appointment</Typography>
                  {selectedPrescription.appointmentId ? (
                    <>
                      <Typography><strong>Date:</strong> {formatDate(selectedPrescription.appointmentId.date)}</Typography>
                      <Typography><strong>Time:</strong> {selectedPrescription.appointmentId.time}</Typography>
                    </>
                  ) : (
                    <Typography>No associated appointment</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="600">Medications</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Medication</strong></TableCell>
                          <TableCell><strong>Dosage</strong></TableCell>
                          <TableCell><strong>Frequency</strong></TableCell>
                          <TableCell><strong>Duration</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPrescription.medicines?.map((medicine, index) => (
                          <TableRow key={index}>
                            <TableCell>{medicine.name}</TableCell>
                            <TableCell>{medicine.dosage}</TableCell>
                            <TableCell>{medicine.frequency}</TableCell>
                            <TableCell>{medicine.duration}</TableCell>
                            <TableCell>
                              <Chip 
                                label={medicine.administrationStatus} 
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(STATUS_COLORS[medicine.administrationStatus] || '#666', 0.1),
                                  color: STATUS_COLORS[medicine.administrationStatus] || '#666'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {selectedPrescription.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="600">Special Instructions</Typography>
                    <Typography>{selectedPrescription.instructions}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Lab Report Dialog */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={closeReportDialog} 
        maxWidth="lg" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lab Report Details
            </Typography>
            <IconButton onClick={closeReportDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {reportData ? (
            <Box>
              {!reportData.hasReport ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Report is not yet available. Please check back later.
                </Alert>
              ) : (
                <>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #eee', pb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      LABORATORY TEST REPORT
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hospital Management System
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Patient Info */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                          Patient Information
                        </Typography>
                        <Typography><strong>Name:</strong> {reportData.labTest.patientId?.userId?.name || 'N/A'}</Typography>
                        <Typography><strong>Age:</strong> {reportData.labTest.patientId?.age || 'N/A'}</Typography>
                        <Typography><strong>Gender:</strong> {reportData.labTest.patientId?.gender || 'N/A'}</Typography>
                        <Typography><strong>Blood Group:</strong> {reportData.labTest.patientId?.bloodGroup || 'N/A'}</Typography>
                      </Paper>
                    </Grid>

                    {/* Test Info */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                          Test Information
                        </Typography>
                        <Typography><strong>Test Name:</strong> {reportData.labTest.testName}</Typography>
                        <Typography><strong>Test ID:</strong> {reportData.labTest._id}</Typography>
                        <Typography><strong>Requested By:</strong> Dr. {reportData.labTest.doctorId?.userId?.name || 'N/A'}</Typography>
                        <Typography><strong>Report Date:</strong> {formatSimpleDate(reportData.labReport?.reportDate || new Date())}</Typography>
                      </Paper>
                    </Grid>

                    {/* Results */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, mt: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                          Test Results
                        </Typography>
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: alpha(CHART_COLORS.info, 0.05),
                          borderRadius: 2,
                          border: `1px solid ${alpha(CHART_COLORS.info, 0.2)}`
                        }}>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {reportData.labReport?.result || 'No results available'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Additional Notes */}
                    {reportData.labReport?.notes && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom color="primary">
                            Additional Notes
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {reportData.labReport.notes}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {/* Footer */}
                    <Grid item xs={12}>
                      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          This is an electronically generated report. For medical use only.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Generated on: {formatDate(new Date())}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {reportData?.hasReport && reportData.labTest && (
            <Button 
              variant="contained" 
              startIcon={<FileDownload />} 
              onClick={() => handleDownloadReport(reportData.labTest._id)}
            >
              Download PDF
            </Button>
          )}
          <Button onClick={closeReportDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientMedicalRecords;