const express = require('express');
const router = express.Router();
const {
  getLabTechProfile,
  getDashboard,
  getNotifications,
  getAssignedTests,
  startTest,
  completeTest,
  submitReport,
  generatePDFReport,
  getReassignmentHistory,
  getPerformanceStats,
  getTestHistory,
  updateProfile,
  createLabTechProfile ,
  getReportStatus,
  getReportDetails ,
  changePassword
  // Add this import
} = require('../../controllers/labtech/labTechController');

const { protect, labTechOnly } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// 🔐 Profile Setup (Special route that doesn't require existing LabTech profile)
router.post('/setup-profile', createLabTechProfile);

// All other routes require LabTech role
router.use(labTechOnly);
// Add these to your labtech routes
router.post('/change-password',changePassword);
router.get('/tests/:testId/report/status', getReportStatus);
router.get('/tests/:testId/report/details', getReportDetails);
// 🔐 Profile & Dashboard
router.get('/me', getLabTechProfile);
router.get('/dashboard', getDashboard);

// 🔔 Notifications
router.get('/notifications', getNotifications);

// 🧾 Tests Management
router.get('/tests', getAssignedTests);
router.patch('/tests/:testId/start', startTest);
router.patch('/tests/:testId/complete', completeTest);
router.post('/tests/:testId/report', submitReport);
router.get('/tests/:testId/history', getReassignmentHistory);

// 📄 PDF Reports
router.get('/tests/:testId/report/pdf', generatePDFReport);

// 📊 Performance & History
router.get('/performance', getPerformanceStats);
router.get('/history', getTestHistory);

// 🔧 Profile Update
router.put('/profile', updateProfile);

module.exports = router;