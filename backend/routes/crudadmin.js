const express = require('express');
const router = express.Router();
const adminController = require('../controllers/crudadmin');
const nurseController = require('../controllers/admin/nurseController');
const appointmentController = require('../controllers/admin/appointmentController');
const labTechController = require('../controllers/admin/labtechController');
const pharmacyController = require('../controllers/admin/pharmacyController'); // Add pharmacy controller
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply admin authorization to all routes
router.use(protect);
router.use(authorize('ADMIN'));

/* =====================
   USER MANAGEMENT ROUTES
===================== */

// Get all users with pagination and filtering
router.get('/users', adminController.getAllUsers);

// Get single user with full details
router.get('/users/:id', adminController.getUserById);

// Create new user with role
router.post('/users', adminController.createUser);

// Update user role and status
router.put('/users/:id', adminController.updateUser);

// Deactivate/Activate user
router.patch('/users/:id/status', adminController.toggleUserStatus);

// Delete user (soft delete)
router.delete('/users/:id', adminController.deleteUser);

// Assign role to user
router.post('/users/:id/assign-role', adminController.assignRole);

/* =====================
   PATIENT MANAGEMENT ROUTES
===================== */

// Get all patients with filters
router.get('/patients', adminController.getAllPatients);

// Get single patient details
router.get('/patients/:id', adminController.getPatientById);

// Update patient profile
router.put('/patients/:id', adminController.updatePatient);

/* =====================
   DOCTOR MANAGEMENT ROUTES
===================== */

// Get all doctors
router.get('/doctors', adminController.getAllDoctors);

// Get doctor details
router.get('/doctors/:id', adminController.getDoctorById);

// Create doctor profile
router.post('/doctors/:userId/profile', adminController.createDoctorProfile);

// Update doctor profile
router.put('/doctors/:id/profile', adminController.updateDoctorProfile);

// Delete doctor profile
router.delete('/doctors/:id/profile', adminController.deleteDoctorProfile);

// Get doctor statistics
router.get('/doctors/:id/statistics', adminController.getDoctorStatistics);

// Get doctor's patients
router.get('/doctors/:id/patients', adminController.getDoctorPatients);

// Get doctor's appointments
router.get('/doctors/:id/appointments', adminController.getDoctorAppointments);

// Get doctor's prescriptions
router.get('/doctors/:id/prescriptions', adminController.getDoctorPrescriptions);

// Get doctor's lab tests
router.get('/doctors/:id/lab-tests', adminController.getDoctorLabTests);

// Update doctor specialization
router.patch('/doctors/:id/specialization', adminController.updateDoctorSpecialization);

// Get doctor availability
router.get('/doctors/:id/availability', adminController.getDoctorAvailability);

// Bulk update doctors
router.patch('/doctors/bulk-update', adminController.bulkUpdateDoctors);

// Get doctor performance report
router.get('/doctors/:id/performance-report', adminController.getDoctorPerformanceReport);

/* =====================
   NURSE MANAGEMENT ROUTES
===================== */

// Create nurse with user account
router.post('/nurses', nurseController.createNurse);

// Get all nurses with detailed information
router.get('/nurses', nurseController.getAllNurses);

// Get single nurse with full details
router.get('/nurses/:id', nurseController.getNurseById);

// Update nurse profile
router.put('/nurses/:id', nurseController.updateNurse);

// Delete nurse
router.delete('/nurses/:id', nurseController.deleteNurse);

// Toggle nurse active status
router.patch('/nurses/:id/status', nurseController.toggleNurseStatus);

// Assign nurse to ward
router.post('/nurses/:id/assign-ward', nurseController.assignNurseToWard);

// Set/Remove charge nurse for ward
router.post('/nurses/:id/charge-nurse', nurseController.manageChargeNurse);

// Get nurses by ward
router.get('/nurses/ward/:wardId', nurseController.getNursesByWard);

// Get nurse performance metrics
router.get('/nurses/:id/performance', nurseController.getNursePerformance);

// Get nurse statistics
router.get('/nurses/statistics/summary', nurseController.getNurseStatistics);

// Get nurse schedule
router.get('/nurses/:id/schedule', nurseController.getNurseSchedule);

// Update nurse shift
router.patch('/nurses/:id/shift', nurseController.updateNurseShift);

// Bulk import nurses
router.post('/nurses/bulk/import', nurseController.bulkImportNurses);

// Export nurses data
router.get('/nurses/export', nurseController.exportNurses);

// Get nurse activity report
router.get('/nurses/reports/activity', nurseController.getNurseActivityReport);

// Quick search nurses
router.get('/nurses/search/quick', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { User, Nurse, Ward } = require('../models/schema');
  const mongoose = require('mongoose');
  
  const handler = asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      res.status(400);
      throw new Error('Search query must be at least 2 characters');
    }

    const users = await User.find({
      role: 'NURSE',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    })
    .select('_id name email phone')
    .limit(10)
    .lean();

    const nurseDetails = await Promise.all(
      users.map(async (user) => {
        const nurse = await Nurse.findOne({ userId: user._id })
          .select('employeeId specialization wardId shift')
          .populate('wardId', 'wardNumber name')
          .lean();
        
        return {
          ...user,
          nurse: nurse || {}
        };
      })
    );

    res.status(200).json({
      success: true,
      count: nurseDetails.length,
      data: nurseDetails
    });
  });
  
  return handler(req, res, next);
});

// Get recent activities for a nurse
router.get('/nurses/:id/activities/recent', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { NursingCare, Vitals, User, Patient } = require('../models/schema');
  const mongoose = require('mongoose');
  
  const handler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid nurse ID');
    }

    // Get nursing care activities
    const nursingCare = await NursingCare.find({ nurseId: id })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .select('careType description status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get vitals recording activities
    const vitals = await Vitals.find({ nurseId: id })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .select('recordedAt notes')
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    // Combine and sort activities
    const activities = [
      ...nursingCare.map(activity => ({
        type: 'nursing_care',
        action: `${activity.careType} care`,
        patient: activity.patientId?.userId?.name || 'Unknown',
        description: activity.description,
        status: activity.status,
        timestamp: activity.createdAt
      })),
      ...vitals.map(activity => ({
        type: 'vitals',
        action: 'Vitals recording',
        patient: activity.patientId?.userId?.name || 'Unknown',
        description: activity.notes,
        timestamp: activity.recordedAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, limit);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  });
  
  return handler(req, res, next);
});

