import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Pill,
  FileText,
  CreditCard,
  Home,
  Bell,
  AlertCircle,
  TrendingUp,
  Activity,
  Heart,
  Thermometer,
  Droplets,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  Hospital
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const PatientDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_BASE_URL}/patients/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Mock data for charts (replace with real data from API)
  const vitalTrendsData = [
    { day: 'Mon', heartRate: 72, systolic: 120, diastolic: 80 },
    { day: 'Tue', heartRate: 75, systolic: 122, diastolic: 82 },
    { day: 'Wed', heartRate: 70, systolic: 118, diastolic: 78 },
    { day: 'Thu', heartRate: 74, systolic: 121, diastolic: 79 },
    { day: 'Fri', heartRate: 73, systolic: 119, diastolic: 77 },
    { day: 'Sat', heartRate: 76, systolic: 124, diastolic: 84 },
    { day: 'Sun', heartRate: 71, systolic: 117, diastolic: 76 },
  ];

  const medicationAdherenceData = [
    { name: 'Taken', value: 85, color: '#10b981' },
    { name: 'Missed', value: 10, color: '#f59e0b' },
    { name: 'Pending', value: 5, color: '#ef4444' },
  ];

  const appointmentTypeData = [
    { type: 'General', count: 4 },
    { type: 'Specialist', count: 2 },
    { type: 'Follow-up', count: 3 },
    { type: 'Emergency', count: 1 },
  ];

  const billStatusData = [
    { month: 'Jan', paid: 1200, pending: 400 },
    { month: 'Feb', paid: 1800, pending: 600 },
    { month: 'Mar', paid: 1500, pending: 300 },
    { month: 'Apr', paid: 2000, pending: 800 },
    { month: 'May', paid: 1700, pending: 500 },
    { month: 'Jun', paid: 2200, pending: 900 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-8">
          <div className="h-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-3xl font-bold text-emerald-800 mb-4 animate-pulse">
          Loading Your Health Dashboard
        </h2>
        <p className="text-emerald-600 text-lg animate-pulse">
          Fetching your health information...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-900">
              Health Dashboard
            </h1>
            <p className="text-emerald-600 mt-2">
              Welcome back! Here's your health overview for {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {dashboardData?.patientInfo?.isAdmitted && (
              <div className="px-4 py-2 bg-orange-100 border border-orange-200 rounded-full">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 font-semibold text-sm">Currently Admitted</span>
                </div>
              </div>
            )}
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: <CalendarDays className="w-6 h-6" />,
              title: 'Upcoming Appointments',
              value: dashboardData?.statistics?.upcomingAppointments || 0,
              color: 'from-blue-500 to-cyan-500',
              link: '/patient/appointments'
            },
            {
              icon: <Pill className="w-6 h-6" />,
              title: 'Pending Medicines',
              value: dashboardData?.statistics?.pendingMedicines || 0,
              color: 'from-purple-500 to-pink-500',
              link: '/patient/records'
            },
            {
              icon: <FileText className="w-6 h-6" />,
              title: 'Pending Lab Tests',
              value: dashboardData?.statistics?.pendingLabTests || 0,
              color: 'from-amber-500 to-orange-500',
              link: '/patient/records'
            },
            {
              icon: <CreditCard className="w-6 h-6" />,
              title: 'Pending Bills',
              value: `$${dashboardData?.statistics?.pendingBillsAmount || 0}`,
              color: 'from-red-500 to-rose-500',
              link: '/patient/billing'
            }
          ].map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="group"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    {stat.icon}
                  </div>
                  {stat.value > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      {stat.value} {stat.value === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <div className="mt-4 flex items-center text-emerald-600 text-sm font-semibold">
                  View details
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
            </div>
            <Link 
              to="/patient/appointments" 
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {dashboardData?.overview?.upcomingAppointments?.length > 0 ? (
              dashboardData.overview.upcomingAppointments.map((appointment, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">
                          Dr. {appointment.doctorId?.userId?.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {appointment.doctorId?.specialization || 'General Consultation'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'Scheduled' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Vital Signs */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Recent Vital Signs</h2>
            </div>
            <Link 
              to="/patient/records" 
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View history
            </Link>
          </div>
          
          <div className="space-y-4">
            {dashboardData?.overview?.recentVitals?.length > 0 ? (
              dashboardData.overview.recentVitals.map((vital, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl border border-red-100 bg-red-50"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-gray-700">Heart Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {vital.heartRate || '--'}
                        <span className="text-sm text-gray-500 ml-1">bpm</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Blood Pressure</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {vital.bloodPressure ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}` : '--/--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Thermometer className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-700">Temperature</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {vital.temperature || '--'}
                        <span className="text-sm text-gray-500 ml-1">°F</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Droplets className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-700">Oxygen</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {vital.oxygenSaturation || '--'}
                        <span className="text-sm text-gray-500 ml-1">%</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Recorded: {new Date(vital.recordedAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent vital signs recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vital Trends Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Vital Trends (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vitalTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="heartRate" 
                  name="Heart Rate (bpm)"
                  stroke="#ef4444" 
                  fill="#fecaca"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="systolic" 
                  name="Systolic BP"
                  stroke="#3b82f6" 
                  fill="#93c5fd"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medication Adherence Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Medication Adherence</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicationAdherenceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {medicationAdherenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Adherence']}
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {medicationAdherenceData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointment Types */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Appointment Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Appointments"
                  radius={[8, 8, 0, 0]}
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Billing Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Billing Trends (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={billStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Amount']}
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  name="Paid Amount"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  name="Pending Amount"
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Health Alerts & Reminders</h2>
          </div>
          <span className="text-sm font-semibold text-emerald-600">
            {dashboardData?.overview?.recentNursingCare?.length || 0} new
          </span>
        </div>
        
        <div className="space-y-4">
          {/* Medication Reminders */}
          {dashboardData?.overview?.pendingPrescriptions?.map((prescription, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl border border-yellow-100 bg-yellow-50"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-800">Medication Due</h4>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      Today
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Take {prescription.medicines?.length || 1} medication(s) as prescribed by Dr. {prescription.doctorId?.userId?.name}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      Mark as taken
                    </button>
                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                      Snooze reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Lab Test Results */}
          {dashboardData?.overview?.recentLabTests?.map((test, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl border border-blue-100 bg-blue-50"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-800">
                      {test.testName || 'Lab Test'} Results
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      test.status === 'Completed' 
                        ? 'bg-green-100 text-green-700'
                        : test.status === 'Processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {test.status === 'Completed' 
                      ? 'Your lab test results are ready to view.' 
                      : 'Your lab test is being processed.'}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {test.status === 'Completed' && (
                      <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                        View results
                      </button>
                    )}
                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                      More details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!dashboardData?.overview?.pendingPrescriptions?.length && 
           !dashboardData?.overview?.recentLabTests?.length && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-gray-500">All caught up! No pending alerts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Status Summary */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Health Status</h2>
            <p className="text-emerald-100 mb-4">
              Based on your recent data and medical history
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">Good</div>
                <div className="text-sm text-emerald-200">Overall Condition</div>
              </div>
              <div className="h-12 w-px bg-emerald-400"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">Stable</div>
                <div className="text-sm text-emerald-200">Vital Signs</div>
              </div>
            </div>
          </div>
          <button className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-full hover:bg-emerald-50 transition-all duration-300 hover:scale-105">
            View Detailed Report
          </button>
        </div>
      </div>

      {/* Add missing RefreshCw icon component */}
      <style>{`
        .RefreshCw {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
};

// RefreshCw icon component
const RefreshCw = ({ className }) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
);

export default PatientDashboard;