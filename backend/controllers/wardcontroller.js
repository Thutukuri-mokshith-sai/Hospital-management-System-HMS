const mongoose = require('mongoose');
const { Ward, Nurse, Patient } = require('../models/schema');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Get all wards
exports.getAllWards = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, specialty, isAvailable, search } = req.query;

  const query = {};

  if (specialty) query.specialty = specialty;
  if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
  
  if (search) {
    query.$or = [
      { wardNumber: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
  }

  const wards = await Ward.find(query)
    .populate('chargeNurseId', 'userId')
    .populate({
      path: 'chargeNurseId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ floor: 1, wardNumber: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Get additional stats for each ward
  const enhancedWards = await Promise.all(
    wards.map(async (ward) => {
      const [nurseCount, patientCount, availableBeds] = await Promise.all([
        Nurse.countDocuments({ wardId: ward._id, isActive: true }),
        Patient.countDocuments({ wardId: ward._id, isAdmitted: true }),
        ward.bedCount - await Patient.countDocuments({ wardId: ward._id, isAdmitted: true })
      ]);

      return {
        ...ward,
        statistics: {
          nurseCount,
          patientCount,
          availableBeds,
          occupancyRate: ((patientCount / ward.bedCount) * 100).toFixed(2)
        }
      };
    })
  );

  const total = await Ward.countDocuments(query);

  res.status(200).json({
    success: true,
    count: enhancedWards.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: enhancedWards
  });
});

// Get single ward details
exports.getWardById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid ward ID');
  }

  const ward = await Ward.findById(id)
    .populate('chargeNurseId', 'userId')
    .populate({
      path: 'chargeNurseId',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    .lean();

  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  // Get nurses assigned to this ward
  const nurses = await Nurse.find({ wardId: id, isActive: true })
    .populate({
      path: 'userId',
      select: 'name email phone'
    })
    .select('-password')
    .lean();

  // Get patients admitted in this ward
  const patients = await Patient.find({ wardId: id, isAdmitted: true })
    .populate({
      path: 'userId',
      select: 'name phone'
    })
    .lean();

  // Get available beds
  const occupiedBeds = patients.map(p => p.bedNumber).filter(bed => bed);
  const allBeds = Array.from({ length: ward.bedCount }, (_, i) => (i + 1).toString());
  const availableBeds = allBeds.filter(bed => !occupiedBeds.includes(bed));

  res.status(200).json({
    success: true,
    data: {
      ward,
      statistics: {
        nurseCount: nurses.length,
        patientCount: patients.length,
        availableBeds: availableBeds.length,
        occupancyRate: ((patients.length / ward.bedCount) * 100).toFixed(2)
      },
      nurses,
      patients,
      availableBeds
    }
  });
});

// Create new ward
exports.createWard = asyncHandler(async (req, res, next) => {
  const { wardNumber, name, floor, bedCount, specialty, chargeNurseId } = req.body;

  if (!wardNumber || !name || !floor || !bedCount) {
    res.status(400);
    throw new Error('Ward number, name, floor, and bed count are required');
  }

  // Check if ward number already exists
  const existingWard = await Ward.findOne({ wardNumber });
  if (existingWard) {
    res.status(409);
    throw new Error('Ward with this number already exists');
  }

  // Validate charge nurse if provided
  if (chargeNurseId) {
    const nurse = await Nurse.findById(chargeNurseId);
    if (!nurse) {
      res.status(404);
      throw new Error('Charge nurse not found');
    }
  }

  const ward = await Ward.create({
    wardNumber,
    name,
    floor,
    bedCount,
    specialty: specialty || 'General',
    chargeNurseId
  });

  res.status(201).json({
    success: true,
    message: 'Ward created successfully',
    data: ward
  });
});

// Update ward
exports.updateWard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid ward ID');
  }

  // Check if updating ward number to one that already exists
  if (updateData.wardNumber) {
    const existingWard = await Ward.findOne({ 
      wardNumber: updateData.wardNumber,
      _id: { $ne: id }
    });
    if (existingWard) {
      res.status(409);
      throw new Error('Ward with this number already exists');
    }
  }

  // Validate charge nurse if provided
  if (updateData.chargeNurseId) {
    const nurse = await Nurse.findById(updateData.chargeNurseId);
    if (!nurse) {
      res.status(404);
      throw new Error('Charge nurse not found');
    }
  }

  const ward = await Ward.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  res.status(200).json({
    success: true,
    message: 'Ward updated successfully',
    data: ward
  });
});
exports.updateWardStatus = asyncHandler(async (req, res) => {
  const ward = await Ward.findByIdAndUpdate(
    req.params.id,
    { isAvailable: req.body.isAvailable },
    { new: true }
  );

  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  res.json({ success: true, data: ward });
});