// Get nurse dashboard overview statistics
router.get('/nurses/dashboard/overview', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { Nurse, User, NursingCare, Vitals, Ward } = require('../models/schema');
  
  const handler = asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalNurses,
      activeNurses,
      todayActivities,
      wardDistribution,
      shiftDistribution,
      topPerformingNurses,
      recentActivities
    ] = await Promise.all([
      // Total nurses count
      Nurse.countDocuments(),
      
      // Active nurses count
      Nurse.countDocuments({ isActive: true }),
      
      // Today's activities
      NursingCare.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'Completed'
      }),
      
      // Nurses by ward distribution
      Nurse.aggregate([
        {
          $group: {
            _id: '$wardId',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'wards',
            localField: '_id',
            foreignField: '_id',
            as: 'ward'
          }
        },
        {
          $unwind: {
            path: '$ward',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            wardName: { $ifNull: ['$ward.name', 'Unassigned'] },
            wardNumber: { $ifNull: ['$ward.wardNumber', 'N/A'] },
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Nurses by shift distribution
      Nurse.aggregate([
        {
          $group: {
            _id: '$shift',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Top performing nurses (based on completed tasks)
      NursingCare.aggregate([
        {
          $match: {
            status: 'Completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$nurseId',
            completedTasks: { $sum: 1 }
          }
        },
        { $sort: { completedTasks: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'nurses',
            localField: '_id',
            foreignField: 'userId',
            as: 'nurseInfo'
          }
        },
        {
          $unwind: {
            path: '$nurseInfo',
            preserveNullAndEmptyArrays: true
          }
        }
      ]),
      
      // Recent nurse activities
      NursingCare.find()
        .populate({
          path: 'nurseId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .populate({
          path: 'patientId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .select('careType description status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalNurses,
          activeNurses,
          inactiveNurses: totalNurses - activeNurses,
          todayActivities,
          activityRate: totalNurses > 0 ? Math.round((todayActivities / totalNurses) * 100) / 100 : 0
        },
        distribution: {
          byWard: wardDistribution,
          byShift: shiftDistribution
        },
        performance: {
          topNurses: topPerformingNurses.map(nurse => ({
            id: nurse._id,
            name: nurse.userInfo?.name || 'Unknown',
            employeeId: nurse.nurseInfo?.employeeId || 'N/A',
            completedTasks: nurse.completedTasks,
            ward: nurse.nurseInfo?.wardId || 'Unassigned'
          }))
        },
        recentActivities: recentActivities.map(activity => ({
          nurse: activity.nurseId?.userId?.name || 'Unknown',
          patient: activity.patientId?.userId?.name || 'Unknown',
          activity: activity.careType,
          description: activity.description,
          status: activity.status,
          time: activity.createdAt
        }))
      }
    });
  });
  
  return handler(req, res, next);
});

/* =====================
   LAB TECH MANAGEMENT ROUTES
===================== */

// Get all lab technicians
router.get('/lab-techs', labTechController.getAllLabTechs);

// Get lab technician dashboard stats
router.get('/lab-techs/dashboard/stats', labTechController.getLabTechDashboardStats);

// Get single lab tech details
router.get('/lab-techs/:id', labTechController.getLabTechById);

// Create lab technician
router.post('/lab-techs', labTechController.createLabTech);

// Update lab technician profile
router.put('/lab-techs/:id', labTechController.updateLabTech);

// Update lab technician status
router.patch('/lab-techs/:id/status', labTechController.updateLabTechStatus);

// Assign lab technician to lab test
router.post('/lab-techs/tests/:testId/assign', labTechController.assignLabTechToTest);

// Get lab technician performance report
router.get('/lab-techs/:id/performance', labTechController.getLabTechPerformanceReport);

// Update lab technician certifications
router.put('/lab-techs/:id/certifications', labTechController.updateLabTechCertifications);

// Get lab technicians by department
router.get('/lab-techs/department/:department', labTechController.getLabTechsByDepartment);

// Delete lab technician
router.delete('/lab-techs/:id', labTechController.deleteLabTech);

// Reassign tests between lab technicians
router.post('/lab-techs/reassign-tests', labTechController.reassignLabTechTests);

/* =====================
   APPOINTMENT MANAGEMENT ROUTES
===================== */

// Get all appointments with advanced filtering
router.get('/appointments', appointmentController.getAllAppointments);

// Get single appointment details
router.get('/appointments/:id', appointmentController.getAppointmentById);

// Create new appointment
router.post('/appointments', appointmentController.createAppointment);

// Update appointment
router.put('/appointments/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/appointments/:id', appointmentController.deleteAppointment);

// Cancel appointment
router.post('/appointments/:id/cancel', appointmentController.cancelAppointment);

// Complete appointment
router.post('/appointments/:id/complete', appointmentController.completeAppointment);

// Get appointment statistics
router.get('/appointments/analytics/statistics', appointmentController.getAppointmentStatistics);

// Get doctor appointment performance
router.get('/appointments/analytics/doctor-performance', appointmentController.getDoctorAppointmentPerformance);

// Get appointment trends
router.get('/appointments/analytics/trends', appointmentController.getAppointmentTrends);

// Get appointment dashboard metrics
router.get('/appointments/analytics/dashboard', appointmentController.getAppointmentDashboardMetrics);

// Bulk update appointments
router.post('/appointments/bulk/update', appointmentController.bulkUpdateAppointments);

// Export appointments data
router.get('/appointments/export/data', appointmentController.exportAppointments);

/* =====================
   PHARMACY MANAGEMENT ROUTES (COMPREHENSIVE)
===================== */

// ======= MEDICINE CRUD ROUTES =======

// Get all medicines with advanced filtering
router.get('/pharmacy/medicines', pharmacyController.getAllMedicines);

// Get medicine by ID with usage history
router.get('/pharmacy/medicines/:id', pharmacyController.getMedicineById);

// Create new medicine
router.post('/pharmacy/medicines', pharmacyController.createMedicine);

// Update medicine
router.put('/pharmacy/medicines/:id', pharmacyController.updateMedicine);

// Delete medicine
router.delete('/pharmacy/medicines/:id', pharmacyController.deleteMedicine);

// Toggle medicine active status
router.patch('/pharmacy/medicines/:id/status', pharmacyController.toggleMedicineStatus);

// ======= STOCK MANAGEMENT ROUTES =======

// Update medicine stock (bulk)
router.post('/pharmacy/stock/update', pharmacyController.updateStock);

// Get stock history for a medicine
router.get('/pharmacy/medicines/:id/history', pharmacyController.getStockHistory);

// ======= ALERTS & MONITORING ROUTES =======

// Get low stock alerts
router.get('/pharmacy/alerts/low-stock', pharmacyController.getLowStockAlerts);

// Get expired medicines
router.get('/pharmacy/alerts/expired', pharmacyController.getExpiredMedicines);

// ======= ANALYTICS & REPORTING ROUTES =======

// Get pharmacy analytics
router.get('/pharmacy/analytics', pharmacyController.getPharmacyAnalytics);

// Get prescription analytics
router.get('/pharmacy/prescription-analytics', pharmacyController.getPrescriptionAnalytics);

// Generate pharmacy report
router.get('/pharmacy/reports', pharmacyController.generatePharmacyReport);

// Get pharmacy dashboard statistics
router.get('/pharmacy/dashboard', pharmacyController.getPharmacyDashboard);

// ======= LEGACY PHARMACY ROUTES (for backward compatibility) =======
// These routes are from the original adminController - kept for compatibility

// Get all medicines with stock alerts (legacy)
router.get('/pharmacy/inventory', adminController.getPharmacyInventory);

// Update medicine stock (legacy)
router.put('/pharmacy/medicines/:id/stock', adminController.updateMedicineStock);

// Add new medicine (legacy)
router.post('/pharmacy/medicines/add', adminController.addMedicine);

// Delete medicine (legacy)
router.delete('/pharmacy/medicines/:id/delete', adminController.deleteMedicine);

/* =====================
   PRESCRIPTION MANAGEMENT ROUTES
===================== */

// Get all prescriptions
router.get('/prescriptions', adminController.getAllPrescriptions);

/* =====================
   VITALS MANAGEMENT ROUTES
===================== */

// Get all vitals records
router.get('/vitals', adminController.getAllVitals);

/* =====================
   NURSING CARE MANAGEMENT ROUTES
===================== */

// Get all nursing care records
router.get('/nursing-care', adminController.getAllNursingCare);

/* =====================
   SYSTEM ANALYTICS DASHBOARD ROUTES
===================== */

// Get dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

/* =====================
   PATIENT REGISTRATIONS & APPOINTMENTS ROUTES
===================== */

// Get patient registrations with filters
router.get('/registrations/patients', adminController.getPatientRegistrations);

// Get all appointments with filters (legacy)
router.get('/appointments/all', adminController.getAllAppointments);

/* =====================
   LABORATORY MANAGEMENT ROUTES
===================== */

// Get all lab tests with filters
router.get('/lab/tests', adminController.getAllLabTests);

// Update lab test status
router.put('/lab/tests/:id/status', adminController.updateLabTestStatus);

// Create lab test
router.post('/lab/tests', adminController.createLabTest);

/* =====================
   BILLING & REVENUE MANAGEMENT ROUTES
===================== */

// Get all billing records
router.get('/billing', adminController.getAllBilling);

// Update billing status
router.put('/billing/:id/status', adminController.updateBillingStatus);

// Create billing record
router.post('/billing', adminController.createBilling);

// Generate revenue report
router.get('/billing/revenue-report', adminController.generateRevenueReport);

/* =====================
   SYSTEM-WIDE REPORTS ROUTES
===================== */

// Generate comprehensive system report
router.get('/reports/system', adminController.generateSystemReport);
/* =====================
   PRESCRIPTION MANAGEMENT ROUTES
===================== */

// Import prescription controller
const prescriptionController = require('../controllers/admin/prescriptioncontroller');

// ======= PRESCRIPTION CRUD ROUTES =======

// Get all prescriptions with advanced filtering
router.get('/prescriptions', prescriptionController.getAllPrescriptions);

// Get single prescription by ID with detailed information
router.get('/prescriptions/:id', prescriptionController.getPrescriptionById);

// Create new prescription
router.post('/prescriptions', prescriptionController.createPrescription);

// Update prescription
router.put('/prescriptions/:id', prescriptionController.updatePrescription);

// Delete prescription
router.delete('/prescriptions/:id', prescriptionController.deletePrescription);

// ======= MEDICINE ADMINISTRATION ROUTES =======

// Update medicine administration status
router.patch('/prescriptions/:id/medicines/:medicineId/administer', prescriptionController.updateMedicineAdministration);

// Bulk update medicine administration
router.post('/prescriptions/bulk/administer', prescriptionController.bulkUpdateAdministration);

// Get overdue prescriptions
router.get('/prescriptions/overdue', prescriptionController.getOverduePrescriptions);

// ======= ANALYTICS & REPORTING ROUTES =======

// Get prescription statistics
router.get('/prescriptions/analytics/statistics', prescriptionController.getPrescriptionStatistics);

// Export prescriptions data
router.get('/prescriptions/export/data', prescriptionController.exportPrescriptions);

// Validate prescription
router.get('/prescriptions/:id/validate', prescriptionController.validatePrescription);

// ======= PRESCRIPTION DASHBOARD ROUTES =======

// Get prescription dashboard metrics
router.get('/prescriptions/dashboard/metrics', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { 
    Prescription, 
    Patient, 
    Doctor, 
    Medicine,
    Billing 
  } = require('../models/schema');
  const mongoose = require('mongoose');
  
  const handler = asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today.setDate(today.getDate() - 7));
    const startOfMonth = new Date(today.setDate(today.getDate() - 30));

    const [
      totalPrescriptions,
      todayPrescriptions,
      pendingMedicines,
      totalRevenue,
      topMedicines,
      topDoctors,
      recentPrescriptions,
      prescriptionTrends
    ] = await Promise.all([
      // Total prescriptions count
      Prescription.countDocuments(),
      
      // Today's prescriptions
      Prescription.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // Pending medicines for administration
      Prescription.aggregate([
        { $unwind: '$medicines' },
        { 
          $match: { 
            'medicines.administrationStatus': 'Pending'
          } 
        },
        { 
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Total revenue from prescriptions
      Billing.aggregate([
        {
          $lookup: {
            from: 'prescriptions',
            localField: 'prescriptionId',
            foreignField: '_id',
            as: 'prescription'
          }
        },
        { $unwind: '$prescription' },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            pendingRevenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$amount', 0]
              }
            }
          }
        }
      ]),
      
      // Top medicines by usage
      Prescription.aggregate([
        { $unwind: '$medicines' },
        {
          $group: {
            _id: '$medicines.name',
            totalPrescribed: { $sum: '$medicines.quantity' },
            prescriptions: { $addToSet: '$_id' }
          }
        },
        { $sort: { totalPrescribed: -1 } },
        { $limit: 5 }
      ]),
      
      // Top prescribing doctors
      Prescription.aggregate([
        {
          $group: {
            _id: '$doctorId',
            prescriptions: { $sum: 1 },
            totalMedicines: { $sum: { $size: '$medicines' } }
          }
        },
        { $sort: { prescriptions: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        { $unwind: '$doctorInfo' }
      ]),
      
      // Recent prescriptions
      Prescription.find()
        .populate({
          path: 'patientId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .populate({
          path: 'doctorId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .select('createdAt medicines notes')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Prescription trends (last 7 days)
      Prescription.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            medicines: { $sum: { $size: '$medicines' } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate completion rate
    const totalMedicinesResult = await Prescription.aggregate([
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.administrationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMedicines = totalMedicinesResult.reduce((sum, item) => sum + item.count, 0);
    const administeredMedicines = totalMedicinesResult.find(item => item._id === 'Administered')?.count || 0;
    const completionRate = totalMedicines > 0 ? (administeredMedicines / totalMedicines) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPrescriptions,
          todayPrescriptions,
          pendingMedicines: pendingMedicines[0]?.count || 0,
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
          pendingRevenue: totalRevenue[0]?.pendingRevenue || 0,
          completionRate: Math.round(completionRate * 100) / 100
        },
        topMetrics: {
          medicines: topMedicines.map(med => ({
            name: med._id,
            prescribed: med.totalPrescribed,
            prescriptions: med.prescriptions.length
          })),
          doctors: topDoctors.map(doc => ({
            id: doc._id,
            name: doc.doctorInfo.name,
            prescriptions: doc.prescriptions,
            totalMedicines: doc.totalMedicines
          }))
        },
        recent: {
          prescriptions: recentPrescriptions.map(pres => ({
            id: pres._id,
            patient: pres.patientId?.userId?.name || 'Unknown',
            doctor: pres.doctorId?.userId?.name || 'Unknown',
            medicines: pres.medicines.length,
            date: pres.createdAt,
            notes: pres.notes || 'No notes'
          }))
        },
        trends: prescriptionTrends.map(trend => ({
          date: trend._id,
          prescriptions: trend.count,
          medicines: trend.medicines
        }))
      }
    });
  });
  
  return handler(req, res, next);
});

// Get prescription summary for specific patient
router.get('/patients/:id/prescriptions/summary', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { 
    Prescription, 
    Patient, 
    Billing 
  } = require('../models/schema');
  const mongoose = require('mongoose');
  
  const handler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid patient ID');
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    const [
      prescriptions,
      billing,
      medicineStats,
      recentActivity
    ] = await Promise.all([
      // Get all prescriptions for patient
      Prescription.find({ patientId: id })
        .populate({
          path: 'doctorId',
          populate: {
            path: 'userId',
            select: 'name specialization'
          }
        })
        .select('createdAt medicines notes')
        .sort({ createdAt: -1 })
        .lean(),
      
      // Get billing information
      Billing.find({ patientId: id, prescriptionId: { $exists: true, $ne: null } })
        .populate('prescriptionId', 'createdAt')
        .select('amount paymentStatus prescriptionId')
        .lean(),
      
      // Get medicine statistics
      Prescription.aggregate([
        { $match: { patientId: new mongoose.Types.ObjectId(id) } },
        { $unwind: '$medicines' },
        {
          $group: {
            _id: '$medicines.administrationStatus',
            count: { $sum: 1 },
            medicines: { $push: '$medicines.name' }
          }
        }
      ]),
      
      // Get recent administration activity
      Prescription.aggregate([
        { $match: { patientId: new mongoose.Types.ObjectId(id) } },
        { $unwind: '$administrationRecords' },
        { $sort: { 'administrationRecords.timestamp': -1 } },
        { $limit: 10 },
        {
          $project: {
            medicineName: '$administrationRecords.medicineName',
            status: '$administrationRecords.status',
            administeredBy: '$administrationRecords.administeredBy',
            notes: '$administrationRecords.notes',
            timestamp: '$administrationRecords.timestamp'
          }
        }
      ])
    ]);

    // Calculate totals
    const totalPrescriptions = prescriptions.length;
    const totalMedicines = prescriptions.reduce((sum, pres) => sum + pres.medicines.length, 0);
    const totalAmount = billing.reduce((sum, bill) => sum + bill.amount, 0);
    const pendingAmount = billing
      .filter(bill => bill.paymentStatus === 'Pending')
      .reduce((sum, bill) => sum + bill.amount, 0);

    // Group prescriptions by doctor
    const prescriptionsByDoctor = prescriptions.reduce((acc, pres) => {
      const doctorName = pres.doctorId?.userId?.name || 'Unknown Doctor';
      if (!acc[doctorName]) {
        acc[doctorName] = {
          prescriptions: 0,
          medicines: 0
        };
      }
      acc[doctorName].prescriptions += 1;
      acc[doctorName].medicines += pres.medicines.length;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: (await Patient.findById(id).populate('userId', 'name')).userId?.name
        },
        summary: {
          totalPrescriptions,
          totalMedicines,
          totalAmount,
          pendingAmount,
          activePrescriptions: prescriptions.filter(p => 
            p.medicines.some(m => m.administrationStatus === 'Pending')
          ).length
        },
        statistics: {
          medicineStatus: medicineStats,
          prescriptionsByDoctor: Object.entries(prescriptionsByDoctor).map(([doctor, stats]) => ({
            doctor,
            prescriptions: stats.prescriptions,
            medicines: stats.medicines
          }))
        },
        recent: {
          prescriptions: prescriptions.slice(0, 5).map(pres => ({
            id: pres._id,
            doctor: pres.doctorId?.userId?.name || 'Unknown',
            date: pres.createdAt,
            medicines: pres.medicines.length,
            notes: pres.notes || 'No notes'
          })),
          administration: recentActivity
        },
        billing: {
          total: totalAmount,
          pending: pendingAmount,
          paid: totalAmount - pendingAmount,
          records: billing.slice(0, 5)
        }
      }
    });
  });
  
  return handler(req, res, next);
});

