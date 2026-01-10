import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

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
// Add this import
import Wards from './pages/admin/Wards';
import Nurses from './pages/admin/Nurses';
import Prescription from './pages/admin/Prescription';
// Private Route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Admin Route
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // While auth is loading, don't render routes (avoids flicker)
  if (loading) return null;
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? children : <Navigate to="/login" replace />;
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

            {/* Admin */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </PrivateRoute>
              }
              >
              <Route path="wards" element={<Wards />} />
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="patients" element={<Patients />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path='nurses' element={<Nurses/>}/>
              <Route path="appointments" element={<Appointments />} />
              <Route path="pharmacy" element={<Pharmacy />} />
              <Route path="laboratory" element={<Laboratory />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<Reports />} />
              <Route path='prescription' element={<Prescription/>}/>
            </Route>

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
