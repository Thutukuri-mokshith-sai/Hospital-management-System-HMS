import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import LabTechLayout from './layouts/LabTechLayout';

//lab tech
import LabTechDashboard from './pages/labtech/LabTechDashboard';
import LabTechTests from './pages/labtech/LabTechTests';
import LabTechHistory from './pages/labtech/LabTechHistory';
import LabTechPerformance from './pages/labtech/LabTechPerformance';
import LabTechReports from './pages/labtech/LabTechReports';
import LabTechProfile from './pages/labtech/LabTechProfile';
import LabTechSettings from './pages/labtech/LabTechSettings';

import DoctorLayout from './layouts/DoctorLayout';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
// import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorLabTests from './pages/doctor/DoctorLabTests';
// import Consultation from './pages/doctor/Consultation';
// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLayout from './layouts/AdminLayout';
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

// Private Route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? children : <Navigate to="/login" replace />;
};
const DoctorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "DOCTOR"
    ? children
    : <Navigate to="/login" replace />;
};
const LabTechRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "LAB_TECH"
    ? children
    : <Navigate to="/login" replace />;
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

            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/doctor" element={
                      <PrivateRoute>
                        <DoctorRoute>
                          <DoctorLayout />
                        </DoctorRoute>
                      </PrivateRoute>
                    }>
                      <Route index element={<DoctorDashboard />} />
                      <Route path="dashboard" element={<DoctorDashboard />} />
                      <Route path="patients" element={<DoctorPatients />} />
                      {/* <Route path="appointments" element={<DoctorAppointments />} /> */}
                      <Route path="prescriptions" element={<DoctorPrescriptions />} />
                      <Route path="lab-tests" element={<DoctorLabTests />} />
                      {/* <Route path="consultation/:id" element={<Consultation />} /> */}
                    </Route>

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </PrivateRoute>
              }
            >
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
              <Route path="/labtech" element={
  <PrivateRoute>
    <LabTechRoute>
      <LabTechLayout />
    </LabTechRoute>
  </PrivateRoute>
}>
  <Route index element={<LabTechDashboard />} />
  <Route path="dashboard" element={<LabTechDashboard />} />
  <Route path='tests' element={<LabTechTests/>}/>
  <Route path='history' element={<LabTechHistory/>}/>
  <Route path='performance' element={<LabTechPerformance/>}/>
  <Route path='reports' element={<LabTechReports/>}/>
  <Route path='profile' element={<LabTechProfile/>}/>
  <Route path='settings' element={<LabTechSettings/>}/>
  </Route>
            {/* Default */}
            {/* <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} /> */}

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;