// Search prescriptions
router.get('/prescriptions/search/quick', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { 
    Prescription, 
    Patient, 
    Doctor,
    User 
  } = require('../models/schema');
  
  const handler = asyncHandler(async (req, res) => {
    const { q, status, startDate, endDate } = req.query;
    
    if (!q || q.length < 2) {
      res.status(400);
      throw new Error('Search query must be at least 2 characters');
    }

    // Search for patients
    const patients = await Patient.find()
      .populate({
        path: 'userId',
        match: { 
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      })
      .select('_id')
      .lean();
    
    const patientIds = patients.filter(p => p.userId).map(p => p._id);

    // Search for doctors
    const doctors = await Doctor.find()
      .populate({
        path: 'userId',
        match: { 
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      })
      .select('userId')
      .lean();
    
    const doctorIds = doctors.filter(d => d.userId).map(d => d.userId._id);

    // Build query
    const query = {};
    const orConditions = [];

    if (patientIds.length > 0) {
      orConditions.push({ patientId: { $in: patientIds } });
    }
    
    if (doctorIds.length > 0) {
      orConditions.push({ doctorId: { $in: doctorIds } });
    }

    // Search by medicine name
    orConditions.push({ 'medicines.name': { $regex: q, $options: 'i' } });

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Add additional filters
    if (status) {
      query['medicines.administrationStatus'] = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .select('createdAt medicines notes')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions.map(pres => ({
        id: pres._id,
        patient: pres.patientId?.userId?.name || 'Unknown',
        doctor: pres.doctorId?.userId?.name || 'Unknown',
        date: pres.createdAt,
        medicines: pres.medicines.length,
        status: pres.medicines.some(m => m.administrationStatus === 'Pending') ? 'Pending' : 'Completed',
        notes: pres.notes || 'No notes'
      }))
    });
  });
  
  return handler(req, res, next);
});

