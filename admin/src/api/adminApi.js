import axios from 'axios';
import { BASE_URL } from './api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
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

// Dashboard API calls
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= PHARMACY MANAGEMENT =================

// 1. Medicine CRUD Operations

export const getPharmacyInventory = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/inventory', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMedicineById = async (id) => {
  try {
    const response = await api.get(`/admin/pharmacy/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addMedicine = async (data) => {
  try {
    const response = await api.post('/admin/pharmacy/inventory', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMedicine = async (id, data) => {
  try {
    const response = await api.put(`/admin/pharmacy/inventory/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMedicine = async (id) => {
  try {
    const response = await api.delete(`/admin/pharmacy/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleMedicineStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`/admin/pharmacy/inventory/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 2. Stock Management

export const updateStock = async (data) => {
  try {
    const response = await api.post('/admin/pharmacy/stock/update', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStockHistory = async (id, params = {}) => {
  try {
    const response = await api.get(`/admin/pharmacy/inventory/${id}/history`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 3. Alerts & Monitoring

export const getLowStockAlerts = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/alerts/low-stock', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getExpiredMedicines = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/alerts/expired', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 4. Analytics & Reporting

export const getPharmacyDashboard = async () => {
  try {
    const response = await api.get('/admin/pharmacy/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPharmacyAnalytics = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/analytics', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generatePharmacyReport = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/reports', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// 5. Prescription Analytics

export const getPrescriptionAnalytics = async (params = {}) => {
  try {
    const response = await api.get('/admin/pharmacy/prescription-analytics', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= USERS MANAGEMENT =================

export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleUserStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= PATIENTS MANAGEMENT =================

export const getPatients = async (params = {}) => {
  try {
    const response = await api.get('/admin/patients/registrations', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= DOCTORS MANAGEMENT =================

export const getDoctors = async (params = {}) => {
  try {
    const response = await api.get('/admin/users', { 
      params: { ...params, role: 'DOCTOR' } 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= APPOINTMENTS MANAGEMENT =================

export const getAppointments = async (params = {}) => {
  try {
    const response = await api.get('/admin/appointments', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= LABORATORY MANAGEMENT =================

export const getLabTests = async (params = {}) => {
  try {
    const response = await api.get('/admin/lab/tests', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateLabTestStatus = async (id, data) => {
  try {
    const response = await api.patch(`/admin/lab/tests/${id}/status`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= BILLING MANAGEMENT =================

export const getBillingRecords = async (params = {}) => {
  try {
    const response = await api.get('/admin/billing', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBillingStatus = async (id, paymentStatus) => {
  try {
    const response = await api.patch(`/admin/billing/${id}/status`, { paymentStatus });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRevenueReport = async (params = {}) => {
  try {
    const response = await api.get('/admin/billing/revenue-report', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ================= REPORTS =================

export const getSystemReport = async (params = {}) => {
  try {
    const response = await api.get('/admin/reports/system', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api;