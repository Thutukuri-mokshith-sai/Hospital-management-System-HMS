const mongoose = require('mongoose');
const { 
  Prescription, 
  User, 
  Patient, 
  Doctor, 
  Appointment, 
  Medicine,
  Billing,
  Nurse
} = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   PRESCRIPTION CRUD OPERATIONS
===================== */

// Create new prescription
exports.createPrescription = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    doctorId,
    appointmentId,
    medicines,
    notes
  } = req.body;

  // Validate required fields
  if (!patientId || !doctorId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
    res.status(400);
    throw new Error('Patient ID, doctor ID, and at least one medicine are required');
  }

  // Validate patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate doctor exists and has doctor role
  const doctorUser = await User.findById(doctorId);
  if (!doctorUser || doctorUser.role !== 'DOCTOR') {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const doctor = await Doctor.findOne({ userId: doctorId });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Validate appointment if provided
  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }
  }

  // Validate medicines and check stock
  const validatedMedicines = await Promise.all(
    medicines.map(async (med, index) => {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        throw new Error(`Medicine at index ${index} is missing required fields`);
      }

      if (med.medicineId) {
        const medicine = await Medicine.findById(med.medicineId);
        if (!medicine) {
          throw new Error(`Medicine with ID ${med.medicineId} not found`);
        }
        
        // Check stock if quantity is specified
        if (med.quantity && medicine.stockQuantity < med.quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`);
        }
      }

      return {
        medicineId: med.medicineId || null,
        name: med.name,
        quantity: med.quantity || 1,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        administrationStatus: 'Pending',
        nextDue: calculateNextDue(med.frequency)
      };
    })
  );

  try {
    // Create prescription
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId,
      medicines: validatedMedicines,
      notes
    });

    // Update medicine stock
    await Promise.all(
      validatedMedicines.map(async med => {
        if (med.medicineId && med.quantity) {
          await Medicine.findByIdAndUpdate(
            med.medicineId,
            { $inc: { stockQuantity: -med.quantity } }
          );
        }
      })
    );

    // Create billing record
    const totalAmount = await calculatePrescriptionAmount(validatedMedicines);
    const billing = await Billing.create({
      patientId,
      prescriptionId: prescription._id,
      appointmentId,
      amount: totalAmount,
      paymentStatus: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        prescription,
        billing: {
          id: billing._id,
          amount: billing.amount,
          paymentStatus: billing.paymentStatus
        }
      }
    });

  } catch (error) {
    throw error;
  }
});

// Helper function to calculate next due date
function calculateNextDue(frequency) {
  const now = new Date();
  switch (frequency.toLowerCase()) {
    case 'daily':
    case 'once daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'twice daily':
    case 'bid':
      now.setHours(now.getHours() + 12);
      break;
    case 'thrice daily':
    case 'tid':
      now.setHours(now.getHours() + 8);
      break;
    case 'every 6 hours':
    case 'q6h':
      now.setHours(now.getHours() + 6);
      break;
    case 'every 8 hours':
    case 'q8h':
      now.setHours(now.getHours() + 8);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  return now;
}

// Helper function to calculate prescription amount
async function calculatePrescriptionAmount(medicines) {
  let total = 0;
  
  for (const med of medicines) {
    if (med.medicineId) {
      const medicine = await Medicine.findById(med.medicineId);
      if (medicine) {
        total += medicine.price * (med.quantity || 1);
      }
    } else {
      // Default price for medicines not in inventory
      total += 10 * (med.quantity || 1);
    }
  }
  
  return total;
}

// Get all prescriptions
exports.getAllPrescriptions = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    patientId,
    doctorId,
    status,
    startDate,
    endDate,
    search
  } = req.query;

  const query = {};

  if (patientId) {
    query.patientId = patientId;
  }

  if (doctorId) {
    query.doctorId = doctorId;
  }

  if (status) {
    query['medicines.administrationStatus'] = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Search by patient or doctor name
  if (search) {
    const patients = await Patient.find()
      .populate({
        path: 'userId',
        match: { name: { $regex: search, $options: 'i' } }
      })
      .select('_id')
      .lean();
    
    const patientIds = patients.filter(p => p.userId).map(p => p._id);
    
    const doctors = await Doctor.find()
      .populate({
        path: 'userId',
        match: { name: { $regex: search, $options: 'i' } }
      })
      .select('_id')
      .lean();
    
    const doctorIds = doctors.filter(d => d.userId).map(d => d._id);

    if (patientIds.length > 0 || doctorIds.length > 0) {
      query.$or = [];
      if (patientIds.length > 0) query.$or.push({ patientId: { $in: patientIds } });
      if (doctorIds.length > 0) query.$or.push({ doctorId: { $in: doctorIds } });
    }
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
    .populate('appointmentId', 'date status')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Calculate statistics for each prescription
  const prescriptionsWithStats = prescriptions.map(prescription => {
    const totalMedicines = prescription.medicines.length;
    const pendingMedicines = prescription.medicines.filter(m => m.administrationStatus === 'Pending').length;
    const administeredMedicines = prescription.medicines.filter(m => m.administrationStatus === 'Administered').length;
    
    return {
      ...prescription,
      statistics: {
        totalMedicines,
        pendingMedicines,
        administeredMedicines,
        completionRate: totalMedicines > 0 ? (administeredMedicines / totalMedicines) * 100 : 0
      }
    };
  });

  const total = await Prescription.countDocuments(query);

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prescriptionsWithStats
  });
});

// Get single prescription by ID
exports.getPrescriptionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }

  const prescription = await Prescription.findById(id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'name specialization'
      }
    })
    .populate('appointmentId', 'date time status')
    .populate('medicines.medicineId', 'name category price unit')
    .lean();

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Get billing information
  const billing = await Billing.findOne({ prescriptionId: id })
    .populate('patientId', 'userId')
    .lean();

  // Get administration records
  const administrationStats = await Prescription.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.administrationStatus',
        count: { $sum: 1 },
        medicines: { $push: '$medicines.name' }
      }
    }
  ]);

  // Get recent administration history
  const recentAdministrations = prescription.administrationRecords
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      prescription,
      billing,
      statistics: {
        totalMedicines: prescription.medicines.length,
        administrationStats,
        overdueMedicines: prescription.medicines.filter(m => 
          m.nextDue && new Date(m.nextDue) < new Date() && m.administrationStatus === 'Pending'
        ).length
      },
      recentAdministrations
    }
  });
});

// Update prescription
exports.updatePrescription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }

  const prescription = await Prescription.findById(id);
  
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  try {
    // Handle medicines update
    if (updateData.medicines && Array.isArray(updateData.medicines)) {
      // Validate and update medicines
      const updatedMedicines = await Promise.all(
        updateData.medicines.map(async (med, index) => {
          if (med._id) {
            // Update existing medicine
            const existingMed = prescription.medicines.id(med._id);
            if (existingMed) {
              // Update stock if quantity changed
              if (med.quantity && existingMed.quantity !== med.quantity) {
                const quantityDiff = med.quantity - existingMed.quantity;
                if (existingMed.medicineId) {
                  const medicine = await Medicine.findById(existingMed.medicineId);
                  if (medicine.stockQuantity < quantityDiff) {
                    throw new Error(`Insufficient stock for ${medicine.name}`);
                  }
                  await Medicine.findByIdAndUpdate(
                    existingMed.medicineId,
                    { $inc: { stockQuantity: -quantityDiff } }
                  );
                }
              }
              
              Object.keys(med).forEach(key => {
                if (key !== '_id' && existingMed[key] !== undefined) {
                  existingMed[key] = med[key];
                }
              });
              
              if (med.frequency) {
                existingMed.nextDue = calculateNextDue(med.frequency);
              }
              
              return existingMed;
            }
          }
          
          // Add new medicine
          if (!med.name || !med.dosage || !med.frequency || !med.duration) {
            throw new Error(`New medicine at index ${index} is missing required fields`);
          }
          
          const newMed = {
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            quantity: med.quantity || 1,
            instructions: med.instructions || '',
            administrationStatus: 'Pending',
            nextDue: calculateNextDue(med.frequency)
          };
          
          if (med.medicineId) {
            newMed.medicineId = med.medicineId;
            const medicine = await Medicine.findById(med.medicineId);
            if (medicine) {
              if (medicine.stockQuantity < (med.quantity || 1)) {
                throw new Error(`Insufficient stock for ${medicine.name}`);
              }
              await Medicine.findByIdAndUpdate(
                med.medicineId,
                { $inc: { stockQuantity: -(med.quantity || 1) } }
              );
            }
          }
          
          return newMed;
        })
      );
      
      updateData.medicines = updatedMedicines;
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
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
      });

    // Update billing if medicines changed
    if (updateData.medicines) {
      const totalAmount = await calculatePrescriptionAmount(updatedPrescription.medicines);
      await Billing.findOneAndUpdate(
        { prescriptionId: id },
        { amount: totalAmount },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });

  } catch (error) {
    throw error;
  }
});

// Delete prescription
exports.deletePrescription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }

  const prescription = await Prescription.findById(id);
  
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  try {
    // Restore medicine stock
    await Promise.all(
      prescription.medicines.map(async med => {
        if (med.medicineId && med.quantity) {
          await Medicine.findByIdAndUpdate(
            med.medicineId,
            { $inc: { stockQuantity: med.quantity } }
          );
        }
      })
    );

    // Delete associated billing record
    await Billing.deleteOne({ prescriptionId: id });

    // Delete prescription
    await Prescription.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    throw error;
  }
});

// Update medicine administration status
exports.updateMedicineAdministration = asyncHandler(async (req, res, next) => {
  const { id, medicineId } = req.params;
  const { 
    status, 
    notes,
    administeredBy 
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }

  if (!status || !['Pending', 'Administered', 'Skipped', 'Cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Valid status is required');
  }

  const prescription = await Prescription.findById(id);
  
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  const medicine = prescription.medicines.id(medicineId);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found in prescription');
  }

  try {
    // Update medicine status
    medicine.administrationStatus = status;
    medicine.lastAdministered = status === 'Administered' ? new Date() : null;
    medicine.nextDue = status === 'Administered' ? calculateNextDue(medicine.frequency) : medicine.nextDue;
    
    if (administeredBy) {
      medicine.administeredBy = administeredBy;
    }

    // Add to administration records
    if (status === 'Administered' || status === 'Skipped') {
      prescription.administrationRecords.push({
        medicineName: medicine.name,
        status,
        administeredBy,
        notes,
        timestamp: new Date()
      });
    }

    await prescription.save();

    res.status(200).json({
      success: true,
      message: `Medicine ${status.toLowerCase()} successfully`,
      data: {
        prescriptionId: id,
        medicineId,
        status,
        lastAdministered: medicine.lastAdministered,
        nextDue: medicine.nextDue
      }
    });

  } catch (error) {
    throw error;
  }
});

/* =====================
   PRESCRIPTION ANALYTICS & REPORTS
===================== */

// Get prescription statistics
exports.getPrescriptionStatistics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, doctorId, patientId } = req.query;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (doctorId) {
    matchStage.doctorId = doctorId;
  }

  if (patientId) {
    matchStage.patientId = patientId;
  }

  const [
    prescriptionStats,
    medicineStats,
    doctorStats,
    timelineStats,
    statusStats
  ] = await Promise.all([
    // Overall prescription statistics
    Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          totalMedicines: { $sum: { $size: '$medicines' } },
          avgMedicinesPerPrescription: { $avg: { $size: '$medicines' } },
          totalPatients: { $addToSet: '$patientId' },
          totalDoctors: { $addToSet: '$doctorId' }
        }
      }
    ]),

    // Medicine usage statistics
    Prescription.aggregate([
      { $match: matchStage },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.name',
          totalPrescribed: { $sum: '$medicines.quantity' },
          prescriptions: { $addToSet: '$_id' }
        }
      },
      { $sort: { totalPrescribed: -1 } },
      { $limit: 10 }
    ]),

    // Doctor prescription statistics
    Prescription.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: '$doctorInfo' },
      {
        $group: {
          _id: '$doctorId',
          doctorName: { $first: '$doctorInfo.name' },
          totalPrescriptions: { $sum: 1 },
          totalMedicines: { $sum: { $size: '$medicines' } }
        }
      },
      { $sort: { totalPrescriptions: -1 } },
      { $limit: 10 }
    ]),

    // Timeline statistics (daily prescriptions)
    Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          prescriptions: { $sum: 1 },
          medicines: { $sum: { $size: '$medicines' } }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Medicine administration status statistics
    Prescription.aggregate([
      { $match: matchStage },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.administrationStatus',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: prescriptionStats[0] || {},
      topMedicines: medicineStats,
      topDoctors: doctorStats,
      timeline: timelineStats,
      administrationStatus: statusStats,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    }
  });
});

/* =====================
   PRESCRIPTION EXPORT & REPORTING
===================== */

// Export prescriptions to CSV
exports.exportPrescriptions = asyncHandler(async (req, res, next) => {
  const {
    format = 'csv',
    startDate,
    endDate,
    doctorId,
    patientId
  } = req.query;

  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (doctorId) {
    query.doctorId = doctorId;
  }

  if (patientId) {
    query.patientId = patientId;
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
    .populate('appointmentId', 'date')
    .sort({ createdAt: -1 })
    .lean();

  // Prepare export data
  const exportData = prescriptions.map(prescription => ({
    prescriptionId: prescription._id,
    date: prescription.createdAt.toISOString().split('T')[0],
    patientName: prescription.patientId?.userId?.name || 'Unknown',
    doctorName: prescription.doctorId?.userId?.name || 'Unknown',
    appointmentDate: prescription.appointmentId?.date 
      ? new Date(prescription.appointmentId.date).toISOString().split('T')[0]
      : 'N/A',
    totalMedicines: prescription.medicines.length,
    medicines: prescription.medicines.map(m => 
      `${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`
    ).join('; '),
    notes: prescription.notes || '',
    createdAt: prescription.createdAt
  }));

  if (format === 'csv') {
    const csv = convertToCSV(exportData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=prescriptions_export.csv');
    
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    count: exportData.length,
    data: exportData
  });
});

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle special characters and commas
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/* =====================
   PRESCRIPTION BULK OPERATIONS
===================== */

// Bulk update medicine administration
exports.bulkUpdateAdministration = asyncHandler(async (req, res, next) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400);
    throw new Error('Updates array is required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = {
      success: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const { prescriptionId, medicineId, status, notes, administeredBy } = update;

        if (!prescriptionId || !medicineId || !status) {
          results.failed.push({
            prescriptionId: prescriptionId || 'N/A',
            medicineId: medicineId || 'N/A',
            reason: 'Missing required fields'
          });
          continue;
        }

        const prescription = await Prescription.findById(prescriptionId).session(session);
        if (!prescription) {
          results.failed.push({
            prescriptionId,
            medicineId,
            reason: 'Prescription not found'
          });
          continue;
        }

        const medicine = prescription.medicines.id(medicineId);
        if (!medicine) {
          results.failed.push({
            prescriptionId,
            medicineId,
            reason: 'Medicine not found in prescription'
          });
          continue;
        }

        // Update medicine status
        medicine.administrationStatus = status;
        medicine.lastAdministered = status === 'Administered' ? new Date() : null;
        medicine.nextDue = status === 'Administered' ? calculateNextDue(medicine.frequency) : medicine.nextDue;
        
        if (administeredBy) {
          medicine.administeredBy = administeredBy;
        }

        // Add to administration records
        if (status === 'Administered' || status === 'Skipped') {
          prescription.administrationRecords.push({
            medicineName: medicine.name,
            status,
            administeredBy,
            notes,
            timestamp: new Date()
          });
        }

        await prescription.save({ session });

        results.success.push({
          prescriptionId,
          medicineId,
          medicineName: medicine.name,
          status,
          updatedAt: new Date()
        });

      } catch (error) {
        results.failed.push({
          prescriptionId: update.prescriptionId || 'N/A',
          medicineId: update.medicineId || 'N/A',
          reason: error.message
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.success.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Get overdue prescriptions
exports.getOverduePrescriptions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const prescriptions = await Prescription.find({
    'medicines.nextDue': { $lt: new Date() },
    'medicines.administrationStatus': 'Pending'
  })
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
    .sort({ 'medicines.nextDue': 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Filter and format overdue medicines
  const overdueData = prescriptions.map(prescription => {
    const overdueMedicines = prescription.medicines.filter(med => 
      med.nextDue && new Date(med.nextDue) < new Date() && med.administrationStatus === 'Pending'
    ).map(med => ({
      medicineId: med._id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      nextDue: med.nextDue,
      overdueBy: Math.floor((new Date() - new Date(med.nextDue)) / (1000 * 60 * 60 * 24))
    }));

    return {
      prescriptionId: prescription._id,
      patientName: prescription.patientId?.userId?.name || 'Unknown',
      doctorName: prescription.doctorId?.userId?.name || 'Unknown',
      createdAt: prescription.createdAt,
      overdueMedicines,
      totalOverdue: overdueMedicines.length
    };
  }).filter(item => item.overdueMedicines.length > 0);

  const total = await Prescription.countDocuments({
    'medicines.nextDue': { $lt: new Date() },
    'medicines.administrationStatus': 'Pending'
  });

  res.status(200).json({
    success: true,
    count: overdueData.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: overdueData
  });
});

/* =====================
   PRESCRIPTION VALIDATION
===================== */

// Validate prescription against patient allergies (placeholder)
exports.validatePrescription = asyncHandler(async (req, res, next) => {
  const { prescriptionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }

  const prescription = await Prescription.findById(prescriptionId)
    .populate({
      path: 'patientId',
      select: 'bloodGroup allergies'
    })
    .populate('medicines.medicineId', 'name category contraindications')
    .lean();

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Placeholder for allergy validation logic
  // In a real system, you would check against patient's known allergies
  const validationResults = {
    warnings: [],
    errors: [],
    interactions: []
  };

  // Example checks (customize based on your requirements)
  prescription.medicines.forEach(med => {
    if (med.medicineId?.contraindications) {
      validationResults.warnings.push({
        medicine: med.name,
        warning: `Check contraindications: ${med.medicineId.contraindications}`
      });
    }
  });

  res.status(200).json({
    success: true,
    data: {
      prescriptionId,
      patientId: prescription.patientId._id,
      validationResults,
      isValid: validationResults.errors.length === 0
    }
  });
});