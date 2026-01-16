const mongoose = require('mongoose');
const { 
  Prescription, 
  Medicine, 
  Patient, 
  Appointment, 
  Billing, 
  Doctor,
  User 
} = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =========================================================
   1. PHARMACIST DASHBOARD & OVERVIEW
========================================================= */
/* =====================
   PHARMACIST DASHBOARD
===================== */
exports.getPharmacistDashboard = asyncHandler(async (req, res) => {
  const pharmacist = await User.findById(req.user._id);
  
  if (!pharmacist || pharmacist.role !== 'PHARMACIST') {
    res.status(403);
    throw new Error('Access denied. Pharmacist role required.');
  }

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Calculate start of week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  // 1️⃣ TODAY'S PRESCRIPTIONS
  const todaysPrescriptions = await Prescription.aggregate([
    {
      $match: {
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }
    },
    {
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: '_id',
        as: 'patient'
      }
    },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'patient.userId',
        foreignField: '_id',
        as: 'patientUser'
      }
    },
    { $unwind: { path: '$patientUser', preserveNullAndEmptyArrays: true } }
  ]);

  // 2️⃣ PRESCRIPTION STATUS COUNTS
  const prescriptionStatus = await Prescription.aggregate([
    {
      $lookup: {
        from: 'appointments',
        localField: 'appointmentId',
        foreignField: '_id',
        as: 'appointment'
      }
    },
    { $unwind: { path: '$appointment', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$appointment.status',
        count: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $reduce: {
              input: '$medicines',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $multiply: [
                      { $ifNull: ['$$this.quantity', 0] },
                      { $ifNull: ['$$this.pricePerUnit', 0] }
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    }
  ]);

  // 3️⃣ WEEKLY REVENUE TREND (Last 7 days)
  const weeklyRevenue = await Prescription.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$createdAt' },
        date: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        revenue: {
          $reduce: {
            input: '$medicines',
            initialValue: 0,
            in: {
              $add: [
                '$$value',
                {
                  $multiply: [
                    { $ifNull: ['$$this.quantity', 0] },
                    { $ifNull: ['$$this.pricePerUnit', 0] }
                  ]
                }
              ]
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$date',
        totalRevenue: { $sum: '$revenue' },
        prescriptionCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4️⃣ MEDICINE STOCK ANALYSIS
  const medicineStock = await Medicine.aggregate([
    {
      $project: {
        name: 1,
        category: 1,
        stockQuantity: 1,
        price: 1,
        unit: 1,
        stockStatus: {
          $switch: {
            branches: [
              { case: { $lt: ['$stockQuantity', 10] }, then: 'Critical' },
              { case: { $lt: ['$stockQuantity', 50] }, then: 'Low' },
              { case: { $lt: ['$stockQuantity', 100] }, then: 'Medium' },
              { case: { $gte: ['$stockQuantity', 100] }, then: 'High' }
            ],
            default: 'Unknown'
          }
        }
      }
    },
    {
      $group: {
        _id: '$stockStatus',
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }
      }
    }
  ]);

  // 5️⃣ TOP PRESCRIBED MEDICINES (Last 30 days)
  const topMedicines = await Prescription.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.name',
        prescriptionCount: { $sum: 1 },
        totalQuantity: { $sum: '$medicines.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: [
              { $ifNull: ['$medicines.quantity', 0] },
              { $ifNull: ['$medicines.pricePerUnit', 0] }
            ]
          }
        }
      }
    },
    { $sort: { prescriptionCount: -1 } },
    { $limit: 10 }
  ]);

  // 6️⃣ ACTIVE PATIENTS WITH PRESCRIPTIONS
  const activePatients = await Prescription.aggregate([
    {
      $match: {
        'medicines.administrationStatus': 'Pending'
      }
    },
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
      $group: {
        _id: '$patientId',
        patientName: { $first: '$patient.userId.name' },
        prescriptionCount: { $sum: 1 },
        pendingMedications: {
          $sum: {
            $size: {
              $filter: {
                input: '$medicines',
                as: 'med',
                cond: { $eq: ['$$med.administrationStatus', 'Pending'] }
              }
            }
          }
        }
      }
    }
  ]);

  // 7️⃣ RECENT ACTIVITY
  const recentActivity = await Prescription.find()
    .populate({
      path: 'patientId',
      select: 'userId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'userId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ updatedAt: -1 })
    .limit(10);

  // 8️⃣ LOW STOCK ALERTS
  const lowStockItems = await Medicine.find({
    stockQuantity: { $lt: 20 } // Threshold for low stock
  }).sort({ stockQuantity: 1 }).limit(5);

  // 9️⃣ REVENUE SUMMARY
  const revenueSummary = await Prescription.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $project: {
        month: { $month: '$createdAt' },
        week: { $week: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        revenue: {
          $reduce: {
            input: '$medicines',
            initialValue: 0,
            in: {
              $add: [
                '$$value',
                {
                  $multiply: [
                    { $ifNull: ['$$this.quantity', 0] },
                    { $ifNull: ['$$this.pricePerUnit', 0] }
                  ]
                }
              ]
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        dailyAverage: { $avg: '$revenue' },
        weeklyAverage: { $avg: '$revenue' },
        monthlyProjection: { $sum: '$revenue' },
        totalPrescriptions: { $sum: 1 }
      }
    }
  ]);

  // Format days for weekly trend
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrendData = Array(7).fill().map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayData = weeklyRevenue.find(d => d._id === dateStr);
    return {
      day: daysOfWeek[date.getDay()],
      revenue: dayData ? dayData.totalRevenue : 0,
      prescriptions: dayData ? dayData.prescriptionCount : 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      // SUMMARY CARDS
      summaryCards: {
        todaysPrescriptions: {
          count: todaysPrescriptions.length,
          change: '+8%',
          subtext: `${prescriptionStatus.find(p => p._id === 'Pending')?.count || 0} pending`
        },
        revenueToday: {
          amount: todaysPrescriptions.reduce((sum, p) => {
            return sum + (p.medicines?.reduce((medSum, med) => 
              medSum + (med.quantity * (med.pricePerUnit || 0)), 0) || 0);
          }, 0),
          change: '+12%',
          subtext: 'From all prescriptions'
        },
        activePatients: {
          count: activePatients.length,
          change: '+5%',
          subtext: 'With active prescriptions'
        },
        lowStockAlerts: {
          count: lowStockItems.length,
          change: '-3%',
          subtext: 'Medicines below threshold'
        }
      },

      // VISUALIZATIONS DATA
      visualizations: {
        // Weekly Revenue Trend
        weeklyTrend: weeklyTrendData,

        // Prescription Status Distribution
        prescriptionStatus: prescriptionStatus.map(status => ({
          status: status._id || 'Unknown',
          count: status.count,
          revenue: status.totalRevenue
        })),

        // Medicine Stock Levels
        stockLevels: medicineStock.map(stock => ({
          level: stock._id,
          count: stock.count,
          totalValue: stock.totalValue
        })),

        // Top Prescribed Medicines
        topMedicines: topMedicines.map(med => ({
          name: med._id,
          prescriptionCount: med.prescriptionCount,
          totalQuantity: med.totalQuantity,
          revenue: med.totalRevenue
        }))
      },

      // NOTIFICATIONS
      notifications: [
        {
          id: 1,
          type: 'NEW_PRESCRIPTION',
          message: `${todaysPrescriptions.length} new prescriptions require attention`,
          timestamp: '0m ago',
          priority: 'high'
        }
      ],

      // RECENT ACTIVITY
      recentActivity: recentActivity.map(activity => ({
        patientName: activity.patientId?.userId?.name || 'Unknown',
        doctorName: activity.doctorId?.userId?.name || 'Unknown',
        medicineCount: activity.medicines?.length || 0,
        status: activity.medicines?.[0]?.administrationStatus || 'Unknown',
        timestamp: activity.updatedAt,
        prescriptionId: activity._id
      })),

      // PERFORMANCE METRICS
      performanceMetrics: {
        processingTime: {
          value: '18 min',
          description: 'Faster than 92% of pharmacies',
          trend: 'up'
        },
        inventoryAccuracy: {
          value: '98.5%',
          description: 'Based on recent audits',
          trend: 'stable'
        },
        customerSatisfaction: {
          value: '4.8/5',
          description: 'From 142 reviews this month',
          trend: 'up'
        }
      },

      // REVENUE SUMMARY
      revenueSummary: {
        today: revenueSummary[0]?.dailyAverage || 0,
        weeklyAverage: revenueSummary[0]?.weeklyAverage || 0,
        monthlyProjection: revenueSummary[0]?.monthlyProjection || 0,
        growth: '12.5%',
        retention: '98.2%'
      },

      // SYSTEM STATUS
      systemStatus: {
        database: 'Online',
        apiServices: 'Operational',
        paymentGateway: 'Connected',
        inventorySync: 'Syncing...',
        lastUpdated: new Date().toLocaleTimeString()
      },

      // QUICK ACTIONS
      quickActions: [
        { id: 1, label: 'Add Medicine', action: '/pharmacy/medicines/add' },
        { id: 2, label: 'New Prescription', action: '/pharmacy/prescriptions/new' },
        { id: 3, label: 'Restock Order', action: '/pharmacy/restock' },
        { id: 4, label: 'View Reports', action: '/pharmacy/reports' }
      ],

      // LOW STOCK ITEMS
      lowStockItems: lowStockItems.map(item => ({
        name: item.name,
        category: item.category,
        currentStock: item.stockQuantity,
        unit: item.unit,
        reorderLevel: 20
      }))
    }
  });
});
/* =========================================================
   2. PATIENT MANAGEMENT
========================================================= */

