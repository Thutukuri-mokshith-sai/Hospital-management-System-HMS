// src/pages/doctor/DoctorPrescriptions.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, Chip, Avatar, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, LinearProgress,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Select, FormControl, InputLabel, alpha, Card, CardContent, Switch
} from '@mui/material';
import {
  Medication, Search, FilterList, Add, Visibility, Edit, Delete,
  Person, CalendarMonth, AccessTime, CheckCircle, Pending,
  Warning, Print, Download, History, Receipt, Science
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newPrescriptionOpen, setNewPrescriptionOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
  }, [filterStatus]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Simulated API call
      setTimeout(() => {
        const mockPrescriptions = [
          {
            id: 1,
            prescriptionId: 'RX-2024-001',
            patientName: 'John Doe',
            patientId: 'P001',
            date: '2024-01-10',
            status: 'Active',
            medicines: [
              { name: 'Paracetamol', dosage: '500mg', frequency: 'Every 6 hours', duration: '5 days' },
              { name: 'Amoxicillin', dosage: '250mg', frequency: 'Twice daily', duration: '7 days' }
            ],
            instructions: 'Take after meals. Complete full course.',
            followUp: '2024-01-20',
            doctorName: 'Dr. Smith',
            pharmacyStatus: 'Dispensed'
          },
          {
            id: 2,
            prescriptionId: 'RX-2024-002',
            patientName: 'Jane Smith',
            patientId: 'P002',
            date: '2024-01-09',
            status: 'Completed',
            medicines: [
              { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' }
            ],
            instructions: 'Monitor blood sugar levels regularly.',
            followUp: '2024-02-09',
            doctorName: 'Dr. Smith',
            pharmacyStatus: 'Dispensed'
          },
          {
            id: 3,
            prescriptionId: 'RX-2024-003',
            patientName: 'Robert Brown',
            patientId: 'P003',
            date: '2024-01-08',
            status: 'Pending',
            medicines: [
              { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days' },
              { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: '30 days' }
            ],
            instructions: 'Take at bedtime. Regular liver function tests required.',
            followUp: '2024-02-08',
            doctorName: 'Dr. Smith',
            pharmacyStatus: 'Pending'
          },
          {
            id: 4,
            prescriptionId: 'RX-2024-004',
            patientName: 'Sarah Wilson',
            patientId: 'P004',
            date: '2024-01-07',
            status: 'Expired',
            medicines: [
              { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '10 days' }
            ],
            instructions: 'Take as needed for allergies.',
            followUp: '2024-01-17',
            doctorName: 'Dr. Smith',
            pharmacyStatus: 'Dispensed'
          }
        ];
        
        let filtered = mockPrescriptions;
        if (filterStatus !== 'all') {
          filtered = mockPrescriptions.filter(p => p.status === filterStatus);
        }
        if (searchTerm) {
          filtered = filtered.filter(p => 
            p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.prescriptionId.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (selectedDate) {
          filtered = filtered.filter(p => p.date === selectedDate.toISOString().split('T')[0]);
        }
        setPrescriptions(filtered);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Pending': return 'warning';
      case 'Completed': return 'info';
      case 'Expired': return 'error';
      default: return 'default';
    }
  };

  const getPharmacyStatusColor = (status) => {
    switch(status) {
      case 'Dispensed': return 'success';
      case 'Pending': return 'warning';
      case 'Ready': return 'info';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter(p => p.status === 'Active').length,
    pending: prescriptions.filter(p => p.status === 'Pending').length,
    expired: prescriptions.filter(p => p.status === 'Expired').length
  };

  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
    followUp: ''
  });

  const handleAddMedicine = () => {
    setNewPrescription({
      ...newPrescription,
      medicines: [...newPrescription.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...newPrescription.medicines];
    updatedMedicines[index][field] = value;
    setNewPrescription({ ...newPrescription, medicines: updatedMedicines });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Prescriptions Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create, manage, and track patient prescriptions
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setNewPrescriptionOpen(true)}
          >
            New Prescription
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#3b82f6">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Prescriptions</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                <Receipt />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#10b981">
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">Active</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <CheckCircle />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#f59e0b">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                <Pending />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#ef4444">
                  {stats.expired}
                </Typography>
                <Typography variant="body2" color="text.secondary">Expired</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}>
                <Warning />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
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
              onClick={fetchPrescriptions}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Prescriptions Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Prescription ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Medicines</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pharmacy</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{prescription.prescriptionId}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Follow-up: {prescription.followUp}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {prescription.patientName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{prescription.patientName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {prescription.patientId}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography>{prescription.date}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Dr. {prescription.doctorName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    {prescription.medicines.slice(0, 2).map((med, idx) => (
                      <Chip 
                        key={idx}
                        label={`${med.name} ${med.dosage}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {prescription.medicines.length > 2 && (
                      <Chip 
                        label={`+${prescription.medicines.length - 2} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prescription.status}
                    color={getStatusColor(prescription.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prescription.pharmacyStatus}
                    color={getPharmacyStatusColor(prescription.pharmacyStatus)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(prescription)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton size="small" color="info">
                        <Print fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Prescription Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md"
        fullWidth
      >
        {selectedPrescription && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Prescription Details
                </Typography>
                <Chip 
                  label={selectedPrescription.status}
                  color={getStatusColor(selectedPrescription.status)}
                />
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
                              {selectedPrescription.patientName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600}>{selectedPrescription.patientName}</Typography>
                              <Typography variant="body2">ID: {selectedPrescription.patientId}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Prescription Details
                          </Typography>
                          <Stack spacing={1}>
                            <Typography>ID: {selectedPrescription.prescriptionId}</Typography>
                            <Typography>Date: {selectedPrescription.date}</Typography>
                            <Typography>Follow-up: {selectedPrescription.followUp}</Typography>
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
                        Prescribed Medicines
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Dosage</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPrescription.medicines.map((medicine, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Medication fontSize="small" />
                                  <Typography>{medicine.name}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{medicine.dosage}</TableCell>
                              <TableCell>{medicine.frequency}</TableCell>
                              <TableCell>{medicine.duration}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Instructions
                      </Typography>
                      <Typography>{selectedPrescription.instructions}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                    >
                      Print Prescription
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                    >
                      Download PDF
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Science />}
                      onClick={() => navigate(`/doctor/lab-tests/new?prescriptionId=${selectedPrescription.id}`)}
                    >
                      Order Lab Test
                    </Button>
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

export default DoctorPrescriptions;