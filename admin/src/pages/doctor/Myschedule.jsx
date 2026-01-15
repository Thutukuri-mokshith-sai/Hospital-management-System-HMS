import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Filter, 
  Search, 
  MoreVertical,
  Download,
  Share2,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Video,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Bell,
  Settings,
  BarChart3,
  Zap,
  Moon,
  Sun,
  Grid,
  List,
  MapPin,
  Phone,
  Mail,
  Camera,
  Shield,
  Award,
  Star,
  TrendingUp,
  CalendarDays,
  Briefcase,
  Coffee,
  Dumbbell,
  Music,
  Film,
  Gamepad2,
  Utensils,
  Car,
  Plane,
  Hotel,
  Beach,
  Heart,
  Brain,
  Eye,
  Tooth,
  Stethoscope,
  Pill,
  Microscope,
  Thermometer,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BASE_URL } from '../../api/api';

const MySchedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'grid'
  const [calendarView, setCalendarView] = useState('week'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    monday: { start: '09:00', end: '17:00', available: true, color: 'bg-blue-100' },
    tuesday: { start: '09:00', end: '17:00', available: true, color: 'bg-green-100' },
    wednesday: { start: '09:00', end: '17:00', available: true, color: 'bg-purple-100' },
    thursday: { start: '09:00', end: '17:00', available: true, color: 'bg-pink-100' },
    friday: { start: '09:00', end: '17:00', available: true, color: 'bg-orange-100' },
    saturday: { start: '10:00', end: '14:00', available: false, color: 'bg-red-100' },
    sunday: { start: '10:00', end: '14:00', available: false, color: 'bg-gray-100' }
  });
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    revenue: 0,
    satisfactionRate: 0,
    efficiencyScore: 0
  });

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    dateRange: 'week'
  });

  const [theme, setTheme] = useState('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timeOffRequests, setTimeOffRequests] = useState([]);

  // Mock data for demonstration
  const mockAppointments = [
    {
      id: 1,
      patient: { name: 'John Smith', age: 45, gender: 'Male', avatar: 'JS' },
      date: new Date(),
      time: '10:00',
      duration: 30,
      type: 'Consultation',
      status: 'scheduled',
      priority: 'high',
      notes: 'Follow-up for hypertension',
      location: 'Room 101',
      videoLink: 'https://meet.example.com/abc123'
    },
    {
      id: 2,
      patient: { name: 'Emma Johnson', age: 32, gender: 'Female', avatar: 'EJ' },
      date: new Date(),
      time: '11:30',
      duration: 45,
      type: 'Procedure',
      status: 'completed',
      priority: 'medium',
      notes: 'Annual physical examination',
      location: 'Room 203'
    },
    {
      id: 3,
      patient: { name: 'Robert Chen', age: 58, gender: 'Male', avatar: 'RC' },
      date: addDays(new Date(), 1),
      time: '14:00',
      duration: 60,
      type: 'Surgery',
      status: 'scheduled',
      priority: 'critical',
      notes: 'Knee replacement surgery',
      location: 'OR 3'
    },
    {
      id: 4,
      patient: { name: 'Sarah Wilson', age: 28, gender: 'Female', avatar: 'SW' },
      date: addDays(new Date(), 1),
      time: '16:00',
      duration: 30,
      type: 'Check-up',
      status: 'scheduled',
      priority: 'low',
      notes: 'Pregnancy follow-up',
      location: 'Room 102'
    }
  ];

  const mockTimeSlots = [
    { time: '09:00', available: true },
    { time: '09:30', available: false },
    { time: '10:00', available: false },
    { time: '10:30', available: true },
    { time: '11:00', available: true },
    { time: '11:30', available: false },
    { time: '12:00', available: true },
    { time: '13:00', available: true },
    { time: '13:30', available: true },
    { time: '14:00', available: false },
    { time: '14:30', available: true },
    { time: '15:00', available: true },
    { time: '15:30', available: true },
    { time: '16:00', available: false },
    { time: '16:30', available: true }
  ];

  const mockTimeOffRequests = [
    {
      id: 1,
      doctor: { name: 'Dr. Sarah Miller', specialty: 'Cardiology' },
      startDate: addDays(new Date(), 7),
      endDate: addDays(new Date(), 10),
      type: 'vacation',
      status: 'pending',
      notes: 'Family vacation to Hawaii'
    },
    {
      id: 2,
      doctor: { name: 'Dr. James Wilson', specialty: 'Neurology' },
      startDate: addDays(new Date(), 3),
      endDate: addDays(new Date(), 4),
      type: 'conference',
      status: 'approved',
      notes: 'Medical conference in Chicago'
    }
  ];

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setTimeout(() => {
        setAppointments(mockAppointments);
        setTimeOffRequests(mockTimeOffRequests);
        setStats({
          totalPatients: 156,
          completedAppointments: 42,
          pendingAppointments: 8,
          revenue: 12540,
          satisfactionRate: 94.5,
          efficiencyScore: 87
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'surgery': return <Stethoscope className="w-4 h-4" />;
      case 'consultation': return <User className="w-4 h-4" />;
      case 'check-up': return <Activity className="w-4 h-4" />;
      case 'procedure': return <Thermometer className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const handleJoinCall = (link) => {
    window.open(link, '_blank');
  };

  const handleSendMessage = (patient) => {
    alert(`Opening chat with ${patient.name}`);
  };

  const handleAddEvent = () => {
    setIsAddingEvent(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleApproveTimeOff = (id) => {
    setTimeOffRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      )
    );
  };

  const handleRejectTimeOff = (id) => {
    setTimeOffRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: 'rejected' } : req
      )
    );
  };

  const generateDayView = () => {
    return (
      <div className="space-y-4">
        {mockTimeSlots.map((slot, index) => (
          <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="w-24 flex-shrink-0">
              <span className="font-semibold text-gray-700">{slot.time}</span>
            </div>
            <div className="flex-1">
              {slot.available ? (
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-medium">Available Slot</span>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-lg">
                  <span className="text-red-700 font-medium">Booked - Consultation</span>
                  <p className="text-sm text-red-600 mt-1">Patient: John Doe</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Schedule Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your appointments and availability</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-6 h-6" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'D'}
                </div>
                <div className="hidden md:block">
                  <p className="font-semibold">{user?.name || 'Doctor'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cardiologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className={`w-64 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} min-h-screen border-r shadow-lg transition-all duration-300`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button 
                  onClick={handleAddEvent}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Appointment</span>
                </button>

                <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span>Today's Schedule</span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span>Video Consultations</span>
                  <Video className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span>Time Off Requests</span>
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {timeOffRequests.length}
                  </span>
                </button>
              </div>

              <h2 className="text-lg font-semibold mt-8 mb-4">Filters</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" />
                    <span className="ml-2">Show Video Calls</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show In-person</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show Weekends</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Today's Appointments</p>
                  <p className="text-3xl font-bold mt-2">{appointments.filter(a => isToday(a.date)).length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Time Off</p>
                  <p className="text-3xl font-bold mt-2">{timeOffRequests.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-orange-600 dark:text-orange-400">
                {timeOffRequests.filter(r => r.status === 'pending').length} requests pending approval
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Available Slots</p>
                  <p className="text-3xl font-bold mt-2">12</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 dark:text-green-400">+3 slots added today</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Satisfaction Rate</p>
                  <p className="text-3xl font-bold mt-2">{stats.satisfactionRate}%</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <Star className="w-4 h-4 text-gray-300 fill-current" />
                <span className="ml-2 text-sm text-gray-500">4.8/5.0</span>
              </div>
            </div>
          </div>

          {/* Calendar and Appointments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl font-bold">Calendar View</h2>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setCalendarView('day')}
                          className={`px-4 py-2 rounded-lg ${calendarView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                          Day
                        </button>
                        <button 
                          onClick={() => setCalendarView('week')}
                          className={`px-4 py-2 rounded-lg ${calendarView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                          Week
                        </button>
                        <button 
                          onClick={() => setCalendarView('month')}
                          className={`px-4 py-2 rounded-lg ${calendarView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                          Month
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold">{format(selectedDate, 'MMMM yyyy')}</span>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                        Today
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-semibold py-2 text-gray-500 dark:text-gray-400">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days would go here */}
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-24 p-2 border rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors
                          ${isToday(addDays(startOfWeek(new Date()), i)) ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-600'}`}
                      >
                        <div className="flex justify-between">
                          <span className={`font-semibold ${isToday(addDays(startOfWeek(new Date()), i)) ? 'text-blue-600' : ''}`}>
                            {addDays(startOfWeek(new Date()), i).getDate()}
                          </span>
                          {i % 7 === 0 && <span className="text-xs text-red-500">3 appts</span>}
                        </div>
                        <div className="mt-2 space-y-1">
                          {i % 3 === 0 && (
                            <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 p-1 rounded">
                              10:00 AM
                            </div>
                          )}
                          {i % 4 === 0 && (
                            <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 p-1 rounded">
                              2:00 PM
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day View Time Slots */}
                  {calendarView === 'day' && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Time Slots for {format(selectedDate, 'MMMM d, yyyy')}</h3>
                      {generateDayView()}
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Upcoming Appointments</h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {appointments.map(appointment => (
                    <div 
                      key={appointment.id}
                      className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <div className={`w-3 h-full rounded-lg ${getPriorityColor(appointment.priority)} mr-4`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                              {appointment.patient.avatar}
                            </div>
                            <div>
                              <h3 className="font-semibold">{appointment.patient.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.patient.age} years • {appointment.patient.gender}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{format(appointment.date, 'MMM d')} • {appointment.time}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center text-sm">
                              {getTypeIcon(appointment.type)}
                              <span className="ml-2">{appointment.type}</span>
                            </span>
                            <span className="text-sm">
                              <MapPin className="inline w-4 h-4 mr-1" />
                              {appointment.location}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            {appointment.videoLink && (
                              <button 
                                onClick={() => handleJoinCall(appointment.videoLink)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Join Call
                              </button>
                            )}
                            <button 
                              onClick={() => handleSendMessage(appointment.patient)}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{appointment.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Working Hours */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Working Hours</h2>
                <div className="space-y-3">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${hours.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="capitalize font-medium">{day}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${hours.color} ${theme === 'dark' ? 'text-gray-800' : ''}`}>
                        {hours.available ? `${hours.start} - ${hours.end}` : 'Off'}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-lg hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all font-medium">
                  Edit Working Hours
                </button>
              </div>

              {/* Time Off Requests */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Time Off Requests</h2>
                <div className="space-y-4">
                  {timeOffRequests.map(request => (
                    <div key={request.id} className="p-4 border dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{request.doctor.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{request.doctor.specialty}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm mb-3">{format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{request.notes}</p>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleApproveTimeOff(request.id)}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectTimeOff(request.id)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Weekly Hours</span>
                    <span className="font-bold">40 hrs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Patient Load</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Efficiency</span>
                    <span className="font-bold">{stats.efficiencyScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>No-shows</span>
                    <span className="font-bold">2%</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span>Next Available:</span>
                    <span className="font-bold">Tomorrow, 2:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center">
                  <Printer className="w-6 h-6 mb-2" />
                  <span>Print</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Export</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center">
                  <Share2 className="w-6 h-6 mb-2" />
                  <span>Share</span>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center">
                  <Settings className="w-6 h-6 mb-2" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="fixed bottom-6 right-6 flex space-x-4">
            <button 
              onClick={handleAddEvent}
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300">
              <Video className="w-6 h-6" />
            </button>
            <button className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </main>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Appointment Details</h2>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedEvent.patient.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedEvent.patient.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedEvent.patient.age} years • {selectedEvent.patient.gender}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-sm">
                        <Phone className="inline w-4 h-4 mr-1" />
                        Call
                      </button>
                      <button className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-lg text-sm">
                        <MessageCircle className="inline w-4 h-4 mr-1" />
                        Message
                      </button>
                      <button className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                    <p className="font-semibold">{format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-lg font-bold">{selectedEvent.time}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-lg font-bold">{selectedEvent.duration} minutes</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-semibold">{selectedEvent.type}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedEvent.priority)} text-white`}>
                      {selectedEvent.priority}
                    </span>
                  </div>
                </div>

                {/* Notes and Actions */}
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-gray-600 dark:text-gray-300">{selectedEvent.notes}</p>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold">
                    Start Consultation
                  </button>
                  <button className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                    Reschedule
                  </button>
                  <button className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySchedule;