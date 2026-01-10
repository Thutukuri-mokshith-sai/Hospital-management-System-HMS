import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  LocalHospital,
  CalendarToday,
  Assignment,
  Science,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Add,
  Search,
  BarChart,
  Person,
  Phone,
  Email,
  Visibility,
  Medication,
  AccessTime,
  Star
} from '@mui/icons-material';

import { BASE_URL } from '../../api/api';

const defaultDoctor = {
  userId: '',
  specialization: '',
  department: ''
};

const specializations = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Psychiatry',
  'Emergency Medicine',
  'General Surgery',
  'Internal Medicine',
  'Gynecology',
  'Urology',
  'Ophthalmology',
  'ENT',
  'Radiology'
];

const departments = [
  'Cardiac Care Unit',
  'Neurology Department',
  'Pediatric Ward',
  'Orthopedic Department',
  'Dermatology Clinic',
  'Psychiatric Ward',
  'Emergency Department',
  'Surgery Department',
  'General Medicine',
  'Gynecology Department',
  'Urology Clinic',
  'Eye Care Center',
  'ENT Department',
  'Radiology Department'
];

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(defaultDoctor);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [doctorStats, setDoctorStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const token = localStorage.getItem('token');

  // Calculate insights from doctor data
  const insights = React.useMemo(() => {
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.user?.isActive !== false).length;
    
    // Specialization distribution
    const specializationCount = {};
    doctors.forEach(d => {
      const spec = d.doctor?.specialization || 'Unknown';
      specializationCount[spec] = (specializationCount[spec] || 0) + 1;
    });
    
    // Department distribution
    const departmentCount = {};
    doctors.forEach(d => {
      const dept = d.doctor?.department || 'Unknown';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });
    
    // Calculate average appointments
    const totalAppointments = doctors.reduce((sum, d) => 
      sum + (d.statistics?.totalAppointments || 0), 0
    );
    const avgAppointments = totalDoctors > 0 ? (totalAppointments / totalDoctors).toFixed(0) : 0;
    
    // Most common specialization
    const mostCommonSpecialization = Object.keys(specializationCount).reduce((a, b) => 
      specializationCount[a] > specializationCount[b] ? a : 'N/A', ''
    );
    
    const availabilityRate = totalDoctors > 0 ? ((activeDoctors / totalDoctors) * 100).toFixed(1) : 0;
    
    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors: totalDoctors - activeDoctors,
      totalAppointments,
      avgAppointments,
      specializationCount,
      departmentCount,
      availabilityRate,
      mostCommonSpecialization,
      mostCommonDepartment: Object.keys(departmentCount).reduce((a, b) => 
        departmentCount[a] > departmentCount[b] ? a : 'N/A', ''
      )
    };
  }, [doctors]);

  /* ================= FETCH DOCTORS ================= */
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (specializationFilter) params.append('specialization', specializationFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      params.append('limit', '50'); // Get more doctors for better insights

      const res = await fetch(`${BASE_URL}/admin/doctors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch doctors');
      }

      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error('Fetch doctors error:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH DOCTOR STATS ================= */
  const fetchDoctorStats = async (doctorId) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch doctor statistics');
      }

      const data = await res.json();
      setDoctorStats(data.data || null);
    } catch (error) {
      console.error('Fetch doctor stats error:', error);
      setDoctorStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, specializationFilter, departmentFilter]);

  /* ================= DIALOG HANDLERS ================= */
  const openDialog = (doctor = null) => {
    if (doctor) {
      setCurrentDoctor({
        userId: doctor.user?._id || '',
        specialization: doctor.doctor?.specialization || '',
        department: doctor.doctor?.department || ''
      });
      setEditing(true);
    } else {
      setCurrentDoctor(defaultDoctor);
      setEditing(false);
    }
    setOpen(true);
  };

  const openViewDialog = async (doctor) => {
    setSelectedDoctor(doctor);
    setOpenView(true);
    await fetchDoctorStats(doctor.user?._id);
  };

  /* ================= CREATE DOCTOR PROFILE ================= */
  const saveDoctor = async () => {
    try {
      const url = `${BASE_URL}/doctors/${currentDoctor.userId}/profile`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          specialization: currentDoctor.specialization,
          department: currentDoctor.department
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save doctor profile');
      }

      setOpen(false);
      fetchDoctors();
      alert(data.message || 'Doctor profile created successfully!');
    } catch (error) {
      console.error('Save doctor error:', error);
      alert(error.message);
    }
  };

  /* ================= UPDATE DOCTOR PROFILE ================= */
  const updateDoctor = async () => {
    try {
      const url = `${BASE_URL}/doctors/${selectedDoctor.doctor._id}/profile`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          specialization: currentDoctor.specialization,
          department: currentDoctor.department,
          name: selectedDoctor.user.name,
          email: selectedDoctor.user.email,
          phone: selectedDoctor.user.phone
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update doctor profile');
      }

      setOpen(false);
      fetchDoctors();
      alert(data.message || 'Doctor profile updated successfully!');
    } catch (error) {
      console.error('Update doctor error:', error);
      alert(error.message);
    }
  };

  /* ================= DELETE DOCTOR PROFILE ================= */
  const deleteDoctorProfile = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor profile? The user will be changed to patient role.')) return;

    try {
      const res = await fetch(`${BASE_URL}/doctors/${doctorId}/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete doctor profile');
      }

      fetchDoctors();
      alert(data.message || 'Doctor profile deleted successfully!');
    } catch (error) {
      console.error('Delete doctor error:', error);
      alert(error.message);
    }
  };

  /* ================= TOGGLE USER STATUS ================= */
  const toggleUserStatus = async (doctor) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${doctor.user._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !doctor.user.isActive })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      fetchDoctors();
    } catch (error) {
      console.error('Toggle status error:', error);
      alert(error.message);
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'Cardiology': '#ef4444',
      'Neurology': '#6366f1',
      'Pediatrics': '#10b981',
      'Orthopedics': '#f59e0b',
      'Dermatology': '#ec4899',
      'Psychiatry': '#8b5cf6',
      'Emergency Medicine': '#f97316',
      'General Surgery': '#3b82f6',
      'Internal Medicine': '#84cc16',
      'Gynecology': '#f43f5e',
      'Urology': '#06b6d4',
      'Ophthalmology': '#8b5cf6',
      'ENT': '#14b8a6',
      'Radiology': '#64748b'
    };
    return colors[specialization] || '#6b7280';
  };

  const getStatusColor = (status) => {
    return status === 'Completed' ? '#10b981' : 
           status === 'Scheduled' ? '#3b82f6' : 
           status === 'Cancelled' ? '#ef4444' : '#6b7280';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Doctor Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage hospital doctors efficiently
        </Typography>
      </Box>

      {/* Insights Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Doctors
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalDoctors}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 16 }} />
                    <Typography variant="caption">Active: {insights.activeDoctors}</Typography>
                  </Box>
                </Box>
                <LocalHospital sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Appointments
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalAppointments}
                  </Typography>
                  <Typography variant="caption">
                    Avg: {insights.avgAppointments} per doctor
                  </Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Availability Rate
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.availabilityRate}%
                  </Typography>
                  <Typography variant="caption">
                    {insights.inactiveDoctors} inactive
                  </Typography>
                </Box>
                <BarChart sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={insights.availabilityRate} 
                sx={{ 
                  mt: 2, 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Top Specialty
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.mostCommonSpecialization}
                  </Typography>
                  <Typography variant="caption">
                    {insights.specializationCount[insights.mostCommonSpecialization] || 0} doctors
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Specialty Distribution */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Specialty Distribution
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(insights.specializationCount).map(([specialty, count]) => (
            <Grid item xs={12} sm={6} md={4} key={specialty}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getSpecializationColor(specialty)
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {specialty}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(count / insights.totalDoctors) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mt: 0.5,
                      bgcolor: alpha(getSpecializationColor(specialty), 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSpecializationColor(specialty)
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {count}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Filters + Search + Add */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <TextField
          size="small"
          placeholder="Search doctors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ 
            flex: 1,
            maxWidth: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Specialization</InputLabel>
          <Select
            value={specializationFilter}
            label="Specialization"
            onChange={(e) => setSpecializationFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Specializations</MenuItem>
            {specializations.map(spec => (
              <MenuItem key={spec} value={spec}>{spec}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={departmentFilter}
            label="Department"
            onChange={(e) => setDepartmentFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map(dept => (
              <MenuItem key={dept} value={dept}>{dept}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => openDialog()}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
            }
          }}
        >
          Add Doctor Profile
        </Button>
      </Stack>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Doctor Details</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Appointments</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {doctors.map((doctor) => (
              <TableRow 
                key={doctor.user?._id}
                sx={{ 
                  '&:hover': { bgcolor: '#f8fafc' },
                  transition: 'background-color 0.2s'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getSpecializationColor(doctor.doctor?.specialization),
                        width: 40,
                        height: 40
                      }}
                    >
                      {doctor.user?.name?.charAt(0) || 'D'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                        {doctor.user?.name || 'Unknown Doctor'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {doctor.user?.email}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {doctor.user?.phone || 'No phone'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={doctor.doctor?.specialization || 'Not specified'}
                    size="small"
                    sx={{
                      bgcolor: alpha(getSpecializationColor(doctor.doctor?.specialization), 0.1),
                      color: getSpecializationColor(doctor.doctor?.specialization),
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {doctor.doctor?.department || 'Not assigned'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography fontWeight={600}>
                      {doctor.statistics?.totalAppointments || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      appointments
                    </Typography>
                  </Box>
                  {doctor.statistics?.appointmentStats && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {doctor.statistics.appointmentStats.map((stat, idx) => (
                        <Chip
                          key={idx}
                          label={`${stat._id}: ${stat.count}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: alpha(getStatusColor(stat._id), 0.1),
                            color: getStatusColor(stat._id)
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={doctor.user?.isActive !== false}
                      onChange={() => toggleUserStatus(doctor)}
                      size="small"
                    />
                    {doctor.user?.isActive !== false ? (
                      <Chip 
                        icon={<CheckCircle />}
                        label="Active" 
                        size="small" 
                        color="success"
                        sx={{ height: 24 }}
                      />
                    ) : (
                      <Chip 
                        icon={<Cancel />}
                        label="Inactive" 
                        size="small" 
                        color="error"
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => openViewDialog(doctor)}
                        sx={{ color: '#3b82f6' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Profile">
                      <IconButton 
                        size="small" 
                        onClick={() => openDialog(doctor)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Profile">
                      <IconButton
                        size="small"
                        onClick={() => deleteDoctorProfile(doctor.doctor?._id)}
                        sx={{ color: '#ef4444' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {doctors.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <LocalHospital sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No doctors found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Try adjusting your search' : 'Add your first doctor profile to get started'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add / Edit Doctor Profile Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {editing ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="User ID"
              value={currentDoctor.userId}
              onChange={(e) =>
                setCurrentDoctor({ ...currentDoctor, userId: e.target.value })
              }
              fullWidth
              placeholder="Enter user ID to assign doctor profile"
              disabled={editing}
              helperText="Enter the existing user ID to create doctor profile"
            />
            <FormControl fullWidth>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={currentDoctor.specialization}
                label="Specialization"
                onChange={(e) =>
                  setCurrentDoctor({ ...currentDoctor, specialization: e.target.value })
                }
              >
                {specializations.map(spec => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={currentDoctor.department}
                label="Department"
                onChange={(e) =>
                  setCurrentDoctor({ ...currentDoctor, department: e.target.value })
                }
              >
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={editing ? updateDoctor : saveDoctor}
            disabled={!currentDoctor.userId || !currentDoctor.specialization || !currentDoctor.department}
            sx={{
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
              }
            }}
          >
            {editing ? 'Update Profile' : 'Create Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Doctor Details Dialog */}
      <Dialog 
        open={openView} 
        onClose={() => setOpenView(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        {selectedDoctor && (
          <>
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
              Doctor Details
            </DialogTitle>
            <DialogContent>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {/* Doctor Profile Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getSpecializationColor(selectedDoctor.doctor?.specialization),
                        width: 80,
                        height: 80,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedDoctor.user?.name?.charAt(0) || 'D'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                        {selectedDoctor.user?.name}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography>{selectedDoctor.user?.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography>{selectedDoctor.user?.phone || 'No phone number'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Chip
                              label={selectedDoctor.doctor?.specialization}
                              sx={{
                                bgcolor: alpha(getSpecializationColor(selectedDoctor.doctor?.specialization), 0.1),
                                color: getSpecializationColor(selectedDoctor.doctor?.specialization),
                                fontWeight: 600,
                                justifySelf: 'flex-start'
                              }}
                            />
                            <Typography variant="body2">
                              <strong>Department:</strong> {selectedDoctor.doctor?.department}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                      <Tab label="Overview" />
                      <Tab label="Statistics" />
                      <Tab label="Appointments" />
                    </Tabs>
                  </Box>

                  {/* Tab Content */}
                  {activeTab === 0 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Quick Stats
                          </Typography>
                          {doctorStats?.overview ? (
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Total Appointments</Typography>
                                <Typography fontWeight={600}>{doctorStats.overview.totalAppointments}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Today's Appointments</Typography>
                                <Typography fontWeight={600}>{doctorStats.overview.todayAppointments}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Total Prescriptions</Typography>
                                <Typography fontWeight={600}>{doctorStats.overview.totalPrescriptions}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Average Rating</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Star sx={{ color: '#fbbf24', fontSize: 16 }} />
                                  <Typography fontWeight={600}>{doctorStats.overview.avgRating}</Typography>
                                </Box>
                              </Box>
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" align="center" py={2}>
                              No statistics available
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Upcoming Appointments
                          </Typography>
                          {doctorStats?.upcomingAppointments && doctorStats.upcomingAppointments.length > 0 ? (
                            <Stack spacing={2}>
                              {doctorStats.upcomingAppointments.slice(0, 3).map((appt, idx) => (
                                <Box key={idx} sx={{ 
                                  p: 2, 
                                  borderRadius: 1, 
                                  bgcolor: alpha('#3b82f6', 0.05),
                                  borderLeft: 3,
                                  borderColor: '#3b82f6'
                                }}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {appt.patientId?.userId?.name || 'Unknown Patient'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(appt.date).toLocaleDateString()} at {appt.time}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {appt.reason}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" align="center" py={2}>
                              No upcoming appointments
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && doctorStats && (
                    <Grid container spacing={3}>
                      {/* Appointment Statistics */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Appointment Distribution
                          </Typography>
                          {doctorStats.appointmentStats?.statusDistribution?.map((stat, idx) => (
                            <Box key={idx} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{stat._id}</Typography>
                                <Typography variant="body2" fontWeight={600}>{stat.count}</Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(stat.count / doctorStats.overview.totalAppointments) * 100}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: alpha(getStatusColor(stat._id), 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getStatusColor(stat._id),
                                    borderRadius: 4
                                  }
                                }}
                              />
                            </Box>
                          ))}
                        </Paper>
                      </Grid>

                      {/* Prescription Statistics */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Top Medicines Prescribed
                          </Typography>
                          {doctorStats.prescriptions?.topMedicines?.map((medicine, idx) => (
                            <Box key={idx} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{medicine._id}</Typography>
                                <Typography variant="body2" fontWeight={600}>{medicine.count}</Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(medicine.count / doctorStats.overview.totalPrescriptions) * 100}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: alpha('#10b981', 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: '#10b981',
                                    borderRadius: 4
                                  }
                                }}
                              />
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 2 && (
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Recent Appointments
                      </Typography>
                      {doctorStats?.upcomingAppointments && doctorStats.upcomingAppointments.length > 0 ? (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Patient</TableCell>
                              <TableCell>Date & Time</TableCell>
                              <TableCell>Reason</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {doctorStats.upcomingAppointments.slice(0, 5).map((appt, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {appt.patientId?.userId?.name || 'Unknown'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(appt.date).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {appt.time}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{appt.reason}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={appt.status}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(getStatusColor(appt.status), 0.1),
                                      color: getStatusColor(appt.status)
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Typography color="text.secondary" align="center" py={2}>
                          No appointment data available
                        </Typography>
                      )}
                    </Paper>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setOpenView(false)}
                sx={{ textTransform: 'none' }}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setOpenView(false);
                  openDialog(selectedDoctor);
                }}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
                  }
                }}
              >
                Edit Profile
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Doctors;