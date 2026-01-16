const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/patients/patientController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// All patient routes require authentication and PATIENT role
router.use(protect, authorize('PATIENT'));

/* ===== PATIENT PROFILE ===== */
router.route('/me')
  .get(patientController.getMyProfile)
  .put(patientController.updateMyProfile);

/* ===== APPOINTMENTS ===== */
router.route('/appointments')
  .get(patientController.getMyAppointments)
  .post(patientController.requestAppointment);

router.route('/appointments/:id')
  .get(patientController.getAppointmentById)
  .put(patientController.cancelAppointment);

/* ===== DOCTOR AVAILABILITY ===== */
router.get('/doctors/available', patientController.getAvailableDoctors);
router.get('/doctors/:doctorId/availability/:date', patientController.getDoctorAvailability);

/* ===== PRESCRIPTIONS ===== */
router.get('/prescriptions', patientController.getMyPrescriptions);
router.get('/prescriptions/:id', patientController.getPrescriptionById);

/* ===== LAB TESTS & REPORTS ===== */
router.get('/lab-tests', patientController.getMyLabTests);
router.get('/lab-tests/:id', patientController.getLabTestById);
/* ===== LAB REPORTS VIEW & DOWNLOAD ===== */
router.get('/lab-reports/:labTestId', patientController.getLabReport);
router.get('/lab-reports/:labTestId/download-pdf', patientController.downloadLabReportPDF);
/* ===== MEDICAL HISTORY & VITALS ===== */
router.get('/medical-history', patientController.getMedicalHistory);
router.get('/vitals', patientController.getMyVitals);

/* ===== BILLING & PAYMENTS ===== */
router.get('/bills', patientController.getMyBills);
router.get('/bills/:id', patientController.getBillById);
router.post('/bills/:id/pay', patientController.payBill);
// In patientRoutes.js or similar
router.get('/bills/:id/download',  patientController.downloadBillPDF);
/* ===== DASHBOARD ===== */
router.get('/dashboard', patientController.getDashboard);

/* ===== NOTIFICATIONS ===== */
router.get('/notifications', patientController.getNotifications);

/* ===== HEALTHCARE TEAM ===== */
router.get('/doctors', patientController.getMyDoctors);
router.get('/nurses', patientController.getMyNurses);

/* ===== ADMISSION & WARD ===== */
router.get('/ward-info', patientController.getWardInfo);

/* ===== ACCOUNT SETTINGS ===== */
router.put('/change-password', patientController.changePassword);

/* ===== EMERGENCY CONTACT ===== */
router.route('/emergency-contact')
  .get(patientController.getEmergencyContact)
  .put(patientController.updateEmergencyContact);

module.exports = router;