import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Receipt,
  DollarSign,
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
  Shield,
  Lock,
  QrCode,
  Smartphone,
  Building,
  Wallet,
  Pill,
  Activity,
  Stethoscope,
  Package,
  Percent,
  FileInvoice
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { BASE_URL } from '../../api/api';

// Color palettes
const COLORS = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
  processing: '#8b5cf6',
  primary: '#059669',
  secondary: '#3b82f6',
  background: '#f8fafc',
  medicine: '#8b5cf6',
  consultation: '#3b82f6',
  service: '#f59e0b',
  tax: '#ef4444'
};

const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Credit Card', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'debit_card', name: 'Debit Card', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'net_banking', name: 'Net Banking', icon: <Building className="w-5 h-5" /> },
  { id: 'upi', name: 'UPI', icon: <QrCode className="w-5 h-5" /> },
  { id: 'wallet', name: 'Digital Wallet', icon: <Wallet className="w-5 h-5" /> }
];

const PatientBilling = () => {
  const [activeTab, setActiveTab] = useState('bills');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bills: [],
    summary: {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      totalBills: 0,
      paidBills: 0,
      pendingBills: 0
    },
    trends: []
  });
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    sort: 'date_desc',
    search: ''
  });
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const navigate = useNavigate();

  // Set up axios interceptor
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
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
  }, [navigate]);

  // Fetch billing data
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${BASE_URL}/patients/bills`);
      if (response.data.success) {
        setData({
          bills: response.data.data || [],
          summary: response.data.summary || {
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            totalBills: 0,
            paidBills: 0,
            pendingBills: 0
          }
        });
        generateTrendsData(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch billing data');
      console.error('Billing data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendsData = (bills) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trends = months.map(month => ({
      month,
      paid: Math.floor(Math.random() * 5000) + 2000,
      pending: Math.floor(Math.random() * 3000) + 1000,
      total: Math.floor(Math.random() * 8000) + 3000
    }));
    setData(prev => ({ ...prev, trends }));
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleViewBill = async (bill) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/patients/bills/${bill._id}`);
      if (response.data.success) {
        setSelectedBill(response.data.data);
        setShowBillModal(true);
      }
    } catch (err) {
      setError('Failed to fetch bill details');
      console.error('Bill details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (bill) => {
    setSelectedBill(bill);
    setPaymentStep(0);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (paymentStep === 0) {
      setPaymentStep(1);
    } else {
      try {
        const response = await axios.post(`${BASE_URL}/patients/bills/${selectedBill._id}/pay`, {
          paymentMethod,
          transactionId: `TXN${Date.now()}`,
          cardDetails: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? cardDetails : undefined
        });
        
        if (response.data.success) {
          alert('Payment successful!');
          fetchBillingData();
          setShowPaymentModal(false);
          setSelectedBill(null);
          setPaymentStep(0);
          setCardDetails({
            number: '',
            name: '',
            expiry: '',
            cvv: ''
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Payment failed. Please try again.');
      }
    }
  };

  const handleDownloadBill = async (billId) => {
    try {
      setGeneratingPDF(true);
      const response = await axios.get(`${BASE_URL}/patients/bills/${billId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setGeneratingPDF(false);
    } catch (err) {
      setError('Failed to download bill');
      console.error('Download error:', err);
      setGeneratingPDF(false);
    }
  };

  const filteredBills = data.bills.filter(bill => {
    if (filters.status !== 'all' && bill.paymentStatus !== filters.status) {
      return false;
    }
    
    if (filters.search) {
      const query = filters.search.toLowerCase();
      return (
        bill._id.toLowerCase().includes(query) ||
        (bill.prescriptionId?._id?.toLowerCase().includes(query)) ||
        bill.amount.toString().includes(query)
      );
    }
    
    return true;
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'date_desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date_asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillType = (bill) => {
    if (bill.prescriptionId) return 'Medicines';
    if (bill.appointmentId) return 'Consultation';
    return 'Medical Services';
  };

  const statCards = [
    {
      title: 'Total Bills',
      value: data.summary.totalBills,
      icon: <Receipt className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-500',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Amount',
      value: formatCurrency(data.summary.totalAmount),
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Paid Amount',
      value: formatCurrency(data.summary.paidAmount),
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(data.summary.pendingAmount),
      icon: <Clock className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-500',
      trend: '-5%',
      trendUp: false
    }
  ];

  const paymentStatusData = [
    { name: 'Paid', value: data.summary.paidBills || 0, color: COLORS.paid },
    { name: 'Pending', value: data.summary.pendingBills || 0, color: COLORS.pending }
  ];

  const calculateBreakdown = (bill) => {
    if (!bill.breakdown) return null;
    
    return [
      { name: 'Medicines', value: bill.breakdown.medicines || 0, color: COLORS.medicine },
      { name: 'Consultation', value: bill.breakdown.consultation || 0, color: COLORS.consultation },
      { name: 'Service', value: bill.breakdown.serviceCharge || 0, color: COLORS.service },
      { name: 'Tax', value: bill.breakdown.tax || 0, color: COLORS.tax }
    ].filter(item => item.value > 0);
  };

  if (loading && !selectedBill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading billing information...</p>
        </div>
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
              Billing & Payments
            </h1>
            <p className="text-emerald-600 mt-2">
              Manage your medical bills and payments with complete transparency
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Export feature coming soon')}
              className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Statements
            </button>
            <button
              onClick={fetchBillingData}
              className="p-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-emerald-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.trendUp ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-emerald-200 pb-2">
          {[
            { id: 'bills', label: 'All Bills', icon: <Receipt className="w-4 h-4" /> },
            { id: 'payment', label: 'Make Payment', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'history', label: 'Payment History', icon: <Clock className="w-4 h-4" /> },
            { id: 'analytics', label: 'Financial Analytics', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* All Bills Tab */}
        {activeTab === 'bills' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow border border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bills..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="date_desc">Date (Newest)</option>
                    <option value="date_asc">Date (Oldest)</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setFilters({ status: 'all', sort: 'date_desc', search: '' })}
                className="mt-4 px-4 py-2 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </button>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-2xl shadow border border-emerald-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bill ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Receipt className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No bills found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill._id} className="hover:bg-emerald-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">
                              BILL-{bill._id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getBillType(bill) === 'Medicines' ? (
                                <Pill className="w-4 h-4 text-purple-500" />
                              ) : getBillType(bill) === 'Consultation' ? (
                                <Stethoscope className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Activity className="w-4 h-4 text-emerald-500" />
                              )}
                              <span className="text-sm text-gray-900">{getBillType(bill)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{formatDate(bill.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(bill.amount)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(bill.paymentStatus)}`}>
                              {bill.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewBill(bill)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {bill.paymentStatus === 'Pending' && (
                                <button
                                  onClick={() => handleMakePayment(bill)}
                                  className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                                  title="Make Payment"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadBill(bill._id)}
                                disabled={generatingPDF}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Download Invoice"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Make Payment Tab */}
        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Bill to Pay</h3>
                <div className="space-y-3">
                  {data.bills
                    .filter(bill => bill.paymentStatus === 'Pending')
                    .map((bill) => (
                      <div
                        key={bill._id}
                        onClick={() => setSelectedBill(bill)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                          selectedBill?._id === bill._id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selectedBill?._id === bill._id
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedBill?._id === bill._id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                BILL-{bill._id.slice(-8)}
                              </p>
                              <p className="text-sm text-gray-600">{getBillType(bill)}</p>
                              {bill.medicineDetails && bill.medicineDetails.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {bill.medicineDetails.length} medicine(s)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(bill.amount)}</p>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor('Pending')}`}>
                              Pending
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Issued: {formatDate(bill.createdAt)}
                        </div>
                      </div>
                    ))}
                  
                  {data.bills.filter(b => b.paymentStatus === 'Pending').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-gray-600">No pending bills to pay</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
                
                {selectedBill ? (
                  <>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bill ID:</span>
                        <span className="font-medium">BILL-{selectedBill._id?.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{formatDate(selectedBill.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span>{getBillType(selectedBill)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedBill.amount)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMakePayment(selectedBill)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      Pay Now
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Secure payment processed via PCI DSS compliant gateway
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                    <p className="text-gray-600">Please select a bill to proceed with payment</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bill #</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.bills
                        .filter(bill => bill.paymentStatus === 'Paid' && bill.paymentDate)
                        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                        .map((bill) => (
                          <tr key={bill._id} className="hover:bg-emerald-50">
                            <td className="px-6 py-4">
                              BILL-{bill._id.slice(-8)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{formatDate(bill.paymentDate)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 text-xs font-medium border border-emerald-300 text-emerald-700 rounded-full">
                                {bill.paymentMethod || 'Online'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">{formatCurrency(bill.amount)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-xs font-mono text-gray-700">
                                {bill.transactionId || `TXN-${bill._id.slice(-8)}`}
                              </code>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {data.bills.filter(b => b.paymentStatus === 'Paid').length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">No payment history found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {data.summary.paidBills || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Total Paid</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatCurrency(data.summary.paidAmount || 0)}
                    </p>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-700 mb-3">Payment Methods Used</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Credit Card', value: 45, color: COLORS.primary },
                          { name: 'Debit Card', value: 25, color: COLORS.secondary },
                          { name: 'Net Banking', value: 15, color: COLORS.processing },
                          { name: 'UPI', value: 10, color: COLORS.pending },
                          { name: 'Wallet', value: 5, color: COLORS.overdue }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Credit Card', value: 45, color: COLORS.primary },
                          { name: 'Debit Card', value: 25, color: COLORS.secondary },
                          { name: 'Net Banking', value: 15, color: COLORS.processing },
                          { name: 'UPI', value: 10, color: COLORS.pending },
                          { name: 'Wallet', value: 5, color: COLORS.overdue }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Billing Trends (Last 6 Months)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <RechartsTooltip 
                          formatter={(value) => [formatCurrency(value), 'Amount']}
                          contentStyle={{ 
                            borderRadius: '0.75rem', 
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          name="Total Billing"
                          stroke={COLORS.primary} 
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="paid" 
                          name="Paid Amount"
                          stroke={COLORS.paid} 
                          fill={COLORS.paid}
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="pending" 
                          name="Pending Amount"
                          stroke={COLORS.pending} 
                          fill={COLORS.pending}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Status Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentStatusData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentStatusData.filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow border border-emerald-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Billing Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="paid" 
                      name="Paid" 
                      fill={COLORS.paid} 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="pending" 
                      name="Pending" 
                      fill={COLORS.pending} 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Bill Details</h3>
              <button
                onClick={() => setShowBillModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Patient Information */}
              {selectedBill.patientId?.userId && (
                <div className="mb-8 p-4 bg-emerald-50 rounded-xl">
                  <h4 className="font-semibold text-emerald-800 mb-2">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedBill.patientId.userId.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedBill.patientId.userId.email}</p>
                    </div>
                    {selectedBill.patientId.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedBill.patientId.phone}</p>
                      </div>
                    )}
                    {selectedBill.patientId.age && (
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-medium">{selectedBill.patientId.age}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Bill Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill ID:</span>
                      <span className="font-medium">BILL-{selectedBill._id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span>{formatDate(selectedBill.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{getBillType(selectedBill)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBill.paymentStatus)}`}>
                        {selectedBill.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedBill.paymentDate && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Payment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Date:</span>
                        <span>{formatDate(selectedBill.paymentDate)}</span>
                      </div>
                      {selectedBill.paymentMethod && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span>{selectedBill.paymentMethod}</span>
                        </div>
                      )}
                      {selectedBill.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <code className="text-sm font-mono">{selectedBill.transactionId}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Doctor Information */}
              {selectedBill.appointmentId?.doctorId?.userId && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">Doctor Information</h4>
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Dr. {selectedBill.appointmentId.doctorId.userId.name}</p>
                      <p className="text-sm text-gray-600">{selectedBill.appointmentId.doctorId.specialization}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Medicine Details */}
              {selectedBill.medicineDetails && selectedBill.medicineDetails.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-800 mb-3">Medicine Details</h4>
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Medicine Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dosage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBill.medicineDetails.map((medicine, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-purple-500" />
                                <span>{medicine.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">{medicine.dosage}</td>
                            <td className="px-4 py-3">{medicine.quantity} {medicine.unit}</td>
                            <td className="px-4 py-3">{formatCurrency(medicine.unitPrice)}</td>
                            <td className="px-4 py-3 font-medium">{formatCurrency(medicine.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              {/* Bill Breakdown */}
              {selectedBill.breakdown && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Bill Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Medicines:</span>
                          <span>{formatCurrency(selectedBill.breakdown.medicines || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Consultation:</span>
                          <span>{formatCurrency(selectedBill.breakdown.consultation || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Charge:</span>
                          <span>{formatCurrency(selectedBill.breakdown.serviceCharge || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax (18%):</span>
                          <span>{formatCurrency(selectedBill.breakdown.tax || 0)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span className="text-gray-800">Grand Total:</span>
                            <span className="text-emerald-600 text-lg">
                              {formatCurrency(selectedBill.breakdown.grandTotal || selectedBill.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={calculateBreakdown(selectedBill)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {calculateBreakdown(selectedBill)?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value) => [formatCurrency(value), 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                className="px-4 py-2 text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 flex items-center gap-2"
                onClick={() => handleDownloadBill(selectedBill._id)}
                disabled={generatingPDF}
              >
                <Download className="w-4 h-4" />
                {generatingPDF ? 'Generating PDF...' : 'Download Invoice'}
              </button>
              <div className="flex items-center gap-3">
                {selectedBill.paymentStatus === 'Pending' && (
                  <button
                    onClick={() => {
                      setShowBillModal(false);
                      handleMakePayment(selectedBill);
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Make Payment
                  </button>
                )}
                <button
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {paymentStep === 0 ? 'Select Payment Method' : 'Enter Payment Details'}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    paymentStep >= 0 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`h-1 w-12 ${
                    paymentStep >= 1 ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    paymentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>
              
              {paymentStep === 0 ? (
                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Select your preferred payment method</h4>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            {method.icon}
                          </div>
                          <span className="font-medium">{method.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Enter your payment details</h4>
                  
                  {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Payment Amount:</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(selectedBill.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              {paymentStep === 1 && (
                <button
                  onClick={() => setPaymentStep(0)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Back
                </button>
              )}
              <button
                onClick={handlePaymentSubmit}
                disabled={paymentStep === 1 && paymentMethod === 'credit_card' && 
                  (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentStep === 0 ? 'Next' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientBilling;