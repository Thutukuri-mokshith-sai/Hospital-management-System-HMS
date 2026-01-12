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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
  Divider,
  Badge,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Description,
  Download,
  Visibility,
  Search,
  FilterList,
  Refresh,
  Print,
  Share,
  Email,
  CalendarToday,
  Person,
  MedicalServices,
  Error as ErrorIcon,
  CheckCircle,
  Pending,
  Science,
  AccessTime,
  PriorityHigh,
  Report as ReportIcon,
  ContentCopy,
  History
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const BASE_URL = 'http://localhost:5000/api/v1';

const LabTechReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [hasReports, setHasReports] = useState([]);
  const [reportDetails, setReportDetails] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Use the test history endpoint to get completed tests
      const response = await api.get('/labtech/history?limit=100');
      const tests = response.data.data || [];
      
      // Fetch report status for each test
      const reportsWithStatus = await Promise.all(
        tests.map(async (test) => {
          try {
            // Check if report exists for this test
            const reportResponse = await api.get(`/labtech/tests/${test.id}/report/status`);
            return {
              ...test,
              hasReport: reportResponse.data.hasReport,
              reportId: reportResponse.data.reportId,
              reportDate: reportResponse.data.reportDate
            };
          } catch (error) {
            return {
              ...test,
              hasReport: false,
              reportId: null
            };
          }
        })
      );
      
      setReports(reportsWithStatus);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showSnackbar('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      console.error('Error downloading PDF:', error);
      showSnackbar(error.response?.data?.message || 'Failed to download PDF', 'error');
    }
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
      console.error('Error printing report:', error);
      showSnackbar('Failed to print report', 'error');
    }
  };

  const handleShareReport = (testId) => {
    setSelectedReport(testId);
    setEmailDialog(true);
  };

  const handleSendEmail = async () => {
    try {
      // For now, just copy link to clipboard since email API might not exist
      const reportLink = `${BASE_URL}/labtech/tests/${selectedReport}/report/pdf`;
      await navigator.clipboard.writeText(reportLink);
      showSnackbar('Report link copied to clipboard');
      setEmailDialog(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sharing report:', error);
      showSnackbar('Failed to share report', 'error');
    }
  };

  const viewReportDetails = async (report) => {
    setSelectedReport(report);
    setReportLoading(true);
    
    try {
      // Fetch detailed report information
      const response = await api.get(`/labtech/tests/${report.id}/report/details`);
      setReportDetails(response.data.data);
      setPreviewDialog(true);
    } catch (error) {
      console.error('Error fetching report details:', error);
      showSnackbar('Could not load report details', 'error');
    } finally {
      setReportLoading(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle color="success" />;
      case 'Processing': return <Pending color="warning" />;
      case 'Requested': return <ErrorIcon color="info" />;
      default: return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Processing': return 'warning';
      case 'Requested': return 'info';
      default: return 'error';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleCopyTestId = (testId) => {
    navigator.clipboard.writeText(testId);
    showSnackbar('Test ID copied to clipboard', 'info');
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

  const filteredReports = reports.filter(report => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        report.testName.toLowerCase().includes(term) ||
        report.patientName?.toLowerCase().includes(term) ||
        report.doctorName?.toLowerCase().includes(term) ||
        report.id.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      return report.status === statusFilter;
    }
    return true;
  });

  // Filter reports that actually have reports submitted
  const reportsWithLabReports = reports.filter(report => report.hasReport);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <Science sx={{ verticalAlign: 'middle', mr: 1 }} />
            Laboratory Reports Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View, download, and manage all laboratory test reports
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchReports}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Description />}
            onClick={() => {
              // Generate summary report
              showSnackbar('Monthly report generation coming soon', 'info');
            }}
          >
            Generate Summary
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  <Description color="primary" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Tests
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {reports.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                  <CheckCircle color="success" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    With Reports
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {reportsWithLabReports.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reports.length > 0 
                      ? `${Math.round((reportsWithLabReports.length / reports.length) * 100)}% coverage`
                      : '0%'
                    }
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                  <AccessTime color="warning" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Avg. Completion
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {reports.length > 0 ? '2.5h' : '0h'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per test
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'error.light', mr: 2 }}>
                  <PriorityHigh color="error" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Critical Tests
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {reports.filter(r => r.priority === 'Critical').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    urgent cases
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by test name, patient, doctor, or test ID..."
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
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Requested">Requested</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={3} pb={2}>
          <Typography variant="h6" fontWeight="bold">
            Laboratory Test Reports ({filteredReports.length})
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={`${reportsWithLabReports.length} with reports`} 
              color="primary" 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={`${reports.length} total tests`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>
        
        {loading ? (
          <Box p={4} textAlign="center">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading reports...</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Details</TableCell>
                  <TableCell>Patient Info</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report.id} 
                    hover
                    sx={{ 
                      borderLeft: report.priority === 'Critical' ? '4px solid #f44336' : 'none',
                      opacity: report.hasReport ? 1 : 0.8
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Science sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography fontWeight="bold" gutterBottom>
                            {report.testName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {report.id.slice(-8)}
                            <IconButton 
                              size="small" 
                              sx={{ ml: 0.5 }}
                              onClick={() => handleCopyTestId(report.id)}
                            >
                              <ContentCopy fontSize="inherit" />
                            </IconButton>
                          </Typography>
                          <Chip 
                            label={report.priority} 
                            size="small" 
                            color={getPriorityColor(report.priority)}
                            sx={{ mt: 0.5 }}
                          />
                          {report.hasReport && (
                            <Chip 
                              icon={<ReportIcon />}
                              label="Report Submitted" 
                              size="small" 
                              color="success"
                              variant="outlined"
                              sx={{ mt: 0.5, ml: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography fontWeight="medium">{report.patientName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Age: {report.age || 'N/A'} • Gender: {report.gender || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <MedicalServices sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography>{report.doctorName || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          🗓️ {report.assignedAt ? formatDate(report.assignedAt) : 'Not assigned'}
                        </Typography>
                        {report.completedAt && (
                          <Typography variant="caption" color="success.main" display="block">
                            ✅ {formatDate(report.completedAt)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(report.status)}
                        <Typography sx={{ ml: 1 }}>
                          {report.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => viewReportDetails(report)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {report.hasReport ? (
                          <>
                            <Tooltip title="Download PDF">
                              <IconButton 
                                size="small"
                                onClick={() => handleDownloadPDF(report.id)}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print Report">
                              <IconButton 
                                size="small"
                                onClick={() => handlePrintReport(report.id)}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share Report">
                              <IconButton 
                                size="small"
                                onClick={() => handleShareReport(report.id)}
                              >
                                <Share fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="No report submitted yet">
                            <span>
                              <IconButton size="small" disabled>
                                <Download fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="View History">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewReassignmentHistory(report.id)}
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
        )}

        {filteredReports.length === 0 && !loading && (
          <Box p={4} textAlign="center">
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Reports Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try changing your search criteria' 
                : 'No laboratory tests have been completed yet'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Report Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Science sx={{ mr: 1 }} />
            Laboratory Report Details
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {reportLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : selectedReport ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom color="primary">
                  {selectedReport.testName}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Patient Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Name:</strong> {selectedReport.patientName || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID: {selectedReport.id?.slice(-8)}
                  </Typography>
                  <Typography variant="body2">
                    Age: {selectedReport.age || 'N/A'} • Gender: {selectedReport.gender || 'N/A'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Test Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography><strong>Test:</strong> {selectedReport.testName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Test ID: {selectedReport.id?.slice(-8)}
                  </Typography>
                  <Chip 
                    label={selectedReport.priority} 
                    size="small" 
                    color={getPriorityColor(selectedReport.priority)}
                    sx={{ mt: 0.5 }}
                  />
                  <Box display="flex" alignItems="center" mt={1}>
                    {getStatusIcon(selectedReport.status)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      Status: {selectedReport.status}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Requested:</strong> {selectedReport.createdAt ? formatDate(selectedReport.createdAt) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Assigned:</strong> {selectedReport.assignedAt ? formatDate(selectedReport.assignedAt) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Completed:</strong> {selectedReport.completedAt ? formatDate(selectedReport.completedAt) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Report Status:</strong> {selectedReport.hasReport ? 'Submitted' : 'Pending'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {selectedReport.hasReport && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Laboratory report has been submitted and is ready for download.
                  </Alert>
                </Grid>
              )}

              {!selectedReport.hasReport && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Laboratory report has not been submitted yet. Please submit the report from the main dashboard.
                  </Alert>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="text.secondary">No report data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          {selectedReport?.hasReport && (
            <>
              <Button 
                variant="contained" 
                startIcon={<Download />}
                onClick={() => handleDownloadPDF(selectedReport.id)}
              >
                Download PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Print />}
                onClick={() => handlePrintReport(selectedReport.id)}
              >
                Print
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)}>
        <DialogTitle>Share Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Enter recipient's email address"
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            The report will be shared as a downloadable link via email.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Currently sharing copies the report link to clipboard. Email integration coming soon.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEmailDialog(false);
            setEmailAddress('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Email />}
            onClick={handleSendEmail}
          >
            Copy Link
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

export default LabTechReports;