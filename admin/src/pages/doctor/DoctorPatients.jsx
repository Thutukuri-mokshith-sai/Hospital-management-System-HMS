// src/pages/doctor/DoctorPatients.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, Chip, Avatar, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, LinearProgress,
  Tooltip, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, Divider, Card, CardContent
} from '@mui/material';
import {
  People, Search, FilterList, Visibility, Edit, MedicalServices,
  AccessTime, Bloodtype, MonitorHeart, ArrowForward, MoreVert,
  LocalHospital, Phone, Email, Cake, Transgender, HealthAndSafety
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [filterStatus]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Simulated API call
      setTimeout(() => {
        const mockPatients = [
          {
            id: 1,
            name: 'John Doe',
            age: 45,
            gender: 'Male',
            admissionStatus: 'Admitted',
            ward: 'ICU-101',
            lastVisit: '2024-01-10',
            condition: 'Stable',
            bloodGroup: 'O+',
            email: 'john@example.com',
            phone: '+1234567890',
            diagnosis: 'Hypertension',
            doctor: 'Dr. Smith',
            nextAppointment: '2024-01-15'
          },
          {
            id: 2,
            name: 'Jane Smith',
            age: 32,
            gender: 'Female',
            admissionStatus: 'Discharged',
            ward: 'Ward-205',
            lastVisit: '2024-01-09',
            condition: 'Recovered',
            bloodGroup: 'A+',
            email: 'jane@example.com',
            phone: '+1234567891',
            diagnosis: 'Diabetes',
            doctor: 'Dr. Johnson',
            nextAppointment: '2024-01-20'
          },
          {
            id: 3,
            name: 'Robert Brown',
            age: 58,
            gender: 'Male',
            admissionStatus: 'Admitted',
            ward: 'ICU-102',
            lastVisit: '2024-01-10',
            condition: 'Critical',
            bloodGroup: 'B+',
            email: 'robert@example.com',
            phone: '+1234567892',
            diagnosis: 'Heart Disease',
            doctor: 'Dr. Smith',
            nextAppointment: '2024-01-12'
          },
          {
            id: 4,
            name: 'Sarah Wilson',
            age: 29,
            gender: 'Female',
            admissionStatus: 'Observation',
            ward: 'Ward-301',
            lastVisit: '2024-01-08',
            condition: 'Improving',
            bloodGroup: 'AB+',
            email: 'sarah@example.com',
            phone: '+1234567893',
            diagnosis: 'Pneumonia',
            doctor: 'Dr. Lee',
            nextAppointment: '2024-01-14'
          }
        ];
        
        let filtered = mockPatients;
        if (filterStatus !== 'all') {
          filtered = mockPatients.filter(p => p.admissionStatus === filterStatus);
        }
        if (searchTerm) {
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setPatients(filtered);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const handleMenuClick = (event, patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleQuickAction = (action) => {
    if (selectedPatient) {
      switch(action) {
        case 'prescription':
          navigate(`/doctor/prescriptions/new?patientId=${selectedPatient.id}`);
          break;
        case 'lab':
          navigate(`/doctor/lab-tests/new?patientId=${selectedPatient.id}`);
          break;
        case 'vitals':
          navigate(`/doctor/vitals?patientId=${selectedPatient.id}`);
          break;
        default:
          break;
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Admitted': return 'error';
      case 'Discharged': return 'success';
      case 'Observation': return 'warning';
      default: return 'default';
    }
  };

  const getConditionColor = (condition) => {
    switch(condition) {
      case 'Critical': return '#ef4444';
      case 'Stable': return '#10b981';
      case 'Improving': return '#3b82f6';
      case 'Recovered': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Patient Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and monitor your patients' health records
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<LocalHospital />}
            onClick={() => navigate('/doctor/new-consultation')}
          >
            New Consultation
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
                  {patients.filter(p => p.admissionStatus === 'Admitted').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Admitted</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                <People />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#10b981">
                  {patients.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Patients</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <HealthAndSafety />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#f59e0b">
                  {patients.filter(p => p.condition === 'Critical').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Critical</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                <MonitorHeart />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" fontWeight={700} color="#8b5cf6">
                  {patients.filter(p => p.admissionStatus === 'Discharged').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Discharged</Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}>
                <ArrowForward />
              </Avatar>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search patients by name or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ flex: 1 }}
          />
          <Button
            startIcon={<FilterList />}
            onClick={() => setFilterStatus(filterStatus === 'all' ? 'Admitted' : 'all')}
            variant={filterStatus !== 'all' ? 'contained' : 'outlined'}
          >
            {filterStatus === 'all' ? 'Filter' : 'Admitted Only'}
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="All" 
            onClick={() => setFilterStatus('all')}
            color={filterStatus === 'all' ? 'primary' : 'default'}
          />
          <Chip 
            label="Admitted" 
            onClick={() => setFilterStatus('Admitted')}
            color={filterStatus === 'Admitted' ? 'primary' : 'default'}
          />
          <Chip 
            label="Discharged" 
            onClick={() => setFilterStatus('Discharged')}
            color={filterStatus === 'Discharged' ? 'primary' : 'default'}
          />
          <Chip 
            label="Critical" 
            onClick={() => setFilterStatus('Critical')}
            color={filterStatus === 'Critical' ? 'primary' : 'default'}
          />
        </Stack>
      </Paper>

      {/* Patients Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Age/Gender</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Diagnosis</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Visit</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
                      {patient.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>{patient.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ward: {patient.ward}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography>{patient.age} years</Typography>
                    <Chip 
                      icon={<Transgender fontSize="small" />}
                      label={patient.gender}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24, mt: 0.5 }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={patient.admissionStatus}
                    color={getStatusColor(patient.admissionStatus)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={patient.condition}
                    sx={{ 
                      bgcolor: alpha(getConditionColor(patient.condition), 0.1),
                      color: getConditionColor(patient.condition),
                      fontWeight: 600
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{patient.diagnosis}</Typography>
                  <Chip 
                    icon={<Bloodtype />}
                    label={patient.bloodGroup}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography>{patient.lastVisit}</Typography>
                  {patient.nextAppointment && (
                    <Chip 
                      icon={<AccessTime />}
                      label={`Next: ${patient.nextAppointment}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(patient)}
                        sx={{ color: '#3b82f6' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quick Actions">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleMenuClick(e, patient)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleQuickAction('prescription')}>
          <MedicalServices sx={{ mr: 1 }} /> Write Prescription
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('lab')}>
          <Bloodtype sx={{ mr: 1 }} /> Order Lab Test
        </MenuItem>
        <MenuItem onClick={() => handleQuickAction('vitals')}>
          <MonitorHeart sx={{ mr: 1 }} /> Check Vitals
        </MenuItem>
        <MenuItem onClick={() => navigate(`/doctor/notes?patientId=${selectedPatient?.id}`)}>
          <Edit sx={{ mr: 1 }} /> Add Medical Notes
        </MenuItem>
      </Menu>

      {/* Patient Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md"
        fullWidth
      >
        {selectedPatient && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={600}>
                Patient Details: {selectedPatient.name}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Personal Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Full Name</Typography>
                          <Typography>{selectedPatient.name}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Age & Gender</Typography>
                          <Typography>{selectedPatient.age} years, {selectedPatient.gender}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Contact</Typography>
                          <Stack direction="row" spacing={2}>
                            <Chip icon={<Phone />} label={selectedPatient.phone} size="small" />
                            <Chip icon={<Email />} label={selectedPatient.email} size="small" />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                          <Chip 
                            icon={<Bloodtype />}
                            label={selectedPatient.bloodGroup}
                            color="error"
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Medical Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Current Status</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip 
                              label={selectedPatient.admissionStatus}
                              color={getStatusColor(selectedPatient.admissionStatus)}
                              size="small"
                            />
                            <Chip 
                              label={selectedPatient.condition}
                              sx={{ 
                                bgcolor: alpha(getConditionColor(selectedPatient.condition), 0.1),
                                color: getConditionColor(selectedPatient.condition)
                              }}
                              size="small"
                            />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Ward</Typography>
                          <Typography>{selectedPatient.ward}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Primary Diagnosis</Typography>
                          <Typography fontWeight={600}>{selectedPatient.diagnosis}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Attending Doctor</Typography>
                          <Typography>{selectedPatient.doctor}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="contained" 
                      startIcon={<MedicalServices />}
                      onClick={() => navigate(`/doctor/prescriptions/new?patientId=${selectedPatient.id}`)}
                    >
                      Write Prescription
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<Bloodtype />}
                      onClick={() => navigate(`/doctor/lab-tests/new?patientId=${selectedPatient.id}`)}
                    >
                      Order Lab Test
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<MonitorHeart />}
                      onClick={() => navigate(`/doctor/vitals?patientId=${selectedPatient.id}`)}
                    >
                      Check Vitals
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

export default DoctorPatients;