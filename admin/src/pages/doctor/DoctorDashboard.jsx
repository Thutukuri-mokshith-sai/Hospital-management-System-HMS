import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Users, FileText, TestTube, 
  AlertTriangle, ClipboardList, User, Settings, 
  LogOut, RefreshCw, Search, Filter, Plus, Edit,
  Eye, Clock, Bell, ChevronDown, ChevronRight,
  Pill, Heart, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';

const DoctorDashboard = () => {
  const BASE_URL = 'http://localhost:5000/api/v1';
  
  // Get auth from localStorage
  const getAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return { token, user };
  };

  // State Management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientClinical, setPatientClinical] = useState(null);
  
  // Filter States
  const [appointmentFilters, setAppointmentFilters] = useState({
    status: '',
    date: new Date().toISOString().split('T')[0],
    page: 1,
    limit: 10
  });
  const [patientFilters, setPatientFilters] = useState({
    search: '',
    admissionStatus: '',
    page: 1,
    limit: 10
  });
  const [labFilters, setLabFilters] = useState({
    patientId: '',
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });
  
  // Form States
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showLabTestForm, setShowLabTestForm] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    appointmentId: '',
    medicines: [{ medicineId: '', name: '', quantity: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });
  const [labTestForm, setLabTestForm] = useState({
    patientId: '',
    appointmentId: '',
    testName: '',
    priority: 'Medium',
    notes: ''
  });

  // API Helper Function
  const apiCall = async (endpoint, options = {}) => {
    const { token } = getAuth();
    if (!token) {
      setError('Not authenticated. Please login.');
      return null;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Fetch Dashboard Data
  const fetchDashboard = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/dashboard');
    if (data && data.success) {
      setDashboardData(data.data);
      if (data.data.criticalAlerts) {
        setAlerts(data.data.criticalAlerts);
      }
    }
    setLoading(false);
  };

  // Fetch Appointments
  const fetchAppointments = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(appointmentFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const data = await apiCall(`/doctors/appointments?${params}`);
    if (data && data.success) {
      setAppointments(data.data);
    }
    setLoading(false);
  };

  // Update Appointment
  const updateAppointment = async (id, updates) => {
    setLoading(true);
    const data = await apiCall(`/doctors/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (data && data.success) {
      setSuccess('Appointment updated successfully');
      fetchAppointments();
    }
    setLoading(false);
  };

  // Fetch Patients
  const fetchPatients = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(patientFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const data = await apiCall(`/doctors/patients?${params}`);
    if (data && data.success) {
      setPatients(data.data);
    }
    setLoading(false);
  };

  // Fetch Patient Clinical View
  const fetchPatientClinical = async (patientId) => {
    setLoading(true);
    const data = await apiCall(`/doctors/patients/${patientId}`);
    if (data && data.success) {
      setPatientClinical(data.data);
      setSelectedPatient(patientId);
    }
    setLoading(false);
  };

  // Create Prescription
  const createPrescription = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionForm)
    });
    if (data && data.success) {
      setSuccess('Prescription created successfully');
      setShowPrescriptionForm(false);
      setPrescriptionForm({
        patientId: '',
        appointmentId: '',
        medicines: [{ medicineId: '', name: '', quantity: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      });
      fetchPrescriptions();
    }
    setLoading(false);
  };

  // Fetch Prescriptions
  const fetchPrescriptions = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/prescriptions');
    if (data && data.success) {
      setPrescriptions(data.data);
    }
    setLoading(false);
  };

  // Order Lab Test
  const orderLabTest = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/lab-tests', {
      method: 'POST',
      body: JSON.stringify(labTestForm)
    });
    if (data && data.success) {
      setSuccess('Lab test ordered successfully');
      setShowLabTestForm(false);
      setLabTestForm({
        patientId: '',
        appointmentId: '',
        testName: '',
        priority: 'Medium',
        notes: ''
      });
      fetchLabTests();
    }
    setLoading(false);
  };

  // Fetch Lab Tests
  const fetchLabTests = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(labFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const data = await apiCall(`/doctors/lab-tests?${params}`);
    if (data && data.success) {
      setLabTests(data.data);
    }
    setLoading(false);
  };

  // Fetch Lab Reports
  const fetchLabReports = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/lab-reports');
    if (data && data.success) {
      setLabReports(data.data);
    }
    setLoading(false);
  };

  // Fetch Admitted Patients
  const fetchAdmittedPatients = async () => {
    setLoading(true);
    const data = await apiCall('/doctors/admitted-patients');
    if (data && data.success) {
      setAdmittedPatients(data.data);
    }
    setLoading(false);
  };

  // Fetch Alerts
  const fetchAlerts = async () => {
    const data = await apiCall('/doctors/alerts');
    if (data && data.success) {
      setAlerts(data.data);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Initial Load
  useEffect(() => {
    const { token } = getAuth();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchDashboard();
    fetchAlerts();
  }, []);

  // Tab Change Effect
  useEffect(() => {
    if (activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'patients') fetchPatients();
    if (activeTab === 'prescriptions') fetchPrescriptions();
    if (activeTab === 'lab-tests') fetchLabTests();
    if (activeTab === 'lab-reports') fetchLabReports();
    if (activeTab === 'admitted') fetchAdmittedPatients();
  }, [activeTab]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const { user } = getAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name || 'Doctor'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAlerts}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-6 h-6" />
                {alerts.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'patients', label: 'Patients', icon: Users },
              { id: 'admitted', label: 'Admitted', icon: Heart },
              { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
              { id: 'lab-tests', label: 'Lab Tests', icon: TestTube },
              { id: 'lab-reports', label: 'Reports', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && !loading && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Today's Appointments", value: dashboardData.counts?.todaysAppointments || 0, icon: Calendar, color: 'blue' },
                { label: 'Admitted Patients', value: dashboardData.counts?.admittedPatients || 0, icon: Heart, color: 'red' },
                { label: 'Pending Lab Tests', value: dashboardData.counts?.pendingLabTests || 0, icon: TestTube, color: 'yellow' },
                { label: 'Active Prescriptions', value: dashboardData.counts?.activePrescriptions || 0, icon: Pill, color: 'green' },
                { label: 'Total Patients', value: dashboardData.counts?.totalPatients || 0, icon: Users, color: 'purple' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <Icon className={`w-12 h-12 text-${stat.color}-500`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Critical Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                  Critical Alerts ({alerts.length})
                </h2>
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                        alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{alert.patientName}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                          {alert.data && (
                            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                              {JSON.stringify(alert.data, null, 2)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-lg font-medium text-gray-900">{dashboardData.doctorProfile?.userId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-medium text-gray-900">{dashboardData.doctorProfile?.userId?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Specialization</p>
                  <p className="text-lg font-medium text-gray-900">{dashboardData.doctorProfile?.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="text-lg font-medium text-gray-900">{dashboardData.doctorProfile?.department}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={appointmentFilters.date}
                    onChange={(e) => setAppointmentFilters({...appointmentFilters, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={appointmentFilters.status}
                    onChange={(e) => setAppointmentFilters({...appointmentFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  onClick={fetchAppointments}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {appointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{apt.patientId?.userId?.name}</div>
                          <div className="text-sm text-gray-500">{apt.patientId?.userId?.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{new Date(apt.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{apt.time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{apt.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {apt.status === 'Scheduled' && (
                              <button
                                onClick={() => updateAppointment(apt._id, { status: 'Completed' })}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => fetchPatientClinical(apt.patientId._id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={patientFilters.search}
                    onChange={(e) => setPatientFilters({...patientFilters, search: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Status</label>
                  <select
                    value={patientFilters.admissionStatus}
                    onChange={(e) => setPatientFilters({...patientFilters, admissionStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
                <button
                  onClick={fetchPatients}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <div key={patient._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{patient.userId?.name}</h3>
                        <p className="text-sm text-gray-500">{patient.age} yrs • {patient.gender}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Blood Group:</span>
                      <span className="font-medium text-gray-900">{patient.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        patient.admissionStatus === 'Admitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.admissionStatus}
                      </span>
                    </div>
                    {patient.wardId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ward:</span>
                        <span className="font-medium text-gray-900">{patient.wardId?.wardNumber}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      fetchPatientClinical(patient._id);
                      setActiveTab('patient-clinical');
                    }}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Clinical View */}
        {activeTab === 'patient-clinical' && patientClinical && !loading && (
          <div className="space-y-6">
            <button
              onClick={() => setActiveTab('patients')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to Patients</span>
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{patientClinical.patient?.userId?.name}</h2>
                    <p className="text-gray-500">{patientClinical.patient?.age} yrs • {patientClinical.patient?.gender} • {patientClinical.patient?.bloodGroup}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setPrescriptionForm({...prescriptionForm, patientId: patientClinical.patient._id});
                      setShowPrescriptionForm(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Prescription</span>
                  </button>
                  <button
                    onClick={() => {
                      setLabTestForm({...labTestForm, patientId: patientClinical.patient._id});
                      setShowLabTestForm(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lab Test</span>
                  </button>
                </div>
              </div>

              {/* Latest Vitals */}
              {patientClinical.clinicalData?.latestVitals && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Latest Vitals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="text-2xl font-bold text-blue-600">{patientClinical.clinicalData.latestVitals.temperature}°C</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Blood Pressure</p>
                      <p className="text-2xl font-bold text-green-600">
                        {patientClinical.clinicalData.latestVitals.bloodPressure?.systolic}/{patientClinical.clinicalData.latestVitals.bloodPressure?.diastolic}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Heart Rate</p>
                      <p className="text-2xl font-bold text-red-600">{patientClinical.clinicalData.latestVitals.heartRate} bpm</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Oxygen</p>
                      <p className="text-2xl font-bold text-purple-600">{patientClinical.clinicalData.latestVitals.oxygenSaturation}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Recorded by {patientClinical.clinicalData.latestVitals.nurseId?.userId?.name} on{' '}
                    {new Date(patientClinical.clinicalData.latestVitals.recordedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Nursing Care */}
              {patientClinical.clinicalData?.nursingCare?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Nursing Care</h3>
                  <div className="space-y-2">
                    {patientClinical.clinicalData.nursingCare.slice(0, 5).map((care, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{care.careType}</p>
                          <p className="text-sm text-gray-600">{care.description}</p>
                          <p className="text-xs text-gray-500 mt-1">By {care.nurseId?.userId?.name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          care.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {care.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admitted Patients Tab */}
        {activeTab === 'admitted' && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admittedPatients.map((patient) => (
                <div key={patient._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{patient.userId?.name}</h3>
                        <p className="text-sm text-gray-500">Ward: {patient.wardId?.wardNumber}</p>
                      </div>
                    </div>
                  </div>

                  {patient.latestVitals && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Temp</p>
                        <p className="text-sm font-semibold">{patient.latestVitals.temperature}°C</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">BP</p>
                        <p className="text-sm font-semibold">
                          {patient.latestVitals.bloodPressure?.systolic}/{patient.latestVitals.bloodPressure?.diastolic}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">HR</p>
                        <p className="text-sm font-semibold">{patient.latestVitals.heartRate} bpm</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">O2</p>
                        <p className="text-sm font-semibold">{patient.latestVitals.oxygenSaturation}%</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-600">Admitted:</span>
                    <span className="text-gray-900">{new Date(patient.admissionDate).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      fetchPatientClinical(patient._id);
                      setActiveTab('patient-clinical');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Full Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && !loading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Prescriptions</h2>
              <button
                onClick={() => setShowPrescriptionForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Prescription</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prescription.patientId?.userId?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Prescribed on {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      prescription.status === 'Administered' ? 'bg-green-100 text-green-800' :
                      prescription.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {prescription.medicines?.map((medicine, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{medicine.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Dosage: {medicine.dosage} • Frequency: {medicine.frequency}
                            </p>
                            <p className="text-sm text-gray-600">
                              Duration: {medicine.duration} • Quantity: {medicine.quantity}
                            </p>
                            {medicine.instructions && (
                              <p className="text-sm text-gray-500 mt-2 italic">{medicine.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Tests Tab */}
        {activeTab === 'lab-tests' && !loading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Lab Tests</h2>
              <button
                onClick={() => setShowLabTestForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Order Lab Test</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {labTests.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{test.patientId?.userId?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{test.testName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          test.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          test.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          test.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {test.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          test.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          test.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lab Reports Tab */}
        {activeTab === 'lab-reports' && !loading && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Lab Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labReports.map((report) => (
                <div key={report._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.testName}</h3>
                      <p className="text-sm text-gray-500">{report.patientId?.userId?.name}</p>
                    </div>
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Completed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{new Date(report.completedAt).toLocaleDateString()}</span>
                    </div>
                    {report.results && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">Results:</p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(report.results, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New Prescription</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={prescriptionForm.patientId}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, patientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter patient ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID (Optional)</label>
                <input
                  type="text"
                  value={prescriptionForm.appointmentId}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, appointmentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter appointment ID"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medicines</h3>
                  <button
                    onClick={() => setPrescriptionForm({
                      ...prescriptionForm,
                      medicines: [...prescriptionForm.medicines, { medicineId: '', name: '', quantity: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                    })}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add Medicine
                  </button>
                </div>

                {prescriptionForm.medicines.map((medicine, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        value={medicine.name}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].name = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={medicine.dosage}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].dosage = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={medicine.quantity}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].quantity = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g., Every 6 hours)"
                        value={medicine.frequency}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].frequency = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 5 days)"
                        value={medicine.duration}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].duration = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={medicine.instructions}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].instructions = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    {prescriptionForm.medicines.length > 1 && (
                      <button
                        onClick={() => {
                          const newMeds = prescriptionForm.medicines.filter((_, i) => i !== idx);
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Medicine
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPrescriptionForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createPrescription}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Test Form Modal */}
      {showLabTestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Lab Test</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={labTestForm.patientId}
                  onChange={(e) => setLabTestForm({...labTestForm, patientId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter patient ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <input
                  type="text"
                  value={labTestForm.testName}
                  onChange={(e) => setLabTestForm({...labTestForm, testName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Complete Blood Count"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={labTestForm.priority}
                  onChange={(e) => setLabTestForm({...labTestForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={labTestForm.notes}
                  onChange={(e) => setLabTestForm({...labTestForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional notes or instructions"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowLabTestForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={orderLabTest}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Order Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard