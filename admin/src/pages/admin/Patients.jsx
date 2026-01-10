import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, Grid, Card, CardContent, Chip, LinearProgress,
  IconButton, Tooltip, alpha, MenuItem, InputAdornment
} from '@mui/material';
import {
  Search, Add, Edit, Delete, Visibility, Person, 
  LocalHospital, CalendarMonth, Bloodtype, EscalatorWarning
} from '@mui/icons-material';
import { BASE_URL } from '../../api/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    isAdmitted: '',
    bloodGroup: '',
    page: 1,
    limit: 10
  });

  // State for Dialogs
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const token = localStorage.getItem('token');

  /* ================= INSIGHTS ================= */
  const insights = useMemo(() => {
    return {
      total: patients.length,
      admitted: patients.filter(p => p.patient?.isAdmitted).length,
      critical: patients.filter(p => p.patient?.admissionStatus === 'Emergency').length,
      newToday: patients.filter(p => {
        const today = new Date().toISOString().split('T')[0];
        return p.user?.createdAt?.startsWith(today);
      }).length
    };
  }, [patients]);

  /* ================= FETCH DATA ================= */
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        ...filters,
      }).toString();

      const res = await fetch(`${BASE_URL}/admin/patients?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPatients(data.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(fetchPatients, 500);
    return () => clearTimeout(handler);
  }, [search, filters]);

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setOpenDetail(true);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Patient Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient records, admissions, and medical history
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          sx={{ borderRadius: 2, px: 3, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }}}
        >
          Register Patient
        </Button>
      </Box>

      {/* Insight Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Patients', value: insights.total, icon: <Person />, color: '#6366f1' },
          { label: 'Currently Admitted', value: insights.admitted, icon: <LocalHospital />, color: '#10b981' },
          { label: 'Emergency Cases', value: insights.critical, icon: <EscalatorWarning />, color: '#ef4444' },
          { label: 'New Registrations', value: insights.newToday, icon: <CalendarMonth />, color: '#f59e0b' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, borderRadius: 2, bgcolor: alpha(stat.color, 0.1), color: stat.color 
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
        />
        <TextField
          select
          size="small"
          label="Blood Group"
          value={filters.bloodGroup}
          onChange={(e) => setFilters({...filters, bloodGroup: e.target.value})}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
            <MenuItem key={bg} value={bg}>{bg}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={filters.isAdmitted}
          onChange={(e) => setFilters({...filters, isAdmitted: e.target.value})}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="true">Admitted</MenuItem>
          <MenuItem value="false">Outpatient</MenuItem>
        </TextField>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        {loading && <LinearProgress sx={{ bgcolor: alpha('#6366f1', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />}
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Patient Info</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Blood Group</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Admission</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ward/Bed</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((row) => (
              <TableRow key={row.user.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{row.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Age: {row.patient.age} | {row.patient.gender}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.user.phone}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.user.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={row.patient.bloodGroup} 
                    size="small" 
                    icon={<Bloodtype sx={{ fontSize: '14px !important' }} />}
                    sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={row.patient.isAdmitted ? 'Admitted' : 'Discharged'}
                    size="small"
                    color={row.patient.isAdmitted ? 'success' : 'default'}
                    variant={row.patient.isAdmitted ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  {row.patient.isAdmitted ? (
                    <Typography variant="body2">
                      {row.admissionInfo?.ward?.name} / <strong>{row.patient.bedNumber}</strong>
                    </Typography>
                  ) : '--'}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="View Medical History">
                      <IconButton size="small" onClick={() => handleViewDetails(row)} color="primary">
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" color="info">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Details Dialog (Simplified) */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', mb: 2 }}>
          Patient Medical Profile
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">General Information</Typography>
                <Typography><strong>Name:</strong> {selectedPatient.user.name}</Typography>
                <Typography><strong>Address:</strong> {selectedPatient.patient.address}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Latest Vitals</Typography>
                <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="body2">Temp: {selectedPatient.latestVitals?.temperature}°C</Typography>
                  <Typography variant="body2">BP: {selectedPatient.latestVitals?.bloodPressure?.systolic}/{selectedPatient.latestVitals?.bloodPressure?.diastolic}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;