import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class DoctorAPI {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('doctorToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('doctorToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard
  getDashboard = async () => {
    const response = await this.api.get('/doctors/dashboard');
    return response.data;
  };

  // Appointments
  getAppointments = async (params = {}) => {
    const response = await this.api.get('/doctors/appointments', { params });
    return response.data;
  };

  getAppointment = async (id) => {
    const response = await this.api.get(`/doctors/appointments/${id}`);
    return response.data;
  };

  updateAppointment = async (id, data) => {
    const response = await this.api.put(`/doctors/appointments/${id}`, data);
    return response.data;
  };

  // Patients
  getPatients = async (params = {}) => {
    const response = await this.api.get('/doctors/patients', { params });
    return response.data;
  };

  getPatientClinicalView = async (id) => {
    const response = await this.api.get(`/doctors/patients/${id}`);
    return response.data;
  };

  // Prescriptions
  getPrescriptions = async (params = {}) => {
    const response = await this.api.get('/doctors/prescriptions', { params });
    return response.data;
  };

  createPrescription = async (data) => {
    const response = await this.api.post('/doctors/prescriptions', data);
    return response.data;
  };

  updatePrescription = async (id, data) => {
    const response = await this.api.put(`/doctors/prescriptions/${id}`, data);
    return response.data;
  };

  // Lab Tests
  getLabTests = async (params = {}) => {
    const response = await this.api.get('/doctors/lab-tests', { params });
    return response.data;
  };

  createLabTest = async (data) => {
    const response = await this.api.post('/doctors/lab-tests', data);
    return response.data;
  };

  getLabReports = async (params = {}) => {
    const response = await this.api.get('/doctors/lab-reports', { params });
    return response.data;
  };

  // Admitted Patients
  getAdmittedPatients = async (params = {}) => {
    const response = await this.api.get('/doctors/admitted-patients', { params });
    return response.data;
  };

  // Alerts
  getAlerts = async () => {
    const response = await this.api.get('/doctors/alerts');
    return response.data;
  };

  // Profile
  getProfile = async () => {
    const response = await this.api.get('/doctors/profile');
    return response.data;
  };

  updateProfile = async (data) => {
    const response = await this.api.put('/doctors/profile', data);
    return response.data;
  };

  changePassword = async (data) => {
    const response = await this.api.put('/doctors/change-password', data);
    return response.data;
  };
}

export default new DoctorAPI();