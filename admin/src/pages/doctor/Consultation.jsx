// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import {
//   Box, Paper, Typography, Stack, Button, TextField, Divider,
//   Grid, Chip, Avatar, IconButton, Alert, CircularProgress
// } from '@mui/material';
// import {
//   ArrowBack, Save, MedicalServices, Assignment, Person,
//   CalendarMonth, AccessTime, Phone, Email
// } from '@mui/icons-material';
// import { format, parseISO } from 'date-fns';
// import { doctorAppointments } from '../../api/doctorApi';

// const Consultation = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [appointment, setAppointment] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [consultationNotes, setConsultationNotes] = useState('');
//   const [diagnosis, setDiagnosis] = useState('');
//   const [recommendations, setRecommendations] = useState('');

//   useEffect(() => {
//     fetchAppointmentDetails();
//   }, [id]);

//   const fetchAppointmentDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await doctorAppointments.getAppointmentById(id);
      
//       if (response.success) {
//         setAppointment(response.data);
//         setConsultationNotes(response.data.notes || '');
//         setLoading(false);
//       } else {
//         setError('Failed to load appointment details');
//       }
//     } catch (err) {
//       console.error('Error fetching appointment:', err);
//       setError(err.response?.data?.error || 'Failed to load appointment');
//       setLoading(false);
//     }
//   };

//   const handleSaveConsultation = async () => {
//     try {
//       const response = await doctorAppointments.updateAppointment(id, {
//         notes: consultationNotes,
//         diagnosis,
//         recommendations,
//         status: 'Completed'
//       });

//       if (response.success) {
//         navigate('/doctor/appointments', {
//           state: { message: 'Consultation completed successfully' }
//         });
//       }
//     } catch (err) {
//       setError('Failed to save consultation notes');
//     }
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error || !appointment) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error" sx={{ mb: 3 }}>
//           {error || 'Appointment not found'}
//         </Alert>
//         <Button startIcon={<ArrowBack />} onClick={() => navigate('/doctor/appointments')}>
//           Back to Appointments
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* Header */}
//       <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
//         <IconButton onClick={() => navigate('/doctor/appointments')}>
//           <ArrowBack />
//         </IconButton>
//         <Box>
//           <Typography variant="h4" fontWeight={700}>
//             Consultation
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Patient consultation and notes
//           </Typography>
//         </Box>
//       </Stack>

//       <Grid container spacing={3}>
//         {/* Patient Info Sidebar */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
//             <Typography variant="h6" fontWeight={600} gutterBottom>
//               Patient Information
//             </Typography>
//             <Stack spacing={2}>
//               <Stack direction="row" spacing={2} alignItems="center">
//                 <Avatar sx={{ width: 60, height: 60, fontSize: 24 }}>
//                   {appointment.patientId?.userId?.name?.charAt(0) || 'P'}
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h6" fontWeight={600}>
//                     {appointment.patientId?.userId?.name || 'Unknown Patient'}
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     ID: {appointment.patientId?._id?.slice(-6) || 'N/A'}
//                   </Typography>
//                 </Box>
//               </Stack>

//               <Divider />

//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   <Phone fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
//                   Contact
//                 </Typography>
//                 <Typography>{appointment.patientId?.userId?.phone || 'N/A'}</Typography>
//               </Box>

//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   <Email fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
//                   Email
//                 </Typography>
//                 <Typography>{appointment.patientId?.userId?.email || 'N/A'}</Typography>
//               </Box>

//               <Divider />

//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   <CalendarMonth fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
//                   Appointment Date
//                 </Typography>
//                 <Typography fontWeight={600}>
//                   {format(parseISO(appointment.date), 'MMM dd, yyyy')}
//                 </Typography>
//               </Box>

//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   <AccessTime fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
//                   Appointment Time
//                 </Typography>
//                 <Typography fontWeight={600}>{appointment.time}</Typography>
//               </Box>

//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   Reason for Visit
//                 </Typography>
//                 <Typography>{appointment.reason || 'Not specified'}</Typography>
//               </Box>
//             </Stack>
//           </Paper>

//           {/* Quick Actions */}
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" fontWeight={600} gutterBottom>
//               Quick Actions
//             </Typography>
//             <Stack spacing={2}>
//               <Button
//                 variant="outlined"
//                 startIcon={<Assignment />}
//                 onClick={() => navigate('/doctor/prescriptions/new', {
//                   state: { 
//                     appointmentId: appointment._id,
//                     patientId: appointment.patientId?._id 
//                   }
//                 })}
//                 fullWidth
//               >
//                 Write Prescription
//               </Button>
//               <Button
//                 variant="outlined"
//                 startIcon={<MedicalServices />}
//                 onClick={() => navigate(`/doctor/patients/${appointment.patientId?._id}`)}
//                 fullWidth
//               >
//                 View Patient History
//               </Button>
//             </Stack>
//           </Paper>
//         </Grid>

//         {/* Consultation Notes */}
//         <Grid item xs={12} md={8}>
//           <Paper sx={{ p: 3, borderRadius: 2 }}>
//             <Typography variant="h6" fontWeight={600} gutterBottom>
//               Consultation Notes
//             </Typography>

//             <Stack spacing={3}>
//               {/* Diagnosis */}
//               <Box>
//                 <Typography variant="subtitle2" fontWeight={600} gutterBottom>
//                   Diagnosis
//                 </Typography>
//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={3}
//                   value={diagnosis}
//                   onChange={(e) => setDiagnosis(e.target.value)}
//                   placeholder="Enter diagnosis..."
//                   variant="outlined"
//                 />
//               </Box>

//               {/* Consultation Notes */}
//               <Box>
//                 <Typography variant="subtitle2" fontWeight={600} gutterBottom>
//                   Consultation Notes
//                 </Typography>
//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={6}
//                   value={consultationNotes}
//                   onChange={(e) => setConsultationNotes(e.target.value)}
//                   placeholder="Enter detailed consultation notes..."
//                   variant="outlined"
//                 />
//               </Box>

//               {/* Recommendations */}
//               <Box>
//                 <Typography variant="subtitle2" fontWeight={600} gutterBottom>
//                   Recommendations & Follow-up
//                 </Typography>
//                 <TextField
//                   fullWidth
//                   multiline
//                   rows={3}
//                   value={recommendations}
//                   onChange={(e) => setRecommendations(e.target.value)}
//                   placeholder="Enter recommendations and follow-up instructions..."
//                   variant="outlined"
//                 />
//               </Box>

//               {/* Action Buttons */}
//               <Stack direction="row" spacing={2} justifyContent="flex-end">
//                 <Button
//                   variant="outlined"
//                   onClick={() => navigate('/doctor/appointments')}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   variant="contained"
//                   startIcon={<Save />}
//                   onClick={handleSaveConsultation}
//                 >
//                   Save & Complete Consultation
//                 </Button>
//               </Stack>
//             </Stack>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };

// export default Consultation;