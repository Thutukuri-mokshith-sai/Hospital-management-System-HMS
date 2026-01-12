// import React, { useState, useEffect } from 'react';
// import {
//   Box, Grid, Paper, Typography, Stack, Chip, Avatar, TextField, Button,
//   Table, TableHead, TableRow, TableCell, TableBody, IconButton, LinearProgress,
//   Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
//   Select, FormControl, InputLabel, alpha, Card, CardContent, Badge,
//   Alert, Snackbar, CircularProgress, Divider
// } from '@mui/material';
// import {
//   CalendarMonth, Search, FilterList, CheckCircle, Cancel, AccessTime,
//   Person, Phone, Email, ArrowForward, Edit, Visibility, NoteAdd,
//   Add, Today, Schedule, LocationOn, Assignment, MedicalServices,
//   Event, Warning, Star, NewReleases, Notifications, Close
// } from '@mui/icons-material';
// import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { format, parseISO, isToday, isAfter } from 'date-fns';
// import { useNavigate } from 'react-router-dom';
// import { doctorAppointments } from '../../api/doctorApi';

// const DoctorAppointments = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [recentAppointments, setRecentAppointments] = useState([]);
//   const [unseenAppointments, setUnseenAppointments] = useState([]);
//   const [loading, setLoading] = useState({
//     main: false,
//     recent: false,
//     unseen: false
//   });
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [detailsOpen, setDetailsOpen] = useState(false);
//   const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
//   const navigate = useNavigate();

//   // Fetch all appointments
//   const fetchAppointments = async () => {
//     try {
//       setLoading(prev => ({ ...prev, main: true }));
//       setError('');

//       const params = {};
//       if (filterStatus !== 'all') params.status = filterStatus;
//       if (selectedDate) {
//         const dateStr = format(selectedDate, 'yyyy-MM-dd');
//         params.date = dateStr;
//       }

//       const response = await doctorAppointments.getAppointments(params);
      
//       if (response.success) {
//         const formattedAppointments = response.data.map(apt => ({
//           id: apt._id,
//           patientName: apt.patientId?.userId?.name || 'Unknown Patient',
//           patientId: apt.patientId?._id,
//           userId: apt.patientId?.userId?._id,
//           time: apt.time,
//           date: format(parseISO(apt.date), 'yyyy-MM-dd'),
//           type: 'Consultation',
//           status: apt.status,
//           reason: apt.reason || 'No reason specified',
//           notes: apt.notes || '',
//           nursingNotes: apt.nursingNotes || '',
//           preparationStatus: apt.preparationStatus || 'Not Started',
//           priority: 'Normal',
//           contact: apt.patientId?.userId?.phone || 'N/A',
//           email: apt.patientId?.userId?.email || 'N/A',
//           appointmentTime: parseISO(apt.date),
//           lastUpdatedBy: apt.lastUpdatedBy,
//           createdAt: parseISO(apt.createdAt)
//         }));

//         setAppointments(formattedAppointments);
//       } else {
//         setError('Failed to fetch appointments');
//       }
//     } catch (err) {
//       console.error('Error fetching appointments:', err);
//       setError(err.response?.data?.error || 'Failed to fetch appointments');
//     } finally {
//       setLoading(prev => ({ ...prev, main: false }));
//     }
//   };

//   // Fetch recent appointments (last 7 days)
//   const fetchRecentAppointments = async () => {
//     try {
//       setLoading(prev => ({ ...prev, recent: true }));
//       const response = await doctorAppointments.getRecentAppointments();
      
//       if (response.success) {
//         const formatted = response.data.slice(0, 5).map(apt => ({
//           id: apt._id,
//           patientName: apt.patientId?.userId?.name || 'Unknown',
//           date: format(parseISO(apt.date), 'MMM dd'),
//           status: apt.status,
//           reason: apt.reason || 'Checkup'
//         }));
//         setRecentAppointments(formatted);
//       }
//     } catch (err) {
//       console.error('Error fetching recent appointments:', err);
//     } finally {
//       setLoading(prev => ({ ...prev, recent: false }));
//     }
//   };

//   // Fetch unseen appointments
//   const fetchUnseenAppointments = async () => {
//     try {
//       setLoading(prev => ({ ...prev, unseen: true }));
//       const response = await doctorAppointments.getUnseenAppointments();
      
