import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, Stack, Grid, Card, CardContent, Chip, LinearProgress,
  IconButton, Tooltip, Alert, Snackbar, TablePagination,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search, Add, Edit, Delete, Inventory, Warning, 
  TrendingUp, LocalPharmacy, Analytics, Download
} from '@mui/icons-material';
import { BASE_URL } from '../../api/api';
// const BASE_URL = 'http://localhost:5000/api/admin/pharmacy';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    price: '',
    stockQuantity: '',
    unit: 'tablet',
    reorderLevel: 20,
    description: ''
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [], expiring: [] });

  const token = localStorage.getItem('token');

  // Categories for dropdown
  const categories = [
    'Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Antidepressant',
    'Antihypertensive', 'Diuretic', 'Antidiabetic', 'Vitamin', 'General'
  ];

  // Units for dropdown
  const units = ['tablet', 'capsule', 'bottle', 'tube', 'injection', 'syrup'];

  /* ================= FETCH MEDICINES ================= */
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        search: search
      });

      const res = await fetch(`${BASE_URL}/admin/pharmacy/medicines?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch medicines');

      const data = await res.json();
      setMedicines(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ALERTS ================= */
  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/alerts/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      
      const data = await res.json();
      setAlerts(data.alerts || { lowStock: [], outOfStock: [], expiring: [] });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  /* ================= SHOW ALERT ================= */
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchMedicines();
    fetchAlerts();
  }, [page, rowsPerPage, search]);

  /* ================= DIALOG HANDLERS ================= */
  const handleOpenDialog = (medicine = null) => {
    if (medicine) {
      setCurrentMedicine(medicine);
      setEditing(true);
    } else {
      setCurrentMedicine({
        name: '',
        genericName: '',
        category: '',
        manufacturer: '',
        batchNumber: '',
        expiryDate: '',
        price: '',
        stockQuantity: '',
        unit: 'tablet',
        reorderLevel: 20,
        description: ''
      });
      setEditing(false);
    }
    setOpenDialog(true);
  };

  /* ================= SAVE MEDICINE ================= */
  const saveMedicine = async () => {
    try {
      const url = editing
        ? `${BASE_URL}/admin/pharmacy/medicines/${currentMedicine._id}`
        : `${BASE_URL}/admin/pharmacy/medicines`;

      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentMedicine)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save medicine');
      }

      showAlert(`Medicine ${editing ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      fetchMedicines();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  /* ================= DELETE MEDICINE ================= */
  const deleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/pharmacy/medicines/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete medicine');
      }

      showAlert('Medicine deleted successfully', 'success');
      fetchMedicines();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (medicine) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/pharmacy/medicines/${medicine._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !medicine.isActive })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }

      showAlert(`Medicine ${medicine.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchMedicines();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  /* ================= STOCK UPDATE ================= */
  const updateStock = async (medicineId, action, quantity, notes = '') => {
    try {
      const res = await fetch(`${BASE_URL}/stock/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medicines: [{
            medicineId,
            quantity,
            action,
            notes
          }]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update stock');
      }

      showAlert('Stock updated successfully', 'success');
      fetchMedicines();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  /* ================= EXPORT REPORT ================= */
  const exportReport = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reports?format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to export report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showAlert('Report exported successfully', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  /* ================= CALCULATE INSIGHTS ================= */
  const insights = {
    totalMedicines: medicines.length,
    lowStockCount: alerts.lowStock.length,
    outOfStockCount: alerts.outOfStock.length,
    expiringCount: alerts.expiring.length,
    totalValue: medicines.reduce((sum, med) => sum + (med.price * med.stockQuantity), 0).toFixed(2)
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Pharmacy Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage medicine inventory, stock levels, and prescriptions
        </Typography>
      </Box>

      {/* Alerts Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: '#3b82f6' }}>
                  <Inventory fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {insights.totalMedicines}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Medicines
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: '#f59e0b' }}>
                  <Warning fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {insights.lowStockCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #ef4444' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: '#ef4444' }}>
                  <Warning fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {insights.outOfStockCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Out of Stock
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: '#10b981' }}>
                  <TrendingUp fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    ${insights.totalValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Medicine
          </Button>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={exportReport}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => fetchAlerts()}
          >
            Refresh Alerts
          </Button>
          <TextField
            size="small"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ ml: 'auto', width: 300 }}
          />
        </Stack>
      </Paper>

      {/* Medicines Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell>Medicine</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicines.map((medicine) => (
              <TableRow key={medicine._id}>
                <TableCell>
                  <Box>
                    <Typography fontWeight={600}>{medicine.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {medicine.genericName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={medicine.category}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{medicine.batchNumber}</TableCell>
                <TableCell>
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography fontWeight={600}>
                      {medicine.stockQuantity} {medicine.unit}
                    </Typography>
                    {medicine.stockQuantity <= medicine.reorderLevel && (
                      <Chip
                        label="Low Stock"
                        size="small"
                        color="warning"
                        sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>${medicine.price}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      checked={medicine.isActive}
                      onChange={() => toggleStatus(medicine)}
                      size="small"
                    />
                    <Chip
                      label={medicine.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={medicine.isActive ? 'success' : 'error'}
                    />
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(medicine)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => deleteMedicine(medicine._id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Stock">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          updateStock(
                            medicine._id,
                            'add',
                            50,
                            'Stock added manually'
                          )
                        }
                      >
                        +50
                      </Button>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Low Stock Alerts */}
      {alerts.lowStock.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Low Stock Alerts ({alerts.lowStock.length})
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {alerts.lowStock.map((alert, index) => (
              <Chip
                key={index}
                label={`${alert.name}: ${alert.stockQuantity} left`}
                size="small"
                color="warning"
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? 'Edit Medicine' : 'Add New Medicine'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Medicine Name"
              value={currentMedicine.name}
              onChange={(e) =>
                setCurrentMedicine({ ...currentMedicine, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Generic Name"
              value={currentMedicine.genericName}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  genericName: e.target.value
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={currentMedicine.category}
                label="Category"
                onChange={(e) =>
                  setCurrentMedicine({
                    ...currentMedicine,
                    category: e.target.value
                  })
                }
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Manufacturer"
              value={currentMedicine.manufacturer}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  manufacturer: e.target.value
                })
              }
              fullWidth
            />
            <TextField
              label="Batch Number"
              value={currentMedicine.batchNumber}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  batchNumber: e.target.value
                })
              }
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={currentMedicine.expiryDate}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  expiryDate: e.target.value
                })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Price"
              type="number"
              value={currentMedicine.price}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  price: parseFloat(e.target.value)
                })
              }
              fullWidth
              required
            />
            <TextField
              label="Stock Quantity"
              type="number"
              value={currentMedicine.stockQuantity}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  stockQuantity: parseInt(e.target.value)
                })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={currentMedicine.unit}
                label="Unit"
                onChange={(e) =>
                  setCurrentMedicine({
                    ...currentMedicine,
                    unit: e.target.value
                  })
                }
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Reorder Level"
              type="number"
              value={currentMedicine.reorderLevel}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  reorderLevel: parseInt(e.target.value)
                })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={currentMedicine.description}
              onChange={(e) =>
                setCurrentMedicine({
                  ...currentMedicine,
                  description: e.target.value
                })
              }
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveMedicine}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pharmacy;