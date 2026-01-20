import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  FileText,
  Pencil,
  Send,
  Plus,
  Eye,
  Download,
  Activity,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Tag,
  ChevronRight,
  ArrowRight,
  Stethoscope,
  FilePlus,
  BarChart2,
  Pill,
  TestTube,
  Clipboard,
  MessageSquare,
  Heart,
  Thermometer,
  Blood,
  Brain,
  Users,
  Microscope,
  Building,
  Award,
  Star,
  Zap,
  TrendingUp,
  Check,
  Shield,
  Wrench,
  Briefcase,
  Target,
  UserPlus,
  ExternalLink,
  List,
  Grid,
  Loader2,
  AlertTriangle,
  Info
} from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

import { BASE_URL } from '../../api/api';
const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [relatedData, setRelatedData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    appointmentId: '',
    medicines: [{
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      instructions: ''
    }]
  });
  const [newLabTest, setNewLabTest] = useState({
    patientId: '',
    testName: '',
    priority: 'Medium',
    notes: ''
  });
  const [labReports, setLabReports] = useState([]);
  const [patientHistory, setPatientHistory] = useState({
    appointments: [],
    prescriptions: [],
    labTests: [],
    nursingCare: [],
    vitals: []
  });
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    pendingPrescriptions: 0,
    pendingLabTests: 0,
    completedLabTests: 0,
    awaitingReports: 0
  });

  // Lab Tech Management State
  const [labTechs, setLabTechs] = useState([]);
  const [loadingLabTechs, setLoadingLabTechs] = useState(false);
  const [selectedLabTech, setSelectedLabTech] = useState(null);
  const [showLabTechModal, setShowLabTechModal] = useState(false);
  const [showAvailableLabTechsModal, setShowAvailableLabTechsModal] = useState(false);
  const [showAssignLabTechModal, setShowAssignLabTechModal] = useState(false);
  const [showLabTechPerformanceModal, setShowLabTechPerformanceModal] = useState(false);
  const [labTechDepartments, setLabTechDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [availableLabTechs, setAvailableLabTechs] = useState([]);
  const [labTechPerformance, setLabTechPerformance] = useState(null);
  const [assigningLabTech, setAssigningLabTech] = useState({
    testId: '',
    labTechId: ''
  });
  const [pendingLabTests, setPendingLabTests] = useState([]);

  // New states for enhanced lab reports
  const [showPatientLabTestsModal, setShowPatientLabTestsModal] = useState(false);
  const [patientLabTests, setPatientLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [showLabTestDetailsModal, setShowLabTestDetailsModal] = useState(false);
  const [labTestFilters, setLabTestFilters] = useState({
    status: 'All',
    priority: 'All'
  });

  const token = localStorage.getItem('token');
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // ==================== EXISTING FUNCTIONS ====================

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(dateFilter && { date: dateFilter }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axiosInstance.get(`/doctors/appointments?${params}`);
      
      if (response.data && response.data.success) {
        setAppointments(response.data.data || []);
        setTotalPages(response.data.pages || 1);
      } else {
        setAppointments([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async (id) => {
    try {
      const response = await axiosInstance.get(`/doctors/appointments/${id}`);
      
      if (response.data && response.data.success) {
        const appointmentData = response.data.data?.appointment || response.data.data;
        const relatedData = response.data.data?.relatedData;
        
        // Fetch lab reports for this appointment's lab tests
        if (relatedData?.labTests && relatedData.labTests.length > 0) {
          // Get lab reports for all lab tests
          const labReportsPromises = relatedData.labTests.map(async (labTest) => {
            if (labTest._id) {
              try {
                const reportResponse = await axiosInstance.get(`/doctors/lab-reports/${labTest._id}`);
                if (reportResponse.data && reportResponse.data.success) {
                  return {
                    ...reportResponse.data.data,
                    labTestDetails: labTest
                  };
                }
              } catch (error) {
                console.log(`No lab report found for test ${labTest._id}`);
              }
            }
            return null;
          });
          
          const labReports = (await Promise.all(labReportsPromises)).filter(report => report !== null);
          
          setRelatedData({
            ...relatedData,
            labReports
          });
        } else {
          setRelatedData(relatedData);
        }
        
        setSelectedAppointment(appointmentData);
      } else {
        setSelectedAppointment(response.data);
        setRelatedData(null);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch appointment details');
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await axiosInstance.put(`/doctors/appointments/${id}/status`, { status });
      
      if (response.data && response.data.success) {
        toast.success(`Appointment marked as ${status}`);
      } else {
        toast.success('Status updated');
      }
      
      fetchAppointments();
      if (selectedAppointment?._id === id) {
        fetchAppointmentDetails(id);
      }
      fetchDashboardStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const updateAppointmentNotes = async () => {
    if (!selectedAppointment || !appointmentNotes.trim()) {
      toast.error('Please enter notes');
      return;
    }
    
    try {
      const response = await axiosInstance.put(`/doctors/appointments/${selectedAppointment._id}/notes`, {
        notes: appointmentNotes
      });
      
      if (response.data && response.data.success) {
        toast.success('Notes updated successfully');
      } else {
        toast.success('Notes updated');
      }
      
      setShowNotesModal(false);
      setAppointmentNotes('');
      fetchAppointmentDetails(selectedAppointment._id);
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error(error.response?.data?.message || 'Failed to update notes');
    }
  };

  const createPrescription = async () => {
    try {
      const patientId = selectedAppointment?.patientId?._id || selectedAppointment?.patientId;
      
      if (!patientId) {
        toast.error('Patient ID not found');
        return;
      }

      const validMedicines = newPrescription.medicines.filter(med => med.name.trim() !== '');
      if (validMedicines.length === 0) {
        toast.error('Please add at least one medicine');
        return;
      }

      const prescriptionData = {
        patientId: patientId,
        appointmentId: selectedAppointment._id,
        medicines: validMedicines
      };

      const response = await axiosInstance.post('/doctors/prescriptions', prescriptionData);
      
      if (response.data && response.data.success) {
        toast.success('Prescription created successfully');
        setShowPrescriptionModal(false);
        resetPrescriptionForm();
        
        fetchDashboardStats();
        
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p>Prescription created successfully!</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await sendToPharmacy(response.data.data._id);
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm"
              >
                Send to Pharmacy
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        ), { duration: 5000 });
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    }
  };

  const sendToPharmacy = async (prescriptionId) => {
    try {
      const response = await axiosInstance.post(`/doctors/prescriptions/${prescriptionId}/send-to-pharmacy`);
      
      if (response.data && response.data.success) {
        toast.success('Prescription sent to pharmacy successfully');
      } else {
        toast.success('Prescription sent to pharmacy');
      }
    } catch (error) {
      console.error('Error sending to pharmacy:', error);
      toast.error(error.response?.data?.message || 'Failed to send to pharmacy');
    }
  };

  const requestLabTest = async () => {
    try {
      const patientId = selectedAppointment?.patientId?._id || selectedAppointment?.patientId;
      
      if (!patientId) {
        toast.error('Patient ID not found');
        return;
      }

      if (!newLabTest.testName.trim()) {
        toast.error('Please enter test name');
        return;
      }

      const labTestData = {
        patientId: patientId,
        testName: newLabTest.testName,
        priority: newLabTest.priority,
        notes: newLabTest.notes || '',
        status: 'Requested'
      };

      const response = await axiosInstance.post('/doctors/lab-tests', labTestData);
      
      if (response.data && response.data.success) {
        toast.success('Lab test requested successfully');
        setShowLabTestModal(false);
        resetLabTestForm();
        fetchDashboardStats();
        
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p>Lab test created successfully! Test ID: {response.data.data._id.substring(0, 8)}...</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setAssigningLabTech({
                    testId: response.data.data._id,
                    labTechId: ''
                  });
                  setShowAssignLabTechModal(true);
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Assign Lab Technician
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        ), { duration: 8000 });
      }
    } catch (error) {
      console.error('Error requesting lab test:', error);
      toast.error(error.response?.data?.message || 'Failed to request lab test');
    }
  };

  // Enhanced getLabReport function
  const getLabReport = async (labTestId) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-reports/${labTestId}`);
      
      if (response.data && response.data.success) {
        // Also fetch the lab test details for context
        const labTestResponse = await axiosInstance.get(`/doctors/lab-tests/${labTestId}`);
        const labTestDetails = labTestResponse.data?.data;
        
        const enrichedReport = {
          ...response.data.data,
          labTestDetails: labTestDetails || null
        };
        
        setLabReports([enrichedReport]);
        setShowReportModal(true);
        return enrichedReport;
      } else {
        toast.error('Lab report not available');
        return null;
      }
    } catch (error) {
      console.error('Error fetching lab report:', error);
      
      // Check if it's a 404 (report doesn't exist yet)
      if (error.response?.status === 404) {
        // Fetch lab test details to show status
        try {
          const labTestResponse = await axiosInstance.get(`/doctors/lab-tests/${labTestId}`);
          const labTest = labTestResponse.data?.data;
          
          if (labTest) {
            toast((t) => (
              <div className="flex flex-col gap-2">
                <p>Lab report not available yet. Test status: <strong>{labTest.status}</strong></p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!labTest.labTechId) {
                        setAssigningLabTech({
                          testId: labTestId,
                          labTechId: ''
                        });
                        setShowAssignLabTechModal(true);
                      } else {
                        toast.info(`Test assigned to lab technician. Status: ${labTest.status}`);
                      }
                      toast.dismiss(t.id);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    {!labTest.labTechId ? 'Assign Lab Technician' : 'Check Status'}
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ), { duration: 8000 });
          }
        } catch (labTestError) {
          console.error('Error fetching lab test details:', labTestError);
          toast.error('Lab test not found');
        }
      } else {
        toast.error('Failed to fetch lab report');
      }
      
      return null;
    }
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      const response = await axiosInstance.get(`/doctors/patients/${patientId}/history`);
      
      if (response.data && response.data.success) {
        setPatientHistory(response.data.data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast.error('Failed to fetch patient history');
    }
  };

  const fetchPatientVitals = async (patientId) => {
    try {
      const response = await axiosInstance.get(`/doctors/patients/${patientId}/vitals?page=1&limit=5`);
      
      if (response.data && response.data.success) {
        console.log('Vitals data:', response.data.data);
        toast.success('Vitals data loaded');
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axiosInstance.get('/doctors/dashboard/stats');
      
      if (response.data && response.data.success) {
        const summary = response.data.data?.summary || {};
        setStats({
          today: summary.todayAppointments || 0,
          week: summary.weekAppointments || 0,
          month: summary.monthAppointments || 0,
          pendingPrescriptions: summary.activePrescriptions || 0,
          pendingLabTests: summary.pendingLabTests || 0,
          completedLabTests: summary.completedLabTests || 0,
          awaitingReports: summary.awaitingReports || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const resetPrescriptionForm = () => {
    setNewPrescription({
      patientId: '',
      appointmentId: '',
      medicines: [{
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
        instructions: ''
      }]
    });
  };

  const resetLabTestForm = () => {
    setNewLabTest({
      patientId: '',
      testName: '',
      priority: 'Medium',
      notes: ''
    });
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...newPrescription.medicines];
    updatedMedicines[index][field] = value;
    setNewPrescription({ ...newPrescription, medicines: updatedMedicines });
  };

  const addMedicine = () => {
    setNewPrescription({
      ...newPrescription,
      medicines: [
        ...newPrescription.medicines,
        { name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
      ]
    });
  };

  const removeMedicine = (index) => {
    if (newPrescription.medicines.length > 1) {
      const updatedMedicines = newPrescription.medicines.filter((_, i) => i !== index);
      setNewPrescription({ ...newPrescription, medicines: updatedMedicines });
    }
  };

  // ==================== ENHANCED LAB REPORTS FUNCTIONS ====================

  // Get lab tests for a specific patient
  const getLabTestsByPatient = async (patientId, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 50,
        ...filters
      });

      const response = await axiosInstance.get(`/doctors/patients/${patientId}/lab-tests?${params}`);
      
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching patient lab tests:', error);
      toast.error('Failed to fetch patient lab tests');
      return [];
    }
  };

  // Fetch lab reports for multiple lab tests
  // Enhanced frontend function for fetching lab reports
const fetchLabReportsForTests = async (labTests) => {
  if (!labTests || labTests.length === 0) return [];
  
  const completedTests = labTests.filter(test => test.status === 'Completed');
  
  if (completedTests.length === 0) return [];
  
  // Fetch lab reports for each completed test
  const labReportsPromises = completedTests.map(async (labTest) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-reports/${labTest._id}`);
      if (response.data && response.data.success) {
        const report = response.data.data;
        
        // If lab tech details are not populated, fetch them separately
        if (report.labTestDetails?.labTechId?._id && !report.labTestDetails.labTechId.name) {
          try {
            const labTechResponse = await axiosInstance.get(`/doctors/lab-techs/${report.labTestDetails.labTechId._id}`);
            if (labTechResponse.data && labTechResponse.data.success) {
              report.labTestDetails.labTechId.name = labTechResponse.data.data.user?.name;
            }
          } catch (error) {
            console.error('Error fetching lab tech details:', error);
          }
        }
        
        return report;
      }
    } catch (error) {
      console.log(`No lab report found for test ${labTest._id}:`, error.message);
    }
    return null;
  });
  
  const reports = (await Promise.all(labReportsPromises)).filter(report => report !== null);
  return reports;
};

  // Generic function to fetch and display lab reports
  const handleViewLabReports = async (patientId, appointmentId = null) => {
    try {
      setLoading(true);
      
      let labTests = [];
      
      if (appointmentId) {
        // Get lab tests for this specific appointment
        const response = await axiosInstance.get(`/doctors/lab-tests?patientId=${patientId}&limit=50`);
        if (response.data && response.data.success) {
          labTests = response.data.data;
        }
      } else {
        // Get all lab tests for this patient
        labTests = await getLabTestsByPatient(patientId);
      }
      
      if (labTests.length === 0) {
        toast.error('No lab tests found for this patient');
        setLoading(false);
        return [];
      }
      
      // Fetch lab reports for completed tests
      const labReports = await fetchLabReportsForTests(labTests);
      
      if (labReports.length > 0) {
        setLabReports(labReports);
        setShowReportModal(true);
        setShowModal(false);
      } else {
        // Show lab tests with option to assign tech or check status
        setPendingLabTests(labTests.filter(test => test.status !== 'Completed'));
        setShowAssignLabTechModal(true);
        toast.info('No completed lab reports yet. You can assign lab technicians or check test status.');
      }
      
      setLoading(false);
      return labReports;
    } catch (error) {
      console.error('Error handling lab reports:', error);
      toast.error('Failed to fetch lab reports');
      setLoading(false);
      return [];
    }
  };

  // Function to show patient lab tests
  const showPatientLabTests = async (patientId) => {
    try {
      setLoading(true);
      const labTests = await getLabTestsByPatient(patientId);
      
      if (labTests.length > 0) {
        // Group tests by status for better organization
        const groupedTests = {
          Requested: labTests.filter(test => test.status === 'Requested'),
          Processing: labTests.filter(test => test.status === 'Processing'),
          Completed: labTests.filter(test => test.status === 'Completed'),
          All: labTests
        };
        
        setPatientLabTests(groupedTests);
        setShowPatientLabTestsModal(true);
      } else {
        toast.error('No lab tests found for this patient');
      }
    } catch (error) {
      console.error('Error fetching patient lab tests:', error);
      toast.error('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  // Function to view specific lab test
  const viewLabTest = async (labTestId) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-tests/${labTestId}`);
      
      if (response.data && response.data.success) {
        setSelectedLabTest(response.data.data);
        
        // Check if there's a lab report for this test
        try {
          const reportResponse = await axiosInstance.get(`/doctors/lab-reports/${labTestId}`);
          if (reportResponse.data && reportResponse.data.success) {
            setLabReports([{
              ...reportResponse.data.data,
              labTestDetails: response.data.data
            }]);
            setShowReportModal(true);
            setShowPatientLabTestsModal(false);
          } else {
            setShowLabTestDetailsModal(true);
          }
        } catch (reportError) {
          setShowLabTestDetailsModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching lab test:', error);
      toast.error('Failed to fetch lab test details');
    }
  };

  // Function to filter lab tests
  const filterLabTests = () => {
    if (!patientLabTests.All) return [];
    
    let filtered = patientLabTests.All;
    
    if (labTestFilters.status !== 'All') {
      filtered = filtered.filter(test => test.status === labTestFilters.status);
    }
    
    if (labTestFilters.priority !== 'All') {
      filtered = filtered.filter(test => test.priority === labTestFilters.priority);
    }
    
    return filtered;
  };

  // ==================== LAB TECH FUNCTIONS ====================

  const fetchLabTechs = async (department = 'All') => {
    setLoadingLabTechs(true);
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 20,
        ...(department !== 'All' && { department }),
        isActive: 'true'
      });

      const response = await axiosInstance.get(`/doctors/lab-techs?${params}`);
      
      if (response.data && response.data.success) {
        setLabTechs(response.data.data || []);
        
        const departments = ['All', ...new Set(response.data.data.map(lt => 
          lt.labTech?.department || lt.department
        ).filter(Boolean))];
        setLabTechDepartments(departments);
      } else {
        setLabTechs([]);
      }
    } catch (error) {
      console.error('Error fetching lab techs:', error);
      toast.error('Failed to fetch lab technicians');
      setLabTechs([]);
    } finally {
      setLoadingLabTechs(false);
    }
  };

  const fetchLabTechById = async (id) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-techs/${id}`);
      
      if (response.data && response.data.success) {
        setSelectedLabTech(response.data.data);
        setShowLabTechModal(true);
      }
    } catch (error) {
      console.error('Error fetching lab tech details:', error);
      toast.error('Failed to fetch lab technician details');
    }
  };

  const fetchAvailableLabTechs = async (department, testType) => {
    try {
      const params = new URLSearchParams({
        ...(department && { department }),
        ...(testType && { testType })
      });

      const response = await axiosInstance.get(`/doctors/lab-techs/available?${params}`);
      
      if (response.data && response.data.success) {
        setAvailableLabTechs(response.data.data || []);
        setShowAvailableLabTechsModal(true);
      }
    } catch (error) {
      console.error('Error fetching available lab techs:', error);
      toast.error('Failed to fetch available lab technicians');
    }
  };

  const fetchLabTechsByDepartment = async (department) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-techs/department/${department}`);
      
      if (response.data && response.data.success) {
        setLabTechs(response.data.data || []);
        setSelectedDepartment(department);
      }
    } catch (error) {
      console.error('Error fetching lab techs by department:', error);
      toast.error('Failed to fetch lab technicians by department');
    }
  };

  const fetchLabTechPerformance = async (id) => {
    try {
      const response = await axiosInstance.get(`/doctors/lab-techs/${id}/performance`);
      
      if (response.data && response.data.success) {
        setLabTechPerformance(response.data.data);
        setShowLabTechPerformanceModal(true);
      }
    } catch (error) {
      console.error('Error fetching lab tech performance:', error);
      toast.error('Failed to fetch lab technician performance');
    }
  };

  const assignLabTechToTest = async () => {
    if (!assigningLabTech.testId || !assigningLabTech.labTechId) {
      toast.error('Please select a lab technician to assign');
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/doctors/lab-tests/${assigningLabTech.testId}/assign-lab-tech`,
        { labTechId: assigningLabTech.labTechId }
      );
      
      if (response.data && response.data.success) {
        toast.success('Lab technician assigned successfully');
        setShowAssignLabTechModal(false);
        setAssigningLabTech({ testId: '', labTechId: '' });
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error assigning lab tech:', error);
      toast.error(error.response?.data?.message || 'Failed to assign lab technician');
    }
  };

  const fetchPendingLabTests = async () => {
    try {
      const response = await axiosInstance.get('/doctors/lab-tests?status=Requested&limit=20');
      if (response.data && response.data.success) {
        setPendingLabTests(response.data.data || []);
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching pending lab tests:', error);
      return [];
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const getPatientName = (appointment) => {
    if (!appointment) return 'N/A';
    
    if (appointment.patientId?.userId?.name) {
      return appointment.patientId.userId.name;
    }
    if (appointment.patientId?.name) {
      return appointment.patientId.name;
    }
    if (appointment.patient?.userId?.name) {
      return appointment.patient.userId.name;
    }
    if (appointment.patient?.name) {
      return appointment.patient.name;
    }
    if (appointment.patientName) {
      return appointment.patientName;
    }
    return 'N/A';
  };

  const getAppointmentNotes = (appointment) => {
    if (!appointment) return '';
    return appointment.notes || '';
  };

  const getPatientAge = (appointment) => {
    if (!appointment) return 'N/A';
    
    if (appointment.patientId?.age !== undefined) {
      return appointment.patientId.age;
    }
    if (appointment.patient?.age !== undefined) {
      return appointment.patient.age;
    }
    return 'N/A';
  };

  const getPatientGender = (appointment) => {
    if (!appointment) return 'N/A';
    
    if (appointment.patientId?.gender) {
      return appointment.patientId.gender;
    }
    if (appointment.patient?.gender) {
      return appointment.patient.gender;
    }
    return 'N/A';
  };

  const getPatientPhone = (appointment) => {
    if (!appointment) return 'N/A';
    
    if (appointment.patientId?.userId?.phone) {
      return appointment.patientId.userId.phone;
    }
    if (appointment.patientId?.phone) {
      return appointment.patientId.phone;
    }
    if (appointment.patient?.userId?.phone) {
      return appointment.patient.userId.phone;
    }
    return 'N/A';
  };

  const getPatientBloodGroup = (appointment) => {
    if (!appointment) return 'N/A';
    
    if (appointment.patientId?.bloodGroup) {
      return appointment.patientId.bloodGroup;
    }
    if (appointment.patient?.bloodGroup) {
      return appointment.patient.bloodGroup;
    }
    return 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes || 0), 0);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Scheduled':
        return <Clock className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'Processing':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getLabTechStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-red-100 text-red-800 border border-red-200';
  };

  const getAvailabilityBadge = (availability) => {
    if (availability?.isAvailable) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Available</span>;
    } else if (availability?.loadPercentage < 80) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Moderate Load</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High Load</span>;
    }
  };

  const commonTests = [
    'Complete Blood Count',
    'Lipid Profile',
    'Liver Function Test',
    'Kidney Function Test',
    'Thyroid Function Test',
    'Blood Glucose',
    'Urine Analysis',
    'X-Ray Chest',
    'ECG',
    'MRI Scan',
    'CT Scan',
    'Ultrasound'
  ];

  const commonMedicines = [
    'Paracetamol',
    'Ibuprofen',
    'Amoxicillin',
    'Azithromycin',
    'Metformin',
    'Amlodipine',
    'Atorvastatin',
    'Levothyroxine',
    'Losartan',
    'Omeprazole',
    'Cetirizine',
    'Salbutamol'
  ];

  // Initialize
  useEffect(() => {
    fetchAppointments();
    fetchDashboardStats();
    fetchLabTechs();
  }, [statusFilter, dateFilter, currentPage]);

  // Load pending tests when assign modal opens
  useEffect(() => {
    if (showAssignLabTechModal) {
      fetchPendingLabTests();
    }
  }, [showAssignLabTechModal]);

  // Filter appointments based on search
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const patientName = getPatientName(appointment).toLowerCase();
    const reason = (appointment.reason || '').toLowerCase();
    const notes = getAppointmentNotes(appointment).toLowerCase();
    
    return patientName.includes(searchLower) || 
           reason.includes(searchLower) || 
           notes.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-blue-600" />
              Doctor's Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage patient appointments, prescriptions, lab tests, and lab technicians</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAvailableLabTechs()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Microscope className="w-4 h-4" />
              Find Lab Tech
            </button>
            <button
              onClick={fetchAppointments}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.today}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Lab Tests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingLabTests}</p>
            </div>
            <TestTube className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Lab Tests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedLabTests}</p>
            </div>
            <TestTube className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Awaiting Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.awaitingReports}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.month}</p>
            </div>
            <BarChart2 className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingPrescriptions}</p>
            </div>
            <Pill className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-blue-500 text-blue-600 px-4 py-3 font-medium">
              Appointments
            </button>
            <button 
              onClick={() => fetchLabTechs()}
              className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-4 py-3 font-medium"
            >
              Lab Technicians
            </button>
          </nav>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by patient name, reason, or notes..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Processing">Processing</option>
            </select>
            
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              onClick={fetchAppointments}
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            <button
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
              onClick={() => {
                setStatusFilter('All');
                setDateFilter('');
                setSearchQuery('');
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getPatientName(appointment)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getPatientAge(appointment)} years • {getPatientGender(appointment)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {appointment.reason || 'No reason specified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.time)}
                        </div>
                        {appointment.notes && (
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {appointment.notes.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            {appointment.status}
                          </span>
                          {appointment.priority && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              appointment.priority === 'High' || appointment.priority === 'Critical' 
                                ? 'bg-red-100 text-red-800' 
                                : appointment.priority === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {appointment.priority} Priority
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              fetchAppointmentDetails(appointment._id);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          
                          <button
                            onClick={async () => {
                              const patientId = appointment.patientId?._id || appointment.patientId;
                              if (patientId) {
                                await handleViewLabReports(patientId, appointment._id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm transition-colors"
                            title="View Lab Reports"
                          >
                            <TestTube className="w-4 h-4" />
                            Reports
                          </button>
                          
                          {appointment.status === 'Scheduled' && (
                            <>
                              <button
                                onClick={() => updateAppointmentStatus(appointment._id, 'Completed')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition-colors"
                                title="Mark as Completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                              </button>
                              <button
                                onClick={() => updateAppointmentStatus(appointment._id, 'Cancelled')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
                                title="Cancel Appointment"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => {
                              const patientId = appointment.patientId?._id || appointment.patientId;
                              if (patientId) {
                                fetchPatientHistory(patientId);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-colors"
                            title="View Patient History"
                          >
                            <Clipboard className="w-4 h-4" />
                            History
                          </button>
                          
                          <button
                            onClick={() => {
                              const patientId = appointment.patientId?._id || appointment.patientId;
                              if (patientId) {
                                showPatientLabTests(patientId);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
                            title="View Lab Tests"
                          >
                            <TestTube className="w-4 h-4" />
                            Lab Tests
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAppointments.length === 0 && !loading && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later</p>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setDateFilter('');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lab Technicians Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Microscope className="w-6 h-6 text-purple-600" />
            Lab Technicians
          </h2>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                if (e.target.value === 'All') {
                  fetchLabTechs();
                } else {
                  fetchLabTechsByDepartment(e.target.value);
                }
              }}
            >
              {labTechDepartments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
            <button
              onClick={() => fetchAvailableLabTechs()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Zap className="w-4 h-4" />
              Find Available
            </button>
          </div>
        </div>

        {loadingLabTechs ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labTechs.map((item) => (
              <div key={item.user?._id || item._id} className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.user?.name || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500">{item.labTech?.employeeId}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLabTechStatusColor(item.labTech?.isActive)}`}>
                    {item.labTech?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{item.labTech?.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{item.labTech?.specialization || 'General'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Tests Done</p>
                    <p className="font-semibold">{item.statistics?.totalTestsConducted || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="font-semibold">{item.statistics?.pendingTests || 0}</p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => fetchLabTechById(item.user?._id || item._id)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => fetchLabTechPerformance(item.user?._id || item._id)}
                    className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {labTechs.length === 0 && !loadingLabTechs && (
          <div className="text-center py-8 bg-white rounded-xl shadow">
            <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lab technicians found</h3>
            <p className="text-gray-500">Try changing the department filter</p>
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                    setRelatedData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Patient Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow">
                      <User className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getPatientName(selectedAppointment)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-semibold text-gray-900">{getPatientAge(selectedAppointment)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="font-semibold text-gray-900">{getPatientGender(selectedAppointment)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="font-semibold text-gray-900">{getPatientBloodGroup(selectedAppointment)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="font-semibold text-gray-900">{getPatientPhone(selectedAppointment)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Appointment Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(selectedAppointment.date)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="font-medium">{formatTime(selectedAppointment.time)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status}
                      </span>
                    </div>
                    {selectedAppointment.reason && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Reason:</span>
                        <span className="font-medium text-right">{selectedAppointment.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      Clinical Notes
                    </h4>
                    <button
                      onClick={() => {
                        setAppointmentNotes(getAppointmentNotes(selectedAppointment));
                        setShowNotesModal(true);
                      }}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      {selectedAppointment.notes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg min-h-[100px]">
                    {getAppointmentNotes(selectedAppointment) || 'No clinical notes recorded yet.'}
                  </div>
                </div>
              </div>

              {/* Related Data */}
              {relatedData && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Related Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedData.prescription && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Prescription</span>
                        </div>
                        <p className="text-sm text-gray-600">Available</p>
                      </div>
                    )}
                    {relatedData.labTests && relatedData.labTests.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Lab Tests</span>
                        </div>
                        <p className="text-sm text-gray-600">{relatedData.labTests.length} tests</p>
                      </div>
                    )}
                    {relatedData.latestVitals && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-5 h-5 text-orange-600" />
                          <span className="font-medium">Latest Vitals</span>
                        </div>
                        <p className="text-sm text-gray-600">Recorded</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Lab Reports Section */}
                  {relatedData.labReports && relatedData.labReports.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TestTube className="w-5 h-5 text-purple-600" />
                        Lab Reports ({relatedData.labReports.length})
                      </h4>
                      <div className="space-y-4">
                        {relatedData.labReports.map((report, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">{report.labTestDetails?.testName || 'Lab Test'}</h5>
                                <p className="text-sm text-gray-500">
                                  Reported: {new Date(report.reportDate || report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Completed
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-sm text-gray-500">Results</p>
                                <p className="font-medium text-gray-900">{report.result || 'Available'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Technician</p>
                                <p className="font-medium text-gray-900">
                                  {report.labTestDetails?.labTechId?.name || 'Lab Technician'}
                                </p>
                              </div>
                            </div>
                            
                            {report.notes && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Notes</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">{report.notes}</p>
                              </div>
                            )}
                            
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => {
                                  setLabReports([report]);
                                  setShowReportModal(true);
                                  setShowModal(false);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View Full Report
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(true);
                      setShowModal(false);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Pill className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Create Prescription</div>
                      <div className="text-xs opacity-90">Prescribe medications</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowLabTestModal(true);
                      setShowModal(false);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <TestTube className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Request Lab Test</div>
                      <div className="text-xs opacity-90">Order diagnostic tests</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const patientId = selectedAppointment.patientId?._id || selectedAppointment.patientId;
                      if (patientId) {
                        handleViewLabReports(patientId, selectedAppointment._id);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <TestTube className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">View Lab Reports</div>
                      <div className="text-xs opacity-90">Test results & analysis</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const patientId = selectedAppointment.patientId?._id || selectedAppointment.patientId;
                      if (patientId) {
                        fetchPatientHistory(patientId);
                        setShowModal(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Clipboard className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">View History</div>
                      <div className="text-xs opacity-90">Medical records</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const patientId = selectedAppointment.patientId?._id || selectedAppointment.patientId;
                      if (patientId) {
                        fetchPatientVitals(patientId);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Activity className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Check Vitals</div>
                      <div className="text-xs opacity-90">BP, Temp, Pulse</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal - Remains same */}
      {showNotesModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient: <span className="font-semibold">{getPatientName(selectedAppointment)}</span>
                </label>
              </div>
              <textarea
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Enter clinical assessment, diagnosis, treatment plan, follow-up instructions..."
              />
              <div className="mt-2 text-xs text-gray-500">
                Include assessment, diagnosis, treatment, and follow-up instructions.
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateAppointmentNotes}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal - Remains same */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create Prescription</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    For: <span className="font-semibold">{getPatientName(selectedAppointment)}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    resetPrescriptionForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Prescription form - Remains same */}
              <div className="space-y-6">
                {newPrescription.medicines.map((medicine, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        Medicine #{index + 1}
                      </h4>
                      {newPrescription.medicines.length > 1 && (
                        <button
                          onClick={() => removeMedicine(index)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Medicine Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicine Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={medicine.name}
                            onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                            placeholder="Start typing medicine name..."
                            list="medicine-suggestions"
                          />
                          <datalist id="medicine-suggestions">
                            {commonMedicines.map((med, idx) => (
                              <option key={idx} value={med} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg, 10ml, 1 tablet"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency *
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={medicine.frequency}
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        >
                          <option value="">Select frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="Four times daily">Four times daily</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration *
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        >
                          <option value="">Select duration</option>
                          <option value="1 day">1 day</option>
                          <option value="3 days">3 days</option>
                          <option value="5 days">5 days</option>
                          <option value="7 days">7 days</option>
                          <option value="10 days">10 days</option>
                          <option value="14 days">14 days</option>
                          <option value="1 month">1 month</option>
                          <option value="Until finished">Until finished</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMedicineChange(index, 'quantity', Math.max(1, medicine.quantity - 1))}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="w-full p-3 border border-gray-300 rounded-lg text-center"
                            value={medicine.quantity}
                            onChange={(e) => handleMedicineChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleMedicineChange(index, 'quantity', medicine.quantity + 1)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={medicine.instructions}
                          onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                          placeholder="e.g., Take after meals, Avoid alcohol, Store in cool place..."
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Medicine Button */}
                <button
                  onClick={addMedicine}
                  className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-700">Add Another Medicine</span>
                  <span className="text-sm text-gray-500">Click to add more medications</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    resetPrescriptionForm();
                  }}
                  className="px-5 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={createPrescription}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <Pill className="w-5 h-5" />
                    Create Prescription
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Test Modal - Remains same */}
      {showLabTestModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Request Lab Test</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    For: <span className="font-semibold">{getPatientName(selectedAppointment)}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLabTestModal(false);
                    resetLabTestForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Lab test form - Remains same */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newLabTest.testName}
                      onChange={(e) => setNewLabTest({ ...newLabTest, testName: e.target.value })}
                      placeholder="Start typing test name..."
                      list="test-suggestions"
                    />
                    <datalist id="test-suggestions">
                      {commonTests.map((test, idx) => (
                        <option key={idx} value={test} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonTests.slice(0, 6).map((test, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewLabTest({ ...newLabTest, testName: test })}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full"
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setNewLabTest({ ...newLabTest, priority })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          newLabTest.priority === priority
                            ? priority === 'Critical'
                              ? 'bg-red-100 border-red-500 text-red-700'
                              : priority === 'High'
                              ? 'bg-orange-100 border-orange-500 text-orange-700'
                              : priority === 'Medium'
                              ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                              : 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-medium">{priority}</div>
                        <div className="text-xs opacity-75">
                          {priority === 'Critical' ? 'Immediate' :
                           priority === 'High' ? 'Urgent' :
                           priority === 'Medium' ? 'Routine' : 'Non-urgent'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Notes
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newLabTest.notes}
                    onChange={(e) => setNewLabTest({ ...newLabTest, notes: e.target.value })}
                    placeholder="Specify test requirements, suspected diagnosis, special instructions..."
                    rows="4"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowLabTestModal(false);
                    resetLabTestForm();
                  }}
                  className="px-5 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={requestLabTest}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <TestTube className="w-5 h-5" />
                  Request Lab Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal - Remains same */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Patient Medical History</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointments History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Recent Appointments ({patientHistory.appointments?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {patientHistory.appointments?.slice(0, 3).map((apt) => (
                      <div key={apt._id} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{formatDate(apt.date)}</p>
                            <p className="text-xs text-gray-500">{formatTime(apt.time)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        {apt.reason && (
                          <p className="text-xs text-gray-600 mt-1">{apt.reason}</p>
                        )}
                      </div>
                    ))}
                    {(!patientHistory.appointments || patientHistory.appointments.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No appointment history</p>
                    )}
                  </div>
                </div>

                {/* Prescriptions History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-green-500" />
                    Recent Prescriptions ({patientHistory.prescriptions?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {patientHistory.prescriptions?.slice(0, 3).map((pres) => (
                      <div key={pres._id} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">
                              {pres.medicines?.length || 0} medicines
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(pres.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {pres.status || 'Active'}
                          </span>
                        </div>
                        {pres.medicines?.[0] && (
                          <p className="text-xs text-gray-600 mt-1">{pres.medicines[0].name}</p>
                        )}
                      </div>
                    ))}
                    {(!patientHistory.prescriptions || patientHistory.prescriptions.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No prescription history</p>
                    )}
                  </div>
                </div>

                {/* Lab Tests History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-purple-500" />
                    Recent Lab Tests ({patientHistory.labTests?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {patientHistory.labTests?.slice(0, 3).map((test) => (
                      <div key={test._id} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{test.testName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(test.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>
                        {test.priority && (
                          <p className="text-xs text-gray-600 mt-1">Priority: {test.priority}</p>
                        )}
                      </div>
                    ))}
                    {(!patientHistory.labTests || patientHistory.labTests.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No lab test history</p>
                    )}
                  </div>
                </div>

                {/* Vitals History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    Latest Vitals
                  </h4>
                  {patientHistory.vitals?.[0] ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-xs text-gray-500">BP</p>
                          <p className="font-semibold">
                            {patientHistory.vitals[0].bloodPressure?.systolic || '--'}/
                            {patientHistory.vitals[0].bloodPressure?.diastolic || '--'}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-xs text-gray-500">Heart Rate</p>
                          <p className="font-semibold">{patientHistory.vitals[0].heartRate || '--'} bpm</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="text-xs text-gray-500">Temperature</p>
                          <p className="font-semibold">{patientHistory.vitals[0].temperature || '--'}°C</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-xs text-gray-500">Oxygen</p>
                          <p className="font-semibold">{patientHistory.vitals[0].oxygenSaturation || '--'}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Recorded: {new Date(patientHistory.vitals[0].recordedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No vitals recorded</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full mt-6 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Lab Report Modal */}
      {showReportModal && labReports.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lab Reports</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {labReports.length} report{labReports.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setLabReports([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Patient Info Banner */}
              {selectedAppointment && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getPatientName(selectedAppointment)}</p>
                        <p className="text-sm text-gray-600">
                          Age: {getPatientAge(selectedAppointment)} | Gender: {getPatientGender(selectedAppointment)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Appointment Date</p>
                      <p className="font-medium">{formatDate(selectedAppointment?.date)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lab Reports List */}
              <div className="space-y-6">
                {labReports.map((report, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-bold text-gray-900">
                            {report.labTestDetails?.testName || report.labTestId?.testName || 'Lab Test'}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Report Date</p>
                            <p className="font-medium">
                              {new Date(report.reportDate || report.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Test Status</p>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Completed
                            </span>
                          </div>
                          {report.labTestDetails?.priority && (
                            <div>
                              <p className="text-xs text-gray-500">Priority</p>
                              <span className={`px-2 py-1 rounded text-xs ${
                                report.labTestDetails?.priority === 'High' || report.labTestDetails?.priority === 'Critical' 
                                  ? 'bg-red-100 text-red-800' 
                                  : report.labTestDetails?.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {report.labTestDetails?.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Report ID</p>
                        <p className="font-mono text-sm text-gray-600">
                          {report._id ? report._id.substring(0, 8) + '...' : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Test Results
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {report.result || 'No results recorded'}
                        </p>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Lab Technician Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          Lab Technician
                        </h4>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="font-medium">
                            {report.labTestDetails?.labTechId?.name || 
                             report.labTechId?.name || 
                             'Lab Technician'}
                          </p>
                          {report.labTestDetails?.labTechId?.employeeId && (
                            <p className="text-sm text-gray-600">
                              ID: {report.labTestDetails.labTechId.employeeId}
                            </p>
                          )}
                          {report.labTestDetails?.labTechId?.department && (
                            <p className="text-sm text-gray-600">
                              Department: {report.labTestDetails.labTechId.department}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Doctor Information */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-500" />
                          Requesting Doctor
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium">
                            {report.labTestDetails?.doctorId?.userId?.name || 'Doctor'}
                          </p>
                          {report.labTestDetails?.doctorId?.specialization && (
                            <p className="text-sm text-gray-600">
                              {report.labTestDetails.doctorId.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    {report.notes && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Technician Notes</h4>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-gray-700">{report.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(report.updatedAt || report.createdAt).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            toast.success('Download functionality to be implemented');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            toast.success('Share functionality to be implemented');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Share with Patient
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setLabReports([]);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      toast.success('Redirecting to lab tests management');
                    }}
                    className="px-5 py-2.5 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Manage Lab Tests
                  </button>
                  <button
                    onClick={() => {
                      if (selectedAppointment) {
                        setShowReportModal(false);
                        setShowModal(true);
                      }
                    }}
                    className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Back to Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Lab Tests Modal */}
      {showPatientLabTestsModal && patientLabTests.All && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Patient Lab Tests</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {patientLabTests.All.length} tests
                  </p>
                </div>
                <button
                  onClick={() => setShowPatientLabTestsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={labTestFilters.status}
                      onChange={(e) => setLabTestFilters({...labTestFilters, status: e.target.value})}
                    >
                      <option value="All">All Status</option>
                      <option value="Requested">Requested</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={labTestFilters.priority}
                      onChange={(e) => setLabTestFilters({...labTestFilters, priority: e.target.value})}
                    >
                      <option value="All">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setLabTestFilters({status: 'All', priority: 'All'})}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Requested</p>
                      <p className="text-2xl font-bold text-gray-900">{patientLabTests.Requested?.length || 0}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Processing</p>
                      <p className="text-2xl font-bold text-gray-900">{patientLabTests.Processing?.length || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{patientLabTests.Completed?.length || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Lab Tests List */}
              <div className="space-y-4">
                {filterLabTests().map((labTest, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{labTest.testName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(labTest.status)}`}>
                            {labTest.status}
                          </span>
                          {labTest.priority && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              labTest.priority === 'High' || labTest.priority === 'Critical' 
                                ? 'bg-red-100 text-red-800' 
                                : labTest.priority === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {labTest.priority} Priority
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(labTest.createdAt)}
                          </span>
                        </div>
                        {labTest.notes && (
                          <p className="text-sm text-gray-600 mt-2">{labTest.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {labTest.status === 'Completed' ? (
                          <button
                            onClick={() => getLabReport(labTest._id)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                          >
                            View Report
                          </button>
                        ) : labTest.status === 'Requested' ? (
                          <button
                            onClick={() => {
                              setAssigningLabTech({
                                testId: labTest._id,
                                labTechId: ''
                              });
                              setShowAssignLabTechModal(true);
                              setShowPatientLabTestsModal(false);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                          >
                            Assign Tech
                          </button>
                        ) : (
                          <button
                            onClick={() => viewLabTest(labTest._id)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                          >
                            Check Status
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {labTest.labTechId && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          Assigned to: {labTest.labTechId?.name || 'Lab Technician'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filterLabTests().length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lab tests found</h3>
                  <p className="text-gray-500">Try adjusting your filters</p>
                </div>
              )}

              <div className="flex justify-end mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowPatientLabTestsModal(false)}
                  className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Test Details Modal */}
      {showLabTestDetailsModal && selectedLabTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Lab Test Details</h2>
                <button
                  onClick={() => setShowLabTestDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedLabTest.testName}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLabTest.status)}`}>
                      {selectedLabTest.status}
                    </span>
                    {selectedLabTest.priority && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedLabTest.priority === 'High' || selectedLabTest.priority === 'Critical' 
                          ? 'bg-red-100 text-red-800' 
                          : selectedLabTest.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedLabTest.priority} Priority
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Requested Date</p>
                    <p className="font-medium">{formatDate(selectedLabTest.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Updated Date</p>
                    <p className="font-medium">{formatDate(selectedLabTest.updatedAt)}</p>
                  </div>
                </div>

                {selectedLabTest.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedLabTest.notes}</p>
                  </div>
                )}

                {selectedLabTest.labTechId && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">Assigned Lab Technician</p>
                    <p className="text-gray-700">{selectedLabTest.labTechId?.name || 'Lab Technician'}</p>
                    {selectedLabTest.labTechId?.employeeId && (
                      <p className="text-sm text-gray-600">ID: {selectedLabTest.labTechId.employeeId}</p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between gap-3">
                    {selectedLabTest.status === 'Requested' && !selectedLabTest.labTechId && (
                      <button
                        onClick={() => {
                          setAssigningLabTech({
                            testId: selectedLabTest._id,
                            labTechId: ''
                          });
                          setShowAssignLabTechModal(true);
                          setShowLabTestDetailsModal(false);
                        }}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Assign Lab Technician
                      </button>
                    )}
                    <button
                      onClick={() => setShowLabTestDetailsModal(false)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lab Tech Modal - Remains same */}
      {showAssignLabTechModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Assign Lab Technician</h2>
                <button
                  onClick={() => {
                    setShowAssignLabTechModal(false);
                    setAssigningLabTech({ testId: '', labTechId: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test ID
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={assigningLabTech.testId}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pending Test
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={assigningLabTech.testId}
                    onChange={(e) => setAssigningLabTech({
                      ...assigningLabTech,
                      testId: e.target.value
                    })}
                  >
                    <option value="">Select a pending test</option>
                    {pendingLabTests
                      .filter(test => test.status === 'Requested')
                      .map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.testName} - {formatDate(test.createdAt)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Lab Technician *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={assigningLabTech.labTechId}
                    onChange={(e) => setAssigningLabTech({
                      ...assigningLabTech,
                      labTechId: e.target.value
                    })}
                  >
                    <option value="">Select a lab technician</option>
                    {labTechs
                      .filter(lt => lt.labTech?.isActive)
                      .map((labTech) => (
                        <option key={labTech.user?._id} value={labTech.user?._id}>
                          {labTech.user?.name} - {labTech.labTech?.department} 
                          {labTech.statistics?.pendingTests > 0 ? 
                            ` (${labTech.statistics.pendingTests} pending)` : ' (Available)'
                          }
                        </option>
                      ))}
                  </select>
                  
                  <div className="mt-2">
                    <button
                      onClick={() => fetchAvailableLabTechs()}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Microscope className="w-4 h-4" />
                      View Available Technicians
                    </button>
                  </div>
                </div>

                {assigningLabTech.labTechId && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Selected Technician</h4>
                    {(() => {
                      const selected = labTechs.find(
                        lt => lt.user?._id === assigningLabTech.labTechId
                      );
                      if (!selected) return null;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{selected.user?.name}</p>
                            <p className="text-sm text-gray-600">
                              {selected.labTech?.department} • {selected.labTech?.specialization}
                            </p>
                            <p className="text-xs text-gray-500">
                              {selected.statistics?.pendingTests || 0} pending tests
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowAssignLabTechModal(false);
                    setAssigningLabTech({ testId: '', labTechId: '' });
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={assignLabTechToTest}
                  disabled={!assigningLabTech.labTechId || !assigningLabTech.testId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Assign Technician
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Technician Details Modal - Remains same */}
      {showLabTechModal && selectedLabTech && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Lab Technician Details</h2>
                <button
                  onClick={() => {
                    setShowLabTechModal(false);
                    setSelectedLabTech(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Lab Tech Details Content - Remains same */}
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white">
                      <User className="w-10 h-10 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{selectedLabTech.user?.name}</h3>
                      <p className="text-gray-600">{selectedLabTech.user?.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          ID: {selectedLabTech.labTech?.employeeId}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getLabTechStatusColor(selectedLabTech.labTech?.isActive)}`}>
                          {selectedLabTech.labTech?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                      Professional Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Department:</span>
                        <span className="font-medium">{selectedLabTech.labTech?.department || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Specialization:</span>
                        <span className="font-medium">{selectedLabTech.labTech?.specialization || 'General'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Experience:</span>
                        <span className="font-medium">{selectedLabTech.labTech?.experience || 0} years</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">License:</span>
                        <span className="font-medium">{selectedLabTech.labTech?.licenseNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-green-500" />
                      Performance Statistics
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total Tests:</span>
                          <span className="font-medium">{selectedLabTech.statistics?.totalTests || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completed Tests:</span>
                          <span className="font-medium">{selectedLabTech.statistics?.completedTests || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pending Tests:</span>
                          <span className="font-medium">{selectedLabTech.statistics?.pendingTests || 0}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Accuracy Rate:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{selectedLabTech.labTech?.accuracyRate || 0}%</span>
                            <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${selectedLabTech.labTech?.accuracyRate || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {selectedLabTech.labTech?.certifiedTests && selectedLabTech.labTech.certifiedTests.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Certifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLabTech.labTech.certifiedTests.map((cert, index) => (
                        <span key={index} className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                          {cert.testName || cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    onClick={() => fetchLabTechPerformance(selectedLabTech.user?._id)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-5 h-5" />
                    View Performance Report
                  </button>
                  <button
                    onClick={() => {
                      if (selectedLabTech.user?._id) {
                        fetchAvailableLabTechs(selectedLabTech.labTech?.department);
                      }
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Find Similar Techs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Lab Technicians Modal - Remains same */}
      {showAvailableLabTechsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Available Lab Technicians</h2>
                <button
                  onClick={() => setShowAvailableLabTechsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {availableLabTechs.map((labTech, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {labTech.userId?.name || labTech.name}
                          </h3>
                          <p className="text-sm text-gray-500">{labTech.employeeId}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-600">{labTech.department}</span>
                            <span className="text-xs text-gray-600">{labTech.specialization}</span>
                            {labTech.experience && (
                              <span className="text-xs text-gray-600">{labTech.experience} years exp</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {labTech.availability && getAvailabilityBadge(labTech.availability)}
                        <span className="text-xs text-gray-500">
                          {labTech.availability?.pendingTests || 0} pending tests
                        </span>
                      </div>
                    </div>

                    {/* Certifications */}
                    {labTech.certifiedTests && labTech.certifiedTests.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Certified in:</p>
                        <div className="flex flex-wrap gap-2">
                          {labTech.certifiedTests.slice(0, 3).map((cert, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                              {cert.testName || cert}
                            </span>
                          ))}
                          {labTech.certifiedTests.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{labTech.certifiedTests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => fetchLabTechById(labTech.userId?._id || labTech._id)}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          toast((t) => (
                            <div className="flex flex-col gap-2">
                              <p>Assign {labTech.userId?.name || labTech.name} to which test?</p>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    setAssigningLabTech(prev => ({
                                      ...prev,
                                      labTechId: labTech.userId?._id || labTech._id
                                    }));
                                    setShowAssignLabTechModal(true);
                                    setShowAvailableLabTechsModal(false);
                                    toast.dismiss(t.id);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                >
                                  Select from Pending Tests
                                </button>
                                <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ), { duration: 10000 });
                        }}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Assign to Test
                      </button>
                    </div>
                  </div>
                ))}

                {availableLabTechs.length === 0 && (
                  <div className="text-center py-8">
                    <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No available lab technicians</h3>
                    <p className="text-gray-500">All technicians are currently busy or on break</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Tech Performance Modal - Remains same */}
      {showLabTechPerformanceModal && labTechPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Lab Technician Performance</h2>
                <button
                  onClick={() => setShowLabTechPerformanceModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Tech Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{labTechPerformance.labTech?.name}</h3>
                      <p className="text-gray-600">{labTechPerformance.labTech?.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-500">{labTechPerformance.labTech?.department}</span>
                        <span className="text-sm text-gray-500">{labTechPerformance.labTech?.employeeId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total Tests For You</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {labTechPerformance.performance?.totalTests || 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Avg. Processing Time</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {labTechPerformance.performance?.avgProcessingHours?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">hours</p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Efficiency</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {labTechPerformance.performance?.avgProcessingHours < 24 ? 'High' : 
                         labTechPerformance.performance?.avgProcessingHours < 48 ? 'Medium' : 'Low'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Tests */}
                {labTechPerformance.recentTests && labTechPerformance.recentTests.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Tests For You</h4>
                    <div className="space-y-3">
                      {labTechPerformance.recentTests.map((test, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-medium text-gray-900">{test.testName}</p>
                            <p className="text-sm text-gray-500">
                              {test.patientId?.userId?.name || 'Unknown Patient'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{formatDate(test.updatedAt)}</p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowLabTechPerformanceModal(false)}
                    className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Close
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

export default DoctorAppointments;