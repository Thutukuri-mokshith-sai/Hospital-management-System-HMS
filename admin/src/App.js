import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import LabTechLayout from './layouts/LabTechLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';
import PharmacistLayout from './layouts/PharmacistLayout';
import PatientLayout from './layouts/PatientLayout';

// Lab Tech Pages
import LabTechDashboard from './pages/labtech/LabTechDashboard';
import LabTechTests from './pages/labtech/LabTechTests';
import LabTechHistory from './pages/labtech/LabTechHistory';
import LabTechPerformance from './pages/labtech/LabTechPerformance';
import LabTechReports from './pages/labtech/LabTechReports';
import LabTechProfile from './pages/labtech/LabTechProfile';
import LabTechSettings from './pages/labtech/LabTechSettings';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import MySchedule from './pages/doctor/Myschedule';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorClinicalActions from './pages/doctor/DoctorClinicalActions';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Patients from './pages/admin/Patients';
import Doctors from './pages/admin/Doctors';
import Appointments from './pages/admin/Appointments';
import Pharmacy from './pages/admin/Pharmacy';
import Laboratory from './pages/admin/Laboratory';
import Billing from './pages/admin/Billing';
import Reports from './pages/admin/Reports';
import Wards from './pages/admin/Wards';
import Nurses from './pages/admin/Nurses';
import Prescription from './pages/admin/Prescription';
import Settings from './pages/admin/Settings';
import Profile from './pages/admin/Profile';

// Pharmacist Pages
import PharmacistDashboard from './pages/pharma/PharmacistDashboard';
import PrescriptionProcessing from './pages/pharma/PrescriptionProcessing';
import BillingReports from './pages/pharma/BillingReports';
import MedicineInventory from './pages/pharma/MedicineInventory';

// Patient Pages
import PatientDashboard from './pages/patients/PatientDashboard';
import PatientAppointments from './pages/patients/PatientAppointments';
import PatientMedicalRecords from './pages/patients/PatientMedicalRecords';
import PatientBilling from './pages/patients/PatientBilling';
import PatientCareAdmission from './pages/patients/PatientCareAdmission';
import PatientProfile from './pages/patients/PatientProfile';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Role-based Route Components
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? children : <Navigate to="/" replace />;
};

const DoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'DOCTOR' ? children : <Navigate to="/" replace />;
};

const PharmacistRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'PHARMACIST' ? children : <Navigate to="/" replace />;
};

const LabTechRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'LAB_TECH' ? children : <Navigate to="/" replace />;
};

const PatientRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'PATIENT' ? children : <Navigate to="/" replace />;
};

// Helper function to redirect based on role
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) return <Navigate to="/login" replace />;
  
  const roleRoutes = {
    'ADMIN': '/admin/dashboard',
    'DOCTOR': '/doctor/dashboard',
    'PATIENT': '/patient/dashboard',
    'PHARMACIST': '/pharmacist/dashboard',
    'LAB_TECH': '/labtech/dashboard',
    'NURSE': '/nurse/dashboard'
  };
  
  const route = roleRoutes[user.role] || '/login';
  return <Navigate to={route} replace />;
};

const theme = createTheme({
  palette: {
    primary: { main: '#2c3e50' },
    secondary: { main: '#34495e' },
    background: { default: '#ecf0f1' }
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Root redirect based on role */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <PrivateRoute>
                <DoctorRoute>
                  <DoctorLayout />
                </DoctorRoute>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="clinical-actions" element={<DoctorClinicalActions />} />
              <Route path="profile" element={<DoctorProfile />} />
              <Route path="schedule" element={<MySchedule />} />
            </Route>
            
            {/* Pharmacist Routes */}
            <Route path="/pharmacist" element={
              <PrivateRoute>
                <PharmacistRoute>
                  <PharmacistLayout />
                </PharmacistRoute>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PharmacistDashboard />} />
              <Route path="prescriptions" element={<PrescriptionProcessing />} />
              <Route path="billing" element={<BillingReports />} />
              <Route path="inventory" element={<MedicineInventory />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="patients" element={<Patients />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="nurses" element={<Nurses />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="pharmacy" element={<Pharmacy />} />
              <Route path="laboratory" element={<Laboratory />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="wards" element={<Wards />} />
              <Route path="prescription" element={<Prescription />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Lab Tech Routes */}
            <Route path="/labtech" element={
              <PrivateRoute>
                <LabTechRoute>
                  <LabTechLayout />
                </LabTechRoute>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LabTechDashboard />} />
              <Route path="tests" element={<LabTechTests />} />
              <Route path="history" element={<LabTechHistory />} />
              <Route path="performance" element={<LabTechPerformance />} />
              <Route path="reports" element={<LabTechReports />} />
              <Route path="profile" element={<LabTechProfile />} />
              <Route path="settings" element={<LabTechSettings />} />
            </Route>
            
            {/* Patient Routes */}
            <Route path="/patient" element={
              <PrivateRoute>
                <PatientRoute>
                  <PatientLayout />
                </PatientRoute>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="appointments" element={<PatientAppointments />} />
               <Route path="records" element={<PatientMedicalRecords />} />
              <Route path="billing" element={<PatientBilling />} />
              <Route path="care" element={<PatientCareAdmission />} />
              <Route path="profile" element={<PatientProfile />} />
              
              {/*<Route path="settings" element={<Navigate to="profile" replace />} />
              <Route path="help" element={<div>Help Center (Coming Soon)</div>} /> */}
            </Route>
            
            {/* Catch-all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;