// Delete ward
exports.deleteWard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid ward ID');
  }

  const ward = await Ward.findById(id);
  
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  // Check if ward has patients
  const patientCount = await Patient.countDocuments({ wardId: id, isAdmitted: true });
  if (patientCount > 0) {
    res.status(400);
    throw new Error('Cannot delete ward with admitted patients');
  }

  // Check if ward has nurses assigned
  const nurseCount = await Nurse.countDocuments({ wardId: id });
  if (nurseCount > 0) {
    res.status(400);
    throw new Error('Cannot delete ward with assigned nurses');
  }

  await Ward.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Ward deleted successfully'
  });
});

// Assign charge nurse to ward
exports.assignChargeNurse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { chargeNurseId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid ward ID');
  }

  if (!chargeNurseId) {
    res.status(400);
    throw new Error('Charge nurse ID is required');
  }

  const ward = await Ward.findById(id);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  const nurse = await Nurse.findById(chargeNurseId);
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  // Check if nurse is assigned to this ward
  if (nurse.wardId.toString() !== id) {
    res.status(400);
    throw new Error('Nurse must be assigned to this ward first');
  }

  ward.chargeNurseId = chargeNurseId;
  await ward.save();

  res.status(200).json({
    success: true,
    message: 'Charge nurse assigned successfully',
    data: ward
  });
});

// Get ward occupancy report
exports.getWardOccupancyReport = asyncHandler(async (req, res, next) => {
  const { specialty } = req.query;

  const query = {};
  if (specialty) query.specialty = specialty;

  const wards = await Ward.find(query).lean();

  const occupancyReport = await Promise.all(
    wards.map(async (ward) => {
      const patientCount = await Patient.countDocuments({ 
        wardId: ward._id, 
        isAdmitted: true 
      });
      
      const occupancyRate = ((patientCount / ward.bedCount) * 100).toFixed(2);
      const availableBeds = ward.bedCount - patientCount;

      return {
        wardNumber: ward.wardNumber,
        name: ward.name,
        specialty: ward.specialty,
        floor: ward.floor,
        totalBeds: ward.bedCount,
        occupiedBeds: patientCount,
        availableBeds,
        occupancyRate: parseFloat(occupancyRate),
        isFull: patientCount === ward.bedCount
      };
    })
  );

  // Calculate totals
  const totals = occupancyReport.reduce((acc, ward) => ({
    totalBeds: acc.totalBeds + ward.totalBeds,
    occupiedBeds: acc.occupiedBeds + ward.occupiedBeds,
    availableBeds: acc.availableBeds + ward.availableBeds,
    fullWards: acc.fullWards + (ward.isFull ? 1 : 0)
  }), { totalBeds: 0, occupiedBeds: 0, availableBeds: 0, fullWards: 0 });

  totals.occupancyRate = ((totals.occupiedBeds / totals.totalBeds) * 100).toFixed(2);

  res.status(200).json({
    success: true,
    data: {
      report: occupancyReport,
      totals,
      summary: {
        totalWards: wards.length,
        averageOccupancy: (occupancyReport.reduce((sum, ward) => sum + parseFloat(ward.occupancyRate), 0) / wards.length).toFixed(2),
        fullWards: totals.fullWards
      }
    }
  });
});