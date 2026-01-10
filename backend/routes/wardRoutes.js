const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  assignChargeNurse,
  getWardOccupancyReport,
  updateWardStatus
} = require('../controllers/wardcontroller');

// Apply authentication and authorization middleware
router.use(protect);

// Routes accessible to ADMIN and NURSE roles
router.get('/', getAllWards);
router.get('/:id', getWardById);
router.get('/report/occupancy', getWardOccupancyReport);

// Routes accessible only to ADMIN
router.use(authorize('ADMIN'));
router.post('/', createWard);
router.put('/:id', updateWard);
router.delete('/:id', deleteWard);
router.patch('/:id/charge-nurse', assignChargeNurse);
router.patch('/:id/status', authorize('ADMIN'), updateWardStatus);

module.exports = router;