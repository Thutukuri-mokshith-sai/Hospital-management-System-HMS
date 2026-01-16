const express = require('express');
const router = express.Router();

// Import controller
const pharmacistController = require('../../controllers/pharma/pharmacistController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// All pharmacist routes require authentication and PHARMACIST role
router.use(protect, authorize('PHARMACIST'));

/* ===== DASHBOARD & OVERVIEW ===== */
router.get('/dashboard/stats', pharmacistController.getPharmacistDashboard);
router.get('/notifications', pharmacistController.getNotifications);

/* ===== PATIENT MANAGEMENT ===== */
router.get('/patients', pharmacistController.getPatients);
router.get('/patients/:id', pharmacistController.getPatientById);

/* ===== PRESCRIPTION MANAGEMENT ===== */
router.get('/prescriptions', pharmacistController.getPrescriptions);
router.get('/prescriptions/:id', pharmacistController.getPrescriptionById);
router.post('/prescriptions/:id/quick-process', pharmacistController.quickProcessPrescription);

/* ===== MEDICINE INVENTORY ===== */
router.get('/medicines', pharmacistController.getMedicines);
router.get('/medicines/search', pharmacistController.searchMedicines);
router.put('/medicines/:id/stock', pharmacistController.updateMedicineStock);

/* ===== BILLING MANAGEMENT ===== */
router.get('/bills', pharmacistController.getBills);
router.get('/bills/:id', pharmacistController.getBillById);
router.post('/bills', pharmacistController.createBill);
router.put('/bills/:id/payment', pharmacistController.updateBillPayment);

/* ===== REPORTS & ANALYTICS ===== */
router.get('/reports/sales', pharmacistController.getSalesReport);
router.get('/reports/inventory', pharmacistController.getInventoryReport);

module.exports = router;