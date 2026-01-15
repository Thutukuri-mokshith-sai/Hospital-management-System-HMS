// admin/src/pages/doctor/DoctorPatients.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Calendar, 
  FileText, 
  Activity, 
  Droplets, 
  Stethoscope,
  Pill,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Heart,
  Thermometer,
  Eye,
  Shield,
  Download,
  MoreVertical,
  Users,
  Bed,
  Home,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, isToday, differenceInYears } from 'date-fns';
import { BASE_URL } from '../../api/api';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState([]);
  const [patientHistory, setPatientHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    discharged: 0,
    critical: 0
  });

  const token = localStorage.getItem('token');

  // Fetch patients with comprehensive data
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${BASE_URL}/doctors/patients?${params.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch patients');
      
      const data = await res.json();
      const patientsData = data.data || [];
      
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      
      // Calculate statistics
      const admittedCount = patientsData.filter(p => p.isAdmitted).length;
      const dischargedCount = patientsData.filter(p => !p.isAdmitted && p.admissionStatus === 'Discharged').length;
      
      setStats({
        total: patientsData.length,
        admitted: admittedCount,
        discharged: dischargedCount,
        critical: patientsData.filter(p => getVitalStatus([]) === 'critical').length
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token]);

  // Fetch patient details
  const fetchPatientDetails = async (patientId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch patient details');
      
      const data = await res.json();
      setSelectedPatient(data.data);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  // Fetch patient vitals
  const fetchPatientVitals = async (patientId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/patients/${patientId}/vitals?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch vitals');
      
      const data = await res.json();
      setPatientVitals(data.data || []);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      setPatientVitals([]);
    }
  };

  // Fetch patient history
  const fetchPatientHistory = async (patientId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/patients/${patientId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch patient history');
      
      const data = await res.json();
      setPatientHistory(data.data);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setPatientHistory(null);
    }
  };

  // Handle patient selection
  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    await Promise.all([
      fetchPatientDetails(patient._id),
      fetchPatientVitals(patient._id),
      fetchPatientHistory(patient._id)
    ]);
  };

  // Filter patients based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const searchLower = searchTerm.toLowerCase();
        return (
          patient.userId?.name?.toLowerCase().includes(searchLower) ||
          patient.userId?.email?.toLowerCase().includes(searchLower) ||
          patient._id?.toLowerCase().includes(searchLower) ||
          patient.userId?.phone?.includes(searchTerm)
        );
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Get status badge style
  const getStatusBadge = (patient) => {
    if (patient.isAdmitted) {
      return {
        text: 'Admitted',
        color: 'bg-red-100 text-red-800',
        icon: <Bed className="w-4 h-4" />
      };
    } else if (patient.admissionStatus === 'Discharged') {
      return {
        text: 'Discharged',
        color: 'bg-gray-100 text-gray-800',
        icon: <Home className="w-4 h-4" />
      };
    }
    return {
      text: 'Outpatient',
      color: 'bg-blue-100 text-blue-800',
      icon: <User className="w-4 h-4" />
    };
  };

  // Get gender icon and color
  const getGenderInfo = (gender) => {
    if (gender === 'Male') {
      return {
        icon: '♂',
        color: 'text-blue-600 bg-blue-50'
      };
    } else if (gender === 'Female') {
      return {
        icon: '♀',
        color: 'text-pink-600 bg-pink-50'
      };
    }
    return {
      icon: '?',
      color: 'text-gray-600 bg-gray-50'
    };
  };

  // Get blood group badge
  const getBloodGroupBadge = (bloodGroup) => {
    if (!bloodGroup) return null;
    
    const colors = {
      'A+': 'bg-red-50 text-red-700 border-red-200',
      'A-': 'bg-orange-50 text-orange-700 border-orange-200',
      'B+': 'bg-green-50 text-green-700 border-green-200',
      'B-': 'bg-teal-50 text-teal-700 border-teal-200',
      'O+': 'bg-purple-50 text-purple-700 border-purple-200',
      'O-': 'bg-pink-50 text-pink-700 border-pink-200',
      'AB+': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'AB-': 'bg-cyan-50 text-cyan-700 border-cyan-200'
    };
    
    return colors[bloodGroup] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Get vital status
  const getVitalStatus = (vitals) => {
    if (!vitals || vitals.length === 0) return 'normal';
    
    const latest = vitals[0];
    const { systolic, diastolic } = latest.bloodPressure || {};
    const oxygen = latest.oxygenSaturation;
    
    if (systolic > 180 || diastolic > 120 || oxygen < 90) {
      return 'critical';
    } else if (systolic > 140 || diastolic > 90 || oxygen < 95) {
      return 'warning';
    }
    return 'normal';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      return differenceInYears(today, birth);
    } catch {
      return 'N/A';
    }
  };

  // Initialize
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
              <p className="mt-2 text-gray-600">
                Manage and monitor patients under your care
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={fetchPatients}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Patients</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 text-sm text-blue-100">
              Under your care
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Currently Admitted</p>
                <p className="text-3xl font-bold mt-2">{stats.admitted}</p>
              </div>
              <Bed className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 text-sm text-red-100">
              In hospital care
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Discharged</p>
                <p className="text-3xl font-bold mt-2">{stats.discharged}</p>
              </div>
              <Home className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 text-sm text-green-100">
              Completed treatment
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Critical Condition</p>
                <p className="text-3xl font-bold mt-2">{stats.critical}</p>
              </div>
              <AlertCircle className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 text-sm text-amber-100">
              Requiring immediate attention
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                placeholder="Search patients by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Patients
              </button>
              <button
                onClick={() => setStatusFilter('admitted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'admitted' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Bed className="w-4 h-4 inline mr-2" />
                Admitted
              </button>
              <button
                onClick={() => setStatusFilter('discharged')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'discharged' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Discharged
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading patient records...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Details
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medical Info
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => {
                      const status = getStatusBadge(patient);
                      const genderInfo = getGenderInfo(patient.gender);
                      
                      return (
                        <tr 
                          key={patient._id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${genderInfo.color} font-bold`}>
                                  {patient.userId?.name?.charAt(0) || 'P'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {patient.userId?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {patient.userId?.email || 'No email'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  ID: {patient._id?.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${genderInfo.color}`}>
                                {genderInfo.icon} {patient.age || calculateAge(patient.dateOfBirth)}y
                              </span>
                              {patient.bloodGroup && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBloodGroupBadge(patient.bloodGroup)}`}>
                                  <Droplets className="w-3 h-3 mr-1" />
                                  {patient.bloodGroup}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              {patient.userId?.phone ? (
                                <span className="inline-flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {patient.userId.phone}
                                </span>
                              ) : 'No phone'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                {status.icon}
                                <span className="ml-1.5">{status.text}</span>
                              </span>
                            </div>
                            {patient.admissionDate && (
                              <div className="mt-1 text-xs text-gray-500">
                                {formatDate(patient.admissionDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(patient.lastVisitDate || patient.admissionDate)}
                            {patient.lastVisitDate && isToday(parseISO(patient.lastVisitDate)) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Today
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePatientSelect(patient);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FileText className="w-4 h-4 mr-1.5" />
                                View
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Calendar className="w-4 h-4 mr-1.5" />
                                Schedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPatients.length === 0 && (
                <div className="py-12 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search terms or filters' 
                      : 'No patients are currently under your care'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedPatient(null)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sm:px-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.userId?.name?.charAt(0) || 'P'}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-white">
                          {selectedPatient.userId?.name}
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Patient ID: {selectedPatient._id?.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-white/80 hover:text-white"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    {['overview', 'vitals', 'history', 'appointments', 'prescriptions', 'lab_tests'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                      >
                        {tab === 'overview' && <User className="w-4 h-4 inline mr-2" />}
                        {tab === 'vitals' && <Activity className="w-4 h-4 inline mr-2" />}
                        {tab === 'history' && <FileText className="w-4 h-4 inline mr-2" />}
                        {tab === 'appointments' && <Calendar className="w-4 h-4 inline mr-2" />}
                        {tab === 'prescriptions' && <Pill className="w-4 h-4 inline mr-2" />}
                        {tab === 'lab_tests' && <TestTube className="w-4 h-4 inline mr-2" />}
                        {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Patient Info Card */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Age</label>
                              <p className="mt-1 text-gray-900">{selectedPatient.age || calculateAge(selectedPatient.dateOfBirth)} years</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Gender</label>
                              <p className="mt-1 text-gray-900">{selectedPatient.gender || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Blood Group</label>
                              <p className="mt-1 text-gray-900">
                                {selectedPatient.bloodGroup ? (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getBloodGroupBadge(selectedPatient.bloodGroup)}`}>
                                    {selectedPatient.bloodGroup}
                                  </span>
                                ) : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Status</label>
                              <p className="mt-1">
                                {selectedPatient.isAdmitted ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    <Bed className="w-4 h-4 mr-1.5" />
                                    Admitted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <Home className="w-4 h-4 mr-1.5" />
                                    Outpatient
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <Mail className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-gray-900">{selectedPatient.userId?.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-gray-900">{selectedPatient.userId?.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Appointments</span>
                              <span className="font-bold text-blue-600">5</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Prescriptions</span>
                              <span className="font-bold text-green-600">8</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Lab Tests</span>
                              <span className="font-bold text-purple-600">3</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Last Visit</span>
                              <span className="font-bold text-gray-900">
                                {formatDate(selectedPatient.lastVisitDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Calendar className="w-5 h-5 mr-2" />
                            Schedule Appointment
                          </button>
                          <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <FileText className="w-5 h-5 mr-2" />
                            View Full History
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'vitals' && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">Vital Signs History</h4>
                      {patientVitals.length > 0 ? (
                        <div className="space-y-4">
                          {patientVitals.map((vital, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDateTime(vital.recordedAt)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Recorded by: {vital.nurseId?.userId?.name || 'N/A'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {vital.bloodPressure?.systolic || '--'}/{vital.bloodPressure?.diastolic || '--'}
                                  </div>
                                  <div className="text-xs text-gray-500">Blood Pressure</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {vital.heartRate || '--'}
                                  </div>
                                  <div className="text-xs text-gray-500">Heart Rate (bpm)</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-amber-600">
                                    {vital.temperature || '--'}°F
                                  </div>
                                  <div className="text-xs text-gray-500">Temperature</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${vital.oxygenSaturation < 95 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {vital.oxygenSaturation || '--'}%
                                  </div>
                                  <div className="text-xs text-gray-500">O₂ Saturation</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No vital records found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && patientHistory && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">Medical History</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Appointments */}
                        <div className="bg-white border rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-gray-900 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                              Recent Appointments
                            </h5>
                            <span className="text-sm text-gray-500">{patientHistory.appointments?.length || 0} total</span>
                          </div>
                          <div className="space-y-3">
                            {patientHistory.appointments?.slice(0, 5).map((apt, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formatDate(apt.date)} {apt.time}
                                  </div>
                                  <div className="text-sm text-gray-500">{apt.status}</div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${apt.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {apt.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Prescriptions */}
                        <div className="bg-white border rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-gray-900 flex items-center">
                              <Pill className="w-5 h-5 mr-2 text-green-600" />
                              Recent Prescriptions
                            </h5>
                            <span className="text-sm text-gray-500">{patientHistory.prescriptions?.length || 0} total</span>
                          </div>
                          <div className="space-y-3">
                            {patientHistory.prescriptions?.slice(0, 5).map((pres, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium text-gray-900 mb-1">
                                  {pres.medicines?.length || 0} medications
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(pres.createdAt)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other tabs would have similar structures */}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Start Consultation
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;