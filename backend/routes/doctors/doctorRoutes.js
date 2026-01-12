const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/doctors/doctorController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Apply authentication and doctor role authorization to all routes
router.use(protect);
router.use(authorize('DOCTOR'));

/* =====================
   DOCTOR DASHBOARD
===================== */
router.get('/dashboard', doctorController.getDashboard);

/* =====================
   APPOINTMENT MANAGEMENT
===================== */
router.route('/appointments')
  .get(doctorController.getAppointments);

router.route('/appointments/:id')
  .get(doctorController.getAppointment)
  .put(doctorController.updateAppointment);

/* =====================
   PATIENT MANAGEMENT
===================== */
router.route('/patients')
  .get(doctorController.getPatients);

router.route('/patients/:id')
  .get(doctorController.getPatient);

/* =====================
   PRESCRIPTIONS MANAGEMENT
===================== */
router.route('/prescriptions')
  .get(doctorController.getPrescriptions)
  .post(doctorController.createPrescription);

router.route('/prescriptions/:id')
  .put(doctorController.updatePrescription);

/* =====================
   LAB TESTS MANAGEMENT
===================== */
router.route('/lab-tests')
  .get(doctorController.getLabTests)
  .post(doctorController.orderLabTest);

router.route('/lab-reports')
  .get(doctorController.getLabReports);

/* =====================
   IN-PATIENT MONITORING
===================== */
router.get('/admitted-patients', doctorController.getAdmittedPatients);

/* =====================
   ALERTS & NOTIFICATIONS
===================== */
router.get('/alerts', doctorController.getAlerts);

/* =====================
   PROFILE & SETTINGS
===================== */
router.route('/profile')
  .get(doctorController.getProfile)
  .put(doctorController.updateProfile);

router.put('/change-password', doctorController.changePassword);

module.exports = router;