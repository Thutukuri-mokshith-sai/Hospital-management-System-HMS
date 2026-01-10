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
  InputAdornment,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import {
  TrendingUp,
  CalendarToday,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Add,
  Search,
  Visibility,
  Medication,
  AccessTime,
  MedicalServices,
  MonitorHeart,
  Receipt,
  FilterList,
  Download,
  Check,
  Close,
  MonetizationOn,
  DoneAll,
  Pending,
  HourglassEmpty
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addDays} from 'date-fns';

import { BASE_URL } from '../../api/api';

const defaultAppointment = {
  patientId: '',
  doctorId: '',
  date: new Date(),
  time: '09:00',
  reason: '',
  notes: '',
  nursingNotes: '',
  preparationStatus: 'Not Started'
};

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

const preparationStatuses = ['Not Started', 'In Progress', 'Ready', 'Completed'];
const appointmentStatuses = ['Scheduled', 'Completed', 'Cancelled'];

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(defaultAppointment);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  // const [activeTab, setActiveTab] = useState(0);
  const [analyticsTab, setAnalyticsTab] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [patientFilter, ] = useState('');
  const [departmentFilter, ] = useState('');
  const [specializationFilter, ] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Data for dropdowns
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [, setDepartments] = useState([]);
  const [, setSpecializations] = useState([]);
  
  // Analytics data
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  
  // Bulk operations
  const [bulkAction, setBulkAction] = useState('');
  const [bulkData, setBulkData] = useState({});
  
  const token = localStorage.getItem('token');

  // Calculate insights from appointment data
  const insights = React.useMemo(() => {
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'Scheduled').length;
    const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled').length;
    
    // Status distribution
    const statusCount = {};
    appointments.forEach(a => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    });
    
    // Time slot distribution
    const timeSlotCount = {};
    appointments.forEach(a => {
      if (a.status === 'Scheduled') {
        timeSlotCount[a.time] = (timeSlotCount[a.time] || 0) + 1;
      }
    });
    
    // Doctor distribution
    const doctorCount = {};
    appointments.forEach(a => {
      const doctorName = a.doctorDetails?.userId?.name || 'Unknown';
      doctorCount[doctorName] = (doctorCount[doctorName] || 0) + 1;
    });
    
    const completionRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0;
    
    const cancellationRate = totalAppointments > 0 ? 
      Math.round((cancelledAppointments / totalAppointments) * 100) : 0;
    
    const estimatedRevenue = completedAppointments * 100; // Assuming $100 per appointment
    
    const mostPopularTimeSlot = Object.keys(timeSlotCount).reduce((a, b) => 
      timeSlotCount[a] > timeSlotCount[b] ? a : '', ''
    );
    
    const busiestDoctor = Object.keys(doctorCount).reduce((a, b) => 
      doctorCount[a] > doctorCount[b] ? a : '', ''
    );
    
    // Today's appointments
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysAppointments = appointments.filter(a => 
      format(new Date(a.date), 'yyyy-MM-dd') === today
    ).length;
    
    // Tomorrow's appointments
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const tomorrowsAppointments = appointments.filter(a => 
      format(new Date(a.date), 'yyyy-MM-dd') === tomorrow
    ).length;
    
    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      statusCount,
      timeSlotCount,
      doctorCount,
      completionRate,
      cancellationRate,
      estimatedRevenue,
      mostPopularTimeSlot,
      busiestDoctor,
      todaysAppointments,
      tomorrowsAppointments
    };
  }, [appointments]);

  /* ================= FETCH APPOINTMENTS ================= */
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', format(dateFilter, 'yyyy-MM-dd'));
      if (doctorFilter) params.append('doctorId', doctorFilter);
      if (patientFilter) params.append('patientId', patientFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (specializationFilter) params.append('specialization', specializationFilter);
      if (startDateFilter) params.append('startDate', format(startDateFilter, 'yyyy-MM-dd'));
      if (endDateFilter) params.append('endDate', format(endDateFilter, 'yyyy-MM-dd'));
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '100');

      const res = await fetch(`${BASE_URL}/admin/appointments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch appointments');
      }

      const data = await res.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH DROPDOWN DATA ================= */
  const fetchDropdownData = async () => {
    try {
      const [doctorsRes, patientsRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/doctors?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/admin/patients?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (doctorsRes.ok) {
        const data = await doctorsRes.json();
        setDoctors(data.data || []);
        
        // Extract unique departments and specializations
        const depts = new Set();
        const specs = new Set();
        data.data.forEach(doctor => {
          if (doctor.doctor?.department) depts.add(doctor.doctor.department);
          if (doctor.doctor?.specialization) specs.add(doctor.doctor.specialization);
        });
        setDepartments(Array.from(depts));
        setSpecializations(Array.from(specs));
      }

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error('Fetch dropdown data error:', error);
    }
  };

  /* ================= FETCH APPOINTMENT DETAILS ================= */
  const fetchAppointmentDetails = async (appointmentId) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to fetch appointment details');
      }

      const data = await res.json();
      setAppointmentDetails(data.data || null);
    } catch (error) {
      console.error('Fetch appointment details error:', error);
      setAppointmentDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  /* ================= FETCH ANALYTICS DATA ================= */
  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const [statsRes, perfRes, trendsRes, dashboardRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/appointments/analytics/statistics?groupBy=day&months=1`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/admin/appointments/analytics/doctor-performance?minAppointments=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/admin/appointments/analytics/trends?period=week&months=3`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/admin/appointments/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatistics(data);
      }

      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformanceData(data.data || []);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrendsData(data.data || []);
      }

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboardMetrics(data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDropdownData();
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, dateFilter, doctorFilter, patientFilter, departmentFilter, 
      specializationFilter, startDateFilter, endDateFilter, sortBy, sortOrder]);

  /* ================= CREATE APPOINTMENT ================= */
  const saveAppointment = async () => {
    try {
      console.log('Creating appointment with data:', currentAppointment);
      
      const appointmentData = {
        ...currentAppointment,
        date: format(currentAppointment.date, 'yyyy-MM-dd')
      };

      console.log('Formatted appointment data:', appointmentData);

      const res = await fetch(`${BASE_URL}/admin/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await res.json();
      console.log('Response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create appointment');
      }

      setOpen(false);
      fetchAppointments();
      alert(data.message || 'Appointment created successfully!');
    } catch (error) {
      console.error('Save appointment error:', error);
      alert(error.message || 'Failed to create appointment. Please try again.');
    }
  };

  /* ================= UPDATE APPOINTMENT ================= */
  const updateAppointment = async () => {
    try {
      const url = `${BASE_URL}/admin/appointments/${selectedAppointment._id}`;

      const appointmentData = {
        ...currentAppointment,
        date: format(currentAppointment.date, 'yyyy-MM-dd')
      };

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update appointment');
      }

      setOpen(false);
      fetchAppointments();
      alert(data.message || 'Appointment updated successfully!');
    } catch (error) {
      console.error('Update appointment error:', error);
      alert(error.message);
    }
  };

  /* ================= DELETE APPOINTMENT ================= */
  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete appointment');
      }

      fetchAppointments();
      alert(data.message || 'Appointment deleted successfully!');
    } catch (error) {
      console.error('Delete appointment error:', error);
      alert(error.message);
    }
  };

  /* ================= APPOINTMENT ACTIONS ================= */
  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cancellationReason: 'Cancelled by admin',
          notes: 'Appointment cancelled by administrator'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel appointment');
      }

      fetchAppointments();
      alert(data.message || 'Appointment cancelled successfully!');
    } catch (error) {
      console.error('Cancel appointment error:', error);
      alert(error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/appointments/${appointmentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: 'Appointment completed successfully',
          outcome: 'Completed as scheduled'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete appointment');
      }

      fetchAppointments();
      alert(data.message || 'Appointment completed successfully!');
    } catch (error) {
      console.error('Complete appointment error:', error);
      alert(error.message);
    }
  };

  /* ================= BULK OPERATIONS ================= */
  const handleBulkAction = async () => {
    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    if (selectedAppointments.length === 0) {
      alert('Please select appointments to perform bulk action');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/admin/appointments/bulk/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentIds: selectedAppointments,
          action: bulkAction,
          data: bulkData
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to perform bulk action');
      }

      setOpenBulk(false);
      setSelectedAppointments([]);
      fetchAppointments();
      alert(data.message || 'Bulk action completed successfully!');
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(error.message);
    }
  };

  /* ================= EXPORT APPOINTMENTS ================= */
  const exportAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (startDateFilter) params.append('startDate', format(startDateFilter, 'yyyy-MM-dd'));
      if (endDateFilter) params.append('endDate', format(endDateFilter, 'yyyy-MM-dd'));
      params.append('format', 'csv');

      const res = await fetch(`${BASE_URL}/admin/appointments/export/data?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to export appointments');
      }

      // Create download link
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert(error.message);
    }
  };

  /* ================= SELECTION HANDLERS ================= */
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedAppointments(appointments.map(a => a._id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId) => {
    if (selectedAppointments.includes(appointmentId)) {
      setSelectedAppointments(selectedAppointments.filter(id => id !== appointmentId));
    } else {
      setSelectedAppointments([...selectedAppointments, appointmentId]);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Completed' ? '#10b981' : 
           status === 'Scheduled' ? '#3b82f6' : 
           status === 'Cancelled' ? '#ef4444' : '#6b7280';
  };

  const getStatusIcon = (status) => {
    return status === 'Completed' ? <CheckCircle /> :
           status === 'Scheduled' ? <Pending /> :
           status === 'Cancelled' ? <Cancel /> : <HourglassEmpty />;
  };

  const getPreparationColor = (status) => {
    return status === 'Ready' ? '#10b981' : 
           status === 'In Progress' ? '#f59e0b' : 
           status === 'Completed' ? '#10b981' : 
           '#6b7280';
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /* ================= OPEN DIALOG HANDLERS ================= */
  const handleOpenNewAppointment = () => {
    setCurrentAppointment({
      patientId: '',
      doctorId: '',
      date: new Date(),
      time: '09:00',
      reason: '',
      notes: '',
      nursingNotes: '',
      preparationStatus: 'Not Started'
    });
    setEditing(false);
    setOpen(true);
  };

  const handleOpenEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentAppointment({
      patientId: appointment.patientId || appointment.patientDetails?.userId?._id || '',
      doctorId: appointment.doctorId || appointment.doctorDetails?.userId?._id || '',
      date: appointment.date ? new Date(appointment.date) : new Date(),
      time: appointment.time || '09:00',
      reason: appointment.reason || '',
      notes: appointment.notes || '',
      nursingNotes: appointment.nursingNotes || '',
      preparationStatus: appointment.preparationStatus || 'Not Started'
    });
    setEditing(true);
    setOpen(true);
  };

  const handleOpenViewAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setOpenView(true);
    await fetchAppointmentDetails(appointment._id);
  };

  const handleOpenBulkDialog = () => {
    setOpenBulk(true);
    setBulkAction('');
    setBulkData({});
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            Appointment Management System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule, manage, and analyze patient appointments
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
                      Total Appointments
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {insights.totalAppointments}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Today: {insights.todaysAppointments}
                      </Typography>
                    </Box>
                  </Box>
                  <CalendarToday sx={{ fontSize: 48, opacity: 0.3 }} />
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
                      Completion Rate
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {insights.completionRate}%
                    </Typography>
                    <Typography variant="caption">
                      {insights.completedAppointments} completed
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.completionRate} 
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
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Estimated Revenue
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      ${insights.estimatedRevenue}
                    </Typography>
                    <Typography variant="caption">
                      {insights.completedAppointments} consultations
                    </Typography>
                  </Box>
                  <MonetizationOn sx={{ fontSize: 48, opacity: 0.3 }} />
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
                      Busiest Doctor
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {insights.busiestDoctor || 'N/A'}
                    </Typography>
                    <Typography variant="caption">
                      {insights.doctorCount[insights.busiestDoctor] || 0} appointments
                    </Typography>
                  </Box>
                  <MedicalServices sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label="Scheduled"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h4" fontWeight={700}>
                      {insights.scheduledAppointments}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label="Completed"
                      color="success"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h4" fontWeight={700}>
                      {insights.completedAppointments}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label="Cancelled"
                      color="error"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h4" fontWeight={700}>
                      {insights.cancelledAppointments}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label="Tomorrow"
                      color="warning"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h4" fontWeight={700}>
                      {insights.tomorrowsAppointments}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Popular Time Slots
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {Object.entries(insights.timeSlotCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([time, count], idx) => (
                    <Box key={time} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{formatTime(time)}</Typography>
                        <Typography variant="body2" fontWeight={600}>{count}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / Math.max(...Object.values(insights.timeSlotCount))) * 100}
                        sx={{
                          height: 6,
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
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Analytics Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs 
            value={analyticsTab} 
            onChange={(e, newValue) => setAnalyticsTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Appointments" />
            <Tab label="Analytics" />
            <Tab label="Performance" />
          </Tabs>

          {analyticsTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Filters + Search + Add */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search appointments..."
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
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {appointmentStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    value={doctorFilter}
                    label="Doctor"
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">All Doctors</MenuItem>
                    {doctors.map(doctor => (
                      <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                        {doctor.user?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Order"
                    onChange={(e) => setSortOrder(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="desc">Descending</MenuItem>
                    <MenuItem value="asc">Ascending</MenuItem>
                  </Select>
                </FormControl>

                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={handleOpenNewAppointment}
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
                  New Appointment
                </Button>

                {selectedAppointments.length > 0 && (
                  <Button 
                    variant="outlined" 
                    startIcon={<DoneAll />}
                    onClick={handleOpenBulkDialog}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                      borderColor: '#3b82f6',
                      color: '#3b82f6'
                    }}
                  >
                    Bulk Actions ({selectedAppointments.length})
                  </Button>
                )}
              </Stack>

              {/* Date Range Filters */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                <DatePicker
                  label="Start Date"
                  value={startDateFilter}
                  onChange={(newValue) => setStartDateFilter(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDateFilter}
                  onChange={(newValue) => setEndDateFilter(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <DatePicker
                  label="Specific Date"
                  value={dateFilter}
                  onChange={(newValue) => setDateFilter(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<FilterList />}
                  onClick={() => {
                    setDateFilter(null);
                    setStartDateFilter(null);
                    setEndDateFilter(null);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Clear Dates
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Download />}
                  onClick={exportAppointments}
                  sx={{ textTransform: 'none' }}
                >
                  Export
                </Button>
              </Stack>

              {/* Table */}
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {loading && <LinearProgress />}
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                          indeterminate={selectedAppointments.length > 0 && selectedAppointments.length < appointments.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Appointment Details</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow 
                        key={appointment._id}
                        sx={{ 
                          '&:hover': { bgcolor: '#f8fafc' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedAppointments.includes(appointment._id)}
                            onChange={() => handleSelectAppointment(appointment._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                              {appointment.reason || 'Consultation'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {format(new Date(appointment.date), 'MMM dd, yyyy')}
                            </Typography>
                            {appointment.notes && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {appointment.notes.length > 50 ? 
                                  `${appointment.notes.substring(0, 50)}...` : appointment.notes}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#3b82f6', 0.8) }}>
                              {appointment.patientDetails?.userId?.name?.charAt(0) || 'P'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {appointment.patientDetails?.userId?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.patientDetails?.userId?.phone || 'No phone'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#10b981', 0.8) }}>
                              {appointment.doctorDetails?.userId?.name?.charAt(0) || 'D'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {appointment.doctorDetails?.userId?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.doctorDetails?.specialization || 'General'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<AccessTime />}
                            label={formatTime(appointment.time)}
                            size="small"
                            sx={{
                              bgcolor: alpha('#3b82f6', 0.1),
                              color: '#3b82f6'
                            }}
                          />
                          {appointment.preparationStatus && (
                            <Chip
                              label={appointment.preparationStatus}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: alpha(getPreparationColor(appointment.preparationStatus), 0.1),
                                color: getPreparationColor(appointment.preparationStatus)
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(appointment.status)}
                            label={appointment.status}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(appointment.status), 0.1),
                              color: getStatusColor(appointment.status),
                              fontWeight: 500
                            }}
                          />
                          {appointment.billingStatus && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              {appointment.billingStatus}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenViewAppointment(appointment)}
                                sx={{ color: '#3b82f6' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {appointment.status === 'Scheduled' && (
                              <>
                                <Tooltip title="Edit Appointment">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleOpenEditAppointment(appointment)}
                                    sx={{ color: '#667eea' }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Complete Appointment">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => completeAppointment(appointment._id)}
                                    sx={{ color: '#10b981' }}
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel Appointment">
                                  <IconButton
                                    size="small"
                                    onClick={() => cancelAppointment(appointment._id)}
                                    sx={{ color: '#ef4444' }}
                                  >
                                    <Close fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Delete Appointment">
                              <IconButton
                                size="small"
                                onClick={() => deleteAppointment(appointment._id)}
                                sx={{ color: '#ef4444' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}

                    {appointments.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <CalendarToday sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No appointments found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {search ? 'Try adjusting your search' : 'Schedule your first appointment to get started'}
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenNewAppointment}
                            sx={{ textTransform: 'none' }}
                          >
                            Create New Appointment
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}

          {analyticsTab === 1 && (
            <Box sx={{ p: 3 }}>
              {analyticsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {/* Statistics Summary */}
                  {statistics && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Appointment Statistics
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: alpha('#3b82f6', 0.05), p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Appointments
                              </Typography>
                              <Typography variant="h4" fontWeight={700}>
                                {statistics.overallSummary?.totalAppointments || 0}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: alpha('#10b981', 0.05), p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Completion Rate
                              </Typography>
                              <Typography variant="h4" fontWeight={700}>
                                {statistics.overallSummary?.overallCompletionRate?.toFixed(1) || 0}%
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: alpha('#ef4444', 0.05), p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Cancellation Rate
                              </Typography>
                              <Typography variant="h4" fontWeight={700}>
                                {statistics.overallSummary?.overallCancellationRate?.toFixed(1) || 0}%
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: alpha('#f59e0b', 0.05), p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Total Revenue
                              </Typography>
                              <Typography variant="h4" fontWeight={700}>
                                ${statistics.overallSummary?.totalRevenue || 0}
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Trends Chart */}
                  {trendsData.length > 0 && (
                    <Grid item xs={12} md={8}>
                      <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Appointment Trends
                        </Typography>
                        <Box sx={{ height: 300, overflow: 'auto' }}>
                          <List dense>
                            {trendsData.slice(0, 10).map((trend, idx) => (
                              <ListItem key={idx} divider>
                                <ListItemText
                                  primary={`Period: ${JSON.stringify(trend.period)}`}
                                  secondary={`Total: ${trend.total} | Completed: ${trend.completed} | Revenue: $${trend.revenue}`}
                                />
                                <ListItemSecondaryAction>
                                  <Typography variant="body2">
                                    Growth: {trend.growth?.toFixed(1) || 0}%
                                  </Typography>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                  {/* Top Doctors */}
                  {performanceData.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Top Performing Doctors
                        </Typography>
                        <List dense>
                          {performanceData.slice(0, 5).map((doctor, idx) => (
                            <ListItem key={doctor.doctorId} divider>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.8) }}>
                                  {doctor.doctorName?.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={doctor.doctorName}
                                secondary={
                                  <>
                                    <Typography variant="caption" display="block">
                                      {doctor.specialization}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Score: {doctor.performanceScore}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          )}

          {analyticsTab === 2 && (
            <Box sx={{ p: 3 }}>
              {dashboardMetrics ? (
                <Grid container spacing={3}>
                  {/* Performance Metrics */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Performance Dashboard
                      </Typography>
                      <Grid container spacing={3}>
                        {dashboardMetrics.performance?.topDoctors && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                              Top Doctors by Appointments
                            </Typography>
                            <List dense>
                              {dashboardMetrics.performance.topDoctors.slice(0, 5).map((doctor, idx) => (
                                <ListItem key={idx} divider>
                                  <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.8) }}>
                                      {doctor.doctorName?.charAt(0)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={doctor.doctorName}
                                    secondary={
                                      <>
                                        <Typography variant="caption" display="block">
                                          {doctor.department}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                          {doctor.completed} appointments
                                        </Typography>
                                      </>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        )}

                        {dashboardMetrics.performance?.timeSlots && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                              Time Slot Utilization
                            </Typography>
                            <List dense>
                              {dashboardMetrics.performance.timeSlots.slice(0, 5).map((slot, idx) => (
                                <ListItem key={idx} divider>
                                  <ListItemText
                                    primary={slot.timeSlot}
                                    secondary={
                                      <>
                                        <Typography variant="caption" display="block">
                                          {slot.total} appointments
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                          Utilization: {slot.utilization}%
                                        </Typography>
                                      </>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <Chip
                                      label={slot.busyLevel}
                                      size="small"
                                      color={
                                        slot.busyLevel === 'Very High' ? 'error' :
                                        slot.busyLevel === 'High' ? 'warning' :
                                        slot.busyLevel === 'Medium' ? 'info' : 'success'
                                      }
                                    />
                                  </ListItemSecondaryAction>
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Upcoming Appointments */}
                  {dashboardMetrics.upcomingAppointments && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                          Upcoming Appointments ({dashboardMetrics.upcomingAppointments.count})
                        </Typography>
                        <Grid container spacing={2}>
                          {dashboardMetrics.upcomingAppointments.appointments.slice(0, 6).map((appt, idx) => (
                            <Grid item xs={12} sm={6} md={4} key={idx}>
                              <Card sx={{ 
                                p: 2, 
                                borderRadius: 2,
                                borderLeft: 3,
                                borderColor: '#3b82f6'
                              }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                  {appt.patientId?.userId?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {appt.doctorId?.userId?.name}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {format(new Date(appt.date), 'MMM dd')} at {formatTime(appt.time)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {appt.reason}
                                </Typography>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CalendarToday sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No analytics data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {/* Add / Edit Appointment Dialog */}
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
            {editing ? 'Edit Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Appointment Details
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Patient *</InputLabel>
                    <Select
                      value={currentAppointment.patientId}
                      label="Patient *"
                      onChange={(e) =>
                        setCurrentAppointment({ ...currentAppointment, patientId: e.target.value })
                      }
                      required
                    >
                      <MenuItem value="">Select Patient</MenuItem>
                      {patients.map(patient => (
                        <MenuItem key={patient.user?._id} value={patient.user?._id}>
                          {patient.user?.name} ({patient.user?.phone || 'No phone'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Doctor *</InputLabel>
                    <Select
                      value={currentAppointment.doctorId}
                      label="Doctor *"
                      onChange={(e) =>
                        setCurrentAppointment({ ...currentAppointment, doctorId: e.target.value })
                      }
                      required
                    >
                      <MenuItem value="">Select Doctor</MenuItem>
                      {doctors.map(doctor => (
                        <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                          {doctor.user?.name} ({doctor.doctor?.specialization || 'General'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <DatePicker
                    label="Appointment Date *"
                    value={currentAppointment.date}
                    onChange={(newValue) =>
                      setCurrentAppointment({ ...currentAppointment, date: newValue })
                    }
                    slotProps={{ textField: { fullWidth: true, size: 'small', required: true } }}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Time Slot *</InputLabel>
                    <Select
                      value={currentAppointment.time}
                      label="Time Slot *"
                      onChange={(e) =>
                        setCurrentAppointment({ ...currentAppointment, time: e.target.value })
                      }
                      required
                    >
                      {timeSlots.map(time => (
                        <MenuItem key={time} value={time}>{formatTime(time)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Additional Information
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Reason for Visit"
                    value={currentAppointment.reason}
                    onChange={(e) =>
                      setCurrentAppointment({ ...currentAppointment, reason: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="e.g., Follow-up, Checkup, Emergency"
                  />

                  <TextField
                    label="Doctor's Notes"
                    value={currentAppointment.notes}
                    onChange={(e) =>
                      setCurrentAppointment({ ...currentAppointment, notes: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Medical notes, observations..."
                  />

                  <TextField
                    label="Nursing Notes"
                    value={currentAppointment.nursingNotes}
                    onChange={(e) =>
                      setCurrentAppointment({ ...currentAppointment, nursingNotes: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Preparation instructions, vital signs..."
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Preparation Status</InputLabel>
                    <Select
                      value={currentAppointment.preparationStatus}
                      label="Preparation Status"
                      onChange={(e) =>
                        setCurrentAppointment({ ...currentAppointment, preparationStatus: e.target.value })
                      }
                    >
                      {preparationStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
              onClick={editing ? updateAppointment : saveAppointment}
              disabled={!currentAppointment.patientId || !currentAppointment.doctorId || 
                       !currentAppointment.date || !currentAppointment.time}
              sx={{
                textTransform: 'none',
                px: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
                }
              }}
            >
              {editing ? 'Update Appointment' : 'Schedule Appointment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Appointment Details Dialog */}
        <Dialog 
          open={openView} 
          onClose={() => setOpenView(false)} 
          fullWidth 
          maxWidth="lg"
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          {selectedAppointment && (
            <>
              <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                Appointment Details
              </DialogTitle>
              <DialogContent>
                {detailsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {/* Appointment Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 4, 
                      pb: 3, 
                      borderBottom: 1, 
                      borderColor: 'divider' 
                    }}>
                      <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                          {selectedAppointment.reason || 'Consultation'}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip
                            icon={getStatusIcon(selectedAppointment.status)}
                            label={selectedAppointment.status}
                            sx={{
                              bgcolor: alpha(getStatusColor(selectedAppointment.status), 0.1),
                              color: getStatusColor(selectedAppointment.status),
                              fontWeight: 600
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(selectedAppointment.date), 'EEEE, MMMM dd, yyyy')}
                          </Typography>
                          <Chip
                            icon={<AccessTime />}
                            label={formatTime(selectedAppointment.time)}
                            size="small"
                          />
                        </Stack>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Appointment ID: {selectedAppointment._id?.substring(0, 8)}...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {format(new Date(selectedAppointment.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Patient Information */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Patient Information
                          </Typography>
                          {appointmentDetails?.patient ? (
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 60, height: 60, bgcolor: alpha('#3b82f6', 0.8) }}>
                                  {appointmentDetails.patient.userId?.name?.charAt(0) || 'P'}
                                </Avatar>
                                <Box>
                                  <Typography variant="h6">
                                    {appointmentDetails.patient.userId?.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {appointmentDetails.patient.userId?.email}
                                  </Typography>
                                </Box>
                              </Box>
                              <Divider />
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Phone
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointmentDetails.patient.userId?.phone || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Blood Group
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointmentDetails.patient.bloodGroup || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Admission Status
                                  </Typography>
                                  <Chip
                                    label={appointmentDetails.patient.admissionStatus || 'Outpatient'}
                                    size="small"
                                    color={
                                      appointmentDetails.patient.admissionStatus === 'Admitted' ? 'error' :
                                      appointmentDetails.patient.admissionStatus === 'Observation' ? 'warning' : 'default'
                                    }
                                  />
                                </Grid>
                              </Grid>
                            </Stack>
                          ) : (
                            <Typography color="text.secondary">Patient information not available</Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* Doctor Information */}
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Doctor Information
                          </Typography>
                          {appointmentDetails?.doctor ? (
                            <Stack spacing={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 60, height: 60, bgcolor: alpha('#10b981', 0.8) }}>
                                  {appointmentDetails.doctor.userId?.name?.charAt(0) || 'D'}
                                </Avatar>
                                <Box>
                                  <Typography variant="h6">
                                    {appointmentDetails.doctor.userId?.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {appointmentDetails.doctor.specialization}
                                  </Typography>
                                </Box>
                              </Box>
                              <Divider />
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Department
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointmentDetails.doctor.department || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Experience
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointmentDetails.doctor.experience || 'N/A'} years
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Contact
                                  </Typography>
                                  <Typography variant="body1">
                                    {appointmentDetails.doctor.userId?.email || 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Stack>
                          ) : (
                            <Typography color="text.secondary">Doctor information not available</Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* Notes and Additional Information */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Notes & Additional Information
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Doctor's Notes
                              </Typography>
                              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, minHeight: 100 }}>
                                {selectedAppointment.notes || 'No notes provided'}
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Nursing Notes
                              </Typography>
                              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, minHeight: 100 }}>
                                {selectedAppointment.nursingNotes || 'No nursing notes'}
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>

                      {/* Related Data */}
                      {appointmentDetails?.relatedData && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Related Information
                            </Typography>
                            <Grid container spacing={3}>
                              {appointmentDetails.relatedData.prescription && (
                                <Grid item xs={12} md={6}>
                                  <Card sx={{ p: 2, borderLeft: 3, borderColor: '#10b981' }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                      Prescription
                                    </Typography>
                                    <Typography variant="body2">
                                      Prescription created for this appointment
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      startIcon={<Medication />}
                                    >
                                      View Prescription
                                    </Button>
                                  </Card>
                                </Grid>
                              )}

                              {appointmentDetails.relatedData.billing && (
                                <Grid item xs={12} md={6}>
                                  <Card sx={{ p: 2, borderLeft: 3, borderColor: '#3b82f6' }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                      Billing
                                    </Typography>
                                    <Typography variant="body2">
                                      Amount: ${appointmentDetails.relatedData.billing.amount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Status: {appointmentDetails.relatedData.billing.paymentStatus}
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      startIcon={<Receipt />}
                                    >
                                      View Billing
                                    </Button>
                                  </Card>
                                </Grid>
                              )}

                              {appointmentDetails.relatedData.latestVitals && (
                                <Grid item xs={12} md={6}>
                                  <Card sx={{ p: 2, borderLeft: 3, borderColor: '#f59e0b' }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                      Latest Vitals
                                    </Typography>
                                    <Typography variant="body2">
                                      Recorded: {format(new Date(appointmentDetails.relatedData.latestVitals.recordedAt), 'MMM dd, yyyy')}
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      startIcon={<MonitorHeart />}
                                    >
                                      View Vitals
                                    </Button>
                                  </Card>
                                </Grid>
                              )}

                              {appointmentDetails.relatedData.latestNursingCare && (
                                <Grid item xs={12} md={6}>
                                  <Card sx={{ p: 2, borderLeft: 3, borderColor: '#8b5cf6' }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                      Nursing Care
                                    </Typography>
                                    <Typography variant="body2">
                                      {appointmentDetails.relatedData.latestNursingCare.careType}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Status: {appointmentDetails.relatedData.latestNursingCare.status}
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      startIcon={<MedicalServices />}
                                    >
                                      View Details
                                    </Button>
                                  </Card>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
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
                {selectedAppointment.status === 'Scheduled' && (
                  <>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => cancelAppointment(selectedAppointment._id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Cancel Appointment
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => completeAppointment(selectedAppointment._id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Complete Appointment
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Bulk Operations Dialog */}
        <Dialog 
          open={openBulk} 
          onClose={() => setOpenBulk(false)} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Bulk Operations ({selectedAppointments.length} appointments selected)
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Action</InputLabel>
                <Select
                  value={bulkAction}
                  label="Select Action"
                  onChange={(e) => {
                    setBulkAction(e.target.value);
                    setBulkData({});
                  }}
                >
                  <MenuItem value="">Choose an action</MenuItem>
                  <MenuItem value="cancel">Cancel Appointments</MenuItem>
                  <MenuItem value="complete">Complete Appointments</MenuItem>
                  <MenuItem value="reschedule">Reschedule Appointments</MenuItem>
                  <MenuItem value="updateStatus">Update Status</MenuItem>
                </Select>
              </FormControl>

              {bulkAction === 'cancel' && (
                <TextField
                  label="Cancellation Reason"
                  value={bulkData.reason || ''}
                  onChange={(e) => setBulkData({ ...bulkData, reason: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                />
              )}

              {bulkAction === 'complete' && (
                <Stack spacing={2}>
                  <TextField
                    label="Completion Notes"
                    value={bulkData.notes || ''}
                    onChange={(e) => setBulkData({ ...bulkData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter completion notes..."
                  />
                  <TextField
                    label="Amount per Appointment"
                    type="number"
                    value={bulkData.amount || 100}
                    onChange={(e) => setBulkData({ ...bulkData, amount: parseFloat(e.target.value) })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Stack>
              )}

              {bulkAction === 'reschedule' && (
                <Stack spacing={2}>
                  <DatePicker
                    label="New Date"
                    value={bulkData.newDate || null}
                    onChange={(newValue) => setBulkData({ ...bulkData, newDate: newValue })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>New Time Slot</InputLabel>
                    <Select
                      value={bulkData.newTime || ''}
                      label="New Time Slot"
                      onChange={(e) => setBulkData({ ...bulkData, newTime: e.target.value })}
                    >
                      {timeSlots.map(time => (
                        <MenuItem key={time} value={time}>{formatTime(time)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Rescheduling Notes"
                    value={bulkData.notes || ''}
                    onChange={(e) => setBulkData({ ...bulkData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Reason for rescheduling..."
                  />
                </Stack>
              )}

              {bulkAction === 'updateStatus' && (
                <FormControl fullWidth>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={bulkData.status || ''}
                    label="New Status"
                    onChange={(e) => setBulkData({ ...bulkData, status: e.target.value })}
                  >
                    {appointmentStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Alert severity="warning">
                This action will affect {selectedAppointments.length} appointments. This cannot be undone.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setOpenBulk(false)}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleBulkAction}
              disabled={!bulkAction || (bulkAction === 'reschedule' && (!bulkData.newDate || !bulkData.newTime))}
              sx={{
                textTransform: 'none',
                px: 3
              }}
            >
              Execute Bulk Action
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;