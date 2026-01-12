// src/pages/doctor/DoctorLabTests.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, Chip, Avatar, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, LinearProgress,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, FormControl, InputLabel, alpha, Card, CardContent, Switch,
  Alert, Tabs, Tab
} from '@mui/material';
import {
  Science, Search, FilterList, Add, Visibility, Edit, Delete,
  Person, CalendarMonth, AccessTime, CheckCircle, Pending, Warning,
  ArrowUpward, ArrowDownward, History, Download, Assignment, Report
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';

const DoctorLabTests = () => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newTestOpen, setNewTestOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLabTests();
  }, [filterStatus, filterPriority, tabValue]);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      // Simulated API call
      setTimeout(() => {
        const mockLabTests = [
          {
            id: 1,
            testId: 'LT-2024-001',
            patientName: 'John Doe',
            patientId: 'P001',
            testName: 'Complete Blood Count',
            dateOrdered: '2024-01-10',
            status: 'Requested',
            priority: 'High',
            requestedBy: 'Dr. Smith',
            technician: 'Lab Tech 1',
            notes: 'Check for infection markers',
            results: null,
            reportDate: null
          },
          {
            id: 2,
            testId: 'LT-2024-002',
            patientName: 'Jane Smith',
            patientId: 'P002',
            testName: 'Blood Sugar Test',
            dateOrdered: '2024-01-09',
            status: 'Processing',
            priority: 'Normal',
            requestedBy: 'Dr. Smith',
            technician: 'Lab Tech 2',
            notes: 'Fasting glucose levels',
            results: null,
            reportDate: null
          },
          {
            id: 3,
            testId: 'LT-2024-003',
            patientName: 'Robert Brown',
            patientId: 'P003',
            testName: 'Liver Function Test',
            dateOrdered: '2024-01-08',
            status: 'Completed',
            priority: 'High',
            requestedBy: 'Dr. Smith',
            technician: 'Lab Tech 1',
            notes: 'Monitor liver enzymes',
            results: 'Within normal range',
            reportDate: '2024-01-09',
            reportUrl: '/reports/lt-003.pdf'
          },
          {
            id: 4,
            testId: 'LT-2024-004',
            patientName: 'Sarah Wilson',
            patientId: 'P004',
            testName: 'ECG',
            dateOrdered: '2024-01-07',
            status: 'Cancelled',
            priority: 'Critical',
            requestedBy: 'Dr. Smith',
            technician: null,
            notes: 'Cardiac monitoring',
            results: null,
            reportDate: null
          }
        ];
        
        let filtered = mockLabTests;
        if (filterStatus !== 'all') {
          filtered = mockLabTests.filter(t => t.status === filterStatus);
        }
        if (filterPriority !== 'all') {
          filtered = filtered.filter(t => t.priority === filterPriority);
        }
        if (searchTerm) {
          filtered = filtered.filter(t => 
            t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.testId.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (selectedDate) {
          filtered = filtered.filter(t => t.dateOrdered === selectedDate.toISOString().split('T')[0]);
        }
        
        // Filter by tab
        if (tabValue === 1) {
          filtered = filtered.filter(t => t.status === 'Requested');
        } else if (tabValue === 2) {
          filtered = filtered.filter(t => t.status === 'Processing');
        } else if (tabValue === 3) {
          filtered = filtered.filter(t => t.status === 'Completed');
        }
        
        setLabTests(filtered);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    setDetailsOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Requested': return 'info';
      case 'Processing': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f59e0b';
      case 'Normal': return '#3b82f6';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const stats = {
    total: labTests.length,
    requested: labTests.filter(t => t.status === 'Requested').length,
    processing: labTests.filter(t => t.status === 'Processing').length,
    completed: labTests.filter(t => t.status === 'Completed').length,
    critical: labTests.filter(t => t.priority === 'Critical').length
  };

  const [newTest, setNewTest] = useState({
    patientId: '',
    testName: '',
    priority: 'Normal',
    notes: '',
    appointmentId: ''
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Laboratory Tests Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Order and track laboratory tests for patients
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setNewTestOpen(true)}
          >
            Order Lab Test
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#3b82f6">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Tests</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                <Science />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#06b6d4">
                  {stats.requested}
                </Typography>
                <Typography variant="body2" color="text.secondary">Requested</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#06b6d4', 0.1), color: '#06b6d4' }}>
                <Assignment />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#f59e0b">
                  {stats.processing}
                </Typography>
                <Typography variant="body2" color="text.secondary">Processing</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                <AccessTime />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#10b981">
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">Completed</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <CheckCircle />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#ef4444">
                  {stats.critical}
                </Typography>
                <Typography variant="body2" color="text.secondary">Critical</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}>
                <Warning />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab label={`All Tests (${stats.total})`} />
          <Tab label={`Requested (${stats.requested})`} />
          <Tab label={`Processing (${stats.processing})`} />
          <Tab label={`Completed (${stats.completed})`} />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Requested">Requested</MenuItem>
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={setSelectedDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              startIcon={<FilterList />}
              variant="outlined"
              fullWidth
              onClick={fetchLabTests}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View Critical
            </Button>
          }
        >
          {stats.critical} critical priority lab tests require immediate attention
        </Alert>
      )}

      {/* Lab Tests Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Test ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date Ordered</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Technician</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labTests.map((test) => (
              <TableRow key={test.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{test.testId}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    By: {test.requestedBy}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {test.patientName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{test.patientName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {test.patientId}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{test.testName}</Typography>
                  {test.notes && (
                    <Typography variant="caption" color="text.secondary">
                      {test.notes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography>{test.dateOrdered}</Typography>
                  {test.reportDate && (
                    <Typography variant="caption" color="text.secondary">
                      Report: {test.reportDate}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={test.priority}
                    size="small"
                    sx={{
                      bgcolor: alpha(getPriorityColor(test.priority), 0.1),
                      color: getPriorityColor(test.priority),
                      fontWeight: 600
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={test.status}
                    color={getStatusColor(test.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {test.technician ? (
                    <Typography>{test.technician}</Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Not assigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(test)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {test.status === 'Completed' && (
                      <Tooltip title="View Report">
                        <IconButton size="small" color="success">
                          <Report fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Cancel Test">
                      <IconButton 
                        size="small" 
                        color="error"
                        disabled={test.status === 'Completed' || test.status === 'Cancelled'}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Test Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md"
        fullWidth
      >
        {selectedTest && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Lab Test Details
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={selectedTest.priority}
                    sx={{
                      bgcolor: alpha(getPriorityColor(selectedTest.priority), 0.1),
                      color: getPriorityColor(selectedTest.priority)
                    }}
                  />
                  <Chip 
                    label={selectedTest.status}
                    color={getStatusColor(selectedTest.status)}
                  />
                </Stack>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Patient Information
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                              {selectedTest.patientName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600}>{selectedTest.patientName}</Typography>
                              <Typography variant="body2">ID: {selectedTest.patientId}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Requested by: {selectedTest.requestedBy}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Test Information
                          </Typography>
                          <Stack spacing={1}>
                            <Typography>Test ID: {selectedTest.testId}</Typography>
                            <Typography>Test Name: {selectedTest.testName}</Typography>
                            <Typography>Date Ordered: {selectedTest.dateOrdered}</Typography>
                            {selectedTest.technician && (
                              <Typography>Technician: {selectedTest.technician}</Typography>
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography>{selectedTest.notes || 'No additional notes'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedTest.status === 'Completed' && selectedTest.results && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Test Results
                        </Typography>
                        <Typography>{selectedTest.results}</Typography>
                        <Button
                          startIcon={<Download />}
                          sx={{ mt: 2 }}
                        >
                          Download Full Report
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => navigate(`/doctor/lab-reports?testId=${selectedTest.id}`)}
                    >
                      View Report History
                    </Button>
                    {selectedTest.status === 'Completed' ? (
                      <Button
                        variant="contained"
                        startIcon={<Science />}
                        onClick={() => navigate(`/doctor/lab-tests/new?patientId=${selectedTest.patientId}`)}
                      >
                        Order New Test
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                        disabled={selectedTest.status === 'Cancelled'}
                      >
                        Cancel Test
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DoctorLabTests;