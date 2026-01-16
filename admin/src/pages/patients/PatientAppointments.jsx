import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  CalendarDays,
  Eye,
  Trash2,
  Loader2,
  FileText
} from 'lucide-react';
import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Form state for booking
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

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

  // Fetch appointments and doctors
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch appointments
      const appointmentsResponse = await axios.get(`${API_BASE_URL}/patients/appointments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch available doctors
      const doctorsResponse = await axios.get(`${API_BASE_URL}/patients/doctors/available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (appointmentsResponse.data.success) {
        setAppointments(appointmentsResponse.data.data || []);
      }

      if (doctorsResponse.data.success) {
        console.log('Doctors data structure:', doctorsResponse.data);
        console.log('Doctors array:', doctorsResponse.data.data);
        
        // Transform doctor data to ensure consistent structure
        const transformedDoctors = (doctorsResponse.data.data || []).map(doctor => {
          console.log('Processing doctor:', doctor);
          // Different possible structures
          const userId = doctor.userId || doctor.user || doctor;
          const doctorData = doctor.doctor || doctor;
          
          return {
            ...doctor,
            _id: doctor._id || doctorData._id,
            userId: userId ? {
              _id: userId._id,
              name: userId.name || 'Doctor',
              email: userId.email || 'No email',
              phone: userId.phone || 'No phone'
            } : {
              name: 'Doctor',
              email: 'No email',
              phone: 'No phone'
            },
            specialization: doctor.specialization || doctorData.specialization || 'General',
            department: doctor.department || doctorData.department || 'General Medicine',
            consultationFee: doctor.consultationFee || doctorData.consultationFee || 0,
            phone: doctor.phone || userId?.phone || 'No phone'
          };
        });
        
        console.log('Transformed doctors:', transformedDoctors);
        setDoctors(transformedDoctors);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch available time slots for selected doctor and date
  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    
    try {
      setLoadingSlots(true);
      const response = await axios.get(
        `${API_BASE_URL}/patients/doctors/${doctorId}/availability/${date}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Extract available slots from response
        const slots = response.data.data?.availableSlots || [];
        console.log('Available slots:', slots);
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle doctor selection for booking
  const handleDoctorSelect = (doctor) => {
    console.log('Doctor selected:', doctor);
    setSelectedDoctor(doctor);
    setBookingForm(prev => ({
      ...prev,
      doctorId: doctor._id
    }));
  };

  // Handle date change for booking
  const handleDateChange = (date) => {
    setBookingForm(prev => ({
      ...prev,
      date,
      time: '' // Reset time when date changes
    }));
    
    if (selectedDoctor) {
      fetchAvailableSlots(selectedDoctor._id, date);
    }
  };

  // Handle book appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!bookingForm.doctorId || !bookingForm.date || !bookingForm.time) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setBookingLoading(true);
      setError('');

      const response = await axios.post(
        `${API_BASE_URL}/patients/appointments`,
        bookingForm,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Refresh appointments list
        fetchData();
        // Reset form and close modal
        setBookingForm({
          doctorId: '',
          date: '',
          time: '',
          reason: '',
          notes: ''
        });
        setSelectedDoctor(null);
        setAvailableSlots([]);
        setShowBookingModal(false);
        setError('');
        
        // Show success message (you can replace with toast notification)
        alert('Appointment booked successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to book appointment');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/patients/appointments/${selectedAppointment._id}`,
        {}, // Empty body for cancellation
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Refresh appointments list
        fetchData();
        setShowCancelModal(false);
        setSelectedAppointment(null);
        
        // Show success message
        alert('Appointment cancelled successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel appointment');
      console.error('Cancel error:', err);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      appointment.doctorId?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorId?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    // Type filter (if appointment has type property)
    const matchesType = filterType === 'all' || appointment.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group appointments by date
  const upcomingAppointments = filteredAppointments
    .filter(app => {
      const appointmentDate = new Date(app.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today && app.status !== 'Cancelled';
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastAppointments = filteredAppointments
    .filter(app => {
      const appointmentDate = new Date(app.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate < today || app.status === 'Cancelled';
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Confirmed':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get appointment type color (if type exists)
  const getTypeColor = (type) => {
    switch (type) {
      case 'General':
        return 'bg-purple-100 text-purple-700';
      case 'Specialist':
        return 'bg-indigo-100 text-indigo-700';
      case 'Follow-up':
        return 'bg-cyan-100 text-cyan-700';
      case 'Emergency':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format time display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-emerald-800">Loading Appointments...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-900">
              My Appointments
            </h1>
            <p className="text-emerald-600 mt-2">
              Manage your doctor visits and schedule new appointments
            </p>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Book New Appointment
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="General">General</option>
                <option value="Specialist">Specialist</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            title: 'Total Appointments',
            value: appointments.length,
            color: 'from-blue-500 to-cyan-500',
            icon: <Calendar className="w-6 h-6" />
          },
          {
            title: 'Upcoming',
            value: appointments.filter(a => {
              const appointmentDate = new Date(a.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return appointmentDate >= today && a.status !== 'Cancelled';
            }).length,
            color: 'from-emerald-500 to-teal-500',
            icon: <Clock className="w-6 h-6" />
          },
          {
            title: 'Completed',
            value: appointments.filter(a => a.status === 'Completed').length,
            color: 'from-purple-500 to-pink-500',
            icon: <CheckCircle className="w-6 h-6" />
          },
          {
            title: 'Cancelled',
            value: appointments.filter(a => a.status === 'Cancelled').length,
            color: 'from-red-500 to-rose-500',
            icon: <XCircle className="w-6 h-6" />
          }
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-emerald-900 mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          Dr. {appointment.doctorId?.userId?.name || 'Unknown'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {appointment.doctorId?.specialization || 'General Consultation'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(appointment.time)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.type && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(appointment.type)}`}>
                        {appointment.type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">
                    <span className="font-semibold">Reason:</span> {appointment.reason || 'General Checkup'}
                  </p>
                  {appointment.notes && (
                    <p className="text-gray-600 text-sm mt-1">
                      <span className="font-semibold">Notes:</span> {appointment.notes}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold">Appointment ID:</span> {appointment._id?.slice(-8) || ''}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/`}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </Link>
                    {appointment.status !== 'Cancelled' && new Date(appointment.date) >= new Date() && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-emerald-100 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Upcoming Appointments</h3>
            <p className="text-gray-500 mb-6">You don't have any upcoming appointments scheduled.</p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Book Your First Appointment
            </button>
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-emerald-900 mb-4">Past Appointments</h2>
        {pastAppointments.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-emerald-900">Doctor</th>
                    <th className="text-left py-4 px-6 font-semibold text-emerald-900">Date & Time</th>
                    <th className="text-left py-4 px-6 font-semibold text-emerald-900">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-emerald-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-emerald-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAppointments.map((appointment) => (
                    <tr key={appointment._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              Dr. {appointment.doctorId?.userId?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.doctorId?.specialization || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-800">
                          {new Date(appointment.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{formatTime(appointment.time)}</p>
                      </td>
                      <td className="py-4 px-6">
                        {appointment.type && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(appointment.type)}`}>
                            {appointment.type}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          to={`/patient/appointments/${appointment._id}`}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No past appointments found.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-emerald-900">Book New Appointment</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDoctor(null);
                  setBookingForm({
                    doctorId: '',
                    date: '',
                    time: '',
                    reason: '',
                    notes: ''
                  });
                  setAvailableSlots([]);
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleBookAppointment}>
                {/* Step 1: Select Doctor */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Select Doctor
                  </h3>
                  {doctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doctors.map((doctor) => (
                        <div
                          key={doctor._id}
                          onClick={() => handleDoctorSelect(doctor)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedDoctor?._id === doctor._id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">
                                Dr. {doctor.userId?.name || 'Unknown Doctor'}
                              </h4>
                              <p className="text-sm text-gray-600">{doctor.specialization}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>{doctor.department || 'General Medicine'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{doctor.phone || 'Not available'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{doctor.userId?.email || 'No email'}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {doctor.consultationFee ? `$${doctor.consultationFee}` : 'Free Consultation'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-gray-50 rounded-xl">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No doctors available at the moment.</p>
                      <p className="text-sm text-gray-500 mt-1">Please try again later.</p>
                    </div>
                  )}
                </div>

                {selectedDoctor && (
                  <>
                    {/* Step 2: Select Date */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Select Date
                      </h3>
                      <input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    {/* Step 3: Select Time Slot */}
                    {bookingForm.date && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Select Time Slot
                        </h3>
                        {loadingSlots ? (
                          <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                            <p className="text-gray-500">Loading available slots...</p>
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setBookingForm(prev => ({ ...prev, time: slot }))}
                                className={`p-3 border-2 rounded-xl text-center transition-all ${
                                  bookingForm.time === slot
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                                    : 'border-gray-200 hover:border-emerald-300'
                                }`}
                              >
                                {formatTime(slot)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <p className="text-yellow-700">
                                No available slots for this date. Please select another date.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Appointment Details */}
                    {bookingForm.time && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Appointment Details
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reason for Visit *
                            </label>
                            <input
                              type="text"
                              value={bookingForm.reason}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, reason: e.target.value }))}
                              placeholder="e.g., General checkup, Follow-up, Specific symptoms..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Additional Notes (Optional)
                            </label>
                            <textarea
                              value={bookingForm.notes}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Any specific concerns or symptoms you want to mention..."
                              rows="3"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedDoctor(null);
                      setBookingForm({
                        doctorId: '',
                        date: '',
                        time: '',
                        reason: '',
                        notes: ''
                      });
                      setAvailableSlots([]);
                      setError('');
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedDoctor || !bookingForm.date || !bookingForm.time || bookingLoading}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book Appointment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Cancel Appointment</h2>
              <p className="text-gray-600">
                Are you sure you want to cancel your appointment with{' '}
                <span className="font-semibold">Dr. {selectedAppointment.doctorId?.userId?.name || 'Unknown'}</span>?
              </p>
              <div className="mt-4 p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Date:</span> {new Date(selectedAppointment.date).toLocaleDateString()}
                  <br />
                  <span className="font-semibold">Time:</span> {formatTime(selectedAppointment.time)}
                  <br />
                  <span className="font-semibold">Reason:</span> {selectedAppointment.reason || 'General Checkup'}
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;