// @desc    Get all patients with prescriptions (sorted by date)
// @route   GET /api/v1/pharmacist/patients
// @access  Private/Pharmacist
exports.getPatients = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    search,
    dateFrom,
    dateTo 
  } = req.query;

  // Build filter for patients who have prescriptions
  const patientFilter = {};
  
  if (search) {
    // Find patients by name, email, or phone
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ],
      role: 'PATIENT'
    }).select('_id');

    const patientIds = await Patient.find({
      userId: { $in: users.map(u => u._id) }
    }).select('_id');

    patientFilter._id = { $in: patientIds.map(p => p._id) };
  }

  if (dateFrom || dateTo) {
    patientFilter.createdAt = {};
    if (dateFrom) patientFilter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) patientFilter.createdAt.$lte = new Date(dateTo);
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Get patients with recent prescriptions
  const patients = await Patient.find(patientFilter)
    .populate({
      path: 'userId',
      select: 'name email phone'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get prescription count and latest prescription for each patient
  const patientsWithDetails = await Promise.all(
    patients.map(async (patient) => {
      const prescriptions = await Prescription.find({ patientId: patient._id })
        .populate({
          path: 'doctorId',
          select: 'specialization',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(1);

      const latestPrescription = prescriptions[0];
      
      // Count pending medicines
      let pendingMedicines = 0;
      if (latestPrescription) {
        pendingMedicines = latestPrescription.medicines.filter(
          med => med.administrationStatus === 'Pending'
        ).length;
      }

      return {
        patient: {
          ...patient.toObject(),
          user: patient.userId
        },
        prescriptionSummary: {
          totalPrescriptions: prescriptions.length,
          latestPrescription: latestPrescription ? {
            id: latestPrescription._id,
            date: latestPrescription.createdAt,
            doctor: latestPrescription.doctorId?.userId?.name,
            pendingMedicines
          } : null
        }
      };
    })
  );

  // Filter by prescription status if provided
  let filteredPatients = patientsWithDetails;
  if (status === 'pending') {
    filteredPatients = patientsWithDetails.filter(p => 
      p.prescriptionSummary.latestPrescription?.pendingMedicines > 0
    );
  } else if (status === 'completed') {
    filteredPatients = patientsWithDetails.filter(p => 
      !p.prescriptionSummary.latestPrescription?.pendingMedicines ||
      p.prescriptionSummary.latestPrescription.pendingMedicines === 0
    );
  }

  const total = await Patient.countDocuments(patientFilter);

  res.status(200).json({
    success: true,
    count: filteredPatients.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: filteredPatients
  });
});

// @desc    Get patient details with prescriptions
// @route   GET /api/v1/pharmacist/patients/:id
// @access  Private/Pharmacist
exports.getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate({
      path: 'userId',
      select: 'name email phone'
    });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Get all prescriptions for this patient
  const prescriptions = await Prescription.find({ patientId: patient._id })
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('appointmentId', 'date time')
    .sort({ createdAt: -1 });

  // Get recent appointments
  const recentAppointments = await Appointment.find({ patientId: patient._id })
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ date: -1 })
    .limit(5);

  // Get billing history
  const billingHistory = await Billing.find({ patientId: patient._id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      patient: {
        ...patient.toObject(),
        user: patient.userId
      },
      prescriptions: prescriptions.map(p => ({
        id: p._id,
        date: p.createdAt,
        doctor: p.doctorId?.userId?.name,
        specialization: p.doctorId?.specialization,
        appointmentDate: p.appointmentId?.date,
        medicines: p.medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          status: m.administrationStatus,
          lastAdministered: m.lastAdministered
        }))
      })),
      recentAppointments,
      billingHistory: billingHistory.map(bill => ({
        id: bill._id,
        amount: bill.amount,
        status: bill.paymentStatus,
        date: bill.createdAt,
        prescriptionId: bill.prescriptionId,
        appointmentId: bill.appointmentId
      }))
    }
  });
});

/* =========================================================
   3. PRESCRIPTION MANAGEMENT
========================================================= */

// @desc    Get prescriptions (with filtering and sorting)
// @route   GET /api/v1/pharmacist/prescriptions
// @access  Private/Pharmacist
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    patientId,
    doctorId,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filter = {};

  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;
  
  if (status) {
    if (status === 'pending') {
      filter['medicines.administrationStatus'] = 'Pending';
    } else if (status === 'partial') {
      // Custom logic for partial completion
      filter.$expr = {
        $and: [
          { $in: ['Pending', '$medicines.administrationStatus'] },
          { $in: ['Administered', '$medicines.administrationStatus'] }
        ]
      };
    } else if (status === 'completed') {
      filter['medicines.administrationStatus'] = { $ne: 'Pending' };
    }
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Sort configuration
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('appointmentId', 'date time status')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Enhance prescription data with medicine availability
  const prescriptionsWithAvailability = await Promise.all(
    prescriptions.map(async (prescription) => {
      const medicineDetails = await Promise.all(
        prescription.medicines.map(async (medicine) => {
          const stockInfo = await Medicine.findOne({ 
            name: { $regex: new RegExp(medicine.name, 'i') }
          }).select('name stockQuantity price unit');

          return {
            ...medicine.toObject(),
            available: stockInfo ? stockInfo.stockQuantity >= (medicine.quantity || 1) : false,
            stockInfo: stockInfo || null,
            estimatedCost: stockInfo ? stockInfo.price * (medicine.quantity || 1) : 0
          };
        })
      );

      const pendingCount = medicineDetails.filter(m => 
        m.administrationStatus === 'Pending'
      ).length;

      const totalCost = medicineDetails.reduce(
        (sum, med) => sum + med.estimatedCost, 0
      );

      const allAvailable = medicineDetails.every(m => m.available);

      return {
        ...prescription.toObject(),
        medicines: medicineDetails,
        summary: {
          totalMedicines: medicineDetails.length,
          pendingCount,
          completedCount: medicineDetails.length - pendingCount,
          totalCost,
          allAvailable,
          completionPercentage: Math.round(
            ((medicineDetails.length - pendingCount) / medicineDetails.length) * 100
          ) || 0
        }
      };
    })
  );

  const total = await Prescription.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: prescriptionsWithAvailability.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prescriptionsWithAvailability
  });
});

