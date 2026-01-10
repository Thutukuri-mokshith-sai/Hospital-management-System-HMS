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
  Alert,
  Autocomplete,
  InputAdornment
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
  Star,
  MedicalServices,
  Nightlight,
  WbSunny,
  Bed,
  MonitorHeart,
  History
} from '@mui/icons-material';

import { BASE_URL } from '../../api/api';

const defaultNurse = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  licenseNumber: '',
  wardId: '',
  shift: 'Morning',
  experience: 1,
  employeeId: ''
};

const specializations = [
  'ICU',
  'Emergency',
  'Pediatric',
  'Maternity',
  'Surgery',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Orthopedic',
  'Geriatric',
  'General',
  'Psychiatric',
  'Operating Room',
  'Recovery Room'
];

const shifts = ['Morning', 'Evening', 'Night', 'Rotating'];

const Nurses = () => {
  const [nurses, setNurses] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentNurse, setCurrentNurse] = useState(defaultNurse);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [nurseDetails, setNurseDetails] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [wards, setWards] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const token = localStorage.getItem('token');

  // Calculate insights from nurse data
  const insights = React.useMemo(() => {
    const totalNurses = nurses.length;
    const activeNurses = nurses.filter(n => n.user?.isActive !== false).length;
    
    // Specialization distribution
    const specializationCount = {};
    nurses.forEach(n => {
      const spec = n.nurse?.specialization || 'General';
      specializationCount[spec] = (specializationCount[spec] || 0) + 1;
    });
    
    // Shift distribution
    const shiftCount = {};
    nurses.forEach(n => {
      const shift = n.nurse?.shift || 'Morning';
      shiftCount[shift] = (shiftCount[shift] || 0) + 1;
    });
    
    // Calculate average tasks
    const totalCareTasks = nurses.reduce((sum, n) => 
      sum + (n.statistics?.totalCareTasks || 0), 0
    );
    const avgTasks = totalNurses > 0 ? (totalCareTasks / totalNurses).toFixed(0) : 0;
    
    // Total vitals recorded
    const totalVitals = nurses.reduce((sum, n) => 
      sum + (n.statistics?.totalVitalsRecorded || 0), 0
    );
    
    const mostCommonSpecialization = Object.keys(specializationCount).reduce((a, b) => 
      specializationCount[a] > specializationCount[b] ? a : 'N/A', ''
    );
    
    const availabilityRate = totalNurses > 0 ? ((activeNurses / totalNurses) * 100).toFixed(1) : 0;
    
    return {
      totalNurses,
      activeNurses,
      inactiveNurses: totalNurses - activeNurses,
      totalCareTasks,
      avgTasks,
      totalVitals,
      specializationCount,
      shiftCount,
      availabilityRate,
      mostCommonSpecialization,
      mostCommonShift: Object.keys(shiftCount).reduce((a, b) => 
        shiftCount[a] > shiftCount[b] ? a : 'N/A', ''
      )
    };
  }, [nurses]);

  /* ================= FETCH WARDS ================= */
  const fetchWards = async () => {
    try {
      const res = await fetch(`${BASE_URL}/wards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setWards(data.data || []);
      }
    } catch (error) {
      console.error('Fetch wards error:', error);
    }
  };

  /* ================= FETCH NURSES ================= */
  const fetchNurses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (specializationFilter) params.append('specialization', specializationFilter);
      if (shiftFilter) params.append('shift', shiftFilter);
      if (wardFilter) params.append('wardId', wardFilter);
      if (statusFilter !== '') params.append('isActive', statusFilter);
      params.append('limit', '50');

      const res = await fetch(`${BASE_URL}/admin/nurses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch nurses');
      }

      const data = await res.json();
      setNurses(data.data || []);
    } catch (error) {
      console.error('Fetch nurses error:', error);
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH NURSE DETAILS ================= */
  const fetchNurseDetails = async (nurseId) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/nurses/${nurseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch nurse details');
      }

      const data = await res.json();
      setNurseDetails(data.data || null);
    } catch (error) {
      console.error('Fetch nurse details error:', error);
      setNurseDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNurses();
      fetchWards();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, specializationFilter, shiftFilter, wardFilter, statusFilter]);

  /* ================= DIALOG HANDLERS ================= */
  const openDialog = (nurse = null) => {
    if (nurse) {
      setCurrentNurse({
        name: nurse.user?.name || '',
        email: nurse.user?.email || '',
        password: '',
        phone: nurse.user?.phone || '',
        specialization: nurse.nurse?.specialization || '',
        licenseNumber: nurse.nurse?.licenseNumber || '',
        wardId: nurse.nurse?.wardId?._id || nurse.nurse?.wardId || '',
        shift: nurse.nurse?.shift || 'Morning',
        experience: nurse.nurse?.experience || 1,
        employeeId: nurse.nurse?.employeeId || ''
      });
      setEditing(true);
    } else {
      setCurrentNurse(defaultNurse);
      setEditing(false);
    }
    setOpen(true);
  };

  const openViewDialog = async (nurse) => {
    setSelectedNurse(nurse);
    setOpenView(true);
    await fetchNurseDetails(nurse.user?._id);
  };

  /* ================= CREATE NURSE ================= */
  const saveNurse = async () => {
    try {
      const url = `${BASE_URL}/admin/nurses`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentNurse)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create nurse');
      }

      setOpen(false);
      fetchNurses();
      alert(data.message || 'Nurse created successfully!');
    } catch (error) {
      console.error('Save nurse error:', error);
      alert(error.message);
    }
  };

  /* ================= UPDATE NURSE ================= */
  const updateNurse = async () => {
    try {
      const url = `${BASE_URL}/admin/nurses/${selectedNurse.user._id}`;

      // Don't send password if not changed
      const updateData = { ...currentNurse };
      if (!updateData.password) {
        delete updateData.password;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update nurse');
      }

      setOpen(false);
      fetchNurses();
      alert(data.message || 'Nurse updated successfully!');
    } catch (error) {
      console.error('Update nurse error:', error);
      alert(error.message);
    }
  };

  /* ================= DELETE NURSE ================= */
  const deleteNurse = async (nurseId) => {
    if (!window.confirm('Are you sure you want to delete this nurse? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/nurses/${nurseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete nurse');
      }

      fetchNurses();
      alert(data.message || 'Nurse deleted successfully!');
    } catch (error) {
      console.error('Delete nurse error:', error);
      alert(error.message);
    }
  };

  /* ================= TOGGLE NURSE STATUS ================= */
  const toggleNurseStatus = async (nurse) => {
    try {
      const url = `${BASE_URL}/admin/nurses/${nurse.user._id}`;
      const isActive = !(nurse.user?.isActive !== false);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update nurse status');
      }

      fetchNurses();
    } catch (error) {
      console.error('Toggle status error:', error);
      alert(error.message);
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'ICU': '#ef4444',
      'Emergency': '#f97316',
      'Pediatric': '#10b981',
      'Maternity': '#ec4899',
      'Surgery': '#3b82f6',
      'Cardiology': '#dc2626',
      'Neurology': '#6366f1',
      'Oncology': '#7c3aed',
      'Orthopedic': '#f59e0b',
      'Geriatric': '#64748b',
      'General': '#6b7280',
      'Psychiatric': '#8b5cf6',
      'Operating Room': '#0ea5e9',
      'Recovery Room': '#14b8a6'
    };
    return colors[specialization] || '#6b7280';
  };

  const getShiftColor = (shift) => {
    const colors = {
      'Morning': '#fbbf24',
      'Evening': '#f97316',
      'Night': '#6366f1',
      'Rotating': '#8b5cf6'
    };
    return colors[shift] || '#6b7280';
  };

  const getShiftIcon = (shift) => {
    const icons = {
      'Morning': <WbSunny />,
      'Evening': <AccessTime />,
      'Night': <Nightlight />,
      'Rotating': <History />
    };
    return icons[shift] || <AccessTime />;
  };

  const getStatusColor = (status) => {
    return status === 'Completed' ? '#10b981' : 
           status === 'Scheduled' ? '#3b82f6' : 
           status === 'In Progress' ? '#f59e0b' : 
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
          Nurse Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage hospital nursing staff efficiently
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
                    Total Nurses
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalNurses}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 16 }} />
                    <Typography variant="caption">Active: {insights.activeNurses}</Typography>
                  </Box>
                </Box>
                <MedicalServices sx={{ fontSize: 48, opacity: 0.3 }} />
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
                    Total Care Tasks
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalCareTasks}
                  </Typography>
                  <Typography variant="caption">
                    Avg: {insights.avgTasks} per nurse
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
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
                    Vitals Recorded
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalVitals}
                  </Typography>
                  <Typography variant="caption">
                    Daily average: {(insights.totalVitals / 30).toFixed(0)}
                  </Typography>
                </Box>
                <MonitorHeart sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
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
                    Top Specialization
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.mostCommonSpecialization}
                  </Typography>
                  <Typography variant="caption">
                    {insights.specializationCount[insights.mostCommonSpecialization] || 0} nurses
                  </Typography>
                </Box>
                <MedicalServices sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Specialization Distribution */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Specialization Distribution
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
                    value={(count / insights.totalNurses) * 100}
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
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search nurses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ 
            flex: 1,
            minWidth: 200,
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

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Shift</InputLabel>
          <Select
            value={shiftFilter}
            label="Shift"
            onChange={(e) => setShiftFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Shifts</MenuItem>
            {shifts.map(shift => (
              <MenuItem key={shift} value={shift}>{shift}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Ward</InputLabel>
          <Select
            value={wardFilter}
            label="Ward"
            onChange={(e) => setWardFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Wards</MenuItem>
            {wards.map(ward => (
              <MenuItem key={ward._id} value={ward._id}>
                {ward.name} (Floor {ward.floor})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
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
          Add Nurse
        </Button>
      </Stack>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Nurse Details</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Specialization</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ward & Shift</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Statistics</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {nurses.map((nurse) => (
              <TableRow 
                key={nurse.user?._id}
                sx={{ 
                  '&:hover': { bgcolor: '#f8fafc' },
                  transition: 'background-color 0.2s'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getSpecializationColor(nurse.nurse?.specialization),
                        width: 40,
                        height: 40
                      }}
                    >
                      {nurse.user?.name?.charAt(0) || 'N'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                        {nurse.user?.name || 'Unknown Nurse'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {nurse.user?.email}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {nurse.user?.phone || 'No phone'}
                        </Typography>
                      </Stack>
                      {nurse.nurse?.employeeId && (
                        <Chip
                          label={`ID: ${nurse.nurse.employeeId}`}
                          size="small"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem', 
                            mt: 0.5,
                            bgcolor: alpha('#3b82f6', 0.1),
                            color: '#3b82f6'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={nurse.nurse?.specialization || 'General'}
                    size="small"
                    sx={{
                      bgcolor: alpha(getSpecializationColor(nurse.nurse?.specialization), 0.1),
                      color: getSpecializationColor(nurse.nurse?.specialization),
                      fontWeight: 500
                    }}
                  />
                  {nurse.nurse?.experience > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {nurse.nurse.experience} yrs experience
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {nurse.nurse?.wardId && (
                      <Chip
                        icon={<Bed fontSize="small" />}
                        label={typeof nurse.nurse.wardId === 'object' 
                          ? `${nurse.nurse.wardId.name} (Floor ${nurse.nurse.wardId.floor})`
                          : 'Ward assigned'
                        }
                        size="small"
                        sx={{ 
                          bgcolor: alpha('#10b981', 0.1),
                          color: '#10b981',
                          justifyContent: 'flex-start'
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        color: getShiftColor(nurse.nurse?.shift),
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {getShiftIcon(nurse.nurse?.shift)}
                      </Box>
                      <Typography variant="body2" color={getShiftColor(nurse.nurse?.shift)}>
                        {nurse.nurse?.shift || 'Morning'} Shift
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography fontWeight={600} variant="body2">
                        {nurse.statistics?.totalCareTasks || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        care tasks
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonitorHeart sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography fontWeight={600} variant="body2">
                        {nurse.statistics?.totalVitalsRecorded || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vitals
                      </Typography>
                    </Box>
                    {nurse.statistics?.careStats && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                        {nurse.statistics.careStats.slice(0, 2).map((stat, idx) => (
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
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={nurse.user?.isActive !== false}
                      onChange={() => toggleNurseStatus(nurse)}
                      size="small"
                    />
                    {nurse.user?.isActive !== false ? (
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
                        onClick={() => openViewDialog(nurse)}
                        sx={{ color: '#3b82f6' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Nurse">
                      <IconButton 
                        size="small" 
                        onClick={() => openDialog(nurse)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Nurse">
                      <IconButton
                        size="small"
                        onClick={() => deleteNurse(nurse.user?._id)}
                        sx={{ color: '#ef4444' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {nurses.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <MedicalServices sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No nurses found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Try adjusting your search' : 'Add your first nurse to get started'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add / Edit Nurse Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {editing ? 'Edit Nurse' : 'Add New Nurse'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Personal Information
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Full Name"
                  value={currentNurse.name}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, name: e.target.value })
                  }
                  fullWidth
                  required
                />
                <TextField
                  label="Email Address"
                  type="email"
                  value={currentNurse.email}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, email: e.target.value })
                  }
                  fullWidth
                  required
                  disabled={editing}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={currentNurse.password}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, password: e.target.value })
                  }
                  fullWidth
                  required={!editing}
                  helperText={editing ? "Leave blank to keep current password" : ""}
                />
                <TextField
                  label="Phone Number"
                  value={currentNurse.phone}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, phone: e.target.value })
                  }
                  fullWidth
                />
                <TextField
                  label="Employee ID"
                  value={currentNurse.employeeId}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, employeeId: e.target.value })
                  }
                  fullWidth
                  placeholder="NUR00123"
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Professional Information
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={currentNurse.specialization}
                    label="Specialization"
                    onChange={(e) =>
                      setCurrentNurse({ ...currentNurse, specialization: e.target.value })
                    }
                  >
                    {specializations.map(spec => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="License Number"
                  value={currentNurse.licenseNumber}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, licenseNumber: e.target.value })
                  }
                  fullWidth
                  required
                  placeholder="RN123456"
                />

                <FormControl fullWidth>
                  <InputLabel>Ward Assignment</InputLabel>
                  <Select
                    value={currentNurse.wardId}
                    label="Ward Assignment"
                    onChange={(e) =>
                      setCurrentNurse({ ...currentNurse, wardId: e.target.value })
                    }
                  >
                    {wards.map(ward => (
                      <MenuItem key={ward._id} value={ward._id}>
                        {ward.name} (Floor {ward.floor}) - {ward.specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={currentNurse.shift}
                    label="Shift"
                    onChange={(e) =>
                      setCurrentNurse({ ...currentNurse, shift: e.target.value })
                    }
                  >
                    {shifts.map(shift => (
                      <MenuItem key={shift} value={shift}>{shift}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Experience (Years)"
                  type="number"
                  value={currentNurse.experience}
                  onChange={(e) =>
                    setCurrentNurse({ ...currentNurse, experience: Number(e.target.value) })
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 50 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">years</InputAdornment>
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
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
            onClick={editing ? updateNurse : saveNurse}
            disabled={!currentNurse.name || !currentNurse.email || 
              (!editing && !currentNurse.password) || !currentNurse.licenseNumber || !currentNurse.wardId}
            sx={{
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
              }
            }}
          >
            {editing ? 'Update Nurse' : 'Create Nurse'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Nurse Details Dialog */}
      <Dialog 
        open={openView} 
        onClose={() => setOpenView(false)} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        {selectedNurse && (
          <>
            <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
              Nurse Details
            </DialogTitle>
            <DialogContent>
              {detailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {/* Nurse Profile Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 3, 
                    mb: 4, 
                    pb: 3, 
                    borderBottom: 1, 
                    borderColor: 'divider' 
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getSpecializationColor(selectedNurse.nurse?.specialization),
                        width: 80,
                        height: 80,
                        fontSize: '2rem'
                      }}
                    >
                      {selectedNurse.user?.name?.charAt(0) || 'N'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                            {selectedNurse.user?.name}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                            <Chip
                              label={selectedNurse.nurse?.specialization}
                              sx={{
                                bgcolor: alpha(getSpecializationColor(selectedNurse.nurse?.specialization), 0.1),
                                color: getSpecializationColor(selectedNurse.nurse?.specialization),
                                fontWeight: 600
                              }}
                            />
                            <Chip
                              icon={getShiftIcon(selectedNurse.nurse?.shift)}
                              label={`${selectedNurse.nurse?.shift} Shift`}
                              sx={{
                                bgcolor: alpha(getShiftColor(selectedNurse.nurse?.shift), 0.1),
                                color: getShiftColor(selectedNurse.nurse?.shift)
                              }}
                            />
                            {selectedNurse.nurse?.employeeId && (
                              <Chip
                                label={`ID: ${selectedNurse.nurse.employeeId}`}
                                size="small"
                                sx={{
                                  bgcolor: alpha('#3b82f6', 0.1),
                                  color: '#3b82f6'
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            License: {selectedNurse.nurse?.licenseNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Experience: {selectedNurse.nurse?.experience || 0} years
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography>{selectedNurse.user?.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography>{selectedNurse.user?.phone || 'No phone number'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          {nurseDetails?.assignedWard && (
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: 1, 
                              bgcolor: alpha('#10b981', 0.05),
                              borderLeft: 3,
                              borderColor: '#10b981'
                            }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                Assigned Ward
                              </Typography>
                              <Typography variant="body2">
                                {nurseDetails.assignedWard.ward?.name} 
                                {nurseDetails.assignedWard.ward?.floor && ` (Floor ${nurseDetails.assignedWard.ward.floor})`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {nurseDetails.assignedWard.patientCount || 0} patients currently
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  {/* Tabs */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                      <Tab label="Statistics" />
                      <Tab label="Recent Activities" />
                      <Tab label="Ward Details" />
                    </Tabs>
                  </Box>

                  {/* Tab Content */}
                  {activeTab === 0 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Performance Statistics
                          </Typography>
                          {nurseDetails?.statistics ? (
                            <Stack spacing={3}>
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Total Care Tasks</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.statistics.totalCareTasks}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Vitals Recorded</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.statistics.totalVitalsRecorded}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Unique Patients</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.statistics.uniquePatients || 0}</Typography>
                                </Box>
                              </Box>
                              
                              {nurseDetails.statistics.careDistribution && (
                                <Box>
                                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Care Task Distribution
                                  </Typography>
                                  {nurseDetails.statistics.careDistribution.map((stat, idx) => (
                                    <Box key={idx} sx={{ mb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{stat._id}</Typography>
                                        <Typography variant="body2" fontWeight={600}>{stat.count}</Typography>
                                      </Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={(stat.count / nurseDetails.statistics.totalCareTasks) * 100}
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
                                </Box>
                              )}
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
                            Shift Activity
                          </Typography>
                          {nurseDetails?.statistics?.shiftActivity && nurseDetails.statistics.shiftActivity.length > 0 ? (
                            <Stack spacing={2}>
                              {nurseDetails.statistics.shiftActivity.map((activity, idx) => (
                                <Box key={idx}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">{activity._id}:00</Typography>
                                    <Typography variant="body2" fontWeight={600}>{activity.count} tasks</Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(activity.count / Math.max(...nurseDetails.statistics.shiftActivity.map(a => a.count))) * 100}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: alpha('#3b82f6', 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: '#3b82f6',
                                        borderRadius: 4
                                      }
                                    }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" align="center" py={2}>
                              No shift activity data
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Grid container spacing={3}>
                      {/* Recent Nursing Care */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Recent Nursing Care
                          </Typography>
                          {nurseDetails?.recentActivities?.nursingCare && 
                           nurseDetails.recentActivities.nursingCare.length > 0 ? (
                            <Stack spacing={2}>
                              {nurseDetails.recentActivities.nursingCare.slice(0, 5).map((care, idx) => (
                                <Box key={idx} sx={{ 
                                  p: 2, 
                                  borderRadius: 1, 
                                  bgcolor: alpha('#3b82f6', 0.05),
                                  borderLeft: 3,
                                  borderColor: getStatusColor(care.status)
                                }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {care.careType}
                                    </Typography>
                                    <Chip
                                      label={care.status}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(getStatusColor(care.status), 0.1),
                                        color: getStatusColor(care.status)
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {care.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Patient: {care.patientId?.userId?.name || 'Unknown'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(care.createdAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" align="center" py={2}>
                              No recent nursing care activities
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* Recent Vitals Records */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Recent Vitals Records
                          </Typography>
                          {nurseDetails?.recentActivities?.vitalsRecords && 
                           nurseDetails.recentActivities.vitalsRecords.length > 0 ? (
                            <Stack spacing={2}>
                              {nurseDetails.recentActivities.vitalsRecords.slice(0, 5).map((vital, idx) => (
                                <Box key={idx} sx={{ 
                                  p: 2, 
                                  borderRadius: 1, 
                                  bgcolor: alpha('#10b981', 0.05),
                                  borderLeft: 3,
                                  borderColor: '#10b981'
                                }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                    {vital.patientId?.userId?.name || 'Unknown Patient'}
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary">
                                        Temperature
                                      </Typography>
                                      <Typography variant="body2">
                                        {vital.temperature}°C
                                      </Typography>
                                    </Grid>
                                    {vital.bloodPressure && (
                                      <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">
                                          Blood Pressure
                                        </Typography>
                                        <Typography variant="body2">
                                          {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                                        </Typography>
                                      </Grid>
                                    )}
                                  </Grid>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                    Recorded: {new Date(vital.recordedAt).toLocaleString()}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" align="center" py={2}>
                              No recent vitals records
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 2 && (
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Assigned Ward Details
                      </Typography>
                      {nurseDetails?.assignedWard ? (
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              p: 3, 
                              borderRadius: 2, 
                              bgcolor: alpha('#3b82f6', 0.05),
                              border: 1,
                              borderColor: 'divider'
                            }}>
                              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                {nurseDetails.assignedWard.ward?.name}
                              </Typography>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Ward Number:</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.assignedWard.ward?.wardNumber}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Floor:</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.assignedWard.ward?.floor}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Specialty:</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.assignedWard.ward?.specialty}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Current Patients:</Typography>
                                  <Typography fontWeight={600}>{nurseDetails.assignedWard.patientCount || 0}</Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Current Patients in Ward
                              </Typography>
                              {nurseDetails.assignedWard.currentPatients && 
                               nurseDetails.assignedWard.currentPatients.length > 0 ? (
                                <Stack spacing={2}>
                                  {nurseDetails.assignedWard.currentPatients.slice(0, 5).map((patient, idx) => (
                                    <Box key={idx} sx={{ 
                                      p: 2, 
                                      borderRadius: 1, 
                                      bgcolor: alpha('#10b981', 0.05),
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                          {patient.userId?.name || 'Unknown Patient'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Bed: {patient.bedNumber}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        label="Assigned"
                                        size="small"
                                        color="success"
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              ) : (
                                <Typography color="text.secondary" align="center" py={2}>
                                  No patients currently in ward
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      ) : (
                        <Typography color="text.secondary" align="center" py={2}>
                          No ward assigned
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
                  openDialog(selectedNurse);
                }}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
                  }
                }}
              >
                Edit Nurse
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Nurses;