//       if (response.success) {
//         const formatted = response.data.slice(0, 5).map(apt => ({
//           id: apt._id,
//           patientName: apt.patientId?.userId?.name || 'New Patient',
//           time: apt.time,
//           date: format(parseISO(apt.date), 'MMM dd'),
//           reason: apt.reason || 'Consultation',
//           isUnseen: true
//         }));
//         setUnseenAppointments(formatted);
//       }
//     } catch (err) {
//       console.error('Error fetching unseen appointments:', err);
//     } finally {
//       setLoading(prev => ({ ...prev, unseen: false }));
//     }
//   };

//   useEffect(() => {
//     fetchAppointments();
//     fetchRecentAppointments();
//     fetchUnseenAppointments();
//   }, [filterStatus, selectedDate]);

//   const handleStatusUpdate = async (appointmentId, newStatus) => {
//     try {
//       const response = await doctorAppointments.updateAppointment(appointmentId, {
//         status: newStatus,
//         notes: `Status updated to ${newStatus}`
//       });

//       if (response.success) {
//         setAppointments(prev => prev.map(apt => 
//           apt.id === appointmentId ? { ...apt, status: newStatus } : apt
//         ));
        
//         setSnackbar({
//           open: true,
//           message: `Appointment marked as ${newStatus}`,
//           severity: 'success'
//         });

//         // Refresh data
//         fetchRecentAppointments();
//         fetchUnseenAppointments();
//       }
//     } catch (err) {
//       setSnackbar({
//         open: true,
//         message: err.response?.data?.error || 'Failed to update appointment',
//         severity: 'error'
//       });
//     }
//   };

//   const handleViewDetails = async (appointment) => {
//     try {
//       const response = await doctorAppointments.getAppointmentById(appointment.id);
      
//       if (response.success) {
//         setSelectedAppointment({
//           ...appointment,
//           ...response.data
//         });
//         setDetailsOpen(true);
//       }
//     } catch (err) {
//       setSnackbar({
//         open: true,
//         message: 'Failed to load appointment details',
//         severity: 'error'
//       });
//     }
//   };