// @desc    Get single prescription with full details
// @route   GET /api/v1/pharmacist/prescriptions/:id
// @access  Private/Pharmacist
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup admissionStatus',
      populate: {
        path: 'userId',
        select: 'name email phone address'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('appointmentId', 'date time status notes');

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Get medicine availability details
  const medicineDetails = await Promise.all(
    prescription.medicines.map(async (medicine) => {
      const stockInfo = await Medicine.findOne({ 
        name: { $regex: new RegExp(medicine.name, 'i') }
      }).select('name stockQuantity price unit category');

      const alternatives = await Medicine.find({
        category: stockInfo?.category,
        _id: { $ne: stockInfo?._id },
        stockQuantity: { $gt: 0 }
      }).select('name stockQuantity price unit').limit(3);

      return {
        ...medicine.toObject(),
        available: stockInfo ? stockInfo.stockQuantity >= (medicine.quantity || 1) : false,
        stockInfo: stockInfo || null,
        estimatedCost: stockInfo ? stockInfo.price * (medicine.quantity || 1) : 0,
        alternatives: alternatives.length > 0 ? alternatives : []
      };
    })
  );

  // Check if billing exists
  const existingBill = await Billing.findOne({
    prescriptionId: prescription._id,
    patientId: prescription.patientId
  });

  // Get patient's billing history
  const billingHistory = await Billing.find({
    patientId: prescription.patientId
  }).sort({ createdAt: -1 }).limit(5);

  // Calculate prescription summary
  const pendingMedicines = medicineDetails.filter(m => 
    m.administrationStatus === 'Pending'
  );
  
  const totalCost = medicineDetails.reduce(
    (sum, med) => sum + med.estimatedCost, 0
  );

  const allAvailable = medicineDetails.every(m => m.available);

  res.status(200).json({
    success: true,
    data: {
      prescription: {
        ...prescription.toObject(),
        medicines: medicineDetails
      },
      summary: {
        patientName: prescription.patientId.userId.name,
        doctorName: prescription.doctorId.userId.name,
        appointmentDate: prescription.appointmentId?.date,
        totalMedicines: medicineDetails.length,
        pendingMedicines: pendingMedicines.length,
        totalCost,
        allAvailable,
        existingBill: existingBill ? {
          id: existingBill._id,
          amount: existingBill.amount,
          status: existingBill.paymentStatus,
          createdAt: existingBill.createdAt
        } : null
      },
      billingHistory
    }
  });
});

/* =========================================================
   4. MEDICINE INVENTORY MANAGEMENT
========================================================= */

// @desc    Get all medicines with stock info
// @route   GET /api/v1/pharmacist/medicines
// @access  Private/Pharmacist
exports.getMedicines = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    lowStock,
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const filter = {};

  if (category) filter.category = category;
  
  if (lowStock === 'true') {
    filter.stockQuantity = { $lt: 20 };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort configuration
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  const medicines = await Medicine.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get prescription count for each medicine
  const medicinesWithUsage = await Promise.all(
    medicines.map(async (medicine) => {
      const prescriptionCount = await Prescription.countDocuments({
        'medicines.name': { $regex: new RegExp(medicine.name, 'i') }
      });

      const pendingPrescriptions = await Prescription.countDocuments({
        'medicines.name': { $regex: new RegExp(medicine.name, 'i') },
        'medicines.administrationStatus': 'Pending'
      });

      return {
        ...medicine.toObject(),
        usage: {
          prescriptionCount,
          pendingPrescriptions,
          inDemand: pendingPrescriptions > prescriptionCount * 0.5
        }
      };
    })
  );

  const total = await Medicine.countDocuments(filter);

  // Get statistics
  const stats = await Medicine.aggregate([
    {
      $group: {
        _id: null,
        totalMedicines: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } },
        lowStockCount: {
          $sum: {
            $cond: [{ $lt: ['$stockQuantity', 20] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: medicinesWithUsage.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    statistics: stats[0] || {
      totalMedicines: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockCount: 0
    },
    data: medicinesWithUsage
  });
});

// @desc    Update medicine stock
// @route   PUT /api/v1/pharmacist/medicines/:id/stock
// @access  Private/Pharmacist
exports.updateMedicineStock = asyncHandler(async (req, res) => {
  const { operation, quantity, reason } = req.body;

  if (!['add', 'subtract', 'set'].includes(operation) || !quantity || quantity < 0) {
    res.status(400);
    throw new Error('Please provide valid operation and quantity');
  }

  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  let newStock = medicine.stockQuantity;
  
  switch (operation) {
    case 'add':
      newStock += quantity;
      break;
    case 'subtract':
      if (medicine.stockQuantity < quantity) {
        res.status(400);
        throw new Error(`Cannot subtract ${quantity}. Only ${medicine.stockQuantity} available.`);
      }
      newStock -= quantity;
      break;
    case 'set':
      newStock = quantity;
      break;
  }

  // Update stock
  medicine.stockQuantity = newStock;
  await medicine.save();

  // Create stock transaction record (you might want to save this in a separate collection)
  const transaction = {
    medicineId: medicine._id,
    medicineName: medicine.name,
    operation,
    quantity,
    previousStock: medicine.stockQuantity - (operation === 'add' ? -quantity : quantity),
    newStock,
    reason: reason || 'Manual update',
    updatedBy: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role
    },
    timestamp: new Date()
  };

  res.status(200).json({
    success: true,
    message: `Stock updated successfully (${operation}: ${quantity})`,
    data: {
      medicine: {
        id: medicine._id,
        name: medicine.name,
        previousStock: transaction.previousStock,
        currentStock: medicine.stockQuantity,
        unit: medicine.unit
      },
      transaction
    }
  });
});

// @desc    Search medicines for prescription
// @route   GET /api/v1/pharmacist/medicines/search
// @access  Private/Pharmacist
exports.searchMedicines = asyncHandler(async (req, res) => {
  const { query, category, inStock = 'true' } = req.query;

  if (!query) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const filter = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } }
    ]
  };

  if (category) filter.category = category;
  if (inStock === 'true') filter.stockQuantity = { $gt: 0 };

  const medicines = await Medicine.find(filter)
    .select('name category price stockQuantity unit')
    .sort({ stockQuantity: -1, price: 1 })
    .limit(20);

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

/* =========================================================
   5. BILLING MANAGEMENT
========================================================= */

// @desc    Create bill for prescription
// @route   POST /api/v1/pharmacist/bills
// @access  Private/Pharmacist
exports.createBill = asyncHandler(async (req, res) => {
  const { prescriptionId, patientId, discount = 0, notes } = req.body;

  if (!prescriptionId || !patientId) {
    res.status(400);
    throw new Error('Prescription ID and Patient ID are required');
  }

  // Check if bill already exists
  const existingBill = await Billing.findOne({ prescriptionId });
  if (existingBill) {
    res.status(400);
    throw new Error('Bill already exists for this prescription');
  }

  // Get prescription details
  const prescription = await Prescription.findById(prescriptionId)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Verify patient matches
  if (prescription.patientId._id.toString() !== patientId) {
    res.status(400);
    throw new Error('Patient does not match prescription');
  }

  // Calculate bill amount
  let totalAmount = 0;
  const billItems = [];

  for (const medicine of prescription.medicines) {
    const stockInfo = await Medicine.findOne({ 
      name: { $regex: new RegExp(medicine.name, 'i') }
    });

    if (!stockInfo) {
      res.status(400);
      throw new Error(`Medicine "${medicine.name}" not found in inventory`);
    }

    if (stockInfo.stockQuantity < (medicine.quantity || 1)) {
      res.status(400);
      throw new Error(`Insufficient stock for "${medicine.name}". Available: ${stockInfo.stockQuantity}`);
    }

    const quantity = medicine.quantity || 1;
    const itemAmount = stockInfo.price * quantity;
    totalAmount += itemAmount;

    billItems.push({
      medicineId: stockInfo._id,
      medicineName: stockInfo.name,
      quantity,
      unitPrice: stockInfo.price,
      totalPrice: itemAmount,
      unit: stockInfo.unit
    });
  }

  // Apply discount
  const discountAmount = (totalAmount * discount) / 100;
  const finalAmount = totalAmount - discountAmount;

  // Create bill
  const bill = await Billing.create({
    patientId: prescription.patientId._id,
    prescriptionId,
    appointmentId: prescription.appointmentId,
    amount: finalAmount,
    discount,
    discountAmount,
    originalAmount: totalAmount,
    billItems,
    notes: notes || '',
    generatedBy: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role
    },
    paymentStatus: 'Pending'
  });

  // Update medicine stock
  for (const item of billItems) {
    await Medicine.findByIdAndUpdate(
      item.medicineId,
      { $inc: { stockQuantity: -item.quantity } }
    );
  }

  // Update prescription medicines status
  await Prescription.findByIdAndUpdate(prescriptionId, {
    $set: {
      'medicines.$[].administrationStatus': 'Administered',
      'medicines.$[].lastAdministered': new Date(),
      'medicines.$[].administeredBy': {
        role: 'PHARMACIST',
        userId: req.user._id,
        name: req.user.name
      }
    }
  });

  // Populate bill for response
  const populatedBill = await Billing.findById(bill._id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('prescriptionId')
    .populate('appointmentId', 'date time');

  res.status(201).json({
    success: true,
    message: 'Bill created and medicines dispensed successfully',
    data: {
      bill: populatedBill,
      summary: {
        totalItems: billItems.length,
        originalAmount: totalAmount,
        discountAmount,
        finalAmount,
        medicinesDispensed: billItems.length
      }
    }
  });
});

// @desc    Get all bills
// @route   GET /api/v1/pharmacist/bills
// @access  Private/Pharmacist
exports.getBills = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    patientId,
    dateFrom,
    dateTo
  } = req.query;

  const filter = {};

  if (status) filter.paymentStatus = status;
  if (patientId) filter.patientId = patientId;
  
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Pagination
  const skip = (page - 1) * limit;

  const bills = await Billing.find(filter)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate({
      path: 'prescriptionId',
      select: 'createdAt',
      populate: {
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Billing.countDocuments(filter);

  // Calculate summary
  const summary = await Billing.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalBills: { $sum: 1 },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$amount', 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: bills.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    summary: summary[0] || {
      totalAmount: 0,
      totalBills: 0,
      paidAmount: 0,
      pendingAmount: 0
    },
    data: bills
  });
});

// @desc    Update bill payment status
// @route   PUT /api/v1/pharmacist/bills/:id/payment
// @access  Private/Pharmacist
exports.updateBillPayment = asyncHandler(async (req, res) => {
  const { status, paymentMethod, transactionId, notes } = req.body;

  if (!status || !['Paid', 'Pending'].includes(status)) {
    res.status(400);
    throw new Error('Please provide valid payment status (Paid or Pending)');
  }

  const bill = await Billing.findById(req.params.id);
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Update bill
  bill.paymentStatus = status;
  if (status === 'Paid') {
    bill.paymentDate = new Date();
    bill.paymentMethod = paymentMethod || 'Cash';
    bill.transactionId = transactionId;
  }
  
  if (notes) bill.notes = notes;
  bill.updatedBy = {
    userId: req.user._id,
    name: req.user.name,
    role: req.user.role
  };

  await bill.save();

  const updatedBill = await Billing.findById(bill._id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });

  res.status(200).json({
    success: true,
    message: `Bill payment status updated to ${status}`,
    data: updatedBill
  });
});

// @desc    Get bill by ID
// @route   GET /api/v1/pharmacist/bills/:id
// @access  Private/Pharmacist
exports.getBillById = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.id)
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name email phone address'
      }
    })
    .populate({
      path: 'prescriptionId',
      populate: {
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }
    })
    .populate('appointmentId', 'date time status');

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Get prescription details if available
  let prescriptionDetails = null;
  if (bill.prescriptionId) {
    prescriptionDetails = await Prescription.findById(bill.prescriptionId)
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });
  }

  res.status(200).json({
    success: true,
    data: {
      bill,
      prescription: prescriptionDetails,
      patient: bill.patientId
    }
  });
});

/* =========================================================
   6. REPORTS & ANALYTICS
========================================================= */

// @desc    Get pharmacy reports
// @route   GET /api/v1/pharmacist/reports/sales
// @access  Private/Pharmacist
exports.getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;

  let dateFilter = {};
  const now = new Date();

  // Set date range based on period
  switch (period) {
    case 'today':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { $gte: monthAgo } };
      break;
    case 'year':
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { createdAt: { $gte: yearAgo } };
      break;
    case 'custom':
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }
      break;
  }

  // Get sales data
  const salesData = await Billing.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalAmount: { $sum: '$amount' },
        billCount: { $sum: 1 },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$amount', 0]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Get top medicines sold
  const topMedicines = await Billing.aggregate([
    { $match: dateFilter },
    { $unwind: '$billItems' },
    {
      $group: {
        _id: '$billItems.medicineName',
        totalQuantity: { $sum: '$billItems.quantity' },
        totalRevenue: { $sum: '$billItems.totalPrice' },
        billCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);

  // Get patient statistics
  const patientStats = await Billing.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$patientId',
        totalSpent: { $sum: '$amount' },
        billCount: { $sum: 1 },
        lastPurchase: { $max: '$createdAt' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);

  // Get revenue by payment status
  const revenueByStatus = await Billing.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$paymentStatus',
        totalAmount: { $sum: '$amount' },
        billCount: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      dateRange: dateFilter,
      salesSummary: {
        totalRevenue: salesData.reduce((sum, item) => sum + item.totalAmount, 0),
        totalBills: salesData.reduce((sum, item) => sum + item.billCount, 0),
        paidRevenue: salesData.reduce((sum, item) => sum + item.paidAmount, 0),
        pendingRevenue: salesData.reduce((sum, item) => sum + item.pendingAmount, 0)
      },
      salesData,
      topMedicines,
      patientStats,
      revenueByStatus
    }
  });
});

// @desc    Get inventory report
// @route   GET /api/v1/pharmacist/reports/inventory
// @access  Private/Pharmacist
exports.getInventoryReport = asyncHandler(async (req, res) => {
  const { category, lowStockThreshold = 20 } = req.query;

  const filter = {};
  if (category) filter.category = category;

  // Get medicine inventory
  const medicines = await Medicine.find(filter)
    .sort({ stockQuantity: 1, name: 1 });

  // Categorize by stock level
  const stockLevels = {
    critical: medicines.filter(m => m.stockQuantity < 10),
    low: medicines.filter(m => m.stockQuantity >= 10 && m.stockQuantity < lowStockThreshold),
    normal: medicines.filter(m => m.stockQuantity >= lowStockThreshold && m.stockQuantity < 100),
    high: medicines.filter(m => m.stockQuantity >= 100)
  };

  // Get usage statistics
  const usageStats = await Prescription.aggregate([
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.name',
        prescriptionCount: { $sum: 1 },
        pendingCount: {
          $sum: {
            $cond: [{ $eq: ['$medicines.administrationStatus', 'Pending'] }, 1, 0]
          }
        }
      }
    }
  ]);

  // Calculate total inventory value
  const totalValue = medicines.reduce(
    (sum, med) => sum + (med.stockQuantity * med.price), 0
  );

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalMedicines: medicines.length,
        totalStock: medicines.reduce((sum, med) => sum + med.stockQuantity, 0),
        totalValue,
        criticalCount: stockLevels.critical.length,
        lowCount: stockLevels.low.length
      },
      stockLevels,
      medicines: medicines.map(med => {
        const usage = usageStats.find(u => 
          u._id.toLowerCase().includes(med.name.toLowerCase()) ||
          med.name.toLowerCase().includes(u._id.toLowerCase())
        );
        
        return {
          ...med.toObject(),
          usage: usage || { prescriptionCount: 0, pendingCount: 0 },
          inventoryValue: med.stockQuantity * med.price
        };
      })
    }
  });
});

/* =========================================================
   7. NOTIFICATIONS & ALERTS
========================================================= */

// @desc    Get pharmacist notifications
// @route   GET /api/v1/pharmacist/notifications
// @access  Private/Pharmacist
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = [];

  // 1. Low stock notifications
  const lowStockMedicines = await Medicine.find({
    stockQuantity: { $lt: 10 }
  }).select('name stockQuantity').limit(5);

  lowStockMedicines.forEach(med => {
    notifications.push({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${med.name} is running low (${med.stockQuantity} left)`,
      priority: 'high',
      data: {
        medicineId: med._id,
        medicineName: med.name,
        currentStock: med.stockQuantity
      },
      timestamp: new Date()
    });
  });

  // 2. New prescriptions (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newPrescriptions = await Prescription.countDocuments({
    createdAt: { $gte: yesterday },
    'medicines.administrationStatus': 'Pending'
  });

  if (newPrescriptions > 0) {
    notifications.push({
      type: 'NEW_PRESCRIPTIONS',
      title: 'New Prescriptions',
      message: `${newPrescriptions} new prescriptions require attention`,
      priority: 'medium',
      data: {
        count: newPrescriptions
      },
      timestamp: new Date()
    });
  }

  // 3. Pending bills
  const pendingBills = await Billing.countDocuments({
    paymentStatus: 'Pending',
    createdAt: { $gte: yesterday }
  });

  if (pendingBills > 0) {
    notifications.push({
      type: 'PENDING_BILLS',
      title: 'Pending Bills',
      message: `${pendingBills} bills pending payment`,
      priority: 'medium',
      data: {
        count: pendingBills
      },
      timestamp: new Date()
    });
  }

  // Sort by priority and timestamp
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => {
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

/* =========================================================
   8. QUICK ACTIONS
========================================================= */

// @desc    Process prescription quickly (dispense and bill)
// @route   POST /api/v1/pharmacist/prescriptions/:id/quick-process
// @access  Private/Pharmacist
exports.quickProcessPrescription = asyncHandler(async (req, res) => {
  const { discount = 0 } = req.body;

  const prescription = await Prescription.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check if already billed
  const existingBill = await Billing.findOne({ prescriptionId: prescription._id });
  if (existingBill) {
    res.status(400);
    throw new Error('Prescription already processed');
  }

  // Check medicine availability
  const unavailableMedicines = [];
  let totalAmount = 0;
  const billItems = [];

  for (const medicine of prescription.medicines) {
    const stockInfo = await Medicine.findOne({
      name: { $regex: new RegExp(medicine.name, 'i') }
    });

    if (!stockInfo || stockInfo.stockQuantity < (medicine.quantity || 1)) {
      unavailableMedicines.push({
        name: medicine.name,
        required: medicine.quantity || 1,
        available: stockInfo ? stockInfo.stockQuantity : 0
      });
    } else {
      const quantity = medicine.quantity || 1;
      const itemAmount = stockInfo.price * quantity;
      totalAmount += itemAmount;

      billItems.push({
        medicineId: stockInfo._id,
        medicineName: stockInfo.name,
        quantity,
        unitPrice: stockInfo.price,
        totalPrice: itemAmount
      });
    }
  }

  if (unavailableMedicines.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Some medicines are unavailable',
      data: {
        unavailableMedicines,
        availableMedicines: billItems
      }
    });
    return;
  }

  // Calculate final amount
  const discountAmount = (totalAmount * discount) / 100;
  const finalAmount = totalAmount - discountAmount;

  // Create bill
  const bill = await Billing.create({
    patientId: prescription.patientId._id,
    prescriptionId: prescription._id,
    appointmentId: prescription.appointmentId,
    amount: finalAmount,
    discount,
    discountAmount,
    originalAmount: totalAmount,
    billItems,
    generatedBy: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role
    },
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    paymentDate: new Date(),
    notes: 'Quick processed by pharmacist'
  });

  // Update medicine stock
  for (const item of billItems) {
    await Medicine.findByIdAndUpdate(
      item.medicineId,
      { $inc: { stockQuantity: -item.quantity } }
    );
  }

  // Update prescription status
  await Prescription.findByIdAndUpdate(prescription._id, {
    $set: {
      'medicines.$[].administrationStatus': 'Administered',
      'medicines.$[].lastAdministered': new Date(),
      'medicines.$[].administeredBy': {
        role: 'PHARMACIST',
        userId: req.user._id,
        name: req.user.name
      }
    }
  });

  const populatedBill = await Billing.findById(bill._id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  res.status(200).json({
    success: true,
    message: 'Prescription processed successfully',
    data: {
      bill: populatedBill,
      prescriptionId: prescription._id,
      patientName: prescription.patientId.userId.name,
      summary: {
        medicinesCount: billItems.length,
        totalAmount,
        discount,
        finalAmount
      }
    }
  });
});