// PharmacyDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  FiPackage, FiDollarSign, FiUsers, FiAlertTriangle, 
  FiTrendingUp, FiActivity, FiCalendar, FiClock,
  FiFilter, FiSearch, FiDownload, FiRefreshCw,
  FiEye, FiMoreVertical, FiEdit, FiTrash2,
  FiPrinter, FiShare2, FiMail, FiMessageSquare,
  FiBarChart2, FiPieChart, FiGrid, FiShoppingCart,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiUser,
  FiPlusCircle, FiFileText, FiShoppingBag, FiBarChart
} from 'react-icons/fi';
import { 
  FaPills, FaPrescriptionBottleAlt, FaVial, 
  FaStethoscope, FaHospitalUser, FaChartLine,
  FaRegCalendarCheck, FaMoneyBillWave, FaClipboardCheck,
  FaDatabase, FaServer, FaCreditCard, FaSync
} from 'react-icons/fa';
import { MdOutlineMedicalServices, MdLocalPharmacy, MdAttachMoney } from 'react-icons/md';
import { BASE_URL } from '../../api/api';
const PharmacyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [selectedChart, setSelectedChart] = useState('revenue');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    todaysPrescriptions: 0,
    todayRevenue: 0,
    pendingPrescriptions: 0,
    activePatients: 0,
    lowStockAlerts: 0
  });

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacist/dashboard/stats');
      setDashboardData(response.data.data);
      setStats({
        todaysPrescriptions: response.data.data.summaryCards.todaysPrescriptions.count,
        todayRevenue: response.data.data.summaryCards.revenueToday.amount,
        pendingPrescriptions: parseInt(response.data.data.summaryCards.todaysPrescriptions.subtext) || 0,
        activePatients: response.data.data.summaryCards.activePatients.count,
        lowStockAlerts: response.data.data.summaryCards.lowStockAlerts.count
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Color schemes
  const COLORS = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4'
  };

  const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Administered': return 'green';
      case 'Pending': return 'yellow';
      case 'Scheduled': return 'blue';
      case 'Completed': return 'green';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <MdLocalPharmacy className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's your pharmacy overview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search prescriptions..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="h-5 w-5" />
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <FiDownload className="h-5 w-5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex space-x-2">
            {['today', 'week', 'month', 'year', 'all'].map((period) => (
              <button
                key={period}
                className={`px-4 py-2 rounded-lg capitalize ${
                  timeRange === period 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
                onClick={() => setTimeRange(period)}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            {['pending', 'processed', 'cancelled'].map((status) => (
              <button
                key={status}
                className={`px-4 py-2 rounded-lg capitalize ${
                  filterStatus === status 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Today's Prescriptions",
              value: dashboardData?.summaryCards.todaysPrescriptions.count || 0,
              change: dashboardData?.summaryCards.todaysPrescriptions.change || '+0%',
              icon: FaPrescriptionBottleAlt,
              color: "blue",
              subtext: dashboardData?.summaryCards.todaysPrescriptions.subtext || '0 pending'
            },
            {
              title: "Revenue Today",
              value: formatCurrency(dashboardData?.summaryCards.revenueToday.amount || 0),
              change: dashboardData?.summaryCards.revenueToday.change || '+0%',
              icon: MdAttachMoney,
              color: "green",
              subtext: dashboardData?.summaryCards.revenueToday.subtext || 'From all prescriptions'
            },
            {
              title: "Active Patients",
              value: dashboardData?.summaryCards.activePatients.count || 0,
              change: dashboardData?.summaryCards.activePatients.change || '+0%',
              icon: FaHospitalUser,
              color: "purple",
              subtext: dashboardData?.summaryCards.activePatients.subtext || 'With active prescriptions'
            },
            {
              title: "Low Stock Alerts",
              value: dashboardData?.summaryCards.lowStockAlerts.count || 0,
              change: dashboardData?.summaryCards.lowStockAlerts.change || '+0%',
              icon: FiAlertTriangle,
              color: "red",
              subtext: dashboardData?.summaryCards.lowStockAlerts.subtext || 'Medicines below threshold'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600 font-medium">{stat.title}</p>
              <p className="text-sm text-gray-500 mt-2">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue Trend</h3>
                <p className="text-gray-600">Daily revenue and prescription count</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className={`px-3 py-1 rounded-lg ${selectedChart === 'revenue' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setSelectedChart('revenue')}
                >
                  Revenue
                </button>
                <button 
                  className={`px-3 py-1 rounded-lg ${selectedChart === 'prescriptions' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setSelectedChart('prescriptions')}
                >
                  Prescriptions
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dashboardData?.visualizations.weeklyTrend || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="prescriptions" 
                    name="Prescriptions" 
                    fill={COLORS.primary} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prescription Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Prescription Status</h3>
                <p className="text-gray-600">Distribution of prescriptions by status</p>
              </div>
              <FiPieChart className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.visualizations.prescriptionStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData?.visualizations.prescriptionStatus?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value,
                      `${props.payload.status} prescriptions`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {dashboardData?.visualizations.prescriptionStatus?.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-700">{status.status}</span>
                  </div>
                  <span className="font-bold text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Medicine Stock Levels */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Medicine Stock Levels</h3>
                <p className="text-gray-600">Inventory health overview</p>
              </div>
              <FiBarChart2 className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData?.visualizations.stockLevels || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Items']}
                    labelFormatter={(label) => `Stock Level: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Medicine Count"
                    fill={COLORS.warning}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {dashboardData?.visualizations.stockLevels?.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{item.level}</span>
                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Total Value: {formatCurrency(item.totalValue || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Prescribed Medicines */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Prescribed Medicines</h3>
                <p className="text-gray-600">Most frequently prescribed medicines</p>
              </div>
              <FiGrid className="h-6 w-6 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData?.visualizations.topMedicines || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'prescriptionCount') return [value, 'Prescriptions'];
                      if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey="prescriptionCount" 
                    name="Prescription Count"
                    fill={COLORS.info}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {dashboardData?.visualizations.topMedicines?.map((medicine, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{index + 1}.</span>
                    <span className="text-gray-700">{medicine.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{medicine.prescriptionCount} prescriptions</span>
                    <span className="text-sm text-gray-500">{medicine.totalQuantity} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Notifications & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {dashboardData?.notifications && dashboardData.notifications.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {dashboardData.notifications.length} new
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {dashboardData?.notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notification.priority === 'critical' ? 'border-red-500 bg-red-50' :
                      notification.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        notification.priority === 'critical' ? 'bg-red-100' :
                        notification.priority === 'high' ? 'bg-orange-100' :
                        'bg-blue-100'
                      }`}>
                        <FaPrescriptionBottleAlt className={`h-4 w-4 ${
                          notification.priority === 'critical' ? 'text-red-600' :
                          notification.priority === 'high' ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{notification.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.notifications || dashboardData.notifications.length === 0) && (
                  <div className="text-center py-6">
                    <FiCheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">No new notifications</p>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                View All Notifications
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {dashboardData?.quickActions?.map((action) => (
                  <a
                    key={action.id}
                    href={action.action}
                    className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors mb-2">
                      {action.id === 1 && <FiPlusCircle className="h-6 w-6 text-blue-600" />}
                      {action.id === 2 && <FaPrescriptionBottleAlt className="h-6 w-6 text-blue-600" />}
                      {action.id === 3 && <FiShoppingBag className="h-6 w-6 text-blue-600" />}
                      {action.id === 4 && <FiBarChart className="h-6 w-6 text-blue-600" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Middle & Right Columns - Recent Activity & Low Stock */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="flex items-center space-x-2">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Administered">Administered</option>
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                  <button className="p-2 border rounded-lg hover:bg-gray-50">
                    <FiFilter className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardData?.recentActivity
                  ?.filter(activity => filterStatus === 'all' || activity.status === filterStatus)
                  .slice(0, 6)
                  .map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FiUser className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.patientName}</p>
                          <p className="text-sm text-gray-600">
                            Prescribed by Dr. {activity.doctorName} • {activity.medicineCount} medicines
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          activity.status === 'Administered' ? 'bg-green-100 text-green-800' :
                          activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                        </span>
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <FiEye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <button className="w-full mt-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                View All Activities
              </button>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
                <span className="text-sm text-gray-600">
                  {dashboardData?.lowStockItems?.length || 0} items need attention
                </span>
              </div>
              {dashboardData?.lowStockItems && dashboardData.lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.lowStockItems.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          item.urgency === 'Critical' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <FiAlertTriangle className={`h-5 w-5 ${
                            item.urgency === 'Critical' ? 'text-red-600' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.category} • {item.currentStock} {item.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.urgency === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.urgency}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800">
                          <FiEye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-600">All medicines are well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance & Revenue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
            <div className="space-y-6">
              {dashboardData?.performanceMetrics && Object.entries(dashboardData.performanceMetrics).map(([key, metric]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${
                        key === 'processingTime' ? 'bg-blue-100' :
                        key === 'inventoryAccuracy' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {key === 'processingTime' && <FiClock className="h-5 w-5 text-blue-600" />}
                        {key === 'inventoryAccuracy' && <FiCheckCircle className="h-5 w-5 text-green-600" />}
                        {key === 'customerSatisfaction' && <FiActivity className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {key === 'processingTime' ? 'Prescription Processing Time' :
                           key === 'inventoryAccuracy' ? 'Inventory Accuracy' :
                           'Customer Satisfaction'}
                        </p>
                        <p className="text-sm text-gray-600">{metric.description}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.trend === 'up' ? 'bg-green-600' :
                        metric.trend === 'stable' ? 'bg-blue-600' :
                        'bg-red-600'
                      }`}
                      style={{ 
                        width: key === 'customerSatisfaction' ? '96%' :
                               key === 'inventoryAccuracy' ? '98.5%' :
                               '90%'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Summary</h3>
            <div className="space-y-6">
              {[
                {
                  label: "Today's Revenue",
                  value: formatCurrency(dashboardData?.revenueSummary?.today || 0),
                  trend: dashboardData?.revenueSummary?.growth || '0%',
                  icon: FaMoneyBillWave,
                  color: 'blue'
                },
                {
                  label: "Weekly Average",
                  value: formatCurrency(dashboardData?.revenueSummary?.weeklyAverage || 0),
                  trend: '+8.2%',
                  icon: FaChartLine,
                  color: 'green'
                },
                {
                  label: "Monthly Projection",
                  value: formatCurrency(dashboardData?.revenueSummary?.monthlyProjection || 0),
                  trend: '+15.3%',
                  icon: FaRegCalendarCheck,
                  color: 'purple'
                }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                        <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                      </div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <FiTrendingUp className="h-4 w-4 mr-1" />
                        {item.trend} Growth
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Retention Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {dashboardData?.revenueSummary?.retention || '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
            <div className="space-y-4">
              {dashboardData?.systemStatus && Object.entries(dashboardData.systemStatus).map(([key, status]) => {
                if (key === 'lastUpdated') return null;
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {key === 'database' && <FaDatabase className="h-5 w-5 text-blue-500" />}
                      {key === 'apiServices' && <FaServer className="h-5 w-5 text-green-500" />}
                      {key === 'paymentGateway' && <FaCreditCard className="h-5 w-5 text-purple-500" />}
                      {key === 'inventorySync' && <FaSync className="h-5 w-5 text-blue-500" />}
                      <span className="font-medium text-gray-900">
                        {key === 'database' ? 'Database' :
                         key === 'apiServices' ? 'API Services' :
                         key === 'paymentGateway' ? 'Payment Gateway' :
                         'Inventory Sync'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      status === 'Online' || status === 'Operational' || status === 'Connected'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Last updated: {dashboardData?.systemStatus?.lastUpdated || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;