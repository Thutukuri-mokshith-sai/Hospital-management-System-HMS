import  { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  Add,
  Refresh,
  Receipt,
  Paid,
  Pending,
 
} from '@mui/icons-material';
import { getBillingRecords, updateBillingStatus, getRevenueReport } from '../../api/adminApi';
import { format } from 'date-fns';

const Billing = () => {
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    paymentStatus: '',
    startDate: '',
    endDate: '',
    patientId: ''
  });
  const [revenueSummary, setRevenueSummary] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [updateDialog, setUpdateDialog] = useState(false);

  const fetchBillingRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      const response = await getBillingRecords(params);
      if (response.success) {
        setBillingRecords(response.data);
        setTotal(response.total);
        setRevenueSummary(response.revenueSummary || []);
        setMonthlyRevenue(response.monthlyRevenue || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch billing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingRecords();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setViewDialog(true);
  };

  const handleOpenUpdate = (record) => {
    setSelectedRecord(record);
    setUpdateDialog(true);
  };

  const handleUpdateStatus = async (status) => {
    try {
      await updateBillingStatus(selectedRecord._id, status);
      setUpdateDialog(false);
      fetchBillingRecords();
    } catch (err) {
      setError(err.message || 'Failed to update billing status');
    }
  };

  const paymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const paymentStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <Paid />;
      case 'Pending': return <Pending />;
      default: return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Billing Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ mr: 1 }}
          >
            Create Bill
          </Button>
          <IconButton onClick={fetchBillingRecords}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Revenue Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {revenueSummary.map((summary) => (
          <Grid item xs={12} sm={6} md={4} key={summary._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {paymentStatusIcon(summary._id)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {summary._id}
                  </Typography>
                </Box>
                <Typography variant="h4">${summary.totalAmount?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.count} transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Payment Status"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Patient ID"
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Billing Records Table */}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billingRecords.map((record, index) => (
                <TableRow key={record._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {record.patientId?.userId?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.patientId?.userId?.email || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Receipt sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1" fontWeight="medium">
                        ${record.amount?.toLocaleString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={paymentStatusIcon(record.paymentStatus)}
                      label={record.paymentStatus}
                      color={paymentStatusColor(record.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewRecord(record)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenUpdate(record)}
                      color="warning"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {billingRecords.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No billing records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Record Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Billing Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                <Typography variant="body1">
                  {selectedRecord.patientId?.userId?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRecord.patientId?.userId?.email || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRecord.patientId?.userId?.phone || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                <Typography variant="h4" color="primary">
                  ${selectedRecord.amount?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                <Chip
                  icon={paymentStatusIcon(selectedRecord.paymentStatus)}
                  label={selectedRecord.paymentStatus}
                  color={paymentStatusColor(selectedRecord.paymentStatus)}
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Created Date</Typography>
                <Typography variant="body1">
                  {format(new Date(selectedRecord.createdAt), 'dd/MM/yyyy HH:mm')}
                </Typography>
              </Grid>
              {selectedRecord.prescriptionId && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Related Prescription</Typography>
                  <Typography variant="body1">
                    {selectedRecord.prescriptionId._id}
                  </Typography>
                </Grid>
              )}
              {selectedRecord.appointmentId && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Related Appointment</Typography>
                  <Typography variant="body1">
                    {selectedRecord.appointmentId._id}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Payment Status</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Update payment status for bill #{selectedRecord?._id}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant={selectedRecord?.paymentStatus === 'Paid' ? 'contained' : 'outlined'}
                startIcon={<Paid />}
                onClick={() => handleUpdateStatus('Paid')}
                sx={{ mb: 1 }}
              >
                Mark as Paid
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant={selectedRecord?.paymentStatus === 'Pending' ? 'contained' : 'outlined'}
                startIcon={<Pending />}
                onClick={() => handleUpdateStatus('Pending')}
              >
                Mark as Pending
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing;