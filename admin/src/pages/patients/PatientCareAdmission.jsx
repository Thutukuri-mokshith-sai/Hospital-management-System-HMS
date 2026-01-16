import { useState, useEffect } from 'react';
import {
  Building,
  Bed,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Users,
  Phone,
  Mail,
  MapPin,
  Activity,
  Pill,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Download,
  MessageSquare,
  Bell,
  Thermometer,
  Heart,
  Droplets,
  Shield
} from 'lucide-react';
import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const PatientCareAdmission = () => {
  const [admissionInfo, setAdmissionInfo] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ward'); // 'ward', 'team', 'notes', 'vitals'
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showCareNoteModal, setShowCareNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({
    type: 'Observation',
    content: '',
    priority: 'Medium'
  });

  // Set up axios interceptor for token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(
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
  }, []);

  // Fetch admission and care team data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch ward info (only returns data if admitted)
      const wardResponse = await axios.get(`${API_BASE_URL}/patients/ward-info`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (wardResponse.data.success) {
        if (wardResponse.data.data) {
          setAdmissionInfo(wardResponse.data.data);
        }
      }

      // Fetch doctors who treated the patient
      const doctorsResponse = await axios.get(`${API_BASE_URL}/patients/doctors`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (doctorsResponse.data.success) {
        setDoctors(doctorsResponse.data.data || []);
      }

      // Fetch nurses who cared for the patient
      const nursesResponse = await axios.get(`${API_BASE_URL}/patients/nurses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (nursesResponse.data.success) {
        setNurses(nursesResponse.data.data || []);
      }

    } catch (err) {
      // If 404 for ward-info, patient is not admitted (this is expected)
      if (err.response?.status !== 404 || err.config.url.includes('ward-info')) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
        console.error('Data fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate admission duration
  const calculateAdmissionDuration = (admissionDate) => {
    if (!admissionDate) return 'N/A';
    
    const now = new Date();
    const admission = new Date(admissionDate);
    const diffTime = Math.abs(now - admission);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get note type color
  const getNoteTypeColor = (type) => {
    switch (type) {
      case 'Observation':
        return 'bg-blue-100 text-blue-700';
      case 'Instruction':
        return 'bg-purple-100 text-purple-700';
      case 'Concern':
        return 'bg-orange-100 text-orange-700';
      case 'Update':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get shift color
  const getShiftColor = (shift) => {
    switch (shift) {
      case 'Morning':
        return 'bg-amber-100 text-amber-700';
      case 'Afternoon':
        return 'bg-sky-100 text-sky-700';
      case 'Night':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle add care note (for demo purposes)
  const handleAddCareNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.content.trim()) {
      alert('Please enter note content');
      return;
    }

    try {
      // In a real implementation, you would POST to an API endpoint
      // For now, we'll simulate adding a note locally
      const note = {
        _id: Date.now().toString(),
        ...newNote,
        createdBy: {
          role: 'PATIENT',
          userId: 'patient-id',
          name: 'You'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update admission info with new note
      setAdmissionInfo(prev => ({
        ...prev,
        admissionNotes: [...(prev.admissionNotes || []), note]
      }));

      setNewNote({
        type: 'Observation',
        content: '',
        priority: 'Medium'
      });
      setShowCareNoteModal(false);
      
      alert('Note added successfully!');
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-blue-800">Loading Care & Admission Information...</h2>
      </div>
    );
  }

  // If patient is not admitted
  if (!admissionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
              Care & Admission
            </h1>
            <p className="text-blue-600 mt-2">
              View your hospital stay information and care team details
            </p>
          </div>

          {/* Not Admitted Message */}
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-blue-100 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Building className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Not Currently Admitted</h2>
            <p className="text-blue-600 mb-6 max-w-md mx-auto">
              You are not currently admitted to the hospital. This section is only visible when you have an active admission.
            </p>
            
            {/* Your Care Team (Still show even if not admitted) */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Your Care Team</h3>
              
              {doctors.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Doctors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.slice(0, 2).map((doctor) => (
                      <div key={doctor._id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-800">Dr. {doctor.userId?.name}</h5>
                            <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{doctor.department || 'General Medicine'}</span>
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{doctor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nurses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Nurses
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nurses.slice(0, 2).map((nurse) => (
                      <div key={nurse._id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-800">{nurse.userId?.name}</h5>
                            <p className="text-sm text-gray-600">{nurse.specialization || 'Registered Nurse'}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {nurse.shift && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className={`px-2 py-1 rounded-full text-xs ${getShiftColor(nurse.shift)}`}>
                                {nurse.shift} Shift
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(doctors.length === 0 && nurses.length === 0) && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No care team information available.</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-4">
                If you believe this is an error or need to be admitted, please contact the hospital administration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Hospital
                </button>
                <button className="px-6 py-3 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient is admitted - Show full admission information
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Currently Admitted
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {calculateAdmissionDuration(admissionInfo.admissionDate)}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
                Hospital Stay & Care
              </h1>
              <p className="text-blue-600 mt-2">
                Ward {admissionInfo.wardDetails?.wardNumber} • Bed {admissionInfo.bedNumber} • {admissionInfo.admissionStatus}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCareNoteModal(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Add Note
              </button>
              <button className="px-6 py-3 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full font-semibold transition-colors flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Request Assistance
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-blue-100">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ward', name: 'Ward Info', icon: Building },
                { id: 'team', name: 'Care Team', icon: Users },
                { id: 'notes', name: 'Care Notes', icon: FileText },
                { id: 'vitals', name: 'Recent Vitals', icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                    {tab.id === 'notes' && admissionInfo.admissionNotes?.length > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-blue-600'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admissionInfo.admissionNotes.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admission Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Hospital Stay</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span>Ward {admissionInfo.wardDetails?.wardNumber}: {admissionInfo.wardDetails?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  <span>Bed {admissionInfo.bedNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Admitted {formatDate(admissionInfo.admissionDate)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <p className="text-sm opacity-90">Floor</p>
                <p className="text-2xl font-bold">{admissionInfo.wardDetails?.floor || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Always visible */}
          <div className="lg:col-span-2">
            {activeTab === 'ward' ? (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Ward Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Ward Details */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Ward Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ward Number</span>
                        <span className="font-semibold">{admissionInfo.wardDetails?.wardNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ward Name</span>
                        <span className="font-semibold">{admissionInfo.wardDetails?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor</span>
                        <span className="font-semibold">{admissionInfo.wardDetails?.floor || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Specialty</span>
                        <span className="font-semibold">{admissionInfo.wardDetails?.specialty || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bed Number</span>
                        <span className="font-semibold">{admissionInfo.bedNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admission Details */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Admission Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admission Date</span>
                        <span className="font-semibold">{formatDate(admissionInfo.admissionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admission Time</span>
                        <span className="font-semibold">{formatTime(admissionInfo.admissionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          admissionInfo.admissionStatus === 'Stable' ? 'bg-green-100 text-green-700' :
                          admissionInfo.admissionStatus === 'Critical' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {admissionInfo.admissionStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-semibold">{calculateAdmissionDuration(admissionInfo.admissionDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Patients in Ward */}
                {admissionInfo.wardPatients && admissionInfo.wardPatients.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Other Patients in Ward
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {admissionInfo.wardPatients.map((patient) => (
                          <div key={patient._id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">{patient.userId?.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                patient.admissionStatus === 'Stable' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {patient.admissionStatus}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Bed {patient.bedNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ward Facilities */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Ward Facilities & Rules
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Visiting Hours', value: '10 AM - 8 PM' },
                      { label: 'Nurse Station', value: '24/7' },
                      { label: 'Emergency Call', value: 'Button' },
                      { label: 'WiFi', value: 'Available' }
                    ].map((facility, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-blue-600">{facility.label}</div>
                        <div className="font-semibold text-blue-800">{facility.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'team' ? (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Your Care Team</h2>
                
                {/* Assigned Doctors */}
                {doctors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5" />
                      Assigned Doctors ({doctors.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doctors.map((doctor) => (
                        <div key={doctor._id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-lg text-gray-800">Dr. {doctor.userId?.name}</h4>
                                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                  Primary
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                {doctor.department && (
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    <span>{doctor.department}</span>
                                  </div>
                                )}
                                {doctor.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{doctor.phone}</span>
                                  </div>
                                )}
                                {doctor.userId?.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{doctor.userId.email}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  Message
                                </button>
                                <button className="px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  Call
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Nurses */}
                {admissionInfo.wardNurses && admissionInfo.wardNurses.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Ward Nurses ({admissionInfo.wardNurses.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {admissionInfo.wardNurses.map((nurse) => (
                        <div key={nurse._id} className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-800 mb-1">{nurse.userId?.name}</h4>
                              <p className="text-purple-600 text-sm mb-3">{nurse.specialization || 'Registered Nurse'}</p>
                              
                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span className={`px-2 py-1 rounded-full text-xs ${getShiftColor(nurse.shift)}`}>
                                    {nurse.shift} Shift
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                  <Bell className="w-4 h-4" />
                                  Request Care
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Nurses Who Cared */}
                {nurses.length > 0 && admissionInfo.wardNurses && nurses.length > admissionInfo.wardNurses.length && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      All Nurses Who Cared For You
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {nurses.map((nurse) => (
                          <div key={nurse._id} className="bg-white p-3 rounded-lg text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="font-medium text-gray-800 text-sm">{nurse.userId?.name}</p>
                            <p className="text-xs text-gray-500">{nurse.specialization}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'notes' ? (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-900">Care Notes & Updates</h2>
                  <button
                    onClick={() => setShowCareNoteModal(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Add Note
                  </button>
                </div>

                {admissionInfo.admissionNotes && admissionInfo.admissionNotes.length > 0 ? (
                  <div className="space-y-4">
                    {admissionInfo.admissionNotes.map((note) => (
                      <div key={note._id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getNoteTypeColor(note.noteType)}`}>
                              {note.noteType}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(note.priority)}`}>
                              {note.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{note.content}</p>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">By:</span> {note.createdBy?.name} ({note.createdBy?.role})
                          </div>
                          {note.followUpRequired && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Follow-up Required
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Care Notes Yet</h3>
                    <p className="text-gray-500 mb-6">Your care team will add notes about your treatment and progress here.</p>
                    <button
                      onClick={() => setShowCareNoteModal(true)}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <FileText className="w-5 h-5" />
                      Add Your First Note
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'vitals' ? (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Vitals Monitoring</h2>
                
                {/* Vitals Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Temperature', icon: Thermometer, value: '98.6°F', color: 'from-red-500 to-orange-500' },
                    { label: 'Blood Pressure', icon: Activity, value: '120/80', color: 'from-blue-500 to-cyan-500' },
                    { label: 'Heart Rate', icon: Heart, value: '72 BPM', color: 'from-pink-500 to-rose-500' },
                    { label: 'Oxygen', icon: Droplets, value: '98%', color: 'from-emerald-500 to-teal-500' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: 2 hours ago
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vitals Chart Placeholder */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-800 mb-4">Vitals Trend (Last 24 Hours)</h3>
                  <div className="bg-gray-50 rounded-xl p-6 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Vitals trend chart would appear here</p>
                      <p className="text-sm text-gray-400 mt-1">Shows your vitals changes over time</p>
                    </div>
                  </div>
                </div>

                {/* Recent Measurements */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Measurements</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="pb-3">Time</th>
                          <th className="pb-3">Temperature</th>
                          <th className="pb-3">Blood Pressure</th>
                          <th className="pb-3">Heart Rate</th>
                          <th className="pb-3">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((item) => (
                          <tr key={item} className="border-t border-gray-200">
                            <td className="py-3">
                              <div className="font-medium">2:3{item} PM</div>
                              <div className="text-sm text-gray-500">Today</div>
                            </td>
                            <td className="py-3">
                              <div className="font-medium">98.{6 + item}°F</div>
                              <div className={`text-xs ${item === 1 ? 'text-green-600' : 'text-gray-500'}`}>
                                {item === 1 ? 'Normal' : 'Slightly Elevated'}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="font-medium">12{item}/8{item-1}</div>
                              <div className="text-xs text-gray-500">mmHg</div>
                            </td>
                            <td className="py-3">
                              <div className="font-medium">7{item + 2} BPM</div>
                              <div className="text-xs text-gray-500">Normal</div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm">Nurse Sarah</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition-colors flex items-center gap-3">
                  <Bell className="w-5 h-5" />
                  <span>Call Nurse</span>
                </button>
                <button className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-semibold transition-colors flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  <span>Message Doctor</span>
                </button>
                <button className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold transition-colors flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Request Discharge</span>
                </button>
                <button className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-semibold transition-colors flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>Emergency Help</span>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Today's Schedule</h3>
              <div className="space-y-4">
                {[
                  { time: '9:00 AM', activity: 'Morning Medication', status: 'completed' },
                  { time: '11:00 AM', activity: 'Doctor Round', status: 'upcoming' },
                  { time: '2:00 PM', activity: 'Physiotherapy', status: 'upcoming' },
                  { time: '4:00 PM', activity: 'Evening Medication', status: 'pending' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-100' :
                      item.status === 'upcoming' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        item.status === 'completed' ? 'text-green-600' :
                        item.status === 'upcoming' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.activity}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    {item.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Important Contacts */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Important Contacts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Nurse Station</p>
                    <p className="text-sm text-gray-500">Ward {admissionInfo.wardDetails?.wardNumber}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Emergency</p>
                    <p className="text-sm text-gray-500">24/7 Help Line</p>
                  </div>
                  <button className="text-red-600 hover:text-red-700">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Food Services</p>
                    <p className="text-sm text-gray-500">Meal Orders</p>
                  </div>
                  <button className="text-green-600 hover:text-green-700">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Admission Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Admission Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    admissionInfo.admissionStatus === 'Stable' ? 'bg-green-100 text-green-700' :
                    admissionInfo.admissionStatus === 'Critical' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {admissionInfo.admissionStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admitted Since</span>
                  <span className="font-semibold">{formatDate(admissionInfo.admissionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{calculateAdmissionDuration(admissionInfo.admissionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Discharge</span>
                  <span className="font-semibold">TBD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Care Note Modal */}
      {showCareNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-blue-900">Add Care Note</h2>
              <button
                onClick={() => {
                  setShowCareNoteModal(false);
                  setNewNote({
                    type: 'Observation',
                    content: '',
                    priority: 'Medium'
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddCareNote}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Type
                  </label>
                  <select
                    value={newNote.type}
                    onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Observation">Observation</option>
                    <option value="Instruction">Instruction</option>
                    <option value="Concern">Concern</option>
                    <option value="Update">Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {['High', 'Medium', 'Low'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setNewNote(prev => ({ ...prev, priority }))}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          newNote.priority === priority
                            ? getPriorityColor(priority)
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Content *
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your note here..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCareNoteModal(false);
                    setNewNote({
                      type: 'Observation',
                      content: '',
                      priority: 'Medium'
                    });
                  }}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admission Modal (for demo) */}
      {showAdmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <Building className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Admission</h2>
              <p className="text-gray-600">
                This feature allows you to request hospital admission. Please note that all admissions require doctor approval.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowAdmissionModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Admission request submitted! A doctor will review your request.');
                  setShowAdmissionModal(false);
                }}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors"
              >
                Request Admission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCareAdmission;