const mongoose = require('mongoose');
const { Medicine, Prescription, Patient, Doctor, User } = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/**
 * @desc    Get all medicines with advanced filtering
 * @route   GET /api/admin/pharmacy/medicines
 * @access  Private/Admin
 */exports.getAllMedicines = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    lowStock = false,
    outOfStock = false,
    sortBy = 'name',
    sortOrder = 'asc',
    isActive = 'true'
  } = req.query;

  const query = {};

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } }
    ];
  }

  if (lowStock === 'true') {
    query.stockQuantity = { $lt: 20, $gt: 0 };
  }

  if (outOfStock === 'true') {
    query.stockQuantity = 0;
  }

  // ✅ FIXED ACTIVE FILTER
  if (isActive === 'true') {
    query.$or = [
      ...(query.$or || []),
      { isActive: true },
      { isActive: { $exists: false } }
    ];
  } else if (isActive === 'false') {
    query.isActive = false;
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const medicines = await Medicine.find(query)
    .sort(sort)
    .limit(+limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await Medicine.countDocuments(query);

  const categories = await Medicine.distinct('category');

  const stockSummary = await Medicine.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $lt: ['$stockQuantity', 20] }, { $gt: ['$stockQuantity', 0] }] },
              1,
              0
            ]
          }
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] }
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: medicines.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    filters: {
      categories,
      stockSummary: stockSummary[0] || {}
    },
    data: medicines
  });
});

/**
 * @desc    Get medicine by ID with usage history
 * @route   GET /api/admin/pharmacy/medicines/:id
 * @access  Private/Admin
 */
exports.getMedicineById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  const medicine = await Medicine.findById(id);
  
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  // Get prescription usage history (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [usageStats, recentPrescriptions, monthlyUsage] = await Promise.all([
    // Usage statistics
    Prescription.aggregate([
      { $unwind: '$medicines' },
      { $match: { 'medicines.medicineId': medicine._id } },
      {
        $group: {
          _id: null,
          totalPrescribed: { $sum: '$medicines.quantity' },
          totalPrescriptions: { $sum: 1 },
          recentUsage: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thirtyDaysAgo] },
                '$medicines.quantity',
                0
              ]
            }
          },
          averageMonthlyUsage: {
            $avg: '$medicines.quantity'
          }
        }
      }
    ]),

    // Recent prescriptions
    Prescription.find({
      'medicines.medicineId': medicine._id
    })
      .select('medicines createdAt patientId doctorId')
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name phone'
        }
      })
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name specialization'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // Monthly usage trend (last 6 months)
    Prescription.aggregate([
      { $unwind: '$medicines' },
      { $match: { 
        'medicines.medicineId': medicine._id,
        createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
      }},
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalQuantity: { $sum: '$medicines.quantity' },
          prescriptionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  // Calculate expiry status
  const expiryStatus = medicine.expiryDate ? {
    date: medicine.expiryDate,
    daysRemaining: Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
    status: medicine.expiryDate < new Date() ? 'Expired' : 
           (medicine.expiryDate - new Date()) < (30 * 24 * 60 * 60 * 1000) ? 'Expiring Soon' : 'Valid'
  } : null;

  res.status(200).json({
    success: true,
    data: {
      medicine: {
        ...medicine.toObject(),
        expiryStatus,
        stockStatus: medicine.stockQuantity === 0 ? 'Out of Stock' : 
                    medicine.stockQuantity < 20 ? 'Low Stock' : 'In Stock'
      },
      statistics: usageStats[0] || {
        totalPrescribed: 0,
        totalPrescriptions: 0,
        recentUsage: 0,
        averageMonthlyUsage: 0
      },
      monthlyUsage,
      recentPrescriptions: recentPrescriptions.map(prescription => ({
        date: prescription.createdAt,
        prescriptionId: prescription._id,
        patient: prescription.patientId?.userId?.name || 'N/A',
        doctor: prescription.doctorId?.userId?.name || 'N/A',
        quantity: prescription.medicines.find(m => m.medicineId.toString() === id).quantity,
        dosage: prescription.medicines.find(m => m.medicineId.toString() === id).dosage
      }))
    }
  });
});

/**
 * @desc    Create new medicine
 * @route   POST /api/admin/pharmacy/medicines
 * @access  Private/Admin
 */
exports.createMedicine = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    genericName,
    category, 
    price, 
    stockQuantity, 
    unit,
    unitSize,
    manufacturer,
    batchNumber,
    expiryDate,
    reorderLevel,
    maximumStock,
    description,
    sideEffects,
    contraindications,
    storageInstructions,
    costPrice
  } = req.body;

  // Validation
  if (!name || !price) {
    res.status(400);
    throw new Error('Medicine name and price are required');
  }

  if (price < 0) {
    res.status(400);
    throw new Error('Price cannot be negative');
  }

  if (stockQuantity !== undefined && stockQuantity < 0) {
    res.status(400);
    throw new Error('Stock quantity cannot be negative');
  }

  if (costPrice !== undefined && costPrice < 0) {
    res.status(400);
    throw new Error('Cost price cannot be negative');
  }

  // Check for duplicate medicine name
  const existingMedicine = await Medicine.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });

  if (existingMedicine) {
    res.status(409);
    throw new Error('Medicine with this name already exists');
  }

  const medicineData = {
    name,
    genericName,
    category: category || 'General',
    price,
    stockQuantity: stockQuantity || 0,
    unit: unit || 'tablet',
    isActive: true
  };

  // Add optional fields if provided
  if (unitSize) medicineData.unitSize = unitSize;
  if (manufacturer) medicineData.manufacturer = manufacturer;
  if (batchNumber) medicineData.batchNumber = batchNumber;
  if (expiryDate) medicineData.expiryDate = expiryDate;
  if (reorderLevel) medicineData.reorderLevel = reorderLevel;
  if (maximumStock) medicineData.maximumStock = maximumStock;
  if (description) medicineData.description = description;
  if (sideEffects) medicineData.sideEffects = Array.isArray(sideEffects) ? sideEffects : [sideEffects];
  if (contraindications) medicineData.contraindications = Array.isArray(contraindications) ? contraindications : [contraindications];
  if (storageInstructions) medicineData.storageInstructions = storageInstructions;
  if (costPrice) medicineData.costPrice = costPrice;

  const medicine = await Medicine.create(medicineData);

  res.status(201).json({
    success: true,
    message: 'Medicine created successfully',
    data: medicine
  });
});

/**
 * @desc    Update medicine
 * @route   PUT /api/admin/pharmacy/medicines/:id
 * @access  Private/Admin
 */
exports.updateMedicine = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  // Validate numeric fields
  if (updateData.price !== undefined && updateData.price < 0) {
    res.status(400);
    throw new Error('Price cannot be negative');
  }

  if (updateData.stockQuantity !== undefined && updateData.stockQuantity < 0) {
    res.status(400);
    throw new Error('Stock quantity cannot be negative');
  }

  if (updateData.costPrice !== undefined && updateData.costPrice < 0) {
    res.status(400);
    throw new Error('Cost price cannot be negative');
  }

  // Check for duplicate name if name is being updated
  if (updateData.name) {
    const existingMedicine = await Medicine.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }
    });

    if (existingMedicine) {
      res.status(409);
      throw new Error('Another medicine with this name already exists');
    }
  }

  const medicine = await Medicine.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.status(200).json({
    success: true,
    message: 'Medicine updated successfully',
    data: medicine
  });
});

/**
 * @desc    Delete medicine
 * @route   DELETE /api/admin/pharmacy/medicines/:id
 * @access  Private/Admin
 */
exports.deleteMedicine = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  // Check if medicine is used in any prescription
  const prescriptionCount = await Prescription.countDocuments({
    'medicines.medicineId': id
  });

  if (prescriptionCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete medicine. It is used in ${prescriptionCount} prescription(s).`);
  }

  const medicine = await Medicine.findByIdAndDelete(id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully',
    data: { id: medicine._id, name: medicine.name }
  });
});

/**
 * @desc    Update medicine stock
 * @route   POST /api/admin/pharmacy/stock/update
 * @access  Private/Admin
 */
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { medicines } = req.body;

  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    res.status(400);
    throw new Error('Medicines array is required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedMedicines = [];
    const errors = [];

    for (const item of medicines) {
      const { medicineId, quantity, action, notes, reference } = item;

      if (!mongoose.Types.ObjectId.isValid(medicineId)) {
        errors.push(`Invalid medicine ID: ${medicineId}`);
        continue;
      }

      const medicine = await Medicine.findById(medicineId).session(session);
      
      if (!medicine) {
        errors.push(`Medicine not found: ${medicineId}`);
        continue;
      }

      if (quantity < 0) {
        errors.push(`Quantity cannot be negative for ${medicine.name}`);
        continue;
      }

      let newStock = medicine.stockQuantity;
      let operation = '';

      switch (action) {
        case 'add':
          newStock += quantity;
          operation = 'Stock Added';
          break;
        case 'subtract':
          if (medicine.stockQuantity < quantity) {
            errors.push(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}, Requested: ${quantity}`);
            continue;
          }
          newStock -= quantity;
          operation = 'Stock Used';
          break;
        case 'set':
          newStock = quantity;
          operation = 'Stock Adjusted';
          break;
        default:
          errors.push(`Invalid action: ${action} for ${medicine.name}`);
          continue;
      }

      // Update medicine stock
      medicine.stockQuantity = newStock;
      medicine.lastStockUpdate = new Date();
      await medicine.save({ session });

      updatedMedicines.push({
        id: medicine._id,
        name: medicine.name,
        category: medicine.category,
        previousStock: medicine.stockQuantity - (action === 'add' ? -quantity : action === 'subtract' ? quantity : 0),
        currentStock: newStock,
        unit: medicine.unit,
        action,
        quantity,
        notes
      });
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: 'Some updates failed',
        errors,
        successfulUpdates: updatedMedicines
      });
      return;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        updatedCount: updatedMedicines.length,
        medicines: updatedMedicines
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @desc    Get stock history for a medicine
 * @route   GET /api/admin/pharmacy/medicines/:id/history
 * @access  Private/Admin
 */
exports.getStockHistory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  const medicine = await Medicine.findById(id);
  
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const query = { 'medicines.medicineId': id };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const prescriptions = await Prescription.find(query)
    .select('medicines createdAt patientId doctorId')
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
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Transform prescription data into stock history
  const history = prescriptions.flatMap(prescription => {
    return prescription.medicines
      .filter(med => med.medicineId && med.medicineId.toString() === id)
      .map(med => ({
        date: prescription.createdAt,
        type: 'Prescription',
        action: 'subtract',
        quantity: med.quantity,
        reference: `Prescription #${prescription._id.toString().slice(-6)}`,
        patient: prescription.patientId?.userId?.name || 'N/A',
        doctor: prescription.doctorId?.userId?.name || 'N/A',
        notes: med.dosage ? `Dosage: ${med.dosage}, Frequency: ${med.frequency}` : 'Prescribed'
      }));
  });

  // Add manual stock adjustments (you would fetch from a StockHistory collection)
  const total = await Prescription.countDocuments(query);

  // Calculate running balance (simplified - in real app, use StockHistory)
  let balance = medicine.stockQuantity;
  const historyWithBalance = history.map(record => {
    balance += record.quantity; // Since quantity is negative for prescriptions
    return {
      ...record,
      balance
    };
  }).reverse(); // Show oldest first

  res.status(200).json({
    success: true,
    medicine: {
      id: medicine._id,
      name: medicine.name,
      currentStock: medicine.stockQuantity
    },
    count: history.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: historyWithBalance
  });
});

/**
 * @desc    Get low stock alerts
 * @route   GET /api/admin/pharmacy/alerts/low-stock
 * @access  Private/Admin
 */
exports.getLowStockAlerts = asyncHandler(async (req, res, next) => {
  const { threshold = 20, includeExpired = 'false' } = req.query;

  const query = {
    stockQuantity: { $lt: parseInt(threshold), $gt: 0 },
    isActive: true
  };

  // Add expiry filter
  if (includeExpired === 'false') {
    query.$or = [
      { expiryDate: { $gte: new Date() } },
      { expiryDate: null }
    ];
  }

  const lowStockMedicines = await Medicine.find(query)
    .sort({ stockQuantity: 1 })
    .lean();

  const outOfStockMedicines = await Medicine.find({
    stockQuantity: 0,
    isActive: true
  })
    .sort({ name: 1 })
    .lean();

  // Check for expiring medicines
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiringMedicines = await Medicine.find({
    expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
    isActive: true,
    stockQuantity: { $gt: 0 }
  })
    .sort({ expiryDate: 1 })
    .lean();

  // Calculate reorder suggestions
  const reorderSuggestions = lowStockMedicines.map(medicine => {
    const suggestedReorder = medicine.reorderLevel 
      ? Math.max(medicine.reorderLevel - medicine.stockQuantity, 10)
      : Math.max(50 - medicine.stockQuantity, 10);
    
    return {
      ...medicine,
      suggestedReorder,
      urgency: medicine.stockQuantity < 5 ? 'HIGH' : 
               medicine.stockQuantity < 10 ? 'MEDIUM' : 'LOW'
    };
  });

  res.status(200).json({
    success: true,
    summary: {
      lowStockCount: lowStockMedicines.length,
      outOfStockCount: outOfStockMedicines.length,
      expiringCount: expiringMedicines.length,
      totalAlerts: lowStockMedicines.length + outOfStockMedicines.length + expiringMedicines.length
    },
    alerts: {
      lowStock: reorderSuggestions,
      outOfStock: outOfStockMedicines,
      expiring: expiringMedicines.map(med => ({
        ...med,
        daysToExpiry: Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    }
  });
});

/**
 * @desc    Get pharmacy analytics
 * @route   GET /api/admin/pharmacy/analytics
 * @access  Private/Admin
 */
exports.getPharmacyAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Execute all analytics queries in parallel
  const [
    prescriptionStats,
    topMedicines,
    monthlyTrend,
    categoryDistribution,
    stockAnalytics,
    doctorPrescriptionStats,
    patientPrescriptionStats
  ] = await Promise.all([
    // Overall prescription statistics
    Prescription.aggregate([
      { $match: dateFilter },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          totalMedicinesDispensed: { $sum: '$medicines.quantity' },
          uniqueMedicines: { $addToSet: '$medicines.medicineId' },
          totalPrescriptionValue: {
            $sum: {
              $multiply: [
                '$medicines.quantity',
                { $ifNull: ['$medicines.price', 0] }
              ]
            }
          }
        }
      }
    ]),

    // Top 10 prescribed medicines
    Prescription.aggregate([
      { $match: dateFilter },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.medicineId',
          medicineName: { $first: '$medicines.name' },
          totalQuantity: { $sum: '$medicines.quantity' },
          prescriptionCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]),

    // Monthly prescription trend (last 6 months)
    Prescription.aggregate([
      { 
        $match: { 
          ...dateFilter,
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          prescriptionCount: { $sum: 1 },
          medicineCount: {
            $sum: { $size: '$medicines' }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Category-wise distribution
    Medicine.aggregate([
      {
        $group: {
          _id: '$category',
          totalMedicines: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          totalValue: {
            $sum: { $multiply: ['$stockQuantity', '$price'] }
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]),

    // Stock value analytics
    Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalInventoryValue: {
            $sum: { $multiply: ['$stockQuantity', '$price'] }
          },
          totalCostValue: {
            $sum: { $multiply: ['$stockQuantity', { $ifNull: ['$costPrice', 0] }] }
          },
          averageStockValue: {
            $avg: { $multiply: ['$stockQuantity', '$price'] }
          },
          maxStockValue: {
            $max: { $multiply: ['$stockQuantity', '$price'] }
          },
          minStockValue: {
            $min: { $multiply: ['$stockQuantity', '$price'] }
          }
        }
      }
    ]),

    // Top prescribing doctors
    Prescription.aggregate([
      { $match: dateFilter },
      { $unwind: '$medicines' },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$doctorId',
          doctorName: { $first: '$user.name' },
          specialization: { $first: '$doctor.specialization' },
          totalPrescriptions: { $sum: 1 },
          totalMedicinesDispensed: { $sum: '$medicines.quantity' }
        }
      },
      { $sort: { totalPrescriptions: -1 } },
      { $limit: 5 }
    ]),

    // Patients with most prescriptions
    Prescription.aggregate([
      { $match: dateFilter },
      { $unwind: '$medicines' },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      { $unwind: '$patient' },
      {
        $lookup: {
          from: 'users',
          localField: 'patient.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$patientId',
          patientName: { $first: '$user.name' },
          totalPrescriptions: { $sum: 1 },
          totalMedicines: { $sum: '$medicines.quantity' }
        }
      },
      { $sort: { totalPrescriptions: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      prescriptionStats: prescriptionStats[0] || {
        totalPrescriptions: 0,
        totalMedicinesDispensed: 0,
        uniqueMedicines: [],
        totalPrescriptionValue: 0
      },
      topMedicines,
      monthlyTrend,
      categoryDistribution,
      stockAnalytics: stockAnalytics[0] || {
        totalInventoryValue: 0,
        totalCostValue: 0,
        averageStockValue: 0,
        maxStockValue: 0,
        minStockValue: 0
      },
      topDoctors: doctorPrescriptionStats,
      topPatients: patientPrescriptionStats
    }
  });
});

/**
 * @desc    Generate pharmacy report
 * @route   GET /api/admin/pharmacy/reports
 * @access  Private/Admin
 */
exports.generatePharmacyReport = asyncHandler(async (req, res, next) => {
  const { reportType = 'monthly', startDate, endDate, format = 'json' } = req.query;

  const dateFilter = {};
  const now = new Date();
  
  switch (reportType) {
    case 'daily':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter.createdAt = { $gte: today };
      break;
    case 'weekly':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: weekAgo };
      break;
    case 'monthly':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter.createdAt = { $gte: monthAgo };
      break;
    case 'custom':
      if (startDate) dateFilter.createdAt = { $gte: new Date(startDate) };
      if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
      break;
  }

  // Get prescription data with related information
  const prescriptions = await Prescription.find(dateFilter)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name phone email'
      }
    })
    .populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .lean();

  // Calculate report data
  const reportData = prescriptions.flatMap(prescription => {
    return prescription.medicines.map(medicine => ({
      date: prescription.createdAt,
      prescriptionId: prescription._id,
      patientId: prescription.patientId?._id,
      patientName: prescription.patientId?.userId?.name || 'N/A',
      patientPhone: prescription.patientId?.userId?.phone || 'N/A',
      doctorName: prescription.doctorId?.userId?.name || 'N/A',
      medicineId: medicine.medicineId,
      medicineName: medicine.name,
      quantity: medicine.quantity,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      instructions: medicine.instructions,
      price: medicine.price || 0,
      total: (medicine.price || 0) * medicine.quantity
    }));
  });

  // Summary statistics
  const summary = {
    totalPrescriptions: prescriptions.length,
    totalMedicinesDispensed: reportData.reduce((sum, item) => sum + item.quantity, 0),
    totalRevenue: reportData.reduce((sum, item) => sum + item.total, 0),
    uniquePatients: [...new Set(prescriptions.map(p => p.patientId?._id?.toString()))].length,
    uniqueDoctors: [...new Set(prescriptions.map(p => p.doctorId?._id?.toString()))].length,
    uniqueMedicines: [...new Set(reportData.map(item => item.medicineName))].length,
    reportPeriod: {
      start: dateFilter.createdAt?.$gte || new Date(now.getFullYear(), now.getMonth(), 1),
      end: dateFilter.createdAt?.$lte || now,
      type: reportType
    }
  };

  // Group by medicine for summary
  const medicineSummary = reportData.reduce((acc, item) => {
    if (!acc[item.medicineName]) {
      acc[item.medicineName] = {
        name: item.medicineName,
        totalQuantity: 0,
        prescriptions: 0,
        totalRevenue: 0
      };
    }
    acc[item.medicineName].totalQuantity += item.quantity;
    acc[item.medicineName].prescriptions += 1;
    acc[item.medicineName].totalRevenue += item.total;
    return acc;
  }, {});

  if (format === 'csv') {
    // Generate CSV
    const csvData = [
      ['Date', 'Prescription ID', 'Patient Name', 'Patient Phone', 'Doctor Name', 'Medicine Name', 'Quantity', 'Dosage', 'Frequency', 'Duration', 'Price', 'Total'],
      ...reportData.map(item => [
        item.date.toISOString().split('T')[0],
        item.prescriptionId.toString().slice(-6),
        item.patientName,
        item.patientPhone,
        item.doctorName,
        item.medicineName,
        item.quantity,
        item.dosage,
        item.frequency,
        item.duration,
        item.price.toFixed(2),
        item.total.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=pharmacy-report-${Date.now()}.csv`);
    return res.send(csvData);
  }

  res.status(200).json({
    success: true,
    reportType,
    generatedAt: new Date(),
    summary,
    data: reportData,
    medicineSummary: Object.values(medicineSummary)
  });
});

/**
 * @desc    Get prescription analytics
 * @route   GET /api/admin/pharmacy/prescription-analytics
 * @access  Private/Admin
 */
exports.getPrescriptionAnalytics = asyncHandler(async (req, res, next) => {
  const { groupBy = 'day', startDate, endDate } = req.query;

  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  let groupStage = {};
  
  switch (groupBy) {
    case 'day':
      groupStage = {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
      };
      break;
    case 'week':
      groupStage = {
        _id: { 
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        }
      };
      break;
    case 'month':
      groupStage = {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
      };
      break;
    case 'doctor':
      groupStage = {
        _id: '$doctorId'
      };
      break;
    case 'patient':
      groupStage = {
        _id: '$patientId'
      };
      break;
    case 'medicine':
      groupStage = {
        _id: '$medicines.name'
      };
      break;
    default:
      groupStage = { _id: null };
  }

  const analytics = await Prescription.aggregate([
    { $match: matchStage },
    { $unwind: '$medicines' },
    {
      $group: {
        ...groupStage,
        totalPrescriptions: { $sum: 1 },
        totalMedicines: { $sum: '$medicines.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: [
              '$medicines.quantity',
              { $ifNull: ['$medicines.price', 0] }
            ]
          }
        },
        uniquePatients: { $addToSet: '$patientId' },
        uniqueDoctors: { $addToSet: '$doctorId' }
      }
    },
    {
      $project: {
        _id: 0,
        group: '$_id',
        totalPrescriptions: 1,
        totalMedicines: 1,
        totalRevenue: 1,
        uniquePatientCount: { $size: '$uniquePatients' },
        uniqueDoctorCount: { $size: '$uniqueDoctors' }
      }
    },
    { $sort: { totalPrescriptions: -1 } },
    { $limit: groupBy === 'day' ? 30 : groupBy === 'week' ? 12 : groupBy === 'month' ? 12 : 50 }
  ]);

  // If grouping by doctor or patient, populate names
  if (groupBy === 'doctor' || groupBy === 'patient') {
    const populatedAnalytics = await Promise.all(
      analytics.map(async (item) => {
        let name = 'Unknown';
        let details = {};
        
        if (groupBy === 'doctor' && item.group) {
          const doctor = await Doctor.findById(item.group)
            .populate('userId', 'name email');
          name = doctor?.userId?.name || 'Unknown Doctor';
          details = {
            specialization: doctor?.specialization,
            department: doctor?.department
          };
        } else if (groupBy === 'patient' && item.group) {
          const patient = await Patient.findById(item.group)
            .populate('userId', 'name phone');
          name = patient?.userId?.name || 'Unknown Patient';
          details = {
            phone: patient?.userId?.phone,
            age: patient?.age,
            gender: patient?.gender
          };
        }
        
        return {
          ...item,
          name,
          details
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      groupBy,
      data: populatedAnalytics
    });
  }

  res.status(200).json({
    success: true,
    groupBy,
    data: analytics
  });
});

/**
 * @desc    Toggle medicine active status
 * @route   PATCH /api/admin/pharmacy/medicines/:id/status
 * @access  Private/Admin
 */
exports.toggleMedicineStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  if (isActive === undefined) {
    res.status(400);
    throw new Error('isActive status is required');
  }

  const medicine = await Medicine.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.status(200).json({
    success: true,
    message: `Medicine ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: medicine._id,
      name: medicine.name,
      isActive: medicine.isActive
    }
  });
});

/**
 * @desc    Get expired medicines
 * @route   GET /api/admin/pharmacy/alerts/expired
 * @access  Private/Admin
 */
exports.getExpiredMedicines = asyncHandler(async (req, res, next) => {
  const expiredMedicines = await Medicine.find({
    expiryDate: { $lt: new Date() },
    stockQuantity: { $gt: 0 },
    isActive: true
  })
    .sort({ expiryDate: 1 })
    .lean();

  const expiringSoon = await Medicine.find({
    expiryDate: { 
      $gte: new Date(),
      $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    stockQuantity: { $gt: 0 },
    isActive: true
  })
    .sort({ expiryDate: 1 })
    .lean();

  res.status(200).json({
    success: true,
    summary: {
      expiredCount: expiredMedicines.length,
      expiringSoonCount: expiringSoon.length,
      totalValueAtRisk: expiredMedicines.reduce((sum, med) => sum + (med.stockQuantity * med.price), 0)
    },
    data: {
      expired: expiredMedicines.map(med => ({
        ...med,
        daysSinceExpiry: Math.ceil((new Date() - new Date(med.expiryDate)) / (1000 * 60 * 60 * 24))
      })),
      expiringSoon: expiringSoon.map(med => ({
        ...med,
        daysToExpiry: Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    }
  });
});

/**
 * @desc    Get pharmacy dashboard statistics
 * @route   GET /api/admin/pharmacy/dashboard
 * @access  Private/Admin
 */
exports.getPharmacyDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const [
    totalMedicines,
    activeMedicines,
    lowStockCount,
    outOfStockCount,
    totalInventoryValue,
    totalPrescriptionsToday,
    totalPrescriptionsThisWeek,
    totalPrescriptionsThisMonth,
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    topSellingMedicines,
    recentPrescriptions,
    expiringMedicines
  ] = await Promise.all([
    // Medicine counts
    Medicine.countDocuments(),
    Medicine.countDocuments({ isActive: true }),
    Medicine.countDocuments({ stockQuantity: { $lt: 20, $gt: 0 }, isActive: true }),
    Medicine.countDocuments({ stockQuantity: 0, isActive: true }),
    
    // Inventory value
    Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
          totalCost: { $sum: { $multiply: ['$stockQuantity', { $ifNull: ['$costPrice', 0] }] } }
        }
      }
    ]),

    // Prescription counts
    Prescription.countDocuments({ 
      createdAt: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    Prescription.countDocuments({ 
      createdAt: { $gte: startOfWeek }
    }),
    Prescription.countDocuments({ 
      createdAt: { $gte: startOfMonth }
    }),

    // Revenue calculations
    Prescription.aggregate([
      { $match: { 
        createdAt: { 
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }},
      { $unwind: '$medicines' },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $multiply: [
                '$medicines.quantity',
                { $ifNull: ['$medicines.price', 0] }
              ]
            }
          }
        }
      }
    ]),
    Prescription.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } }},
      { $unwind: '$medicines' },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $multiply: [
                '$medicines.quantity',
                { $ifNull: ['$medicines.price', 0] }
              ]
            }
          }
        }
      }
    ]),
    Prescription.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } }},
      { $unwind: '$medicines' },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: {
              $multiply: [
                '$medicines.quantity',
                { $ifNull: ['$medicines.price', 0] }
              ]
            }
          }
        }
      }
    ]),

    // Top selling medicines (last 30 days)
    Prescription.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }},
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.medicineId',
          name: { $first: '$medicines.name' },
          totalQuantity: { $sum: '$medicines.quantity' },
          prescriptionCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
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
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Expiring medicines (next 30 days)
    Medicine.find({
      expiryDate: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      stockQuantity: { $gt: 0 },
      isActive: true
    })
      .sort({ expiryDate: 1 })
      .limit(5)
      .lean()
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      overview: {
        totalMedicines,
        activeMedicines,
        lowStockCount,
        outOfStockCount,
        inventoryValue: totalInventoryValue[0]?.totalValue || 0,
        inventoryCost: totalInventoryValue[0]?.totalCost || 0,
        profitMargin: totalInventoryValue[0]?.totalValue - (totalInventoryValue[0]?.totalCost || 0)
      },
      todayStats: {
        prescriptions: totalPrescriptionsToday,
        revenue: revenueToday[0]?.revenue || 0
      },
      periodStats: {
        thisWeek: {
          prescriptions: totalPrescriptionsThisWeek,
          revenue: revenueThisWeek[0]?.revenue || 0
        },
        thisMonth: {
          prescriptions: totalPrescriptionsThisMonth,
          revenue: revenueThisMonth[0]?.revenue || 0
        }
      },
      topSellingMedicines,
      recentPrescriptions,
      expiringMedicines: expiringMedicines.map(med => ({
        ...med,
        daysToExpiry: Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    }
  });
});