// Get prescription trends report
router.get('/prescriptions/analytics/trends', async (req, res, next) => {
  const { asyncHandler } = require('../middleware/errorMiddleware');
  const { 
    Prescription, 
    Doctor,
    Medicine 
  } = require('../models/schema');
  
  const handler = asyncHandler(async (req, res) => {
    const { period = 'month', startDate, endDate, groupBy = 'day' } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        createdAt: {}
      };
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      dateFilter.createdAt = { $gte: defaultStartDate };
    }

    const [
      dailyTrends,
      weeklyTrends,
      monthlyTrends,
      doctorTrends,
      medicineTrends
    ] = await Promise.all([
      // Daily trends
      Prescription.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            prescriptions: { $sum: 1 },
            medicines: { $sum: { $size: '$medicines' } },
            uniquePatients: { $addToSet: '$patientId' },
            uniqueDoctors: { $addToSet: '$doctorId' }
          }
        },
        {
          $project: {
            date: '$_id',
            prescriptions: 1,
            medicines: 1,
            uniquePatients: { $size: '$uniquePatients' },
            uniqueDoctors: { $size: '$uniqueDoctors' }
          }
        },
        { $sort: { date: 1 } }
      ]),

      // Weekly trends
      Prescription.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            prescriptions: { $sum: 1 },
            medicines: { $sum: { $size: '$medicines' } }
          }
        },
        {
          $project: {
            week: '$_id.week',
            year: '$_id.year',
            prescriptions: 1,
            medicines: 1
          }
        },
        { $sort: { year: 1, week: 1 } }
      ]),

      // Monthly trends
      Prescription.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$createdAt' }
            },
            prescriptions: { $sum: 1 },
            medicines: { $sum: { $size: '$medicines' } },
            revenue: { $sum: { $size: '$medicines' } } // Note: Actual revenue calculation would require billing data
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top doctors by prescriptions
      Prescription.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$doctorId',
            prescriptions: { $sum: 1 },
            medicines: { $sum: { $size: '$medicines' } }
          }
        },
        { $sort: { prescriptions: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        { $unwind: '$doctorInfo' }
      ]),

      // Top medicines by usage
      Prescription.aggregate([
        { $match: dateFilter },
        { $unwind: '$medicines' },
        {
          $group: {
            _id: '$medicines.name',
            prescribed: { $sum: '$medicines.quantity' },
            prescriptions: { $addToSet: '$_id' }
          }
        },
        { $sort: { prescribed: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate growth rates
    let growthRate = 0;
    if (dailyTrends.length >= 2) {
      const lastDay = dailyTrends[dailyTrends.length - 1].prescriptions;
      const previousDay = dailyTrends[dailyTrends.length - 2].prescriptions;
      growthRate = previousDay > 0 ? ((lastDay - previousDay) / previousDay) * 100 : 0;
    }

    res.status(200).json({
      success: true,
      data: {
        period: period,
        dateRange: {
          start: startDate || 'Auto (last 30 days)',
          end: endDate || 'Current date'
        },
        trends: {
          daily: dailyTrends,
          weekly: weeklyTrends,
          monthly: monthlyTrends
        },
        topPerformers: {
          doctors: doctorTrends.map(doc => ({
            id: doc._id,
            name: doc.doctorInfo.name,
            prescriptions: doc.prescriptions,
            medicines: doc.medicines,
            avgMedicinesPerPrescription: doc.prescriptions > 0 
              ? Math.round((doc.medicines / doc.prescriptions) * 100) / 100 
              : 0
          })),
          medicines: medicineTrends.map(med => ({
            name: med._id,
            prescribed: med.prescribed,
            prescriptions: med.prescriptions.length
          }))
        },
        summary: {
          totalPrescriptions: dailyTrends.reduce((sum, day) => sum + day.prescriptions, 0),
          totalMedicines: dailyTrends.reduce((sum, day) => sum + day.medicines, 0),
          avgPrescriptionsPerDay: dailyTrends.length > 0 
            ? Math.round((dailyTrends.reduce((sum, day) => sum + day.prescriptions, 0) / dailyTrends.length) * 100) / 100 
            : 0,
          growthRate: Math.round(growthRate * 100) / 100
        }
      }
    });
  });
  
  return handler(req, res, next);
});
module.exports = router;