// MedicineInventory.jsx - Complete Fixed Version
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Plus, 
  Edit,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  ShoppingCart,
  DollarSign,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Settings,
  ShoppingBag,
  PackagePlus,
  AlertTriangle,
  Activity,
  Grid,
  List,
  Filter as FilterIcon,
  Check,
  X,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, 
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

import { BASE_URL } from '../../api/api';
const MedicineInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState('grid');
  const [categories, setCategories] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [usageStats, setUsageStats] = useState([]);

  const token = localStorage.getItem('token');

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/medicines?page=${currentPage}&limit=${itemsPerPage}`, { headers });
      
      if (!response.ok) throw new Error('Failed to fetch medicines');
      
      const data = await response.json();
      setMedicines(data.data);
      setFilteredMedicines(data.data);
      
      const uniqueCategories = [...new Set(data.data.map(med => med.category).filter(Boolean))];
      setCategories(['all', ...uniqueCategories]);
      
      const stats = calculateUsageStats(data.data);
      setUsageStats(stats);
      
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage]);

  const searchMedicines = async (query) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/medicines/search?query=${query}`, { headers });
      
      if (!response.ok) throw new Error('Failed to search medicines');
      
      const data = await response.json();
      setFilteredMedicines(data.data);
      
    } catch (error) {
      console.error('Error searching medicines:', error);
      toast.error('Failed to search medicines');
    }
  };

  const updateStock = async (medicineId, operation, quantity, reason) => {
    setUpdatingStock(medicineId);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/medicines/${medicineId}/stock`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ operation, quantity, reason })
      });
      
      if (!response.ok) throw new Error('Failed to update stock');
      
      const data = await response.json();
      toast.success(`Stock updated successfully (${operation}: ${quantity})`);
      
      setMedicines(prev => prev.map(med => 
        med._id === medicineId 
          ? { ...med, stockQuantity: data.data.medicine.currentStock }
          : med
      ));
      
      filterMedicines();
      
      setStockHistory(prev => [{
        ...data.data.transaction,
        timestamp: new Date()
      }, ...prev]);
      
      return data;
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
      throw error;
    } finally {
      setUpdatingStock(null);
    }
  };

  const addMedicine = async (medicineData) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${BASE_URL}/pharmacist/medicines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(medicineData)
      });
      
      if (!response.ok) throw new Error('Failed to add medicine');
      
      const data = await response.json();
      toast.success('Medicine added successfully!');
      setShowAddMedicineModal(false);
      fetchMedicines();
      
      return data;
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
      throw error;
    }
  };

  const calculateUsageStats = (medicinesData) => {
    return medicinesData.map(medicine => {
      const usage = medicine.usage || {};
      const prescriptionCount = usage.prescriptionCount || 0;
      const pendingPrescriptions = usage.pendingPrescriptions || 0;
      const stockQuantity = medicine.stockQuantity || 0;
      
      const avgDailyUsage = prescriptionCount / 30;
      const daysOfSupply = avgDailyUsage > 0 ? Math.round(stockQuantity / avgDailyUsage) : 0;
      
      let reorderUrgency = 'low';
      if (daysOfSupply < 7) reorderUrgency = 'critical';
      else if (daysOfSupply < 14) reorderUrgency = 'high';
      else if (daysOfSupply < 30) reorderUrgency = 'medium';
      
      return {
        ...medicine,
        daysOfSupply,
        reorderUrgency,
        inDemand: usage.inDemand || false
      };
    });
  };

  const filterMedicines = useCallback(() => {
    let filtered = [...medicines];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(med => med.category === categoryFilter);
    }

    switch (stockFilter) {
      case 'critical':
        filtered = filtered.filter(med => med.stockQuantity < 10);
        break;
      case 'low':
        filtered = filtered.filter(med => med.stockQuantity >= 10 && med.stockQuantity < 30);
        break;
      case 'normal':
        filtered = filtered.filter(med => med.stockQuantity >= 30 && med.stockQuantity < 100);
        break;
      case 'high':
        filtered = filtered.filter(med => med.stockQuantity >= 100);
        break;
      case 'outofstock':
        filtered = filtered.filter(med => med.stockQuantity === 0);
        break;
      default:
        break;
    }

    if (activeTab === 'lowstock') {
      filtered = filtered.filter(med => med.stockQuantity < 20);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(term) ||
        med.category?.toLowerCase().includes(term) ||
        med._id.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortField === 'stockQuantity' || sortField === 'price') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });

    setFilteredMedicines(filtered);
  }, [medicines, categoryFilter, stockFilter, activeTab, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    filterMedicines();
  }, [filterMedicines]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim().length >= 2) {
      searchMedicines(term);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBulkUpdate = async (operation, quantity) => {
    const selected = filteredMedicines.filter(med => med.stockQuantity < 30);
    
    for (const medicine of selected) {
      try {
        await updateStock(medicine._id, operation, quantity, 'Bulk restock');
      } catch (error) {
        console.error(`Failed to update ${medicine.name}:`, error);
      }
    }
    
    toast.success(`Updated ${selected.length} medicines`);
  };

  const handleExport = async (format = 'csv') => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${BASE_URL}/pharmacist/medicines/export?format=${format}`, { headers });
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `medicine-inventory-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Inventory exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory');
    }
  };

  const StockStatusBadge = ({ quantity, unit }) => {
    const getStatusInfo = (quantity) => {
      if (quantity === 0) {
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Out of Stock' };
      } else if (quantity < 10) {
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Critical' };
      } else if (quantity < 30) {
        return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Low' };
      } else if (quantity < 100) {
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Normal' };
      } else {
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'High' };
      }
    };

    const { color, icon: Icon, label } = getStatusInfo(quantity);
    
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="text-sm text-gray-600">
          {quantity} {unit}
        </span>
      </div>
    );
  };

  const DemandIndicator = ({ usage }) => {
    const prescriptionCount = usage?.prescriptionCount || 0;
    const pendingPrescriptions = usage?.pendingPrescriptions || 0;
    const inDemand = usage?.inDemand || false;
    
    if (prescriptionCount === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
          <Clock className="w-3 h-3" />
          No usage
        </span>
      );
    }
    
    if (inDemand) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
          <TrendingUp className="w-3 h-3" />
          High demand
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
        <TrendingDown className="w-3 h-3" />
        {prescriptionCount} prescriptions
      </span>
    );
  };

  const MedicineCard = ({ medicine }) => {
    const isCritical = medicine.stockQuantity < 10;
    const isLow = medicine.stockQuantity < 30 && medicine.stockQuantity >= 10;
    const daysOfSupply = medicine.daysOfSupply || 0;
    const reorderUrgency = medicine.reorderUrgency || 'low';
    
    return (
      <div className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${isCritical ? 'border-red-200' : isLow ? 'border-yellow-200' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100' : isLow ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              <Package className={`w-5 h-5 ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
              <p className="text-sm text-gray-500">{medicine.category || 'Uncategorized'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedMedicine(medicine);
              setShowUpdateStockModal(true);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Stock Level</span>
            <StockStatusBadge quantity={medicine.stockQuantity} unit={medicine.unit} />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price</span>
            <span className="font-medium text-gray-900">
              ${medicine.price} / {medicine.unit}
            </span>
          </div>
          
          {medicine.usage && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Demand</span>
              <DemandIndicator usage={medicine.usage} />
            </div>
          )}
          
          {daysOfSupply > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Supply Days</span>
              <span className={`text-sm font-medium ${daysOfSupply < 14 ? 'text-red-600' : daysOfSupply < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                {daysOfSupply} days
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between">
            <button
              onClick={() => {
                setSelectedMedicine(medicine);
                setShowMedicineModal(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Details
            </button>
            <button
              onClick={() => {
                setSelectedMedicine(medicine);
                setShowUpdateStockModal(true);
              }}
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Update Stock
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MedicineRow = ({ medicine, index }) => {
    const isCritical = medicine.stockQuantity < 10;
    const isLow = medicine.stockQuantity < 30 && medicine.stockQuantity >= 10;
    
    return (
      <tr className={`hover:bg-gray-50 ${isCritical ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100' : isLow ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              <Package className={`w-4 h-4 ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-blue-600'}`} />
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900">{medicine.name}</div>
              <div className="text-sm text-gray-500">{medicine.category || 'Uncategorized'}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StockStatusBadge quantity={medicine.stockQuantity} unit={medicine.unit} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">${medicine.price}</div>
          <div className="text-xs text-gray-500">per {medicine.unit}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <DemandIndicator usage={medicine.usage} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${(medicine.stockQuantity * medicine.price).toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedMedicine(medicine);
                setShowMedicineModal(true);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedMedicine(medicine);
                setShowUpdateStockModal(true);
              }}
              className="text-green-600 hover:text-green-900"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const SortableHeader = ({ label, field, currentField, currentOrder }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 uppercase tracking-wider"
    >
      {label}
      {currentField === field && (
        currentOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  const UpdateStockModal = () => {
    const [operation, setOperation] = useState('add');
    const [quantity, setQuantity] = useState(10);
    const [reason, setReason] = useState('Restock');

    if (!selectedMedicine || !showUpdateStockModal) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await updateStock(selectedMedicine._id, operation, quantity, reason);
        setShowUpdateStockModal(false);
        setSelectedMedicine(null);
      } catch (error) {
        console.error('Error updating stock:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
              <button
                onClick={() => {
                  setShowUpdateStockModal(false);
                  setSelectedMedicine(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mt-2">{selectedMedicine.name}</p>
            <p className="text-sm text-gray-500">Current stock: {selectedMedicine.stockQuantity} {selectedMedicine.unit}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['add', 'subtract', 'set'].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperation(op)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        operation === op
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {op === 'add' ? 'Add' : op === 'subtract' ? 'Subtract' : 'Set'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        quantity === qty
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Restock">Restock</option>
                  <option value="Dispensed">Dispensed</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Expired">Expired</option>
                  <option value="Audit">Audit Correction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  New stock will be: {
                    operation === 'add' ? selectedMedicine.stockQuantity + quantity :
                    operation === 'subtract' ? selectedMedicine.stockQuantity - quantity :
                    quantity
                  } {selectedMedicine.unit}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateStockModal(false);
                    setSelectedMedicine(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStock === selectedMedicine._id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingStock === selectedMedicine._id ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddMedicineModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: '',
      price: 0,
      stockQuantity: 0,
      unit: 'tablet',
      description: ''
    });

    if (!showAddMedicineModal) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await addMedicine(formData);
        setShowAddMedicineModal(false);
        setFormData({
          name: '',
          category: '',
          price: 0,
          stockQuantity: 0,
          unit: 'tablet',
          description: ''
        });
      } catch (error) {
        console.error('Error adding medicine:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Medicine</h2>
              <button
                onClick={() => setShowAddMedicineModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter medicine name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Antibiotic, Painkiller"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="ml">ML</option>
                  <option value="mg">MG</option>
                  <option value="g">Gram</option>
                  <option value="piece">Piece</option>
                  <option value="bottle">Bottle</option>
                  <option value="box">Box</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Add Medicine
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const MedicineDetailsModal = () => {
    if (!selectedMedicine || !showMedicineModal) return null;

    const medicine = selectedMedicine;
    const stockValue = medicine.stockQuantity * medicine.price;
    const daysOfSupply = medicine.daysOfSupply || 0;
    const reorderUrgency = medicine.reorderUrgency || 'low';
    const usage = medicine.usage || {};
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${medicine.stockQuantity < 10 ? 'bg-red-100' : medicine.stockQuantity < 30 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  <Package className={`w-6 h-6 ${medicine.stockQuantity < 10 ? 'text-red-600' : medicine.stockQuantity < 30 ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{medicine.name}</h2>
                  <p className="text-gray-600">{medicine.category || 'Uncategorized'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMedicineModal(false);
                  setSelectedMedicine(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Stock Information</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <div className="mt-2">
                        <StockStatusBadge quantity={medicine.stockQuantity} unit={medicine.unit} />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Stock Value</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        ${stockValue.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Days of Supply</p>
                      <div className={`text-2xl font-bold mt-2 ${daysOfSupply < 14 ? 'text-red-600' : daysOfSupply < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {daysOfSupply} days
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Reorder Urgency</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          reorderUrgency === 'critical' ? 'bg-red-100 text-red-800' :
                          reorderUrgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          reorderUrgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {reorderUrgency === 'critical' ? <AlertCircle className="w-3 h-3" /> :
                           reorderUrgency === 'high' ? <AlertTriangle className="w-3 h-3" /> :
                           reorderUrgency === 'medium' ? <Clock className="w-3 h-3" /> :
                           <CheckCircle className="w-3 h-3" />}
                          {reorderUrgency.charAt(0).toUpperCase() + reorderUrgency.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{usage.prescriptionCount || 0}</p>
                      <p className="text-sm text-gray-600">Total Prescriptions</p>
                    </div>
                    
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{usage.pendingPrescriptions || 0}</p>
                      <p className="text-sm text-gray-600">Pending Prescriptions</p>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {usage.prescriptionCount > 0 ? Math.round((usage.pendingPrescriptions || 0) / usage.prescriptionCount * 100) : 0}%
                      </p>
                      <p className="text-sm text-gray-600">Pending Rate</p>
                    </div>
                  </div>
                  
                  {usage.inDemand && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700">
                          This medicine is in high demand. Consider increasing stock levels.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Pricing Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Price</span>
                      <span className="font-medium">${medicine.price} per {medicine.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">{medicine.category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium">
                        {medicine.updatedAt ? format(parseISO(medicine.updatedAt), 'PPpp') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Stock Update</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => updateStock(medicine._id, 'add', 10, 'Restock')}
                      disabled={updatingStock === medicine._id}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingStock === medicine._id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add 10 Units
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => updateStock(medicine._id, 'add', 50, 'Bulk Restock')}
                      disabled={updatingStock === medicine._id}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Add 50 Units
                    </button>
                    
                    <button
                      onClick={() => updateStock(medicine._id, 'set', 100, 'Reset to optimal')}
                      disabled={updatingStock === medicine._id}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Settings className="w-4 h-4" />
                      Set to 100 Units
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Stock History</h3>
                  
                  <div className="space-y-2">
                    {stockHistory.slice(0, 3).map((record, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{record.operation}</span>
                          <span className={`${record.operation === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.operation === 'add' ? '+' : '-'}{record.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(parseISO(record.timestamp), 'PPp')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Export</h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </button>
                    
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Export as CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Medicine ID: {medicine._id?.slice(-8)}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowMedicineModal(false);
                    setSelectedMedicine(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowMedicineModal(false);
                    setSelectedMedicine(medicine);
                    setShowUpdateStockModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InventoryAnalytics = () => {
    const criticalCount = medicines.filter(m => m.stockQuantity < 10).length;
    const lowCount = medicines.filter(m => m.stockQuantity >= 10 && m.stockQuantity < 30).length;
    const normalCount = medicines.filter(m => m.stockQuantity >= 30 && m.stockQuantity < 100).length;
    const highCount = medicines.filter(m => m.stockQuantity >= 100).length;
    
    const totalValue = medicines.reduce((sum, med) => sum + (med.stockQuantity * med.price), 0);
    const avgStockValue = medicines.length > 0 ? totalValue / medicines.length : 0;
    
    const stockData = [
      { level: 'Critical', count: criticalCount, color: '#EF4444' },
      { level: 'Low', count: lowCount, color: '#F59E0B' },
      { level: 'Normal', count: normalCount, color: '#10B981' },
      { level: 'High', count: highCount, color: '#3B82F6' }
    ];
    
    const topMedicines = [...medicines]
      .sort((a, b) => (b.stockQuantity * b.price) - (a.stockQuantity * a.price))
      .slice(0, 5);
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stock Level Distribution</h3>
              <p className="text-sm text-gray-500">Inventory health overview</p>
            </div>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={stockData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, percent }) => `${level}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
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
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Low</p>
              <p className="text-xl font-bold text-yellow-600">{lowCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Normal</p>
              <p className="text-xl font-bold text-green-600">{normalCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">High</p>
              <p className="text-xl font-bold text-blue-600">{highCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Value Medicines</h3>
              <p className="text-sm text-gray-500">Highest stock value medicines</p>
            </div>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topMedicines.map((medicine, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-xs text-gray-500">{medicine.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${(medicine.stockQuantity * medicine.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {medicine.stockQuantity} {medicine.unit} × ${medicine.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Inventory Value</span>
              <span className="text-lg font-bold text-blue-600">${totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Average per Medicine</span>
              <span className="text-sm text-gray-900">${avgStockValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && medicines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Package className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-900">Loading Medicine Inventory</p>
          <p className="text-sm text-gray-500 mt-2">Fetching medicine data from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medicine Inventory</h1>
            <p className="text-gray-600 mt-2">Manage pharmacy stock and prevent out-of-stock situations</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines by name or category..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={fetchMedicines}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-6 w-fit">
          {['list', 'lowstock', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'lowstock' ? 'Low Stock' : tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.filter(cat => cat !== 'all').map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="critical">Critical (&lt;10)</option>
              <option value="low">Low (10-29)</option>
              <option value="normal">Normal (30-99)</option>
              <option value="high">High (100+)</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => handleBulkUpdate('add', 20)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <PackagePlus className="w-4 h-4" />
              Bulk Restock
            </button>
            
            <button
              onClick={() => setShowAddMedicineModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
            
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medicines</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{medicines.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {medicines.filter(m => m.stockQuantity < 30).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {medicines.filter(m => m.stockQuantity === 0).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <XCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${medicines.reduce((sum, med) => sum + (med.stockQuantity * med.price), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <InventoryAnalytics />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'lowstock' ? 'Low Stock Medicines' : 'All Medicines'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filteredMedicines.length} medicines found • 
                  {activeTab === 'lowstock' && ' Stock level < 20 units'}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {Math.ceil(filteredMedicines.length / itemsPerPage)}
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="p-6">
              {filteredMedicines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMedicines.map((medicine) => (
                    <MedicineCard key={medicine._id} medicine={medicine} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No medicines found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? 'Try a different search term' : 'Add your first medicine'}
                  </p>
                  <button
                    onClick={() => setShowAddMedicineModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Medicine
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">
                      <SortableHeader
                        label="Medicine"
                        field="name"
                        currentField={sortField}
                        currentOrder={sortOrder}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left">
                      <SortableHeader
                        label="Stock Level"
                        field="stockQuantity"
                        currentField={sortField}
                        currentOrder={sortOrder}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left">
                      <SortableHeader
                        label="Price"
                        field="price"
                        currentField={sortField}
                        currentOrder={sortOrder}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left">
                      Demand
                    </th>
                    <th scope="col" className="px-6 py-3 text-left">
                      Stock Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine, index) => (
                      <MedicineRow key={medicine._id} medicine={medicine} index={index} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No medicines found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm ? 'Try a different search term' : 'Add your first medicine'}
                        </p>
                        <button
                          onClick={() => setShowAddMedicineModal(true)}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add Medicine
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {filteredMedicines.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMedicines.length)} of {filteredMedicines.length} medicines
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
                  disabled={currentPage * itemsPerPage >= filteredMedicines.length}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showMedicineModal && <MedicineDetailsModal />}
      {showUpdateStockModal && <UpdateStockModal />}
      {showAddMedicineModal && <AddMedicineModal />}
    </div>
  );
};

export default MedicineInventory;