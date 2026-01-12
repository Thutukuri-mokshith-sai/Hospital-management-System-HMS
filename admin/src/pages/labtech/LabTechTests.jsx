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
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
  Grid,
  Avatar,
  Badge,
  Divider
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  PlayArrow,
  Done,
  Report,
  Refresh,
  Person,
  MedicalServices,
  Science,
  PriorityHigh,
  AccessTime,
  Error as ErrorIcon,
  CheckCircle,
  PendingActions,
  ContentCopy,
  History,
  Share,
  Print,
  Email
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

const BASE_URL = 'http://localhost:5000/api/v1';

const LabTechTests = () => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [startDialog, setStartDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [reportResult, setReportResult] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labtech/tests');
      const testsData = response.data.data || [];
      setTests(testsData);
      setFilteredTests(testsData);
    } catch (error) {
      console.error('Error fetching tests:', error);
      showSnackbar('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tests;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(test =>
        test.testName.toLowerCase().includes(term) ||
        test.patient?.name?.toLowerCase().includes(term) ||
        test.doctor?.name?.toLowerCase().includes(term) ||
        test.patient?.phone?.includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(test => test.priority === priorityFilter);
    }
    
    setFilteredTests(filtered);
  }, [searchTerm, statusFilter, priorityFilter, tests]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
    
    const hours = differenceInHours(new Date(completedAt), new Date(assignedAt));
    const minutes = differenceInMinutes(new Date(completedAt), new Date(assignedAt)) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const viewTestDetails = (test) => {
    setSelectedTest(test);
    setDetailDialog(true);
  };

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setStartDialog(true);
  };

  const confirmStartTest = async () => {
    try {
      await api.patch(`/labtech/tests/${selectedTest.id}/start`);
      showSnackbar('Test started successfully');
      fetchTests();
      setStartDialog(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to start test', 'error');
    }
  };

  const handleCompleteTest = (test) => {
    setSelectedTest(test);
    setCompleteDialog(true);
  };

  const confirmCompleteTest = async () => {
    try {
      await api.patch(`/labtech/tests/${selectedTest.id}/complete`);
      showSnackbar('Test completed successfully');
      fetchTests();
      setCompleteDialog(false);
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to complete test', 'error');
    }
  };

  const handleSubmitReport = (test) => {
    setSelectedTest(test);
    setReportResult('');
    setAdditionalNotes('');
    setReportDialog(true);
  };

  const confirmSubmitReport = async () => {
    if (!reportResult.trim()) {
      showSnackbar('Please enter test results', 'error');
      return;
    }

    try {
      await api.post(`/labtech/tests/${selectedTest.id}/report`, {
        result: reportResult,
        additionalNotes: additionalNotes || ''
      });
      showSnackbar('Report submitted successfully');
      fetchTests();
      setReportDialog(false);
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

  const handleShareReport = async (testId) => {
    try {
      const reportLink = `${BASE_URL}/labtech/tests/${testId}/report/pdf`;
      await navigator.clipboard.writeText(reportLink);
      showSnackbar('Report link copied to clipboard');
    } catch (error) {
      showSnackbar('Failed to share report', 'error');
    }
  };

  const handleViewReassignmentHistory = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/history`);
      console.log('Reassignment history:', response.data.data);
      showSnackbar('Reassignment history loaded in console', 'info');
    } catch (error) {
      showSnackbar('Failed to load history', 'error');
    }
  };

  const handleCopyTestId = (testId) => {
    navigator.clipboard.writeText(testId);
    showSnackbar('Test ID copied to clipboard', 'info');
  };

  const handlePrintReport = async (testId) => {
    try {
      const response = await api.get(`/labtech/tests/${testId}/report/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      showSnackbar('Failed to print report', 'error');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <Science sx={{ verticalAlign: 'middle', mr: 1 }} />
            Laboratory Tests Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all assigned laboratory tests
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchTests}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
            <Typography variant="subtitle2" color="text.secondary">Total Tests</Typography>
            <Typography variant="h4" fontWeight="bold">{tests.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
            <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
            <Typography variant="h4" fontWeight="bold">
              {tests.filter(t => t.status === 'Requested').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
            <Typography variant="subtitle2" color="text.secondary">Completed</Typography>
            <Typography variant="h4" fontWeight="bold">
              {tests.filter(t => t.status === 'Completed').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
            <Typography variant="subtitle2" color="text.secondary">Critical</Typography>
            <Typography variant="h4" fontWeight="bold">
              {tests.filter(t => t.priority === 'Critical').length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            sx={{ flex: 1, minWidth: 200 }}
            variant="outlined"
            placeholder="Search by test name, patient, doctor, or phone..."
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
                    <ErrorIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
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

          <FormControl sx={{ minWidth: 120 }}>
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

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Tests Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box p={4} textAlign="center">
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading tests...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Assigned Tests ({filteredTests.length})
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Details</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow 
                      key={test.id}
                      hover
                      sx={{ 
                        borderLeft: test.priority === 'Critical' ? '4px solid #f44336' : 'none',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Science sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography fontWeight="bold">{test.testName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {test.id.slice(-8)}
                              <IconButton 
                                size="small" 
                                sx={{ ml: 0.5 }}
                                onClick={() => handleCopyTestId(test.id)}
                              >
                                <ContentCopy fontSize="inherit" />
                              </IconButton>
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
                        <Box display="flex" alignItems="center">
                          <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box>
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
                          </Box>
                        </Box>
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
                              ⏱️ Time: {calculateCompletionTime(test.assignedAt, test.completedAt)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => viewTestDetails(test)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {test.status === 'Requested' && (
                            <Tooltip title="Start Test">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleStartTest(test)}
                              >
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {test.status === 'Processing' && (
                            <>
                              <Tooltip title="Complete Test">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => handleCompleteTest(test)}
                                >
                                  <Done fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Complete test first to submit report">
                                <span>
                                  <IconButton size="small" color="info" disabled>
                                    <Report fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                          
                          {test.status === 'Completed' && (
                            <>
                              <Tooltip title="Submit Report">
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => handleSubmitReport(test)}
                                >
                                  <Report fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download PDF">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDownloadPDF(test.id)}
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Share Report">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleShareReport(test.id)}
                                >
                                  <Share fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          <Tooltip title="View History">
                            <IconButton 
                              size="small"
                              onClick={() => handleViewReassignmentHistory(test.id)}
                            >
                              <History fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {filteredTests.length === 0 && !loading && (
          <Box p={4} textAlign="center">
            <Science sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Tests Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try changing your search criteria' 
                : 'No tests have been assigned to you yet'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Test Details Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        {selectedTest && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Science sx={{ mr: 1 }} />
                Test Details
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom color="primary">
                    {selectedTest.testName}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Patient Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography fontWeight="medium">{selectedTest.patient?.name || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient ID: {selectedTest.id?.slice(-8)}
                    </Typography>
                    <Typography variant="body2">
                      Age: {selectedTest.patient?.age || 'N/A'} • Gender: {selectedTest.patient?.gender || 'N/A'}
                    </Typography>
                    {selectedTest.patient?.bloodGroup && (
                      <Chip 
                        label={`Blood Group: ${selectedTest.patient.bloodGroup}`} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    )}
                    {selectedTest.patient?.phone && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        📞 {selectedTest.patient.phone}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Doctor Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography fontWeight="medium">Dr. {selectedTest.doctor?.name || 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doctor ID: {selectedTest.doctor?.id?.slice(-8) || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Specialization: {selectedTest.doctor?.specialization || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Department: {selectedTest.doctor?.department || 'N/A'}
                    </Typography>
                    {selectedTest.doctor?.phone && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        📞 {selectedTest.doctor.phone}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Test Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">Priority</Typography>
                      <Chip 
                        label={selectedTest.priority} 
                        color={getPriorityColor(selectedTest.priority)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedTest.status} 
                        color={getStatusColor(selectedTest.status)}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">Requested</Typography>
                      <Typography variant="body2">{formatDate(selectedTest.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">Assigned</Typography>
                      <Typography variant="body2">{selectedTest.assignedAt ? formatDate(selectedTest.assignedAt) : 'Not assigned'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {selectedTest.estimatedCompletion && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<AccessTime />}>
                      Estimated Completion: {formatDate(selectedTest.estimatedCompletion)}
                    </Alert>
                  </Grid>
                )}

                {selectedTest.completedAt && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<CheckCircle />}>
                      Completed: {formatDate(selectedTest.completedAt)}
                      {selectedTest.assignedAt && (
                        <Typography variant="caption" display="block">
                          Duration: {calculateCompletionTime(selectedTest.assignedAt, selectedTest.completedAt)}
                        </Typography>
                      )}
                    </Alert>
                  </Grid>
                )}

                {selectedTest.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography>{selectedTest.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(false)}>Close</Button>
              {selectedTest.status === 'Requested' && (
                <Button variant="contained" onClick={() => handleStartTest(selectedTest)}>
                  Start Test
                </Button>
              )}
              {selectedTest.status === 'Processing' && (
                <Button variant="contained" color="success" onClick={() => handleCompleteTest(selectedTest)}>
                  Complete Test
                </Button>
              )}
              {selectedTest.status === 'Completed' && (
                <>
                  <Button variant="outlined" onClick={() => handleDownloadPDF(selectedTest.id)}>
                    Download PDF
                  </Button>
                  <Button variant="contained" onClick={() => handleSubmitReport(selectedTest)}>
                    Submit Report
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Start Test Dialog */}
      <Dialog open={startDialog} onClose={() => setStartDialog(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setStartDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmStartTest} startIcon={<PlayArrow />}>
            Start Processing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Test Dialog */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="sm" fullWidth>
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
                  calculateCompletionTime(selectedTest.assignedAt, new Date()) : 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={2}>
            This will update your performance statistics and allow you to submit the report.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={confirmCompleteTest} startIcon={<Done />}>
            Mark as Completed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Report Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="md" fullWidth>
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
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
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

export default LabTechTests;