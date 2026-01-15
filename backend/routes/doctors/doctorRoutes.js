const express = require('express');
const router = express.Router();

// Import all controller functions
const doctorController = require('../../controllers/doctors/doctorController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// All doctor routes require authentication and DOCTOR role
router.use(protect, authorize('DOCTOR'));

/* ===== DOCTOR PROFILE ===== */
router.route('/me')
  .get(doctorController.getMyProfile)
  .put(doctorController.updateMyProfile);

/* ===== APPOINTMENTS ===== */
router.get('/appointments', doctorController.getMyAppointments);
router.get('/appointments/:id', doctorController.getAppointmentById);
router.put('/appointments/:id/status', doctorController.updateAppointmentStatus);
router.put('/appointments/:id/notes', doctorController.addAppointmentNotes);

/* ===== PATIENTS ===== */
router.get('/patients', doctorController.getMyPatients);
router.get('/patients/:id', doctorController.getPatientById);
router.get('/patients/:id/vitals', doctorController.getPatientVitals);
router.get('/patients/:id/history', doctorController.getPatientHistory);

/* ===== PRESCRIPTIONS ===== */
router.route('/prescriptions')
  .get(doctorController.getMyPrescriptions)
  .post(doctorController.createPrescription);

router.get('/prescriptions/:id', doctorController.getPrescriptionById);
router.post('/prescriptions/:id/send-to-pharmacy', doctorController.sendToPharmacy);
router.get('/prescriptions/:id/full', doctorController.getFullPrescriptionById);

/* ===== LAB TESTS ===== */
router.route('/lab-tests')
  .get(doctorController.getMyLabTests)
  .post(doctorController.requestLabTest);

router.get('/lab-tests/:id', doctorController.getLabTestById);

/* ===== LAB TECH MANAGEMENT ===== */
router.get('/lab-techs', doctorController.getAllLabTechs); // Get all lab techs
router.get('/lab-techs/available', doctorController.getAvailableLabTechs); // Get available lab techs
router.get('/lab-techs/department/:department', doctorController.getLabTechsByDepartment); // Get lab techs by department
router.get('/lab-techs/:id', doctorController.getLabTechById); // Get specific lab tech
router.get('/lab-techs/:id/performance', doctorController.getLabTechPerformance); // Get lab tech performance for doctor's tests
router.post('/lab-tests/:testId/assign-lab-tech', doctorController.assignLabTechToTest); // Assign lab tech to test

/* ===== LAB REPORTS ===== */
router.get('/lab-reports/:labTestId', doctorController.getLabReport);
router.get('/patients/:patientId/lab-tests', doctorController.getLabTestsByDoctorAndPatient);
/* ===== DASHBOARD & STATS ===== */
router.get('/dashboard/stats', doctorController.getDashboardStats);
router.get('/dashboard/quick-stats', doctorController.getQuickStats);
router.get('/dashboard/activity', doctorController.getRecentActivity);

/* ===== NOTIFICATIONS ===== */
router.get('/notifications', doctorController.getNotifications);

/* ===== PHARMACY ===== */
router.get('/pharmacy-reports', doctorController.getPharmacyReports);

/* ===== PATIENT DISCHARGE ===== */
router.post('/patients/:id/discharge', doctorController.createDischargeSummary);

module.exports = router;