//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'Scheduled': return 'info';
//       case 'Completed': return 'success';
//       case 'Cancelled': return 'error';
//       default: return 'default';
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch(status) {
//       case 'Scheduled': return <Event />;
//       case 'Completed': return <CheckCircle />;
//       case 'Cancelled': return <Cancel />;
//       default: return <AccessTime />;
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch(priority) {
//       case 'Critical': return '#ef4444';
//       case 'High': return '#f59e0b';
//       case 'Normal': return '#3b82f6';
//       case 'Low': return '#10b981';
//       default: return '#6b7280';
//     }
//   };

//   const stats = {
//     today: appointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length,
//     scheduled: appointments.filter(a => a.status === 'Scheduled').length,
//     completed: appointments.filter(a => a.status === 'Completed').length,
//     total: appointments.length
//   };

//   const handleStartConsultation = (appointment) => {
//     navigate(`/doctor/consultation/${appointment.id}`, {
//       state: { appointment }
//     });
//   };

//   const handleMarkAsSeen = (appointmentId) => {
//     setUnseenAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Error Alert */}
//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
//           {error}
//         </Alert>
//       )}

//       {/* Header */}
//       <Box sx={{ mb: 4 }}>
//         <Stack direction="row" justifyContent="space-between" alignItems="center">
//           <Box>
//             <Typography variant="h4" fontWeight={700} gutterBottom>
//               Appointment Schedule
//             </Typography>
//             <Typography variant="body1" color="text.secondary">
//               Manage your daily consultations and patient visits
//             </Typography>
//           </Box>
//           <Button 
//             variant="contained" 
//             startIcon={<Add />}
//             onClick={() => setNewAppointmentOpen(true)}
//             disabled={loading.main}
//           >
//             Schedule Appointment
//           </Button>
//         </Stack>
//       </Box>

//       {/* Unseen Appointments Cards */}
//       {unseenAppointments.length > 0 && (
//         <Box sx={{ mb: 4 }}>
//           <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <NewReleases color="error" />
//             New Appointments
//             <Badge badgeContent={unseenAppointments.length} color="error" sx={{ ml: 1 }} />
//           </Typography>
//           <Grid container spacing={2}>
//             {unseenAppointments.map((appointment) => (
//               <Grid item xs={12} sm={6} md={4} key={appointment.id}>
//                 <Card 
//                   sx={{ 
//                     borderRadius: 2,
//                     borderLeft: '4px solid',
//                     borderColor: '#ef4444',
//                     position: 'relative',
//                     overflow: 'visible'
//                   }}
//                 >
//                   <CardContent sx={{ p: 2 }}>
//                     <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
//                       <Box>
//                         <Typography variant="subtitle2" fontWeight={600} color="#ef4444">
//                           NEW
//                         </Typography>
//                         <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
//                           {appointment.patientName}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           {appointment.time} • {appointment.date}
//                         </Typography>
//                         <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
//                           {appointment.reason}
//                         </Typography>
//                       </Box>
//                       <IconButton 
//                         size="small" 
//                         onClick={() => handleMarkAsSeen(appointment.id)}
//                         sx={{ mt: -1, mr: -1 }}
//                       >
//                         <Close fontSize="small" />
//                       </IconButton>
//                     </Stack>
//                     <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
//                       <Button 
//                         size="small" 
//                         variant="outlined"
//                         onClick={() => handleViewDetails(appointment)}
//                       >
//                         View Details
//                       </Button>
//                       <Button 
//                         size="small" 
//                         variant="contained"
//                         onClick={() => handleStartConsultation(appointment)}
//                       >
//                         Start Now
//                       </Button>
//                     </Stack>
//                   </CardContent>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         </Box>
//       )}

//       {/* Stats Cards */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} sm={6} md={3}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Stack direction="row" justifyContent="space-between" alignItems="center">
//               <Box>
//                 <Typography variant="h3" fontWeight={700} color="#3b82f6">
//                   {stats.today}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">Today's Appointments</Typography>
//               </Box>
//               <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}>
//                 <Today />
//               </Avatar>
//             </Stack>
//           </Paper>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Stack direction="row" justifyContent="space-between" alignItems="center">
//               <Box>
//                 <Typography variant="h3" fontWeight={700} color="#f59e0b">
//                   {stats.scheduled}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">Scheduled</Typography>
//               </Box>
//               <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
//                 <Schedule />
//               </Avatar>
//             </Stack>
//           </Paper>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Stack direction="row" justifyContent="space-between" alignItems="center">
//               <Box>
//                 <Typography variant="h3" fontWeight={700} color="#10b981">
//                   {stats.completed}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">Completed</Typography>
//               </Box>
//               <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
//                 <CheckCircle />
//               </Avatar>
//             </Stack>
//           </Paper>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Stack direction="row" justifyContent="space-between" alignItems="center">
//               <Box>
//                 <Typography variant="h3" fontWeight={700} color="#8b5cf6">
//                   {stats.total}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">Total This Week</Typography>
//               </Box>
//               <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}>
//                 <CalendarMonth />
//               </Avatar>
//             </Stack>
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={4}>
//             <TextField
//               size="small"
//               fullWidth
//               placeholder="Search appointments..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && fetchAppointments()}
//               InputProps={{
//                 startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
//               }}
//               disabled={loading.main}
//             />
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <FormControl fullWidth size="small" disabled={loading.main}>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={filterStatus}
//                 label="Status"
//                 onChange={(e) => setFilterStatus(e.target.value)}
//               >
//                 <MenuItem value="all">All Status</MenuItem>
//                 <MenuItem value="Scheduled">Scheduled</MenuItem>
//                 <MenuItem value="Completed">Completed</MenuItem>
//                 <MenuItem value="Cancelled">Cancelled</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} md={3}>
//             <LocalizationProvider dateAdapter={AdapterDateFns}>
//               <DatePicker
//                 label="Select Date"
//                 value={selectedDate}
//                 onChange={(newDate) => setSelectedDate(newDate)}
//                 slotProps={{ 
//                   textField: { 
//                     size: 'small', 
//                     fullWidth: true,
//                     disabled: loading.main
//                   } 
//                 }}
//               />
//             </LocalizationProvider>
//           </Grid>
//           <Grid item xs={12} md={2}>
//             <Button 
//               startIcon={loading.main ? <CircularProgress size={20} /> : <FilterList />}
//               variant="outlined"
//               fullWidth
//               onClick={fetchAppointments}
//               disabled={loading.main}
//             >
//               {loading.main ? 'Loading...' : 'Apply'}
//             </Button>
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* Main Content */}
//       <Grid container spacing={3}>
//         {/* Appointments Table */}
//         <Grid item xs={12} md={8}>
//           <Paper sx={{ borderRadius: 2, overflow: 'hidden', minHeight: 400 }}>
//             {loading.main && <LinearProgress />}
            
//             {appointments.length === 0 && !loading.main ? (
//               <Box sx={{ p: 4, textAlign: 'center' }}>
//                 <CalendarMonth sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
//                 <Typography variant="h6" color="text.secondary">
//                   No appointments found
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//                   Try changing your filters or schedule a new appointment
//                 </Typography>
//               </Box>
//             ) : (
//               <Table>
//                 <TableHead>
//                   <TableRow sx={{ bgcolor: '#f8fafc' }}>
//                     <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
//                     <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
//                     <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
//                     <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
//                     <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {appointments.map((appointment) => (
//                     <TableRow 
//                       key={appointment.id} 
//                       hover
//                       sx={{ 
//                         opacity: appointment.status === 'Completed' ? 0.7 : 1,
//                         bgcolor: appointment.isUnseen ? alpha('#fef3c7', 0.3) : 'inherit'
//                       }}
//                     >
//                       <TableCell>
//                         <Typography fontWeight={600}>{appointment.time}</Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           {format(appointment.appointmentTime, 'MMM dd, yyyy')}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Stack direction="row" alignItems="center" spacing={1}>
//                           <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
//                             {appointment.patientName.charAt(0)}
//                           </Avatar>
//                           <Box>
//                             <Typography fontWeight={600}>{appointment.patientName}</Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               ID: {appointment.patientId?.slice(-6) || 'N/A'}
//                             </Typography>
//                           </Box>
//                         </Stack>
//                       </TableCell>
//                       <TableCell>
//                         <Typography>{appointment.reason}</Typography>
//                         {appointment.notes && (
//                           <Typography variant="caption" color="text.secondary" display="block">
//                             {appointment.notes.substring(0, 50)}...
//                           </Typography>
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         <Chip 
//                           icon={getStatusIcon(appointment.status)}
//                           label={appointment.status}
//                           color={getStatusColor(appointment.status)}
//                           size="small"
//                           variant={appointment.status === 'Completed' ? 'outlined' : 'filled'}
//                         />
//                       </TableCell>
//                       <TableCell align="right">
//                         <Stack direction="row" spacing={1} justifyContent="flex-end">
//                           <Tooltip title="View Details">
//                             <IconButton 
//                               size="small" 
//                               onClick={() => handleViewDetails(appointment)}
//                             >
//                               <Visibility fontSize="small" />
//                             </IconButton>
//                           </Tooltip>
                          
//                           {appointment.status === 'Scheduled' && (
//                             <Tooltip title="Start Consultation">
//                               <IconButton 
//                                 size="small" 
//                                 color="primary"
//                                 onClick={() => handleStartConsultation(appointment)}
//                               >
//                                 <ArrowForward fontSize="small" />
//                               </IconButton>
//                             </Tooltip>
//                           )}
                          
//                           {appointment.status === 'Scheduled' && (
//                             <Tooltip title="Cancel Appointment">
//                               <IconButton 
//                                 size="small" 
//                                 color="error"
//                                 onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
//                               >
//                                 <Cancel fontSize="small" />
//                               </IconButton>
//                             </Tooltip>
//                           )}
                          
//                           {appointment.status === 'Scheduled' && (
//                             <Tooltip title="Mark Complete">
//                               <IconButton 
//                                 size="small" 
//                                 color="success"
//                                 onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
//                               >
//                                 <CheckCircle fontSize="small" />
//                               </IconButton>
//                             </Tooltip>
//                           )}
//                         </Stack>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </Paper>
//         </Grid>

//         {/* Sidebar */}
//         <Grid item xs={12} md={4}>
//           <Stack spacing={3}>
//             {/* Today's Schedule */}
//             <Paper sx={{ p: 3, borderRadius: 2 }}>
//               <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Today />
//                 Today's Schedule
//               </Typography>
//               {loading.main ? (
//                 <Box sx={{ textAlign: 'center', py: 4 }}>
//                   <CircularProgress size={24} />
//                 </Box>
//               ) : (
//                 <Stack spacing={2} sx={{ mt: 2 }}>
//                   {appointments
//                     .filter(apt => apt.date === format(new Date(), 'yyyy-MM-dd'))
//                     .slice(0, 5)
//                     .map((apt, index) => (
//                       <Card key={index} variant="outlined">
//                         <CardContent sx={{ p: 2 }}>
//                           <Stack spacing={1}>
//                             <Stack direction="row" justifyContent="space-between" alignItems="center">
//                               <Typography fontWeight={600}>{apt.time}</Typography>
//                               <Chip 
//                                 label={apt.status}
//                                 size="small"
//                                 color={getStatusColor(apt.status)}
//                               />
//                             </Stack>
//                             <Typography variant="body2">{apt.patientName}</Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {apt.reason}
//                             </Typography>
//                             <Button 
//                               size="small" 
//                               startIcon={<MedicalServices />}
//                               onClick={() => handleStartConsultation(apt)}
//                               sx={{ mt: 1 }}
//                               disabled={apt.status !== 'Scheduled'}
//                             >
//                               Start Consultation
//                             </Button>
//                           </Stack>
//                         </CardContent>
//                       </Card>
//                     ))}
                  
//                   {appointments.filter(apt => apt.date === format(new Date(), 'yyyy-MM-dd')).length === 0 && (
//                     <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
//                       No appointments scheduled for today
//                     </Typography>
//                   )}
//                 </Stack>
//               )}
//             </Paper>

//             {/* Recent Appointments */}
//             <Paper sx={{ p: 3, borderRadius: 2 }}>
//               <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <CalendarMonth />
//                 Recent Appointments
//               </Typography>
//               {loading.recent ? (
//                 <Box sx={{ textAlign: 'center', py: 4 }}>
//                   <CircularProgress size={24} />
//                 </Box>
//               ) : (
//                 <Stack spacing={2} sx={{ mt: 2 }}>
//                   {recentAppointments.map((apt, index) => (
//                     <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
//                       <Avatar sx={{ width: 40, height: 40, mr: 2, fontSize: 14 }}>
//                         {apt.patientName.charAt(0)}
//                       </Avatar>
//                       <Box sx={{ flex: 1 }}>
//                         <Typography variant="body2" fontWeight={500}>
//                           {apt.patientName}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           {apt.date} • {apt.reason}
//                         </Typography>
//                       </Box>
//                       <Chip 
//                         label={apt.status}
//                         size="small"
//                         color={getStatusColor(apt.status)}
//                         variant="outlined"
//                       />
//                     </Box>
//                   ))}
                  
//                   {recentAppointments.length === 0 && (
//                     <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
//                       No recent appointments
//                     </Typography>
//                   )}
//                 </Stack>
//               )}
//             </Paper>
//           </Stack>
//         </Grid>
//       </Grid>

//       {/* Appointment Details Dialog */}
//       <Dialog 
//         open={detailsOpen} 
//         onClose={() => setDetailsOpen(false)} 
//         maxWidth="sm"
//         fullWidth
//       >
//         {selectedAppointment && (
//           <>
//             <DialogTitle>
//               <Typography variant="h6" fontWeight={600}>
//                 Appointment Details
//               </Typography>
//             </DialogTitle>
//             <DialogContent>
//               <Stack spacing={3} sx={{ mt: 1 }}>
//                 {/* Patient Info */}
//                 <Box>
//                   <Typography variant="caption" color="text.secondary" display="block">
//                     Patient Information
//                   </Typography>
//                   <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
//                     <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 48, height: 48 }}>
//                       {selectedAppointment.patientName.charAt(0)}
//                     </Avatar>
//                     <Box>
//                       <Typography fontWeight={600} variant="h6">
//                         {selectedAppointment.patientName}
//                       </Typography>
//                       <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
//                         <Chip 
//                           icon={<Person />} 
//                           label={`ID: ${selectedAppointment.patientId?.slice(-6) || 'N/A'}`} 
//                           size="small" 
//                         />
//                         <Chip 
//                           icon={<Phone />} 
//                           label={selectedAppointment.contact} 
//                           size="small" 
//                         />
//                       </Stack>
//                     </Box>
//                   </Stack>
//                 </Box>

//                 <Divider />

//                 {/* Appointment Details */}
//                 <Grid container spacing={2}>
//                   <Grid item xs={6}>
//                     <Box>
//                       <Typography variant="caption" color="text.secondary" display="block">
//                         Date & Time
//                       </Typography>
//                       <Typography fontWeight={600}>
//                         {format(selectedAppointment.appointmentTime, 'MMM dd, yyyy')}
//                       </Typography>
//                       <Typography color="text.secondary">
//                         {selectedAppointment.time}
//                       </Typography>
//                     </Box>
//                   </Grid>
//                   <Grid item xs={6}>
//                     <Box>
//                       <Typography variant="caption" color="text.secondary" display="block">
//                         Status
//                       </Typography>
//                       <Chip 
//                         label={selectedAppointment.status}
//                         color={getStatusColor(selectedAppointment.status)}
//                         sx={{ mt: 0.5 }}
//                       />
//                     </Box>
//                   </Grid>
//                 </Grid>

//                 {/* Reason */}
//                 <Box>
//                   <Typography variant="caption" color="text.secondary" display="block">
//                     Reason for Visit
//                   </Typography>
//                   <Typography>{selectedAppointment.reason}</Typography>
//                 </Box>

//                 {/* Notes */}
//                 {selectedAppointment.notes && (
//                   <Box>
//                     <Typography variant="caption" color="text.secondary" display="block">
//                       Doctor's Notes
//                     </Typography>
//                     <Typography>{selectedAppointment.notes}</Typography>
//                   </Box>
//                 )}

//                 {/* Nursing Notes */}
//                 {selectedAppointment.nursingNotes && (
//                   <Box>
//                     <Typography variant="caption" color="text.secondary" display="block">
//                       Nursing Notes
//                     </Typography>
//                     <Typography>{selectedAppointment.nursingNotes}</Typography>
//                   </Box>
//                 )}

//                 {/* Preparation Status */}
//                 <Box>
//                   <Typography variant="caption" color="text.secondary" display="block">
//                     Preparation Status
//                   </Typography>
//                   <Chip 
//                     label={selectedAppointment.preparationStatus}
//                     color={selectedAppointment.preparationStatus === 'Ready' ? 'success' : 'warning'}
//                     sx={{ mt: 1 }}
//                   />
//                 </Box>

//                 {/* Action Buttons */}
//                 <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
//                   <Button 
//                     variant="contained"
//                     startIcon={<MedicalServices />}
//                     onClick={() => {
//                       navigate(`/doctor/consultation/${selectedAppointment.id}`);
//                       setDetailsOpen(false);
//                     }}
//                     disabled={selectedAppointment.status === 'Completed'}
//                   >
//                     Start Consultation
//                   </Button>
//                   <Button 
//                     variant="outlined"
//                     startIcon={<Assignment />}
//                     onClick={() => {
//                       navigate(`/doctor/prescriptions/new`, {
//                         state: { 
//                           appointmentId: selectedAppointment.id,
//                           patientId: selectedAppointment.patientId 
//                         }
//                       });
//                       setDetailsOpen(false);
//                     }}
//                   >
//                     Write Prescription
//                   </Button>
//                 </Stack>
//               </Stack>
//             </DialogContent>
//             <DialogActions>
//               <Button onClick={() => setDetailsOpen(false)}>Close</Button>
//               {selectedAppointment.status === 'Scheduled' && (
//                 <Button 
//                   variant="contained"
//                   color="success"
//                   onClick={() => {
//                     handleStatusUpdate(selectedAppointment.id, 'Completed');
//                     setDetailsOpen(false);
//                   }}
//                 >
//                   Mark Complete
//                 </Button>
//               )}
//             </DialogActions>
//           </>
//         )}
//       </Dialog>

//       {/* Snackbar for notifications */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={4000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//       >
//         <Alert 
//           severity={snackbar.severity} 
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default DoctorAppointments;