// DoctorDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarDays, 
  Users, 
  FileText, 
  ClipboardList,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  Pill,
  TestTube,
  UserCheck,
  Bell,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  Stethoscope,
  Heart,
  Thermometer,
  Activity as ActivityIcon,
  Download,
  RefreshCw,
  MoreVertical,
  TrendingDown,
  Eye,
  MessageSquare,
  Settings,
  Filter
} from 'lucide-react';
import { 
  BarChart, Bar, 
  LineChart as RechartsLine, Line, 
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../api/api';


const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');

  const token = localStorage.getItem('token');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, quickRes, activityRes, notifRes] = await Promise.all([
        fetch(`${BASE_URL}/doctors/dashboard/stats`, { headers }),
        fetch(`${BASE_URL}/doctors/dashboard/quick-stats`, { headers }),
        fetch(`${BASE_URL}/doctors/dashboard/activity`, { headers }),
        fetch(`${BASE_URL}/doctors/notifications?limit=10`, { headers })
      ]);

      if (!statsRes.ok || !quickRes.ok) throw new Error('Failed to fetch data');

      const statsData = await statsRes.json();
      const quickData = await quickRes.json();
      const activityData = await activityRes.json();
      const notifData = await notifRes.json();

      setStats(statsData.data);
      setQuickStats(quickData.data);
      setActivity(activityData.data);
      setNotifications(notifData.data || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const StatCard = ({ icon: Icon, title, value, color, trend, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${onClick ? 'hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center mt-2 text-sm">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
              )}
              <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
                {trend > 0 ? '+' : ''}{trend}% from last week
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const NotificationItem = ({ type, title, message, timestamp, priority, data }) => {
    const icons = {
      APPOINTMENT_REMINDER: CalendarDays,
      LAB_RESULT: TestTube,
      PENDING_PRESCRIPTION: Pill,
      CRITICAL_VITALS: AlertCircle,
      DISCHARGE_SUMMARY: FileText
    };
    
    const Icon = icons[type] || Bell;
    const priorityColors = {
      high: 'border-l-red-500 bg-red-50',
      medium: 'border-l-yellow-500 bg-yellow-50',
      low: 'border-l-blue-500 bg-blue-50'
    };

    return (
      <div className={`border-l-4 ${priorityColors[priority]} p-4 rounded-r-lg mb-3 hover:shadow-sm transition-shadow`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Icon className="w-5 h-5 mt-1 text-gray-700" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900">{title}</h4>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
              {data && (
                <div className="flex gap-2 mt-2">
                  {data.appointmentId && (
                    <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                      View Appointment
                    </button>
                  )}
                  {data.labReportId && (
                    <button className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">
                      View Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentStatusChart = () => {
    const data = stats?.visualizations?.appointmentStatus || [
      { status: 'Scheduled', count: 25 },
      { status: 'Completed', count: 45 },
      { status: 'Cancelled', count: 5 }
    ];

    const COLORS = ['#3B82F6', '#10B981', '#EF4444'];

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Appointment Status</h3>
          <PieChart className="w-5 h-5 text-gray-500" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} appointments`, 'Count']} />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAppointmentTrendChart = () => {
    const trends = stats?.visualizations?.appointmentTrends || [
      { date: '2024-01', count: 10 },
      { date: '2024-02', count: 15 },
      { date: '2024-03', count: 12 },
      { date: '2024-04', count: 18 },
      { date: '2024-05', count: 20 }
    ];

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Appointments Over Time</h3>
          <LineChart className="w-5 h-5 text-gray-500" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value) => [`${value} appointments`, 'Appointments']}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                fill="url(#colorUv)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPatientDemographicsChart = () => {
    const demographics = stats?.visualizations?.patientDemographics || [
      { gender: 'Male', count: 45, avgAge: 42 },
      { gender: 'Female', count: 55, avgAge: 38 }
    ];

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Patient Demographics</h3>
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demographics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'count') return [`${value} patients`, 'Count'];
                  return [`${value} years`, 'Average Age'];
                }}
              />
              <Legend />
              <Bar dataKey="count" name="Patient Count" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgAge" name="Average Age" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPrescriptionChart = () => {
    const prescriptionData = stats?.visualizations?.prescriptionStats?.byStatus || [
      { _id: 'Pending', count: 15 },
      { _id: 'Administered', count: 85 }
    ];

    const data = prescriptionData.map(item => ({
      name: item._id,
      value: item.count
    }));

    const COLORS = ['#F59E0B', '#10B981'];

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Prescription Status</h3>
          <Pill className="w-5 h-5 text-gray-500" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} prescriptions`, 'Count']} />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const QuickAction = ({ icon: Icon, title, description, color, onClick }) => (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow ${color} border-l-4 border-blue-500`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-6 h-6 text-blue-600 mt-1" />
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );

  const RecentActivityItem = ({ type, title, time, patient, status, icon: Icon }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{patient}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <Activity className="w-12 h-12 animate-spin mx-auto text-blue-600" />
            <Stethoscope className="w-6 h-6 text-blue-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600">Loading your medical dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching patient data and statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, Doctor. Here's your practice overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Time Range Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4 w-fit">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={CalendarDays}
          title="Today's Appointments"
          value={quickStats?.todaysAppointments || 0}
          color="bg-blue-500"
          trend={12}
          subtitle={`${quickStats?.upcomingAppointments || 0} upcoming`}
        />
        <StatCard
          icon={Users}
          title="Active Patients"
          value={stats?.summary?.totalPatients || 0}
          color="bg-green-500"
          trend={8}
          subtitle={`${quickStats?.criticalPatients || 0} critical`}
        />
        <StatCard
          icon={FileText}
          title="Prescriptions"
          value={stats?.summary?.activePrescriptions || 0}
          color="bg-yellow-500"
          trend={-5}
          subtitle={`${stats?.summary?.completedLabTests || 0} lab reports ready`}
        />
        <StatCard
          icon={ClipboardList}
          title="Lab Tests"
          value={stats?.summary?.pendingLabTests || 0}
          color="bg-purple-500"
          trend={15}
          subtitle={`${quickStats?.lowStockMedicines || 0} medicines low stock`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderAppointmentTrendChart()}
        {renderAppointmentStatusChart()}
        {renderPatientDemographicsChart()}
        {renderPrescriptionChart()}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Top Medicines */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <QuickAction
                icon={CalendarDays}
                title="Schedule Appointment"
                description="Book a new patient consultation"
                onClick={() => toast.success('Opening scheduler')}
              />
              <QuickAction
                icon={FileText}
                title="Write Prescription"
                description="Create new medication orders"
                onClick={() => toast.success('Opening prescription writer')}
              />
              <QuickAction
                icon={TestTube}
                title="Request Lab Test"
                description="Order diagnostic tests"
                onClick={() => toast.success('Opening lab test request')}
              />
              <QuickAction
                icon={MessageSquare}
                title="Patient Messages"
                description="Check unread patient messages"
                onClick={() => toast.success('Opening messages')}
              />
            </div>
          </div>

          {/* Top Medicines */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Prescribed Medicines</h3>
              <Filter className="w-4 h-4 text-gray-500 cursor-pointer" />
            </div>
            <div className="space-y-3">
              {stats?.visualizations?.topMedicines?.slice(0, 5).map((medicine, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{medicine.name}</p>
                      <p className="text-xs text-gray-500">{medicine.totalQuantity || 0} units prescribed</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {medicine.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column - Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Notifications
              </h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No new notifications</p>
                  <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <button className="w-full mt-4 py-2 text-center text-blue-600 hover:text-blue-700 font-medium border-t border-gray-100 pt-4">
                View All Notifications
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Recent Activity & System Health */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Eye className="w-5 h-5 text-gray-500 cursor-pointer" />
            </div>
            <div className="space-y-2">
              {activity?.appointments?.slice(0, 4).map((apt, index) => (
                <RecentActivityItem
                  key={index}
                  icon={CalendarDays}
                  title={`Appointment with ${apt.patientId?.userId?.name || 'Patient'}`}
                  patient={apt.patientId?.userId?.name || 'Patient'}
                  time={new Date(apt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  status={apt.status}
                />
              ))}
              {activity?.prescriptions?.slice(0, 2).map((prescription, index) => (
                <RecentActivityItem
                  key={`prescription-${index}`}
                  icon={FileText}
                  title="Prescription Created"
                  patient={prescription.patientId?.userId?.name || 'Patient'}
                  time={new Date(prescription.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  status="Completed"
                />
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Database Connection</span>
                  <span className="text-green-400">● Healthy</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>API Response Time</span>
                  <span className="text-green-400">42ms</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Usage</span>
                  <span className="text-yellow-400">78%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-gray-400">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-gray-400">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Success Rate</p>
              <p className="text-2xl font-bold mt-2">98.2%</p>
              <p className="text-sm opacity-90 mt-1">Patient Satisfaction</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Avg Consultation Time</p>
              <p className="text-2xl font-bold mt-2">18m 42s</p>
              <p className="text-sm opacity-90 mt-1">Efficiency Score: 92%</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Revenue This Month</p>
              <p className="text-2xl font-bold mt-2">$24,580</p>
              <p className="text-sm opacity-90 mt-1">+12.5% from last month</p>
            </div>
            <BarChart3 className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;