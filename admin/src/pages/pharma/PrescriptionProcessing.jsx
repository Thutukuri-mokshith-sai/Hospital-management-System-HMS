// PrescriptionProcessing.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Pill,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ChevronRight,
  Download,
  Send,
  ShoppingBag,
  Package,
  DollarSign,
  BarChart3,
  Plus,
  TrendingUp,
  MoreVertical,
  Mail,
  Phone,
  Info,
  Tag,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  XCircle as XCircleIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1';

const PrescriptionProcessing = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [processingPrescription, setProcessingPrescription] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const token = localStorage.getItem('token');

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFilter !== 'all' && { 
          dateFrom: getDateRange(dateFilter).from,
          dateTo: getDateRange(dateFilter).to 
        })
      });

      const response = await fetch(`${API_BASE}/pharmacist/prescriptions?${queryParams}`, { headers });
      
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      
      const data = await response.json();
      setPrescriptions(data.data || []);
      setFilteredPrescriptions(data.data || []);
      
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage, sortField, sortOrder, statusFilter, dateFilter]);

  const fetchPrescriptionDetails = async (prescriptionId) => {
    setLoadingDetails(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE}/pharmacist/prescriptions/${prescriptionId}`, { headers });
      
      if (!response.ok) throw new Error('Failed to fetch prescription details');
      
      const data = await response.json();
      
      if (data.data) {
        console.log('Prescription details:', data.data);
        setSelectedPrescription(data.data);
        
        // Also fetch patient details
        if (data.data.prescription?.patientId?._id) {
          fetchPatientDetails(data.data.prescription.patientId._id);
        }
      }
      
    } catch (error) {
      console.error('Error fetching prescription details:', error);
      toast.error('Failed to load prescription details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE}/pharmacist/patients/${patientId}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.data);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const quickProcessPrescription = async (prescriptionId) => {
    setProcessingPrescription(prescriptionId);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE}/pharmacist/prescriptions/${prescriptionId}/quick-process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ discount: 0 })
      });
      
      if (!response.ok) throw new Error('Failed to process prescription');
      
      const data = await response.json();
      toast.success('Prescription processed successfully!');
      
      // Refresh prescriptions list
      fetchPrescriptions();
      
      // If viewing this prescription, update details
      if (selectedPrescription?.prescription?._id === prescriptionId) {
        fetchPrescriptionDetails(prescriptionId);
      }
      
      return data;
    } catch (error) {
      console.error('Error processing prescription:', error);
      toast.error('Failed to process prescription');
      throw error;
    } finally {
      setProcessingPrescription(null);
    }
  };

  const batchProcessMedicines = async (prescriptionId, medicineIds) => {
    setBatchProcessing(true);
    try {
      // This would be a custom endpoint for batch processing
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${medicineIds.length} medicines processed successfully!`);
      
      // Refresh prescription details
      if (selectedPrescription) {
        fetchPrescriptionDetails(prescriptionId);
      }
      setSelectedMedicines([]);
      
    } catch (error) {
      console.error('Error batch processing:', error);
      toast.error('Failed to process medicines');
    } finally {
      setBatchProcessing(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { from: today, to: new Date() };
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { from: weekAgo, to: new Date() };
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return { from: monthAgo, to: new Date() };
      case 'older':
        const olderDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: new Date(0), to: olderDate };
      default:
        return { from: null, to: null };
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const filtered = prescriptions.filter(prescription => {
      const patientName = prescription.patientId?.userId?.name?.toLowerCase() || '';
      const doctorName = prescription.doctorId?.userId?.name?.toLowerCase() || '';
      const medNames = prescription.medicines?.map(m => m.name.toLowerCase()).join(' ') || '';
      
      return (
        patientName.includes(term.toLowerCase()) ||
        doctorName.includes(term.toLowerCase()) ||
        medNames.includes(term.toLowerCase())
      );
    });

    setFilteredPrescriptions(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleMedicineSelect = (medicineId, prescriptionId) => {
    if (selectedMedicines.includes(medicineId)) {
      setSelectedMedicines(selectedMedicines.filter(id => id !== medicineId));
    } else {
      setSelectedMedicines([...selectedMedicines, medicineId]);
    }
  };

  const handleSelectAll = (medicines) => {
    if (selectedMedicines.length === medicines.length) {
      setSelectedMedicines([]);
    } else {
      setSelectedMedicines(medicines.map(m => m._id));
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const StatusBadge = ({ status }) => {
    const getStatusInfo = (status) => {
      switch (status?.toLowerCase()) {
        case 'pending':
          return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' };
        case 'administered':
        case 'processed':
          return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Processed' };
        case 'cancelled':
          return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' };
        case 'partial':
          return { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Partial' };
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

  const MedicineCard = ({ medicine, prescriptionId, isSelected, onSelect }) => {
    // 根据实际的API响应处理字段
    const isAvailable = medicine.available || false;
    const stockInfo = medicine.stockInfo || null;
    const alternatives = medicine.alternatives || [];
    
    return (
      <div className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => onSelect(medicine._id, prescriptionId)}
              className="mt-1"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{medicine.name}</h4>
                {!isAvailable && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Dosage:</span> {medicine.dosage || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span> {medicine.frequency || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {medicine.duration || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {medicine.quantity || 1}
                </div>
              </div>

              {stockInfo && (
                <div className="flex items-center gap-4 text-sm mb-2">
                  <div className={`px-2 py-1 rounded ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Stock: {stockInfo.stockQuantity} {stockInfo.unit}
                  </div>
                  <div className="text-gray-600">
                    Price: ${stockInfo.price || 0} per {stockInfo.unit || 'unit'}
                  </div>
                  {medicine.estimatedCost && medicine.estimatedCost > 0 && (
                    <div className="font-medium">
                      Total: ${medicine.estimatedCost}
                    </div>
                  )}
                </div>
              )}

              {!stockInfo && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Not available in inventory</span>
                </div>
              )}

              {medicine.instructions && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Instructions:</span> {medicine.instructions}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={medicine.administrationStatus || 'pending'} />
            {alternatives && alternatives.length > 0 && !isAvailable && (
              <button className="text-xs text-blue-600 hover:text-blue-700">
                View {alternatives.length} alternatives
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PrescriptionCard = ({ prescription }) => {
    const patientName = prescription.patientId?.userId?.name || 'Unknown Patient';
    const doctorName = prescription.doctorId?.userId?.name || 'Unknown Doctor';
    const date = prescription.createdAt ? format(parseISO(prescription.createdAt), 'MMM dd, yyyy') : 'N/A';
    const medicines = prescription.medicines || [];
    const pendingCount = medicines.filter(m => m.administrationStatus === 'Pending').length;
    const totalMedicines = medicines.length;
    const allAvailable = medicines.every(m => m.available === true);
    
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => fetchPrescriptionDetails(prescription._id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Prescription #{prescription._id?.slice(-6)}</h3>
                  <p className="text-sm text-gray-500">{date}</p>
                </div>
              </div>
              <StatusBadge status={pendingCount === 0 ? 'administered' : pendingCount === totalMedicines ? 'pending' : 'partial'} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Patient</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{patientName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescribing Doctor</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">Dr. {doctorName}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {totalMedicines} medicines • {pendingCount} pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Est. ${prescription.summary?.totalCost || '0'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {pendingCount > 0 && allAvailable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      quickProcessPrescription(prescription._id);
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                    disabled={processingPrescription === prescription._id}
                  >
                    {processingPrescription === prescription._id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Quick Process
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchPrescriptionDetails(prescription._id);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </button>
              </div>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
        </div>
      </div>
    );
  };

  const PrescriptionDetailsModal = () => {
    if (!selectedPrescription) return null;

    const prescription = selectedPrescription.prescription || {};
    const summary = selectedPrescription.summary || {};
    const medicines = prescription.medicines || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
                <p className="text-gray-600">
                  #{prescription._id?.slice(-8)} • Created on {format(parseISO(prescription.createdAt), 'PPpp')}
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
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-xl font-bold">{summary.totalMedicines || medicines.length}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{summary.pendingMedicines || medicines.filter(m => m.administrationStatus === 'Pending').length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-xl font-bold">{medicines.filter(m => m.available === true).length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-xl font-bold">${summary.totalCost || '0'}</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Patient & Doctor Info */}
              <div className="col-span-1 space-y-6">
                {/* Patient Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Patient Information</h3>
                    <button
                      onClick={() => setShowPatientModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Full Profile
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{prescription.patientId?.userId?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">Patient ID: {prescription.patientId?._id?.slice(-6)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Age</p>
                        <p className="font-medium">{prescription.patientId?.age || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gender</p>
                        <p className="font-medium">{prescription.patientId?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Blood Group</p>
                        <p className="font-medium">{prescription.patientId?.bloodGroup || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Admission Status</p>
                        <p className="font-medium">{prescription.patientId?.admissionStatus || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{prescription.patientId?.userId?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{prescription.patientId?.userId?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Prescribing Doctor</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Dr. {prescription.doctorId?.userId?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{prescription.doctorId?.specialization || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-gray-600 mb-1">Department</p>
                      <p className="font-medium">{prescription.doctorId?.department || 'N/A'}</p>
                    </div>
                    
                    {prescription.appointmentId && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Appointment: {format(parseISO(prescription.appointmentId?.date), 'PP')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => quickProcessPrescription(prescription._id)}
                      disabled={processingPrescription === prescription._id || !summary.allAvailable}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${
                        summary.allAvailable
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {processingPrescription === prescription._id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Process All Medicines
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => batchProcessMedicines(prescription._id, selectedMedicines)}
                      disabled={selectedMedicines.length === 0 || batchProcessing}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ${
                        selectedMedicines.length > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {batchProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Process Selected ({selectedMedicines.length})
                        </>
                      )}
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
                      <Send className="w-4 h-4" />
                      Send to Patient
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      <Download className="w-4 h-4" />
                      Export Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Column - Medicines */}
              <div className="col-span-2 space-y-6">
                {/* Medicines Header */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Prescribed Medicines</h3>
                      <p className="text-sm text-gray-500">
                        {medicines.length} medicines • Select individual medicines to process
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectAll(medicines)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {selectedMedicines.length === medicines.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <div className="text-sm text-gray-600">
                        {selectedMedicines.length} selected
                      </div>
                    </div>
                  </div>
                  
                  {/* Medicines List */}
                  <div className="space-y-3">
                    {medicines.length > 0 ? (
                      medicines.map((medicine, index) => (
                        <MedicineCard
                          key={medicine._id || index}
                          medicine={medicine}
                          prescriptionId={prescription._id}
                          isSelected={selectedMedicines.includes(medicine._id)}
                          onSelect={handleMedicineSelect}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No medicines found in this prescription</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescription Notes */}
                {prescription.notes && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Doctor's Notes</h3>
                    <p className="text-gray-600">{prescription.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Prescription Status: <StatusBadge status={
                  summary.pendingMedicines === 0 ? 'administered' :
                  summary.pendingMedicines === summary.totalMedicines ? 'pending' : 'partial'
                } />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => quickProcessPrescription(prescription._id)}
                  disabled={processingPrescription === prescription._id || !summary.allAvailable}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    summary.allAvailable
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {processingPrescription === prescription._id ? 'Processing...' : 'Complete Processing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PatientDetailsModal = () => {
    if (!selectedPatient || !showPatientModal) return null;

    const patient = selectedPatient.patient;
    const user = patient?.user;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Unknown'}</h2>
                  <p className="text-gray-600">Patient ID: {patient?._id?.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPatientModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <div className="grid grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{user?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium">{patient?.age || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium">{patient?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Blood Group</p>
                      <p className="font-medium">{patient?.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Medical History</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Prescriptions */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Prescriptions</h4>
                      {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPatient.prescriptions.slice(0, 3).map((prescription, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="flex justify-between">
                                <span className="font-medium">#{prescription.id?.slice(-6)}</span>
                                <StatusBadge status={prescription.pendingMedicines > 0 ? 'pending' : 'administered'} />
                              </div>
                              <p className="text-gray-600 text-xs mt-1">
                                {prescription.doctor} • {format(parseISO(prescription.date), 'PP')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No prescriptions found</p>
                      )}
                    </div>

                    {/* Appointments */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Appointments</h4>
                      {selectedPatient.recentAppointments && selectedPatient.recentAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPatient.recentAppointments.slice(0, 3).map((appointment, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="flex justify-between">
                                <span className="font-medium">{appointment.doctorId?.userId?.name || 'Unknown'}</span>
                                <span className="text-gray-600">
                                  {appointment.date ? format(parseISO(appointment.date), 'MMM dd') : 'N/A'}
                                </span>
                              </div>
                              <p className="text-gray-600 text-xs mt-1">
                                {appointment.status} • {appointment.time}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No recent appointments</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admission & Billing */}
              <div className="space-y-6">
                {/* Admission Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Admission Status</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <StatusBadge status={patient?.admissionStatus?.toLowerCase()} />
                    </div>
                    
                    {patient?.admissionDate && (
                      <div>
                        <p className="text-sm text-gray-600">Admission Date</p>
                        <p className="font-medium">{format(parseISO(patient.admissionDate), 'PP')}</p>
                      </div>
                    )}
                    
                    {patient?.wardId && (
                      <div>
                        <p className="text-sm text-gray-600">Ward & Bed</p>
                        <p className="font-medium">Ward {patient.wardId} • Bed {patient.bedNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Billing Summary</h3>
                  
                  {selectedPatient.billingHistory && selectedPatient.billingHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPatient.billingHistory.slice(0, 3).map((bill, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">${bill.amount}</span>
                            <StatusBadge status={bill.status.toLowerCase()} />
                          </div>
                          <p className="text-gray-600 text-xs mt-1">
                            {bill.date ? format(parseISO(bill.date), 'PP') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No billing history</p>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-bold">
                        ${selectedPatient.billingHistory?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      <Mail className="w-4 h-4" />
                      Send Message
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      <FileText className="w-4 h-4" />
                      View All Prescriptions
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                      <DollarSign className="w-4 h-4" />
                      Create New Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SortableHeader = ({ label, field, currentField, currentOrder }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      {label}
      {currentField === field && (
        currentOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  if (loading && prescriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <FileText className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-900">Loading Prescriptions</p>
          <p className="text-sm text-gray-500 mt-2">Fetching prescription data from database...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Prescription Processing</h1>
            <p className="text-gray-600 mt-2">Manage and process doctor prescriptions efficiently</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, doctor, or medicine..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={fetchPrescriptions}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <div className="text-sm text-gray-600">
              {filteredPrescriptions.length} prescriptions
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          {/* Status Filter */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'pending', 'processed', 'partial', 'cancelled'].map((status) => (
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
            {['all', 'today', 'week', 'month', 'older'].map((date) => (
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prescriptions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-5">
                  <SortableHeader
                    label="Patient / Doctor"
                    field="patientId"
                    currentField={sortField}
                    currentOrder={sortOrder}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    label="Date"
                    field="createdAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    label="Medicines"
                    field="medicines"
                    currentField={sortField}
                    currentOrder={sortOrder}
                  />
                </div>
                <div className="col-span-1">
                  <SortableHeader
                    label="Status"
                    field="status"
                    currentField={sortField}
                    currentOrder={sortOrder}
                  />
                </div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            </div>

            {/* Prescriptions List */}
            <div className="divide-y divide-gray-200">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <PrescriptionCard key={prescription._id} prescription={prescription} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No prescriptions found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? 'Try a different search term' : 'All prescriptions are processed'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredPrescriptions.length > 0 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPrescriptions.length)} of {filteredPrescriptions.length} prescriptions
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
                    disabled={currentPage * itemsPerPage >= filteredPrescriptions.length}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Statistics & Quick Actions */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Prescription Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending Processing</span>
                  <span className="font-medium">
                    {prescriptions.filter(p => {
                      const pendingCount = p.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                      return pendingCount > 0;
                    }).length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ 
                    width: `${(prescriptions.filter(p => {
                      const pendingCount = p.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                      return pendingCount > 0;
                    }).length / Math.max(prescriptions.length, 1)) * 100}%` 
                  }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Ready to Process</span>
                  <span className="font-medium">
                    {prescriptions.filter(p => {
                      const allAvailable = p.medicines?.every(m => m.available === true) || false;
                      const pendingCount = p.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                      return allAvailable && pendingCount > 0;
                    }).length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ 
                    width: `${(prescriptions.filter(p => {
                      const allAvailable = p.medicines?.every(m => m.available === true) || false;
                      const pendingCount = p.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                      return allAvailable && pendingCount > 0;
                    }).length / Math.max(prescriptions.length, 1)) * 100}%` 
                  }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Processing Speed</span>
                  <span className="font-medium">18 min avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {prescriptions.reduce((sum, p) => sum + (p.summary?.totalCost || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Total Estimated Value</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {prescriptions.reduce((sum, p) => sum + (p.medicines?.length || 0), 0)}
                </p>
                <p className="text-xs text-gray-600">Total Medicines</p>
              </div>
            </div>
          </div>

          {/* Quick Process */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-3">Batch Processing</h3>
            <p className="text-blue-100 text-sm mb-4">
              Process multiple prescriptions efficiently
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  const pendingPrescriptions = prescriptions.filter(p => {
                    const allAvailable = p.medicines?.every(m => m.available === true) || false;
                    const pendingCount = p.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                    return allAvailable && pendingCount > 0;
                  });
                  if (pendingPrescriptions.length > 0) {
                    toast.success(`Processing ${pendingPrescriptions.length} prescriptions`);
                    pendingPrescriptions.forEach(p => quickProcessPrescription(p._id));
                  } else {
                    toast.info('No prescriptions ready for processing');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50"
              >
                <CheckCircle className="w-5 h-5" />
                Process All Available
              </button>
              
              <button
                onClick={() => toast.success('Exporting all prescription data')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
              >
                <Download className="w-5 h-5" />
                Export Prescriptions
              </button>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Patients</h3>
            
            <div className="space-y-3">
              {prescriptions.slice(0, 3).map((prescription) => {
                const patient = prescription.patientId?.userId;
                if (!patient) return null;
                
                const pendingCount = prescription.medicines?.filter(m => m.administrationStatus === 'Pending').length || 0;
                
                return (
                  <div
                    key={prescription._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => {
                      if (prescription.patientId?._id) {
                        fetchPatientDetails(prescription.patientId._id);
                        setShowPatientModal(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-500">
                          {pendingCount} pending medicines
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {selectedPrescription && <PrescriptionDetailsModal />}
      
      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && <PatientDetailsModal />}
    </div>
  );
};

export default PrescriptionProcessing;