// api.js - Updated with all patient-related API calls
import axios from 'axios';

export const BASE_URL = 'https://hospital-management-system-hms-j3rq.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const loginCall = (data) => api.post('/auth/login', data);
export const signupCall = (data) => api.post('/auth/signup', data);
export const getMe = () => api.get('/auth/me');

// Admin Dashboard API
export const getDashboardStats = () => api.get('/admin/dashboard/stats');

// Users Management API
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const toggleUserStatus = (id, data) => api.patch(`/admin/users/${id}/status`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const assignRole = (id, data) => api.post(`/admin/users/${id}/assign-role`, data);

// PATIENTS API - COMPLETE SET
// Get all patients with filters
export const getAllPatients = (params) => api.get('/admin/patients', { params });

// Get single patient details
export const getPatientById = (id) => api.get(`/admin/patients/${id}`);

// Update patient profile
export const updatePatient = (id, data) => api.put(`/admin/patients/${id}`, data);

// Get patient registrations with filters
export const getPatientRegistrations = (params) => api.get('/admin/registrations/patients', { params });

// Create new patient (through user creation)
export const createPatient = (data) => api.post('/admin/users', { ...data, role: 'PATIENT' });

// Patient admission management (custom endpoints if needed)
export const admitPatient = (patientId, data) => api.post(`/patients/${patientId}/admit`, data);
export const dischargePatient = (patientId, data) => api.post(`/patients/${patientId}/discharge`, data);

// Patient vitals
export const getPatientVitals = (patientId, params) => api.get(`/patients/${patientId}/vitals`, { params });
export const addPatientVitals = (patientId, data) => api.post(`/patients/${patientId}/vitals`, data);

// Patient appointments
export const getPatientAppointments = (patientId, params) => api.get(`/patients/${patientId}/appointments`, { params });

// Patient prescriptions
export const getPatientPrescriptions = (patientId, params) => api.get(`/patients/${patientId}/prescriptions`, { params });

// Patient lab tests
export const getPatientLabTests = (patientId, params) => api.get(`/patients/${patientId}/lab-tests`, { params });

// Patient billing
export const getPatientBilling = (patientId, params) => api.get(`/patients/${patientId}/billing`, { params });

// Patient nursing care
export const getPatientNursingCare = (patientId, params) => api.get(`/patients/${patientId}/nursing-care`, { params });

// Patient care notes
export const getPatientCareNotes = (patientId, params) => api.get(`/patients/${patientId}/care-notes`, { params });
export const addPatientCareNote = (patientId, data) => api.post(`/patients/${patientId}/care-notes`, data);
export const updatePatientCareNote = (patientId, noteId, data) => api.put(`/patients/${patientId}/care-notes/${noteId}`, data);

// Patient statistics
export const getPatientStatistics = (patientId) => api.get(`/patients/${patientId}/statistics`);

// Appointments API
export const getAllAppointments = (params) => api.get('/admin/appointments', { params });
export const createAppointment = (data) => api.post('/admin/appointments', data);
export const updateAppointment = (id, data) => api.put(`/admin/appointments/${id}`, data);
export const deleteAppointment = (id) => api.delete(`/admin/appointments/${id}`);

// Doctors API
export const getAllDoctors = (params) => api.get('/admin/doctors', { params });
export const getDoctorById = (id) => api.get(`/admin/doctors/${id}`);

// Nurses API
export const getAllNurses = (params) => api.get('/admin/nurses', { params });

// Pharmacy API
export const getPharmacyInventory = (params) => api.get('/admin/pharmacy/inventory', { params });
export const addMedicine = (data) => api.post('/admin/pharmacy/medicines', data);
export const updateMedicineStock = (id, data) => api.put(`/admin/pharmacy/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/admin/pharmacy/medicines/${id}`);

// Laboratory API
export const getAllLabTests = (params) => api.get('/admin/lab/tests', { params });
export const updateLabTestStatus = (id, data) => api.put(`/admin/lab/tests/${id}/status`, data);
export const createLabTest = (data) => api.post('/admin/lab/tests', data);

// Prescriptions API
export const getAllPrescriptions = (params) => api.get('/admin/prescriptions', { params });

// Vitals API
export const getAllVitals = (params) => api.get('/admin/vitals', { params });

// Nursing Care API
export const getAllNursingCare = (params) => api.get('/admin/nursing-care', { params });

// Billing API
export const getAllBilling = (params) => api.get('/admin/billing', { params });
export const updateBillingStatus = (id, data) => api.put(`/admin/billing/${id}/status`, data);
export const createBilling = (data) => api.post('/admin/billing', data);
export const generateRevenueReport = (params) => api.get('/admin/billing/revenue-report', { params });

// Reports API
export const generateSystemReport = (params) => api.get('/admin/reports/system', { params });

// Wards API
export const getAllWards = (params) => api.get('/admin/wards', { params });
export const getWardById = (id) => api.get(`/admin/wards/${id}`);
export const createWard = (data) => api.post('/admin/wards', data);
export const updateWard = (id, data) => api.put(`/admin/wards/${id}`, data);
export const deleteWard = (id) => api.delete(`/admin/wards/${id}`);

// Export all API functions
export default {
  // Auth
  loginCall,
  signupCall,
  getMe,
  
  // Dashboard
  getDashboardStats,
  
  // Users
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  assignRole,
  
  // Patients - Complete Set
  getAllPatients,
  getPatientById,
  updatePatient,
  getPatientRegistrations,
  createPatient,
  admitPatient,
  dischargePatient,
  getPatientVitals,
  addPatientVitals,
  getPatientAppointments,
  getPatientPrescriptions,
  getPatientLabTests,
  getPatientBilling,
  getPatientNursingCare,
  getPatientCareNotes,
  addPatientCareNote,
  updatePatientCareNote,
  getPatientStatistics,
  
  // Appointments
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  
  // Doctors
  getAllDoctors,
  getDoctorById,
  
  // Nurses
  getAllNurses,
  
  // Pharmacy
  getPharmacyInventory,
  addMedicine,
  updateMedicineStock,
  deleteMedicine,
  
  // Laboratory
  getAllLabTests,
  updateLabTestStatus,
  createLabTest,
  
  // Prescriptions
  getAllPrescriptions,
  
  // Vitals
  getAllVitals,
  
  // Nursing Care
  getAllNursingCare,
  
  // Billing
  getAllBilling,
  updateBillingStatus,
  createBilling,
  generateRevenueReport,
  
  // Reports
  generateSystemReport,
  
  // Wards
  getAllWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard
};