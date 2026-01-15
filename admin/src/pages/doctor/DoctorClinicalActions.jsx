import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Pill, 
  Microscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Send,
  Eye,
  Download,
  ChevronRight,
  Activity,
  Stethoscope,
  ClipboardList,
  TestTube,
  Users,
  MessageSquare,
  Mail,
  Phone,
  Heart,
  Thermometer,
  Droplets,
  FilePlus,
  Trash2,
  Edit
} from 'lucide-react';

const DoctorClinicalActions = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labTechs, setLabTechs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  
  // Filters
  const [appointmentFilters, setAppointmentFilters] = useState({
    status: '',
    date: '',
    search: '',
    page: 1,
    limit: 10
  });
  
  const [prescriptionFilters, setPrescriptionFilters] = useState({
    patientId: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  
  const [labFilters, setLabFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 10
  });

  const [stats, setStats] = useState({
    appointments: { total: 0, today: 0, week: 0, month: 0 },
    prescriptions: { total: 0, pending: 0 },
    labTests: { total: 0, pending: 0, completed: 0 }
  });

  const token = localStorage.getItem('token');
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

  // ============ DATA FETCHING ============
  useEffect(() => {
    fetchDashboardStats();
    if (activeTab === 'appointments') fetchAppointments();
    else if (activeTab === 'prescriptions') fetchPrescriptions();
    else if (activeTab === 'labs') fetchLabTests();
    else if (activeTab === 'lab-techs') fetchLabTechs();
  }, [activeTab, appointmentFilters, prescriptionFilters, labFilters]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/dashboard/quick-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: appointmentFilters.page,
        limit: appointmentFilters.limit,
        ...(appointmentFilters.status && { status: appointmentFilters.status }),
        ...(appointmentFilters.date && { date: appointmentFilters.date }),
        ...(appointmentFilters.search && { search: appointmentFilters.search })
      });

      const res = await fetch(`${BASE_URL}/doctors/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: prescriptionFilters.page,
        limit: prescriptionFilters.limit,
        ...(prescriptionFilters.status && { status: prescriptionFilters.status }),
        ...(prescriptionFilters.search && { search: prescriptionFilters.search }),
        ...(prescriptionFilters.patientId && { patientId: prescriptionFilters.patientId })
      });

      const res = await fetch(`${BASE_URL}/doctors/prescriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setPrescriptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: labFilters.page,
        limit: labFilters.limit,
        ...(labFilters.status && { status: labFilters.status }),
        ...(labFilters.priority && { priority: labFilters.priority }),
        ...(labFilters.search && { search: labFilters.search })
      });

      const res = await fetch(`${BASE_URL}/doctors/lab-tests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Ensure labTechId is properly handled
        const tests = data.data || [];
        setLabTests(tests);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTechs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/doctors/lab-techs/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setLabTechs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lab techs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return null;
    }
  };

  // ============ APPOINTMENT ACTIONS ============
  const updateAppointmentStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        fetchAppointments();
        setShowModal(false);
        alert('Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const addAppointmentNotes = async (id, notes) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/appointments/${id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });
      
      if (res.ok) {
        fetchAppointments();
        alert('Notes saved successfully');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  // ============ PRESCRIPTION ACTIONS ============
  const createPrescription = async (prescriptionData) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(prescriptionData)
      });
      
      const data = await res.json();
      if (data.success) {
        fetchPrescriptions();
        setShowModal(false);
        alert('Prescription created successfully');
      } else {
        alert(data.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Error creating prescription');
    }
  };

  const sendToPharmacy = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/prescriptions/${id}/send-to-pharmacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Prescription sent to pharmacy');
        fetchPrescriptions();
      } else {
        alert(data.message || 'Failed to send to pharmacy');
      }
    } catch (error) {
      console.error('Error sending to pharmacy:', error);
      alert('Error sending to pharmacy');
    }
  };

  const getFullPrescription = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/prescriptions/${id}/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedItem(data.data);
        setModalType('fullPrescription');
        setShowModal(true);
      } else {
        alert(data.message || 'Failed to fetch prescription details');
      }
    } catch (error) {
      console.error('Error fetching full prescription:', error);
      alert('Error fetching prescription details');
    }
  };

  // ============ LAB TEST ACTIONS ============
  const requestLabTest = async (testData) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/lab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      const data = await res.json();
      if (data.success) {
        fetchLabTests();
        setShowModal(false);
        alert('Lab test requested successfully');
      } else {
        alert(data.message || 'Failed to request lab test');
      }
    } catch (error) {
      console.error('Error requesting lab test:', error);
      alert('Error requesting lab test');
    }
  };

  const viewLabReport = async (labTestId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/lab-reports/${labTestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedItem(data.data);
        setModalType('labReport');
        setShowModal(true);
      } else {
        alert(data.message || 'Lab report not available yet');
      }
    } catch (error) {
      console.error('Error fetching lab report:', error);
      alert('Lab report not available yet');
    }
  };

  const assignLabTechToTest = async (testId, labTechId) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/lab-tests/${testId}/assign-lab-tech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ labTechId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Lab technician assigned successfully');
        fetchLabTests();
        setShowModal(false);
      } else {
        alert(data.message || 'Failed to assign lab technician');
      }
    } catch (error) {
      console.error('Error assigning lab tech:', error);
      alert('Error assigning lab technician');
    }
  };

  // ============ UI HELPERS ============
  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'bg-blue-100 text-blue-700 border border-blue-200',
      Completed: 'bg-green-100 text-green-700 border border-green-200',
      Cancelled: 'bg-red-100 text-red-700 border border-red-200',
      Requested: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      Processing: 'bg-orange-100 text-orange-700 border border-orange-200',
      'In Progress': 'bg-purple-100 text-purple-700 border border-purple-200',
      Administered: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
      Assigned: 'bg-indigo-100 text-indigo-700 border border-indigo-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-600 border border-gray-200',
      Medium: 'bg-blue-100 text-blue-600 border border-blue-200',
      High: 'bg-orange-100 text-orange-600 border border-orange-200',
      Critical: 'bg-red-100 text-red-600 border border-red-200',
      Urgent: 'bg-rose-100 text-rose-600 border border-rose-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to get lab tech name safely
  const getLabTechName = (labTest) => {
    if (!labTest.labTechId) return null;
    
    // Handle different response structures
    if (labTest.labTechId?.userId?.name) {
      return labTest.labTechId.userId.name;
    } else if (labTest.labTechId?.name) {
      return labTest.labTechId.name;
    } else if (labTest.labTechName) {
      return labTest.labTechName;
    }
    return null;
  };

  // Helper function to get patient name safely
  const getPatientName = (item) => {
    if (!item) return 'Unknown Patient';
    if (item.patientId?.userId?.name) return item.patientId.userId.name;
    if (item.patientId?.name) return item.patientId.name;
    if (item.patientName) return item.patientName;
    return 'Unknown Patient';
  };

  // Helper function to get patient age
  const getPatientAge = (item) => {
    if (!item) return null;
    if (item.patientId?.age) return item.patientId.age;
    if (item.age) return item.age;
    return null;
  };

  // Helper function to get patient gender
  const getPatientGender = (item) => {
    if (!item) return null;
    if (item.patientId?.gender) return item.patientId.gender;
    if (item.gender) return item.gender;
    return null;
  };

  // Helper function to get patient blood group
  const getPatientBloodGroup = (item) => {
    if (!item) return null;
    if (item.patientId?.bloodGroup) return item.patientId.bloodGroup;
    if (item.bloodGroup) return item.bloodGroup;
    return null;
  };

  // ============ RENDER FUNCTIONS ============
  const renderAppointments = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients..."
              value={appointmentFilters.search}
              onChange={(e) => setAppointmentFilters({...appointmentFilters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={appointmentFilters.status}
            onChange={(e) => setAppointmentFilters({...appointmentFilters, status: e.target.value})}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={appointmentFilters.date}
            onChange={(e) => setAppointmentFilters({...appointmentFilters, date: e.target.value})}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            onClick={fetchAppointments}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
          >
            <Filter className="w-5 h-5 inline mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 gap-4">
        {appointments.map((apt) => (
          <div key={apt._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Patient Info */}
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {getPatientName(apt)?.charAt(0) || 'P'}
                    </div>
                    {apt.patientId?.isAdmitted && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                        <AlertCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {getPatientName(apt)}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-600">
                        {getPatientAge(apt) ? `${getPatientAge(apt)} yrs` : ''} {getPatientGender(apt) ? `• ${getPatientGender(apt)}` : ''}
                      </span>
                      {getPatientBloodGroup(apt) && (
                        <span className="text-sm px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-100">
                          <Droplets className="w-3 h-3 inline mr-1" />
                          {getPatientBloodGroup(apt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(apt.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {apt.time}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end space-y-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem(apt);
                        setModalType('appointmentDetails');
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                    
                    {apt.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(apt._id, 'Completed')}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(apt);
                            setModalType('createPrescription');
                            setShowModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
                        >
                          <Pill className="w-4 h-4" />
                          <span>Prescribe</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {apt.reason && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Reason:</span> {apt.reason}
                  </p>
                </div>
              )}

              {apt.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {apt.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {appointments.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Appointments Found</h3>
            <p className="text-gray-500">No appointments match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={prescriptionFilters.search}
              onChange={(e) => setPrescriptionFilters({...prescriptionFilters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={prescriptionFilters.status}
            onChange={(e) => setPrescriptionFilters({...prescriptionFilters, status: e.target.value})}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Administered">Administered</option>
          </select>
          <button
            onClick={fetchPrescriptions}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
          >
            <Filter className="w-5 h-5 inline mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map((presc) => (
          <div key={presc._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {getPatientName(presc)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(presc.createdAt)} • {presc.appointmentId ? 'Appointment Linked' : 'Direct Prescription'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => getFullPrescription(presc._id)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Full View</span>
                  </button>
                  <button
                    onClick={() => sendToPharmacy(presc._id)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send to Pharmacy</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Medications:</h4>
                {presc.medicines?.slice(0, 3).map((med, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(med.administrationStatus)}`}>
                        {med.administrationStatus}
                      </span>
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                ))}
                
                {presc.medicines?.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      +{presc.medicines.length - 3} more medications
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {prescriptions.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-500">No prescriptions match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLabTests = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search lab tests..."
              value={labFilters.search}
              onChange={(e) => setLabFilters({...labFilters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={labFilters.status}
            onChange={(e) => setLabFilters({...labFilters, status: e.target.value})}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="">All Status</option>
            <option value="Requested">Requested</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={labFilters.priority}
            onChange={(e) => setLabFilters({...labFilters, priority: e.target.value})}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <button
            onClick={fetchLabTests}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
          >
            <Filter className="w-5 h-5 inline mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {labTests.map((test) => {
          const labTechName = getLabTechName(test);
          return (
            <div key={test._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{test.testName}</h3>
                      <p className="text-sm text-gray-600">
                        {getPatientName(test)}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(test.priority)}`}>
                          {test.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {test.status === 'Completed' ? (
                      <button
                        onClick={() => viewLabReport(test._id)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Report</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedItem(test);
                          setModalType('assignLabTech');
                          setShowModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                      >
                        Assign Technician
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Requested</p>
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(test.createdAt)}</p>
                  </div>
                  {test.assignedAt && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Assigned</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(test.assignedAt)}</p>
                    </div>
                  )}
                  {test.completedAt && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(test.completedAt)}</p>
                    </div>
                  )}
                </div>

                {test.notes && (
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-sm text-teal-800">
                      <span className="font-medium">Notes:</span> {test.notes}
                    </p>
                  </div>
                )}

                {labTechName && (
                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Assigned to: {labTechName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {labTests.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Lab Tests Found</h3>
            <p className="text-gray-500">No lab tests match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // ============ MODALS ============
  const AppointmentDetailsModal = () => {
    const [notes, setNotes] = useState(selectedItem?.notes || '');

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {getPatientName(selectedItem)?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {getPatientName(selectedItem)}
            </h3>
            <div className="flex items-center space-x-3 mt-2">
              {getPatientAge(selectedItem) && (
                <span className="text-gray-700">
                  {getPatientAge(selectedItem)} yrs {getPatientGender(selectedItem) ? `• ${getPatientGender(selectedItem)}` : ''}
                </span>
              )}
              {getPatientBloodGroup(selectedItem) && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm border border-red-200">
                  <Droplets className="w-3 h-3 inline mr-1" />
                  {getPatientBloodGroup(selectedItem)}
                </span>
              )}
            </div>
            {selectedItem?.patientId?.userId?.phone && (
              <div className="flex items-center text-gray-600 mt-1">
                <Phone className="w-4 h-4 mr-2" />
                {selectedItem.patientId.userId.phone}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Appointment Date</p>
            <p className="font-bold text-gray-900 text-lg">
              {formatDate(selectedItem?.date)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Time</p>
            <p className="font-bold text-gray-900 text-lg">{selectedItem?.time}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem?.status)}`}>
              {selectedItem?.status}
            </span>
          </div>
          {selectedItem?.patientId?.isAdmitted && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
              <p className="text-sm text-red-700 mb-1">Admission Status</p>
              <p className="font-bold text-gray-900">Admitted</p>
            </div>
          )}
        </div>

        {selectedItem?.reason && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">Reason for Visit</p>
            <p className="text-amber-900">{selectedItem.reason}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Clinical Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Add clinical observations, diagnoses, treatment plan..."
          />
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => addAppointmentNotes(selectedItem._id, notes)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Save Notes
            </button>
            <button
              onClick={() => {
                setModalType('createPrescription');
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Pill className="w-5 h-5 inline mr-2" />
              Create Prescription
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CreatePrescriptionModal = () => {
    const [medicines, setMedicines] = useState([{
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      administrationStatus: 'Pending'
    }]);

    const addMedicine = () => {
      setMedicines([...medicines, {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        administrationStatus: 'Pending'
      }]);
    };

    const removeMedicine = (index) => {
      if (medicines.length > 1) {
        setMedicines(medicines.filter((_, i) => i !== index));
      }
    };

    const updateMedicine = (index, field, value) => {
      const updated = [...medicines];
      updated[index][field] = value;
      setMedicines(updated);
    };

    const handleSubmit = () => {
      const prescriptionData = {
        patientId: selectedItem?.patientId?._id || selectedItem?.patientId,
        appointmentId: selectedItem?._id,
        medicines: medicines.filter(m => m.name && m.dosage && m.frequency && m.duration)
      };
      
      if (prescriptionData.medicines.length === 0) {
        alert('Please add at least one valid medicine');
        return;
      }
      
      createPrescription(prescriptionData);
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Patient Information</h4>
              <p className="text-gray-700">{getPatientName(selectedItem)}</p>
              <p className="text-sm text-gray-600">
                {getPatientAge(selectedItem) ? `${getPatientAge(selectedItem)} yrs` : ''} 
                {getPatientGender(selectedItem) ? ` • ${getPatientGender(selectedItem)}` : ''} 
                {getPatientBloodGroup(selectedItem) ? ` • ${getPatientBloodGroup(selectedItem)}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-lg">Medications</h4>
            <button
              onClick={addMedicine}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>

          {medicines.map((med, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3 relative">
              {medicines.length > 1 && (
                <button
                  onClick={() => removeMedicine(idx)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Amoxicillin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 2x daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={med.administrationStatus}
                    onChange={(e) => updateMedicine(idx, 'administrationStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Administered">Administered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  value={med.instructions}
                  onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Take after meals"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-bold text-lg"
        >
          Create Prescription
        </button>
      </div>
    );
  };

  const AssignLabTechModal = () => {
    const [selectedTech, setSelectedTech] = useState('');

    const handleAssign = () => {
      if (!selectedTech) {
        alert('Please select a lab technician');
        return;
      }
      assignLabTechToTest(selectedItem._id, selectedTech);
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Assign Lab Technician</h4>
          <p className="text-gray-700">
            Test: <span className="font-semibold">{selectedItem?.testName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Patient: {getPatientName(selectedItem)}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Available Lab Technician
            </label>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading available technicians...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {labTechs.map((tech) => {
                  const techName = tech.userId?.name || tech.name || 'Unknown';
                  const techId = tech._id || tech.userId?._id;
                  const department = tech.department || 'Lab';
                  const specialization = tech.specialization || 'General';
                  
                  return (
                    <div
                      key={techId}
                      onClick={() => setSelectedTech(techId)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTech === techId
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                          {techName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{techName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">
                              {department}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {specialization}
                            </span>
                          </div>
                          {tech.isAvailable !== undefined && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${
                                  tech.isAvailable ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {tech.isAvailable ? 'Available' : 'Busy'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {labTechs.length === 0 && !loading && (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No available lab technicians found</p>
            </div>
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={!selectedTech}
          className={`w-full px-6 py-4 text-white rounded-xl font-bold text-lg transition-all ${
            selectedTech
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Assign Selected Technician
        </button>
      </div>
    );
  };

  const FullPrescriptionModal = () => {
    if (!selectedItem) return null;

    const prescription = selectedItem.prescription || selectedItem;
    const patientContext = selectedItem.patientContext || selectedItem;
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Prescription Details</h3>
                <p className="text-gray-600">
                  Created: {formatDateTime(prescription?.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => sendToPharmacy(prescription?._id)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Send className="w-5 h-5 inline mr-2" />
              Send to Pharmacy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-lg mb-4">Patient Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium text-gray-900">
                  {getPatientName(patientContext)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Age</span>
                <span className="font-medium text-gray-900">
                  {getPatientAge(patientContext) || 'N/A'} years
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender</span>
                <span className="font-medium text-gray-900">
                  {getPatientGender(patientContext) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blood Group</span>
                <span className="font-medium text-gray-900">
                  {getPatientBloodGroup(patientContext) || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Prescription Stats */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-lg mb-4">Prescription Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Medicines</span>
                <span className="font-medium text-gray-900">
                  {prescription?.medicines?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Administration</span>
                <span className="font-medium text-amber-600">
                  {(prescription?.medicines?.filter(m => m.administrationStatus === 'Pending')?.length) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Administered</span>
                <span className="font-medium text-green-600">
                  {(prescription?.medicines?.filter(m => m.administrationStatus === 'Administered')?.length) || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Medicines List */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 text-lg mb-4">Medications</h4>
          <div className="space-y-3">
            {prescription?.medicines?.map((med, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{med.name}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Dosage:</span> {med.dosage}
                      </span>
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Frequency:</span> {med.frequency}
                      </span>
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {med.duration}
                      </span>
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(med.administrationStatus)}`}>
                    {med.administrationStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LabReportModal = () => {
    if (!selectedItem) return null;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Lab Report</h3>
              <p className="text-gray-600">
                Test: {selectedItem.testName || selectedItem.labTestId?.testName}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-lg mb-4">Test Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Patient Name</span>
                <span className="font-medium text-gray-900">
                  {getPatientName(selectedItem)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Test Name</span>
                <span className="font-medium text-gray-900">
                  {selectedItem.testName || selectedItem.labTestId?.testName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Report Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedItem.reportDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 text-lg mb-4">Report Details</h4>
            <div className="space-y-3">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <p className="text-sm font-medium text-teal-800 mb-2">Result</p>
                <p className="text-gray-900">{selectedItem.result || 'No result available'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              // Download report logic here
              alert('Download feature coming soon');
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            <Download className="w-5 h-5 inline mr-2" />
            Download Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Clinical Actions Dashboard
            </h1>
            <p className="text-gray-600">Manage appointments, prescriptions, and lab orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setSelectedItem(null);
                setModalType('requestLabTest');
                setShowModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <FilePlus className="w-5 h-5 inline mr-2" />
              Request Lab Test
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-4xl font-bold">{stats.appointments?.today || 0}</p>
                <p className="text-blue-100">Today's Appointments</p>
              </div>
            </div>
            <div className="bg-blue-600/50 rounded-xl p-3 text-sm backdrop-blur-sm">
              <div className="flex justify-between">
                <span>Upcoming:</span>
                <span className="font-semibold">{stats.appointments?.week || 0} this week</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Pill className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-4xl font-bold">{stats.prescriptions?.pending || 0}</p>
                <p className="text-purple-100">Pending Prescriptions</p>
              </div>
            </div>
            <div className="bg-purple-600/50 rounded-xl p-3 text-sm backdrop-blur-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">{stats.prescriptions?.total || 0} created</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Microscope className="w-12 h-12 opacity-90" />
              <div className="text-right">
                <p className="text-4xl font-bold">{stats.labTests?.pending || 0}</p>
                <p className="text-teal-100">Pending Lab Tests</p>
              </div>
            </div>
            <div className="bg-teal-600/50 rounded-xl p-3 text-sm backdrop-blur-sm">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-semibold">{stats.labTests?.completed || 0} reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 p-2 flex gap-2 border border-gray-100">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
              activeTab === 'appointments'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
              activeTab === 'prescriptions'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Pill className="w-5 h-5" />
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
              activeTab === 'labs'
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Microscope className="w-5 h-5" />
            Lab Tests
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading clinical data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'prescriptions' && renderPrescriptions()}
            {activeTab === 'labs' && renderLabTests()}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                <h3 className="text-2xl font-bold text-gray-900">
                  {modalType === 'appointmentDetails' && 'Appointment Details'}
                  {modalType === 'createPrescription' && 'Create Prescription'}
                  {modalType === 'requestLabTest' && 'Request Lab Test'}
                  {modalType === 'labReport' && 'Lab Report'}
                  {modalType === 'assignLabTech' && 'Assign Lab Technician'}
                  {modalType === 'fullPrescription' && 'Prescription Details'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>
              <div className="p-8">
                {modalType === 'appointmentDetails' && <AppointmentDetailsModal />}
                {modalType === 'createPrescription' && <CreatePrescriptionModal />}
                {modalType === 'assignLabTech' && <AssignLabTechModal />}
                {modalType === 'fullPrescription' && <FullPrescriptionModal />}
                {modalType === 'labReport' && <LabReportModal />}
                {modalType === 'requestLabTest' && (
                  <div className="text-center py-12">
                    <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Request Lab Test</h3>
                    <p className="text-gray-500 mb-6">This feature is coming soon</p>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorClinicalActions;