import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Tooltip,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  History as HistoryIcon,
  CalendarToday,
  Person,
  MedicalServices,
  TrendingUp,
  AccessTime,
  Refresh,
  DateRange,
  Assignment,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  Analytics,
  ContentCopy,
  Share,
  Print
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, subDays, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

const BASE_URL = 'http://localhost:5000/api/v1';

const LabTechHistory = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    avgCompletionTimeHours: 0
  });

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchHistory();
    fetchProfileData();
  }, [page, rowsPerPage, startDate, endDate]); // Added date dependencies

  useEffect(() => {
    filterTests();
  }, [searchTerm, priorityFilter, tests]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/labtech/me');
      setProfileData(response.data.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labtech/history', {
        // params: {
        //   page: page + 1,
        //   limit: rowsPerPage,
        //   startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        //   endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
        // }
      });
      
      console.log('History API Response:', response.data);
      
      if (response.data.success) {
        const testsData = response.data.data || [];
        setTests(testsData);
        setFilteredTests(testsData);
        
        // Set pagination info from API
        if (response.data.pagination) {
          setPaginationInfo({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            pages: response.data.pagination.pages
          });
        }
        
        // Set stats from API
        if (response.data.stats) {
          setStats({
            totalCompleted: response.data.stats.totalCompleted || 0,
            avgCompletionTimeHours: response.data.stats.avgCompletionTimeHours || 0
          });
        }
      } else {
        showSnackbar(response.data.message || 'Failed to load test history', 'error');
        setTests([]);
        setFilteredTests([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      showSnackbar(error.response?.data?.message || 'Failed to load test history', 'error');
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestDetails = async (testId) => {
    try {
      setDetailLoading(true);
      // Using the reassignment history endpoint which includes test details
      const response = await api.get(`/labtech/tests/${testId}/history`);
      console.log('Test details response:', response.data);
      
      if (response.data.success) {
        setSelectedTest({
          id: testId,
          ...response.data.data
        });
      } else {
        // Fallback: find test in current list
        const testFromHistory = tests.find(test => test.id === testId);
        if (testFromHistory) {
          setSelectedTest(testFromHistory);
        } else {
          showSnackbar('Test details not found', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      // Fallback to basic test info
      const testFromHistory = tests.find(test => test.id === testId);
      if (testFromHistory) {
        setSelectedTest(testFromHistory);
      } else {
        showSnackbar('Failed to load test details', 'error');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = [...tests];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(test =>
        test.testName?.toLowerCase().includes(term) ||
        (test.patientName || '').toLowerCase().includes(term) ||
        (test.doctorName || '').toLowerCase().includes(term)
      );
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(test => test.priority === priorityFilter);
    }
    
    setFilteredTests(filtered);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when rows per page changes
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const viewTestDetails = async (test) => {
    await fetchTestDetails(test.id);
    setDetailDialog(true);
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
      
      showSnackbar('PDF report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showSnackbar('No PDF report available or download failed', 'error');
    }
  };

  const handleViewReassignmentHistory = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/history`);
      if (response.data.success) {
        // Show reassignment history in a dialog or snackbar
        const history = response.data.data.reassignmentHistory || [];
        const message = history.length > 0 
          ? `Found ${history.length} reassignment records` 
          : 'No reassignment history found';
        showSnackbar(message, 'info');
      } else {
        showSnackbar(response.data.message || 'No reassignment history', 'info');
      }
    } catch (error) {
      console.error('Error fetching reassignment history:', error);
      showSnackbar('No reassignment history found', 'info');
    }
  };

  const handleDateFilterApply = () => {
    setPage(0); // Reset to first page when applying date filter
    fetchHistory();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setPriorityFilter('all');
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setPage(0);
    fetchHistory();
  };

  const handleQuickFilter = (days) => {
    setStartDate(subDays(new Date(), days));
    setEndDate(new Date());
    setPage(0);
    fetchHistory();
  };

  const handleCopyTestId = (testId) => {
    navigator.clipboard.writeText(testId);
    showSnackbar('Test ID copied to clipboard', 'success');
  };

  const calculateFilteredStats = () => {
    // Calculate priority distribution for filtered tests
    const priorityCounts = filteredTests.reduce((acc, test) => {
      if (test.priority) {
        acc[test.priority] = (acc[test.priority] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate completion time for filtered tests (if not provided by API)
    let avgCompletionHours = stats.avgCompletionTimeHours;
    if (filteredTests.length > 0) {
      const completedTests = filteredTests.filter(test => test.completedAt && test.assignedAt);
      if (completedTests.length > 0) {
        const totalHours = completedTests.reduce((sum, test) => {
          const assignedDate = new Date(test.assignedAt);
          const completedDate = new Date(test.completedAt);
          const diffHours = (completedDate - assignedDate) / (1000 * 60 * 60);
          return sum + diffHours;
        }, 0);
        avgCompletionHours = totalHours / completedTests.length;
      }
    }

    return {
      totalFiltered: filteredTests.length,
      avgCompletionTime: avgCompletionHours.toFixed(2),
      priorityCounts
    };
  };

  const filteredStats = calculateFilteredStats();

  const renderStatsCard = (title, value, icon, color = 'primary', subtext = '', tooltip = '') => (
    <Tooltip title={tooltip} arrow>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: `${color}.light`, mr: 2 }}>
              {icon}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {value}
              </Typography>
              {subtext && (
                <Typography variant="caption" color="text.secondary">
                  {subtext}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Test History & Analytics
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View completed tests, download reports, and analyze performance
              {profileData?.profile?.employeeId && (
                <Chip 
                  label={`Employee ID: ${profileData.profile.employeeId}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchHistory}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                // Export functionality
                showSnackbar('Export feature coming soon', 'info');
              }}
            >
              Export Data
            </Button>
          </Box>
        </Box>

        {/* Quick Filter Buttons */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Quick Filters:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleQuickFilter(7)}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleQuickFilter(30)}
            >
              Last 30 Days
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => handleQuickFilter(90)}
            >
              Last 90 Days
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                setStartDate(startOfMonth);
                setEndDate(new Date());
                setPage(0);
                fetchHistory();
              }}
            >
              This Month
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatsCard(
              "Total Completed Tests",
              stats.totalCompleted || 0,
              <CheckCircle color="success" />,
              'success',
              `Showing ${filteredTests.length} in current view`,
              "Total completed tests in selected date range"
            )}
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            {renderStatsCard(
              "Average Completion Time",
              `${stats.avgCompletionTimeHours?.toFixed(2) || '0.00'}h`,
              <AccessTime color="info" />,
              'info',
              "Based on selected date range",
              "Average time to complete tests (hours)"
            )}
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            {renderStatsCard(
              "Current Page Tests",
              filteredTests.length,
              <HistoryIcon color="primary" />,
              'primary',
              `Page ${page + 1} of ${paginationInfo.pages}`,
              "Tests displayed on current page"
            )}
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            {renderStatsCard(
              "Total Pages",
              paginationInfo.pages,
              <Assignment color="warning" />,
              'warning',
              `${paginationInfo.total} total tests`,
              "Total number of pages based on filters"
            )}
          </Grid>
        </Grid>

        {/* Date Range Display */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Currently showing data from: 
            <Typography component="span" variant="body2" fontWeight="bold" sx={{ ml: 1 }}>
              {formatShortDate(startDate)} to {formatShortDate(endDate)}
            </Typography>
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {stats.totalCompleted} completed tests • {stats.avgCompletionTimeHours?.toFixed(2) || '0.00'}h average completion time
            </Typography>
          </Box>
        </Paper>

        {/* Priority Distribution */}
        {Object.keys(filteredStats.priorityCounts).length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Priority Distribution (Current View)
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {Object.entries(filteredStats.priorityCounts).map(([priority, count]) => (
                <Chip
                  key={priority}
                  label={`${priority}: ${count}`}
                  color={getPriorityColor(priority)}
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search tests, patients, doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                maxDate={endDate}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={startDate}
                maxDate={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Box display="flex" gap={1}>
                <Tooltip title="Apply Date Filter">
                  <Button
                    variant="contained"
                    onClick={handleDateFilterApply}
                    fullWidth
                    disabled={loading}
                  >
                    <DateRange />
                  </Button>
                </Tooltip>
                <Tooltip title="Clear All Filters">
                  <Button
                    variant="outlined"
                    onClick={handleResetFilters}
                    fullWidth
                    disabled={loading}
                  >
                    <FilterList />
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tests Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Test History ({filteredTests.length} tests found in current view)
            </Typography>
            {loading && (
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}
          </Box>
          
          {loading ? (
            <Box p={4} textAlign="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Loading test history...
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Details</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Box>
                            <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No tests found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {searchTerm || priorityFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No test history available for the selected period'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTests.map((test) => (
                        <TableRow key={test.id} hover>
                          <TableCell>
                            <Box>
                              <Box display="flex" alignItems="center" mb={1}>
                                <MedicalServices sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography fontWeight="medium">
                                  {test.testName}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                ID: {test.id?.slice(-8)}
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCopyTestId(test.id)}
                                  sx={{ ml: 0.5, padding: 0 }}
                                >
                                  <ContentCopy fontSize="inherit" />
                                </IconButton>
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Person sx={{ mr: 1, color: 'text.secondary' }} />
                              <Box>
                                <Typography>{test.patientName || 'N/A'}</Typography>
                                {test.hasReport && (
                                  <Typography variant="caption" color="success.main" display="block">
                                    ✓ Report Available
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography>{test.doctorName || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={test.priority || 'N/A'} 
                              color={getPriorityColor(test.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="block">
                                <strong>Assigned:</strong> {formatShortDate(test.assignedAt)}
                              </Typography>
                              <Typography variant="caption" display="block">
                                <strong>Completed:</strong> {formatShortDate(test.completedAt)}
                              </Typography>
                              {test.assignedAt && test.completedAt && (
                                <Typography variant="caption" color="primary" display="block">
                                  Duration: {(
                                    (new Date(test.completedAt) - new Date(test.assignedAt)) / 
                                    (1000 * 60 * 60)
                                  ).toFixed(2)}h
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="Completed" 
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => viewTestDetails(test)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download PDF Report">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDownloadPDF(test.id)}
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Assignment History">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleViewReassignmentHistory(test.id)}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 50]}
                component="div"
                count={paginationInfo.total || filteredTests.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Tests per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            </>
          )}
        </Paper>

        {/* Test Details Dialog */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          {detailLoading ? (
            <Box p={4} textAlign="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Loading test details...
              </Typography>
            </Box>
          ) : selectedTest ? (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center">
                  <MedicalServices sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6">{selectedTest.testName || 'Test Details'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Test ID: {selectedTest.testId || selectedTest.id?.slice(-8)}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Test Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Patient Details
                    </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Person sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography>{selectedTest.patient?.name || selectedTest.patientName || 'N/A'}</Typography>
                    </Box>
                    <Box pl={4}>
                      {selectedTest.patient?.age && (
                        <Typography variant="body2">
                          <strong>Age:</strong> {selectedTest.patient.age}
                        </Typography>
                      )}
                      {selectedTest.patient?.gender && (
                        <Typography variant="body2">
                          <strong>Gender:</strong> {selectedTest.patient.gender}
                        </Typography>
                      )}
                      {selectedTest.patient?.bloodGroup && (
                        <Typography variant="body2">
                          <strong>Blood Group:</strong> {selectedTest.patient.bloodGroup}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Doctor & Priority
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2">
                        <strong>Requested by:</strong> {selectedTest.doctor?.name || selectedTest.doctorName || 'N/A'}
                      </Typography>
                      {selectedTest.doctor?.specialization && (
                        <Typography variant="body2">
                          <strong>Specialization:</strong> {selectedTest.doctor.specialization}
                        </Typography>
                      )}
                      {selectedTest.doctor?.department && (
                        <Typography variant="body2">
                          <strong>Department:</strong> {selectedTest.doctor.department}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip 
                        label={selectedTest.priority || 'N/A'} 
                        color={getPriorityColor(selectedTest.priority)}
                        size="small"
                      />
                      <Chip 
                        label="Completed" 
                        color="success"
                        size="small"
                      />
                    </Box>
                  </Grid>

                  {selectedTest.reassignmentHistory && selectedTest.reassignmentHistory.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reassignment History ({selectedTest.reassignmentHistory.length} records)
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                        {selectedTest.reassignmentHistory.map((history, index) => (
                          <Box key={index} mb={2} pb={2} borderBottom={index < selectedTest.reassignmentHistory.length - 1 ? '1px solid #eee' : 'none'}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(history.reassignedAt)}
                            </Typography>
                            <Typography variant="body2">
                              {history.from?.employeeId 
                                ? `Transferred from ${history.from.employeeId} to ${history.to?.employeeId || 'you'}`
                                : `Assigned to ${history.to?.employeeId || 'you'}`
                              }
                            </Typography>
                            {history.reason && (
                              <Typography variant="caption" color="text.secondary">
                                Reason: {history.reason}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Timeline
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Assigned
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedTest.assignedAt)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Completed
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedTest.completedAt)}
                          </Typography>
                          {selectedTest.assignedAt && selectedTest.completedAt && (
                            <Typography variant="caption" color="primary">
                              Duration: {(
                                (new Date(selectedTest.completedAt) - new Date(selectedTest.assignedAt)) / 
                                (1000 * 60 * 60)
                              ).toFixed(2)} hours
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDownloadPDF(selectedTest.id || selectedTest.testId)}
                      >
                        Download PDF Report
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => handleViewReassignmentHistory(selectedTest.id || selectedTest.testId)}
                      >
                        View Assignment History
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Share />}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTest.id || selectedTest.testId);
                          showSnackbar('Test ID copied to clipboard', 'success');
                        }}
                      >
                        Share Test ID
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailDialog(false)}>Close</Button>
              </DialogActions>
            </>
          ) : (
            <Box p={4} textAlign="center">
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Failed to load test details
              </Typography>
            </Box>
          )}
        </Dialog>

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
    </LocalizationProvider>
  );
};

export default LabTechHistory;