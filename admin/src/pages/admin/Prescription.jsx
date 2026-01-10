import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  LinearProgress,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  alpha,
  Autocomplete,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

// Import icons individually - this is the safest approach
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import MedicationIcon from '@mui/icons-material/Medication';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import MedicationLiquidIcon from '@mui/icons-material/MedicationLiquid';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { BASE_URL } from '../../api/api';

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prescription-tabpanel-${index}`}
      aria-labelledby={`prescription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Stepper component for creating prescriptions
const CreatePrescriptionStepper = ({ activeStep }) => {
  const steps = [
    'Select Patient',
    'Choose Doctor',
    'Add Medicines',
    'Review & Submit'
  ];

  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
      {steps.map((label, index) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

const Prescription = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Data states
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAdministerDialog, setOpenAdministerDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);

  // Form states
  const [currentPrescription, setCurrentPrescription] = useState({
    patientId: '',
    doctorId: '',
    appointmentId: '',
    medicines: [],
    notes: ''
  });

  const [newMedicine, setNewMedicine] = useState({
    medicineId: '',
    name: '',
    quantity: 1,
    dosage: '',
    frequency: 'Once daily',
    duration: '7 days',
    instructions: ''
  });

  const [administerData, setAdministerData] = useState({
    prescriptionId: '',
    medicineId: '',
    status: 'Administered',
    notes: '',
    administeredBy: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    patientId: '',
    doctorId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Create prescription stepper
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const token = localStorage.getItem('token');

  // Color functions
  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f59e0b',
      'Administered': '#10b981',
      'Skipped': '#ef4444',
      'Cancelled': '#6b7280',
      'Completed': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  // Fetch data functions
  const fetchPrescriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (search) params.append('search', search);

      const res = await fetch(`${BASE_URL}/admin/prescriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      const data = await res.json();
      setPrescriptions(data.data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  }, [token, filters, search]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  }, [token]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  }, [token]);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/medicines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch medicines');
      const data = await res.json();
      setMedicines(data.data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines([]);
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/prescriptions/analytics/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  }, [token]);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/prescriptions/dashboard/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const data = await res.json();
      setDashboardMetrics(data.data || null);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setDashboardMetrics(null);
    }
  }, [token]);

  // Load data based on active tab
  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        switch (activeTab) {
          case 0: // Dashboard
            await Promise.all([
              fetchDashboardMetrics(),
              fetchPrescriptions()
            ]);
            break;
          case 1: // All Prescriptions
            await Promise.all([
              fetchPrescriptions(),
              fetchPatients(),
              fetchDoctors(),
              fetchMedicines()
            ]);
            break;
          case 2: // Analytics
            await Promise.all([
              fetchAnalytics(),
              fetchPrescriptions()
            ]);
            break;
          case 3: // Overdue
            try {
              const res = await fetch(`${BASE_URL}/admin/prescriptions/overdue`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to fetch overdue prescriptions');
              const data = await res.json();
              setPrescriptions(data.data || []);
            } catch (error) {
              console.error('Error fetching overdue prescriptions:', error);
              setPrescriptions([]);
            }
            break;
          default:
            await fetchPrescriptions();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, refreshKey, fetchPrescriptions, fetchPatients, fetchDoctors, fetchMedicines, fetchAnalytics, fetchDashboardMetrics, token]);

  // Handler functions
  const handleCreatePrescription = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...currentPrescription,
          medicines: currentPrescription.medicines
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create prescription');
      }

      setOpenCreateDialog(false);
      setCurrentPrescription({
        patientId: '',
        doctorId: '',
        appointmentId: '',
        medicines: [],
        notes: ''
      });
      setActiveStep(0);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert(error.message);
    }
  };

  const handleUpdatePrescription = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/prescriptions/${currentPrescription._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentPrescription)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update prescription');
      }

      setOpenEditDialog(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating prescription:', error);
      alert(error.message);
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/prescriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete prescription');
      }

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting prescription:', error);
      alert(error.message);
    }
  };

  const handleAdministerMedicine = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/admin/prescriptions/${administerData.prescriptionId}/medicines/${administerData.medicineId}/administer`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: administerData.status,
            notes: administerData.notes,
            administeredBy: administerData.administeredBy || 'Admin'
          })
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to administer medicine');
      }

      setOpenAdministerDialog(false);
      setRefreshKey(prev => prev + 1);
      setAdministerData({
        prescriptionId: '',
        medicineId: '',
        status: 'Administered',
        notes: '',
        administeredBy: ''
      });
    } catch (error) {
      console.error('Error administering medicine:', error);
      alert(error.message);
    }
  };

  const handleExportPrescriptions = async (format = 'csv') => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.doctorId) params.append('doctorId', filters.doctorId);
      if (filters.patientId) params.append('patientId', filters.patientId);
      params.append('format', format);

      const res = await fetch(`${BASE_URL}/admin/prescriptions/export/data?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to export prescriptions');
      }

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescriptions_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setOpenExportDialog(false);
    } catch (error) {
      console.error('Error exporting prescriptions:', error);
      alert(error.message);
    }
  };

  // Medicine form handlers
  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.duration) {
      alert('Please fill in all required medicine fields');
      return;
    }

    setCurrentPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, { ...newMedicine, _id: Date.now().toString() }]
    }));

    setNewMedicine({
      medicineId: '',
      name: '',
      quantity: 1,
      dosage: '',
      frequency: 'Once daily',
      duration: '7 days',
      instructions: ''
    });
  };

  const handleRemoveMedicine = (index) => {
    setCurrentPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineSelect = (medicine) => {
    if (medicine) {
      setNewMedicine(prev => ({
        ...prev,
        medicineId: medicine._id,
        name: medicine.name,
        dosage: medicine.dosage || '',
        price: medicine.price
      }));
    } else {
      setNewMedicine(prev => ({
        ...prev,
        medicineId: '',
        name: '',
        dosage: ''
      }));
    }
  };

  // Dialog openers
  const openCreatePrescriptionDialog = () => {
    setCurrentPrescription({
      patientId: '',
      doctorId: '',
      appointmentId: '',
      medicines: [],
      notes: ''
    });
    setActiveStep(0);
    setOpenCreateDialog(true);
  };

  const openEditPrescriptionDialog = (prescription) => {
    setCurrentPrescription(prescription);
    setOpenEditDialog(true);
  };

  const openViewPrescriptionDialog = (prescription) => {
    setCurrentPrescription(prescription);
    setOpenViewDialog(true);
  };

//   const openAdministerDialog = (prescriptionId, medicine) => {
//     setAdministerData({
//       prescriptionId,
//       medicineId: medicine._id,
//       status: 'Administered',
//       notes: '',
//       administeredBy: ''
//     });
//     setOpenAdministerDialog(true);
//   };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if medicine is overdue
  const isMedicineOverdue = (medicine) => {
    if (!medicine.nextDue || medicine.administrationStatus !== 'Pending') return false;
    return new Date(medicine.nextDue) < new Date();
  };

  // Calculate overdue days
  const calculateOverdueDays = (date) => {
    if (!date) return 0;
    const overdueMs = new Date() - new Date(date);
    return Math.floor(overdueMs / (1000 * 60 * 60 * 24));
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
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <MedicationIcon sx={{ fontSize: 36 }} />
            Prescription Management System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient prescriptions, medicine administration, and prescriptions analytics
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem'
              },
              '& .Mui-selected': {
                color: '#667eea !important'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea'
              }
            }}
          >
            <Tab icon={<BarChartIcon />} label="Dashboard" />
            <Tab icon={<MedicationIcon />} label="All Prescriptions" />
            <Tab icon={<TimelineIcon />} label="Analytics" />
            <Tab icon={<WarningIcon />} label="Overdue" />
          </Tabs>
        </Paper>

        {/* Dashboard Tab */}
        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : dashboardMetrics ? (
            <>
              {/* Stats Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            Total Prescriptions
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {dashboardMetrics.overview?.totalPrescriptions || 0}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendingUpIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              {dashboardMetrics.overview?.todayPrescriptions || 0} today
                            </Typography>
                          </Box>
                        </Box>
                        <MedicationIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            Pending Medicines
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {dashboardMetrics.overview?.pendingMedicines || 0}
                          </Typography>
                          <Typography variant="caption">
                            Need administration
                          </Typography>
                        </Box>
                        <PendingIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            Completion Rate
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {dashboardMetrics.overview?.completionRate || 0}%
                          </Typography>
                          <Typography variant="caption">
                            Medicines administered
                          </Typography>
                        </Box>
                        <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboardMetrics.overview?.completionRate || 0} 
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
                      color: 'white',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            Total Revenue
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            ₹{dashboardMetrics.overview?.totalRevenue || 0}
                          </Typography>
                          <Typography variant="caption">
                            ₹{dashboardMetrics.overview?.pendingRevenue || 0} pending
                          </Typography>
                        </Box>
                        <AttachMoneyIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalHospitalIcon /> Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={openCreatePrescriptionDialog}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      New Prescription
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AssignmentTurnedInIcon />}
                      onClick={() => setOpenBulkDialog(true)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      }}
                    >
                      Bulk Administer
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => setOpenExportDialog(true)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                      }}
                    >
                      Export Data
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<WarningIcon />}
                      onClick={() => setActiveTab(3)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                      }}
                    >
                      View Overdue
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Top Medicines and Doctors */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MedicationLiquidIcon /> Top Medicines
                    </Typography>
                    <List>
                      {dashboardMetrics.topMetrics?.medicines?.slice(0, 5).map((med, index) => (
                        <React.Fragment key={med.name}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#667eea' }}>
                                {index + 1}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={600}>
                                  {med.name}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <InventoryIcon sx={{ fontSize: 14 }} />
                                    Prescribed: {med.prescribed} units
                                  </Typography>
                                  <Typography variant="caption">
                                    {med.prescriptions} prescriptions
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon /> Top Prescribing Doctors
                    </Typography>
                    <List>
                      {dashboardMetrics.topMetrics?.doctors?.slice(0, 5).map((doc, index) => (
                        <React.Fragment key={doc.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#f093fb' }}>
                                {doc.name?.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={600}>
                                  Dr. {doc.name}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MedicationIcon sx={{ fontSize: 14 }} />
                                    {doc.prescriptions} prescriptions
                                  </Typography>
                                  <Typography variant="caption">
                                    {doc.totalMedicines} total medicines prescribed
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              {/* Recent Prescriptions */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon /> Recent Prescriptions
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Medicines</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardMetrics.recent?.prescriptions?.slice(0, 5).map((pres) => (
                      <TableRow key={pres.id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{pres.patient}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">Dr. {pres.doctor}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${pres.medicines} meds`}
                            size="small"
                            sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(pres.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pres.status === 'Completed' ? 'Completed' : 'Pending'}
                            size="small"
                            sx={{
                              bgcolor: alpha(pres.status === 'Completed' ? '#10b981' : '#f59e0b', 0.1),
                              color: pres.status === 'Completed' ? '#10b981' : '#f59e0b'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No dashboard data available. Create your first prescription to get started.
            </Alert>
          )}
        </TabPanel>

        {/* All Prescriptions Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search prescriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ 
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Filter
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreatePrescriptionDialog}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  New Prescription
                </Button>
              </Stack>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Patient</InputLabel>
                    <Select
                      value={filters.patientId}
                      label="Patient"
                      onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                    >
                      <MenuItem value="">All Patients</MenuItem>
                      {patients.map((patient) => (
                        <MenuItem key={patient.user?.id} value={patient.user?.id}>
                          {patient.user?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      value={filters.doctorId}
                      label="Doctor"
                      onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
                    >
                      <MenuItem value="">All Doctors</MenuItem>
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                          Dr. {doctor.user?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Administered">Administered</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setFilters({
                          patientId: '',
                          doctorId: '',
                          status: '',
                          startDate: '',
                          endDate: ''
                        });
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setRefreshKey(prev => prev + 1)}
                      startIcon={<RefreshIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      Refresh
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Prescription Details</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Medicines</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions.map((prescription) => {
                    const pendingMeds = prescription.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                    const totalMeds = prescription.medicines?.length || 0;
                    const completionRate = totalMeds > 0 ? (totalMeds - pendingMeds) / totalMeds * 100 : 0;
                    
                    return (
                      <TableRow key={prescription._id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                              Prescription #{prescription._id?.slice(-6)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {prescription.notes || 'No notes'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>
                            {prescription.patientId?.userId?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>
                            Dr. {prescription.doctorId?.userId?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip 
                              label={`${totalMeds} medicines`}
                              size="small"
                              sx={{ mb: 0.5, bgcolor: alpha('#667eea', 0.1), color: '#667eea' }}
                            />
                            <LinearProgress 
                              variant="determinate" 
                              value={completionRate}
                              sx={{ 
                                height: 4,
                                borderRadius: 2,
                                bgcolor: alpha('#10b981', 0.1),
                                '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {pendingMeds === 0 ? (
                            <Chip
                              label="Completed"
                              size="small"
                              icon={<CheckCircleIcon />}
                              sx={{
                                bgcolor: alpha('#10b981', 0.1),
                                color: '#10b981',
                                fontWeight: 500
                              }}
                            />
                          ) : (
                            <Chip
                              label={`${pendingMeds} pending`}
                              size="small"
                              icon={<PendingIcon />}
                              sx={{
                                bgcolor: alpha('#f59e0b', 0.1),
                                color: '#f59e0b',
                                fontWeight: 500
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(prescription.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => openViewPrescriptionDialog(prescription)}
                                sx={{ color: '#3b82f6' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openEditPrescriptionDialog(prescription)}
                                sx={{ color: '#f59e0b' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {pendingMeds > 0 && (
                              <Tooltip title="Administer">
                                <IconButton
                                  size="small"
                                  onClick={() => openAdministerDialog(prescription._id, prescription.medicines[0])}
                                  sx={{ color: '#10b981' }}
                                >
                                  <AssignmentTurnedInIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePrescription(prescription._id)}
                                sx={{ color: '#ef4444' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : analytics ? (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Total Prescriptions
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#3b82f6' }}>
                        {analytics.summary?.totalPrescriptions || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedicationIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                        <Typography variant="body2">
                          {analytics.summary?.totalMedicines || 0} total medicines
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Avg Medicines per Prescription
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#10b981' }}>
                        {analytics.summary?.avgMedicinesPerPrescription?.toFixed(1) || 0}
                      </Typography>
                      <Typography variant="body2">
                        Per prescription average
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Unique Patients
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#f59e0b' }}>
                        {analytics.summary?.totalPatients?.length || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                        <Typography variant="body2">Active patients</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Prescribing Doctors
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#ec4899' }}>
                        {analytics.summary?.totalDoctors?.length || 0}
                      </Typography>
                      <Typography variant="body2">
                        Active doctors
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Top Medicines Chart */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MedicationLiquidIcon /> Top 10 Prescribed Medicines
                </Typography>
                <Grid container spacing={2}>
                  {analytics.topMedicines?.slice(0, 10).map((med, index) => (
                    <Grid item xs={12} key={med._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {index + 1}. {med._id}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(med.totalPrescribed / (analytics.topMedicines[0]?.totalPrescribed || 1)) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha('#667eea', 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#667eea',
                                borderRadius: 4
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          {med.totalPrescribed} units
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Top Doctors */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Top Prescribing Doctors
                </Typography>
                <Grid container spacing={3}>
                  {analytics.topDoctors?.slice(0, 6).map((doc, index) => (
                    <Grid item xs={12} sm={6} md={4} key={doc._id}>
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#667eea', mr: 2 }}>
                              {doc.doctorName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600}>Dr. {doc.doctorName}</Typography>
                              <Chip
                                label={`Rank #${index + 1}`}
                                size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Prescriptions
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="#3b82f6">
                                {doc.totalPrescriptions}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Medicines
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="#10b981">
                                {doc.totalMedicines}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Administration Status */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedInIcon /> Medicine Administration Status
                </Typography>
                <Grid container spacing={3}>
                  {analytics.administrationStatus?.map((status) => (
                    <Grid item xs={12} sm={6} md={3} key={status._id}>
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: getStatusColor(status._id),
                                mr: 1.5
                              }}
                            />
                            <Typography variant="h6" fontWeight={600}>
                              {status._id}
                            </Typography>
                          </Box>
                          <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                            {status.count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            medicines
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No analytics data available. Prescriptions data will appear here.
            </Alert>
          )}
        </TabPanel>

        {/* Overdue Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Overdue Prescriptions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AssignmentTurnedInIcon />}
              onClick={() => setOpenBulkDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Bulk Administer
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : prescriptions.length > 0 ? (
            <Grid container spacing={3}>
              {prescriptions.map((prescription) => (
                <Grid item xs={12} key={prescription.prescriptionId}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                            Prescription #{prescription.prescriptionId?.slice(-6)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Patient: {prescription.patientName} | Doctor: {prescription.doctorName}
                          </Typography>
                          <Chip
                            label={`${prescription.totalOverdue} overdue medicines`}
                            size="small"
                            color="error"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        <IconButton onClick={() => openViewPrescriptionDialog(prescription)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        {prescription.overdueMedicines?.map((medicine) => (
                          <Grid item xs={12} md={6} key={medicine.medicineId}>
                            <Paper sx={{ p: 2, bgcolor: alpha('#ef4444', 0.05), borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                                    {medicine.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {medicine.dosage} • {medicine.frequency}
                                  </Typography>
                                  <Chip
                                    label={`Overdue by ${medicine.overdueBy} days`}
                                    size="small"
                                    color="error"
                                    sx={{ mt: 1 }}
                                  />
                                </Box>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<AssignmentTurnedInIcon />}
                                  onClick={() => openAdministerDialog(prescription.prescriptionId, medicine)}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Administer
                                </Button>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Next due: {formatDate(medicine.nextDue)}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              No overdue prescriptions found. All medicines are up to date!
            </Alert>
          )}
        </TabPanel>

        {/* Create Prescription Dialog */}
        <Dialog 
          open={openCreateDialog} 
          onClose={() => setOpenCreateDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Create New Prescription
          </DialogTitle>
          <DialogContent>
            <CreatePrescriptionStepper activeStep={activeStep} />
            
            {activeStep === 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Select Patient
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    value={currentPrescription.patientId}
                    label="Patient"
                    onChange={(e) => {
                      setCurrentPrescription({ ...currentPrescription, patientId: e.target.value });
                      const patient = patients.find(p => p.user?.id === e.target.value);
                      setSelectedPatient(patient);
                    }}
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.user?.id} value={patient.user?.id}>
                        {patient.user?.name} ({patient.patient?.age} years, {patient.patient?.gender})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedPatient && (
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Patient Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Age:</Typography>
                        <Typography variant="body2">{selectedPatient.patient?.age} years</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Gender:</Typography>
                        <Typography variant="body2">{selectedPatient.patient?.gender}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Blood Group:</Typography>
                        <Typography variant="body2">{selectedPatient.patient?.bloodGroup || 'Not specified'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                        <Typography variant="body2">{selectedPatient.patient?.admissionStatus || 'Outpatient'}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    disabled={!currentPrescription.patientId}
                  >
                    Next: Choose Doctor
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Choose Doctor
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Doctor</InputLabel>
                  <Select
                    value={currentPrescription.doctorId}
                    label="Doctor"
                    onChange={(e) => {
                      setCurrentPrescription({ ...currentPrescription, doctorId: e.target.value });
                      const doctor = doctors.find(d => d.user?._id === e.target.value);
                      setSelectedDoctor(doctor);
                    }}
                  >
                    {doctors.map((doctor) => (
                      <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                        Dr. {doctor.user?.name} - {doctor.doctor?.specialization}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedDoctor && (
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Doctor Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Specialization:</Typography>
                        <Typography variant="body2">{selectedDoctor.doctor?.specialization}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Department:</Typography>
                        <Typography variant="body2">{selectedDoctor.doctor?.department}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    disabled={!currentPrescription.doctorId}
                  >
                    Next: Add Medicines
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Add Medicines
                </Typography>
                
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Add New Medicine
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        freeSolo
                        options={medicines}
                        getOptionLabel={(option) => option.name || ''}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search Medicine"
                            size="small"
                            fullWidth
                          />
                        )}
                        onChange={(event, value) => handleMedicineSelect(value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Medicine Name"
                        value={newMedicine.name}
                        onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        label="Quantity"
                        type="number"
                        value={newMedicine.quantity}
                        onChange={(e) => setNewMedicine({ ...newMedicine, quantity: parseInt(e.target.value) || 1 })}
                        size="small"
                        fullWidth
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        label="Dosage"
                        value={newMedicine.dosage}
                        onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                        size="small"
                        fullWidth
                        placeholder="e.g., 500mg"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={newMedicine.frequency}
                          label="Frequency"
                          onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                        >
                          <MenuItem value="Once daily">Once daily</MenuItem>
                          <MenuItem value="Twice daily">Twice daily</MenuItem>
                          <MenuItem value="Thrice daily">Thrice daily</MenuItem>
                          <MenuItem value="Every 6 hours">Every 6 hours</MenuItem>
                          <MenuItem value="Every 8 hours">Every 8 hours</MenuItem>
                          <MenuItem value="Weekly">Weekly</MenuItem>
                          <MenuItem value="As needed">As needed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Duration</InputLabel>
                        <Select
                          value={newMedicine.duration}
                          label="Duration"
                          onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                        >
                          <MenuItem value="3 days">3 days</MenuItem>
                          <MenuItem value="5 days">5 days</MenuItem>
                          <MenuItem value="7 days">7 days</MenuItem>
                          <MenuItem value="10 days">10 days</MenuItem>
                          <MenuItem value="14 days">14 days</MenuItem>
                          <MenuItem value="30 days">30 days</MenuItem>
                          <MenuItem value="Ongoing">Ongoing</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Instructions"
                        value={newMedicine.instructions}
                        onChange={(e) => setNewMedicine({ ...newMedicine, instructions: e.target.value })}
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="e.g., Take after food, Avoid alcohol"
                      />
                    </Grid>
                  </Grid>
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddMedicine}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Add Medicine to Prescription
                  </Button>
                </Paper>

                {/* Added Medicines List */}
                {currentPrescription.medicines.length > 0 && (
                  <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Added Medicines ({currentPrescription.medicines.length})
                    </Typography>
                    <List>
                      {currentPrescription.medicines.map((med, index) => (
                        <ListItem
                          key={med._id}
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveMedicine(index)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#667eea' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={med.name}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {med.dosage} • {med.frequency} • {med.duration}
                                </Typography>
                                <br />
                                <Typography variant="caption" component="span">
                                  Quantity: {med.quantity} • {med.instructions}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                <TextField
                  label="Prescription Notes"
                  value={currentPrescription.notes}
                  onChange={(e) => setCurrentPrescription({ ...currentPrescription, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                  placeholder="Additional notes, diagnosis, or instructions"
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(3)}
                    disabled={currentPrescription.medicines.length === 0}
                  >
                    Next: Review & Submit
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 3 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Review Prescription
                </Typography>
                
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Patient
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {patients.find(p => p.user?.id === currentPrescription.patientId)?.user?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Doctor
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        Dr. {doctors.find(d => d.user?._id === currentPrescription.doctorId)?.user?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Medicines ({currentPrescription.medicines.length})
                      </Typography>
                      {currentPrescription.medicines.map((med, index) => (
                        <Box key={med._id} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                            {med.name}
                          </Typography>
                          <Typography variant="body2">
                            {med.dosage} • {med.frequency} • {med.duration} • Quantity: {med.quantity}
                          </Typography>
                          {med.instructions && (
                            <Typography variant="caption" color="text.secondary">
                              Instructions: {med.instructions}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Grid>
                    
                    {currentPrescription.notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {currentPrescription.notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => setActiveStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCreatePrescription}
                  >
                    Create Prescription
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Prescription Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => setOpenEditDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Edit Prescription
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Patient</InputLabel>
                    <Select
                      value={currentPrescription.patientId}
                      label="Patient"
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, patientId: e.target.value })}
                    >
                      {patients.map((patient) => (
                        <MenuItem key={patient.user?.id} value={patient.user?.id}>
                          {patient.user?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      value={currentPrescription.doctorId}
                      label="Doctor"
                      onChange={(e) => setCurrentPrescription({ ...currentPrescription, doctorId: e.target.value })}
                    >
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.user?._id} value={doctor.user?._id}>
                          Dr. {doctor.user?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                label="Prescription Notes"
                value={currentPrescription.notes}
                onChange={(e) => setCurrentPrescription({ ...currentPrescription, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                sx={{ mt: 2 }}
              />

              {/* Medicines Management */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
                Medicines
              </Typography>
              
              {currentPrescription.medicines?.map((med, index) => (
                <Paper key={med._id} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Medicine Name"
                        value={med.name}
                        onChange={(e) => {
                          const newMedicines = [...currentPrescription.medicines];
                          newMedicines[index].name = e.target.value;
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Dosage"
                        value={med.dosage}
                        onChange={(e) => {
                          const newMedicines = [...currentPrescription.medicines];
                          newMedicines[index].dosage = e.target.value;
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Frequency"
                        value={med.frequency}
                        onChange={(e) => {
                          const newMedicines = [...currentPrescription.medicines];
                          newMedicines[index].frequency = e.target.value;
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Duration"
                        value={med.duration}
                        onChange={(e) => {
                          const newMedicines = [...currentPrescription.medicines];
                          newMedicines[index].duration = e.target.value;
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Quantity"
                        type="number"
                        value={med.quantity}
                        onChange={(e) => {
                          const newMedicines = [...currentPrescription.medicines];
                          newMedicines[index].quantity = parseInt(e.target.value) || 1;
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton 
                        color="error"
                        onClick={() => {
                          const newMedicines = currentPrescription.medicines.filter((_, i) => i !== index);
                          setCurrentPrescription({ ...currentPrescription, medicines: newMedicines });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCurrentPrescription({
                    ...currentPrescription,
                    medicines: [
                      ...currentPrescription.medicines,
                      {
                        _id: Date.now().toString(),
                        name: '',
                        dosage: '',
                        frequency: 'Once daily',
                        duration: '7 days',
                        quantity: 1,
                        instructions: '',
                        administrationStatus: 'Pending'
                      }
                    ]
                  });
                }}
                sx={{ mt: 1 }}
                fullWidth
              >
                Add Medicine
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleUpdatePrescription}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Update Prescription
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Prescription Dialog */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Prescription Details
          </DialogTitle>
          <DialogContent>
            {currentPrescription && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Patient
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {currentPrescription.patientId?.userId?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Doctor
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      Dr. {currentPrescription.doctorId?.userId?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentPrescription.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={currentPrescription.medicines?.some(m => m.administrationStatus === 'Pending') ? 'Pending' : 'Completed'}
                      color={currentPrescription.medicines?.some(m => m.administrationStatus === 'Pending') ? 'warning' : 'success'}
                      size="small"
                    />
                  </Grid>
                  
                  {currentPrescription.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {currentPrescription.notes}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Medicines ({currentPrescription.medicines?.length || 0})
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {currentPrescription.medicines?.map((med, index) => (
                        <Grid item xs={12} key={med._id}>
                          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                                  {med.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {med.dosage} • {med.frequency} • {med.duration} • Quantity: {med.quantity}
                                </Typography>
                                {med.instructions && (
                                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                    Instructions: {med.instructions}
                                  </Typography>
                                )}
                              </Box>
                              <Box>
                                <Chip
                                  label={med.administrationStatus}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(getStatusColor(med.administrationStatus), 0.1),
                                    color: getStatusColor(med.administrationStatus),
                                    fontWeight: 500
                                  }}
                                />
                                {med.administrationStatus === 'Pending' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AssignmentTurnedInIcon />}
                                    onClick={() => openAdministerDialog(currentPrescription._id, med)}
                                    sx={{ mt: 1, borderRadius: 2 }}
                                  >
                                    Administer
                                  </Button>
                                )}
                              </Box>
                            </Box>
                            {med.lastAdministered && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Last administered: {formatDate(med.lastAdministered)}
                              </Typography>
                            )}
                            {med.nextDue && med.administrationStatus === 'Pending' && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Next due: {formatDate(med.nextDue)}
                                {isMedicineOverdue(med) && (
                                  <Chip
                                    label={`Overdue by ${calculateOverdueDays(med.nextDue)} days`}
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            {currentPrescription?.medicines?.some(m => m.administrationStatus === 'Pending') && (
              <Button
                variant="contained"
                onClick={() => setOpenAdministerDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Administer Medicines
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Administer Medicine Dialog */}
        <Dialog 
          open={openAdministerDialog} 
          onClose={() => setOpenAdministerDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Administer Medicine
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={administerData.status}
                  label="Status"
                  onChange={(e) => setAdministerData({ ...administerData, status: e.target.value })}
                >
                  <MenuItem value="Administered">Administered</MenuItem>
                  <MenuItem value="Skipped">Skipped</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Administered By"
                value={administerData.administeredBy}
                onChange={(e) => setAdministerData({ ...administerData, administeredBy: e.target.value })}
                fullWidth
                placeholder="Enter your name or ID"
              />
              
              <TextField
                label="Notes"
                value={administerData.notes}
                onChange={(e) => setAdministerData({ ...administerData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Any notes about the administration"
              />
              
              <TextField
                label="Date & Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                fullWidth
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAdministerDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAdministerMedicine}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Confirm Administration
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Administration Dialog */}
        <Dialog 
          open={openBulkDialog} 
          onClose={() => setOpenBulkDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Bulk Medicine Administration
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select multiple medicines to update their administration status in bulk.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Bulk administration feature coming soon. Currently, please administer medicines individually.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Apply Bulk Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog 
          open={openExportDialog} 
          onClose={() => setOpenExportDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Export Prescriptions Data
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  defaultValue="csv"
                  label="Export Format"
                >
                  <MenuItem value="csv">CSV (Spreadsheet)</MenuItem>
                  <MenuItem value="json" disabled>JSON (API)</MenuItem>
                  <MenuItem value="pdf" disabled>PDF Report</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" fontWeight={600}>
                Filters Applied:
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date Range:
                    </Typography>
                    <Typography variant="body2">
                      {filters.startDate || 'Start'} to {filters.endDate || 'End'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Patient:
                    </Typography>
                    <Typography variant="body2">
                      {filters.patientId ? patients.find(p => p.user?.id === filters.patientId)?.user?.name : 'All'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Doctor:
                    </Typography>
                    <Typography variant="body2">
                      {filters.doctorId ? doctors.find(d => d.user?._id === filters.doctorId)?.user?.name : 'All'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status:
                    </Typography>
                    <Typography variant="body2">
                      {filters.status || 'All'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Alert severity="info">
                Export will include {prescriptions.length} prescriptions with current filters applied.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenExportDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleExportPrescriptions('csv')}
              startIcon={<DownloadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Export as CSV
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Prescription;