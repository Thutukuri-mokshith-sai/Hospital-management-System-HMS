// BillingReports.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Printer,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Users,
  Package,
  ShoppingCart,
  FileText,
  MoreVertical,
  Plus,
  CreditCard,
  Wallet ,
  Smartphone,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Filter as FilterIcon,
  Settings
} from 'lucide-react';
import { 
  BarChart, Bar, 
  LineChart as RechartsLine, Line, 
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart, Scatter, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { toast } from 'react-hot-toast';
import { format, parseISO, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { BASE_URL } from '../../api/api';
const BillingReports = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('month');
  const [reportPeriod, setReportPeriod] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'reports'
  const [exportFormat, setExportFormat] = useState('pdf');

  const token = localStorage.getItem('token');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [billsRes, salesRes, inventoryRes] = await Promise.all([
        fetch(`${BASE_URL}/pharmacist/reports/sales?period=${reportPeriod}`, { headers }),
        fetch(`${BASE_URL}/pharmacist/bills?page=${currentPage}&limit=${itemsPerPage}`, { headers }),
        fetch(`${BASE_URL}/pharmacist/reports/inventory`, { headers })
      ]);

      if (!billsRes.ok) throw new Error('Failed to fetch bills');

      const billsData = await billsRes.json();
      const salesData = await salesRes.json();
      const inventoryData = await inventoryRes.json();

      setBills(billsData.data);
      setFilteredBills(billsData.data);
      setSalesReport(salesData.data);
      setInventoryReport(inventoryData.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage, reportPeriod]);

  // Fetch single bill details
  const fetchBillDetails = async (billId) => {
    setLoadingReport(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/bills/${billId}`, { headers });
      
      if (!response.ok) throw new Error('Failed to fetch bill details');
      
      const data = await response.json();
      setSelectedBill(data.data);
      setShowBillModal(true);
      
    } catch (error) {
      console.error('Error fetching bill details:', error);
      toast.error('Failed to load bill details');
    } finally {
      setLoadingReport(false);
    }
  };

  // Create new bill
  const createBill = async (billData) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/bills`, {
        method: 'POST',
        headers,
        body: JSON.stringify(billData)
      });
      
      if (!response.ok) throw new Error('Failed to create bill');
      
      const data = await response.json();
      toast.success('Bill created successfully!');
      setShowCreateBillModal(false);
      fetchData();
      
      return data;
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
      throw error;
    }
  };

  // Update payment status
  const updatePaymentStatus = async (billId, status, paymentMethod) => {
    setUpdatingPayment(billId);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/bills/${billId}/payment`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status,
          paymentMethod,
          transactionId: `TXN-${Date.now()}`
        })
      });
      
      if (!response.ok) throw new Error('Failed to update payment status');
      
      const data = await response.json();
      toast.success(`Payment marked as ${status}`);
      
      // Update local state
      setBills(prev => prev.map(bill => 
        bill._id === billId ? { ...bill, paymentStatus: status } : bill
      ));
      
      if (selectedBill?.bill?._id === billId) {
        fetchBillDetails(billId);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
      throw error;
    } finally {
      setUpdatingPayment(null);
    }
  };

  // Filter bills based on search and filters
  const filterBills = useCallback(() => {
    let filtered = [...bills];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.paymentStatus === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(bill => 
          new Date(bill.createdAt) >= startDate
        );
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bill => {
        const patientName = bill.patientId?.userId?.name?.toLowerCase() || '';
        const billId = bill._id?.toLowerCase() || '';
        const prescriptionId = bill.prescriptionId?._id?.toLowerCase() || '';
        
        return (
          patientName.includes(term) ||
          billId.includes(term) ||
          prescriptionId.includes(term)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortField === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      return sortOrder === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setFilteredBills(filtered);
  }, [bills, statusFilter, dateFilter, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    filterBills();
  }, [filterBills]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExport = async (type) => {
    try {
      let url = '';
      let filename = '';
      
      switch (type) {
        case 'sales':
          url = `${BASE_URL}/pharmacist/reports/sales?period=${reportPeriod}&format=${exportFormat}`;
          filename = `sales-report-${reportPeriod}-${format(new Date(), 'yyyy-MM-dd')}`;
          break;
        case 'inventory':
          url = `${BASE_URL}/pharmacist/reports/inventory?format=${exportFormat}`;
          filename = `inventory-report-${format(new Date(), 'yyyy-MM-dd')}`;
          break;
        case 'bills':
          url = `${BASE_URL}/pharmacist/bills/export?format=${exportFormat}`;
          filename = `bills-${format(new Date(), 'yyyy-MM-dd')}`;
          break;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(url, { headers });
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filename}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${type} report successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(parseISO(date), 'MMM dd, yyyy');
  };

  const formatDateTime = (date) => {
    return format(parseISO(date), 'PPpp');
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const getStatusInfo = (status) => {
      switch (status.toLowerCase()) {
        case 'paid':
          return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' };
        case 'pending':
          return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' };
        case 'cancelled':
          return { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' };
        default:
          return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Unknown' };
      }
    };

    const { color, icon: Icon, label } = getStatusInfo(status);
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // Payment Method Badge
  const PaymentMethodBadge = ({ method }) => {
    const getMethodInfo = (method) => {
      switch (method?.toLowerCase()) {
        case 'cash':
          return { color: 'bg-green-100 text-green-800', icon: Wallet  };
        case 'card':
          return { color: 'bg-blue-100 text-blue-800', icon: CreditCard };
        case 'online':
          return { color: 'bg-purple-100 text-purple-800', icon: Smartphone };
        default:
          return { color: 'bg-gray-100 text-gray-800', icon: CreditCard };
      }
    };

    const { color, icon: Icon } = getMethodInfo(method);
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${color}`}>
        <Icon className="w-3 h-3" />
        {method || 'Unknown'}
      </span>
    );
  };

  // Bill Card Component
  const BillCard = ({ bill }) => {
    const patientName = bill.patientId?.userId?.name || 'Unknown Patient';
    const prescriptionId = bill.prescriptionId?._id?.slice(-6) || 'N/A';
    const date = formatDate(bill.createdAt);
    const amount = formatCurrency(bill.amount);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bill #{bill._id?.slice(-8)}</h3>
                  <p className="text-sm text-gray-500">{date}</p>
                </div>
              </div>
              <StatusBadge status={bill.paymentStatus} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{patientName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescription</p>
                <p className="font-medium text-gray-900 mt-1">#{prescriptionId}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-bold text-gray-900">{amount}</span>
                </div>
                {bill.paymentMethod && (
                  <PaymentMethodBadge method={bill.paymentMethod} />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchBillDetails(bill._id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                {bill.paymentStatus === 'Pending' && (
                  <button
                    onClick={() => updatePaymentStatus(bill._id, 'Paid', 'Cash')}
                    disabled={updatingPayment === bill._id}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    {updatingPayment === bill._id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Mark Paid
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sales Chart Component
  const SalesChart = () => {
    const salesData = salesReport?.salesData || [];
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <p className="text-sm text-gray-500">Revenue over {reportPeriod}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="custom">Custom</option>
            </select>
            <button
              onClick={() => handleExport('sales')}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="_id" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (reportPeriod === 'today') return format(new Date(value), 'HH:mm');
                  if (reportPeriod === 'week') return format(new Date(value), 'EEE');
                  return format(new Date(value), 'MMM dd');
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="totalAmount" 
                name="Revenue" 
                stroke="#3B82F6" 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="billCount" 
                name="Bills" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(salesReport?.salesSummary?.totalRevenue || 0)}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(salesReport?.salesSummary?.paidRevenue || 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatCurrency(salesReport?.salesSummary?.pendingRevenue || 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Bills</p>
            <p className="text-xl font-bold text-purple-600">
              {salesReport?.salesSummary?.totalBills || 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Inventory Chart Component
  const InventoryChart = () => {
    const stockLevels = inventoryReport?.stockLevels || {};
    const criticalCount = stockLevels.critical?.length || 0;
    const lowCount = stockLevels.low?.length || 0;
    const normalCount = stockLevels.normal?.length || 0;
    const highCount = stockLevels.high?.length || 0;
    
    const stockData = [
      { name: 'Critical', value: criticalCount, color: '#EF4444' },
      { name: 'Low', value: lowCount, color: '#F59E0B' },
      { name: 'Normal', value: normalCount, color: '#10B981' },
      { name: 'High', value: highCount, color: '#3B82F6' }
    ];
    
    const topMedicines = salesReport?.topMedicines || [];
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Analytics</h3>
            <p className="text-sm text-gray-500">Stock levels and top-selling medicines</p>
          </div>
          <button
            onClick={() => handleExport('inventory')}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Stock Levels Pie Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Stock Level Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} medicines`, 'Count']} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Medicines Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Top Selling Medicines</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topMedicines.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="_id" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                      return [`${value} units`, 'Quantity'];
                    }}
                  />
                  <Bar 
                    dataKey="totalQuantity" 
                    name="Quantity Sold" 
                    fill="#8B5CF6" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Stock</p>
                <p className="text-xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Value</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(inventoryReport?.summary?.totalValue || 0)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-xl font-bold text-green-600">
                  {inventoryReport?.summary?.totalMedicines || 0}
                </p>
              </div>
              <Package className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Revenue Breakdown Chart
  const RevenueBreakdownChart = () => {
    const revenueByStatus = salesReport?.revenueByStatus || [];
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Breakdown</h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
              <Legend />
              <Bar 
                dataKey="totalAmount" 
                name="Total Amount" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="billCount" 
                name="Bill Count" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          {revenueByStatus.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(item.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">{item._id} Revenue</p>
              <p className="text-xs text-gray-500">{item.billCount} bills</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bill Details Modal
  const BillDetailsModal = () => {
    if (!selectedBill || !showBillModal) return null;

    const bill = selectedBill.bill;
    const prescription = selectedBill.prescription;
    const patient = selectedBill.patient;
    const billItems = bill.billItems || [];
    const totalItems = billItems.length;
    const totalAmount = bill.amount;
    const originalAmount = bill.originalAmount || totalAmount;
    const discountAmount = bill.discountAmount || 0;
    const discountPercentage = bill.discount || 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bill Details</h2>
                <p className="text-gray-600">
                  #{bill._id?.slice(-8)} • {formatDateTime(bill.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Print"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowBillModal(false);
                    setSelectedBill(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="space-y-6">
              {/* Bill Summary */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Bill Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={bill.paymentStatus} />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-2xl font-bold text-purple-600">{totalItems}</p>
                </div>
              </div>

              {/* Patient & Payment Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="font-medium">{patient?.userId?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Age / Gender</span>
                      <span className="font-medium">
                        {patient?.age || 'N/A'} / {patient?.gender || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Contact</span>
                      <span className="font-medium">{patient?.userId?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <StatusBadge status={bill.paymentStatus} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Method</span>
                      <PaymentMethodBadge method={bill.paymentMethod} />
                    </div>
                    {bill.paymentDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Paid On</span>
                        <span className="font-medium">{formatDate(bill.paymentDate)}</span>
                      </div>
                    )}
                    {bill.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transaction ID</span>
                        <span className="font-medium text-sm">{bill.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bill Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Bill Items</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medicine
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {billItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.medicineName}</p>
                              <p className="text-xs text-gray-500">{item.unit}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-900">{item.quantity}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-900">{formatCurrency(item.unitPrice)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(originalAmount)}</span>
                      </div>
                      {discountPercentage > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Discount ({discountPercentage}%)</span>
                            <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription Link */}
              {prescription && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Linked Prescription</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{prescription._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-500">
                        Created on {formatDate(prescription.createdAt)}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      View Prescription
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Generated by: {bill.generatedBy?.name || 'System'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {bill.paymentStatus === 'Pending' && (
                  <button
                    onClick={() => updatePaymentStatus(bill._id, 'Paid', 'Cash')}
                    disabled={updatingPayment === bill._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {updatingPayment === bill._id ? 'Updating...' : 'Mark as Paid'}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create Bill Modal
  const CreateBillModal = () => {
    const [formData, setFormData] = useState({
      prescriptionId: '',
      patientId: '',
      discount: 0,
      notes: '',
      paymentMethod: 'Cash'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await createBill(formData);
        setShowCreateBillModal(false);
        setFormData({
          prescriptionId: '',
          patientId: '',
          discount: 0,
          notes: '',
          paymentMethod: 'Cash'
        });
      } catch (error) {
        console.error('Error creating bill:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Bill</h2>
              <button
                onClick={() => setShowCreateBillModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.prescriptionId}
                  onChange={(e) => setFormData({ ...formData, prescriptionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter prescription ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateBillModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Create Bill
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <DollarSign className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-900">Loading Billing & Reports</p>
          <p className="text-sm text-gray-500 mt-2">Fetching financial data from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Billing & Reports</h1>
            <p className="text-gray-600 mt-2">Manage pharmacy bills and generate financial reports</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bills by patient, bill ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-6 w-fit">
          {['billing', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          {/* Status Filter */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'paid', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          {/* Date Filter */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'today', 'week', 'month', 'quarter'].map((date) => (
              <button
                key={date}
                onClick={() => setDateFilter(date)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  dateFilter === date
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Billing Tab Content */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(salesReport?.salesSummary?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Bills</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(salesReport?.salesSummary?.pendingRevenue || 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bills</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {salesReport?.salesSummary?.totalBills || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Bill Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(
                      salesReport?.salesSummary?.totalBills 
                        ? salesReport.salesSummary.totalRevenue / salesReport.salesSummary.totalBills 
                        : 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Bills List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bills</h3>
                  <p className="text-sm text-gray-500">{filteredBills.length} bills found</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExport('bills')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowCreateBillModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    New Bill
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <BillCard key={bill._id} bill={bill} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No bills found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? 'Try a different search term' : 'Create your first bill'}
                  </p>
                  <button
                    onClick={() => setShowCreateBillModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create New Bill
                  </button>
                </div>
              )}
            </div>
            
            {filteredBills.length > 0 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length} bills
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= filteredBills.length}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <SalesChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryChart />
            <RevenueBreakdownChart />
          </div>
          
          {/* Detailed Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detailed Reports</h3>
                <p className="text-sm text-gray-500">Export comprehensive pharmacy reports</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleExport('sales')}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Sales Report</h4>
                    <p className="text-sm text-gray-500 mt-1">Daily/Monthly revenue analysis</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('inventory')}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Inventory Report</h4>
                    <p className="text-sm text-gray-500 mt-1">Stock levels and usage</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('bills')}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Bills Report</h4>
                    <p className="text-sm text-gray-500 mt-1">Complete billing history</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBillModal && <BillDetailsModal />}
      {showCreateBillModal && <CreateBillModal />}
    </div>
  );
};

export default BillingReports;