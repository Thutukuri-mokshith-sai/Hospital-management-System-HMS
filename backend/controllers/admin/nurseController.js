const mongoose = require('mongoose');
const { User, Nurse, Ward, NursingCare, Vitals, Patient } = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   NURSE CRUD OPERATIONS
===================== */
exports.createNurse = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    email, 
    password, 
    phone, 
    specialization, 
    licenseNumber, 
    wardId,
    shift,
    experience,
    employeeId 
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !licenseNumber || !wardId) {
    res.status(400);
    throw new Error('Name, email, password, license number, and ward ID are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('User with this email already exists');
  }

  // Validate ward exists
  const ward = await Ward.findById(wardId);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  try {
    // Create user account WITHOUT session
    const user = await User.create({
      name,
      email,
      password,
      role: 'NURSE',
      phone,
      isActive: true
    });

    // Create nurse profile WITHOUT session
    const nurse = await Nurse.create({
      userId: user._id,
      employeeId: employeeId || `NUR${Date.now()}`,
      specialization: specialization || 'General',
      licenseNumber,
      wardId,
      shift: shift || 'Rotating',
      experience: experience || 0,
      isActive: true,
      joinDate: new Date()
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Nurse created successfully',
      data: {
        user: userResponse,
        nurse
      }
    });

  } catch (error) {
    // If error occurs, clean up created records
    if (user) await User.deleteOne({ _id: user._id });
    if (nurse) await Nurse.deleteOne({ _id: nurse._id });
    throw error;
  }
});
// Get all nurses with detailed information
exports.getAllNurses = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    specialization,
    shift,
    wardId,
    search,
    isActive
  } = req.query;

  const userQuery = { role: 'NURSE' };
  const nurseQuery = {};

  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (specialization) {
    nurseQuery.specialization = specialization;
  }

  if (shift) {
    nurseQuery.shift = shift;
  }

  if (wardId) {
    nurseQuery.wardId = wardId;
  }

  if (isActive !== undefined) {
    nurseQuery.isActive = isActive === 'true';
  }

  // Get nurse profiles first
  const nurses = await Nurse.find(nurseQuery).select('userId').lean();
  const nurseUserIds = nurses.map(n => n.userId);

  userQuery._id = { $in: nurseUserIds };

  const users = await User.find(userQuery)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const detailedNurses = await Promise.all(
    users.map(async (user) => {
      const nurse = await Nurse.findOne({ userId: user._id })
        .populate('wardId', 'wardNumber name floor')
        .lean();
      
      // Get care statistics
      const [careStats, vitalsCount] = await Promise.all([
        NursingCare.aggregate([
          { $match: { nurseId: user._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        Vitals.countDocuments({ nurseId: user._id })
      ]);

      return {
        user,
        nurse,
        statistics: {
          totalCareTasks: await NursingCare.countDocuments({ nurseId: user._id }),
          totalVitalsRecorded: vitalsCount,
          careStats
        }
      };
    })
  );

  const total = await User.countDocuments(userQuery);

  res.status(200).json({
    success: true,
    count: detailedNurses.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: detailedNurses
  });
});

// Get single nurse with full details
exports.getNurseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const user = await User.findById(id).select('-password');
  
  if (!user || user.role !== 'NURSE') {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const nurse = await Nurse.findOne({ userId: id })
    .populate('wardId', 'wardNumber name floor specialty')
    .populate('chargeNurseId', 'userId')
    .lean();

  if (!nurse) {
    res.status(404);
    throw new Error('Nurse profile not found');
  }

  // Get nursing statistics
  const [careStats, vitalsStats, patientStats, shiftStats] = await Promise.all([
    NursingCare.aggregate([
      { $match: { nurseId: id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Vitals.countDocuments({ nurseId: id }),
    NursingCare.aggregate([
      { $match: { nurseId: id } },
      {
        $group: {
          _id: '$patientId',
          count: { $sum: 1 }
        }
      },
      { $count: 'uniquePatients' }
    ]),
    NursingCare.aggregate([
      { $match: { nurseId: id } },
      {
        $group: {
          _id: {
            $hour: '$createdAt'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Get recent activities
  const [recentCare, recentVitals, assignedPatients] = await Promise.all([
    NursingCare.find({ nurseId: id })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Vitals.find({ nurseId: id })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean(),
    Patient.find({ wardId: nurse.wardId, isAdmitted: true })
      .populate('userId', 'name')
      .limit(10)
      .lean()
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      nurse,
      statistics: {
        totalCareTasks: await NursingCare.countDocuments({ nurseId: id }),
        totalVitalsRecorded: vitalsStats,
        uniquePatients: patientStats[0]?.uniquePatients || 0,
        careDistribution: careStats,
        shiftActivity: shiftStats
      },
      recentActivities: {
        nursingCare: recentCare,
        vitalsRecords: recentVitals
      },
      assignedWard: {
        ward: nurse.wardId,
        currentPatients: assignedPatients,
        patientCount: assignedPatients.length
      }
    }
  });
});

// Update nurse profile
exports.updateNurse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'NURSE') {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse profile not found');
  }

  try {
    // Update user info if provided
    if (updateData.name || updateData.phone || updateData.email) {
      const userUpdate = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.phone) userUpdate.phone = updateData.phone;
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
          throw new Error('Email already in use');
        }
        userUpdate.email = updateData.email;
      }
      await User.findByIdAndUpdate(id, userUpdate);
    }

    // Update nurse profile
    const nurseUpdate = { ...updateData };
    delete nurseUpdate.name;
    delete nurseUpdate.phone;
    delete nurseUpdate.email;

    // Validate ward if being updated
    if (nurseUpdate.wardId && nurseUpdate.wardId !== nurse.wardId.toString()) {
      const ward = await Ward.findById(nurseUpdate.wardId);
      if (!ward) {
        throw new Error('Ward not found');
      }
    }

    const updatedNurse = await Nurse.findOneAndUpdate(
      { userId: id },
      nurseUpdate,
      { new: true, runValidators: true }
    ).populate('wardId', 'wardNumber name floor');

    res.status(200).json({
      success: true,
      message: 'Nurse updated successfully',
      data: {
        user: await User.findById(id).select('-password'),
        nurse: updatedNurse
      }
    });

  } catch (error) {
    throw error;
  }
});
// Delete nurse
exports.deleteNurse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'NURSE') {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse profile not found');
  }

  try {
    // Check if nurse is a charge nurse
    const isChargeNurse = await Ward.findOne({ chargeNurseId: nurse._id });
    if (isChargeNurse) {
      // Remove charge nurse assignment
      await Ward.updateMany(
        { chargeNurseId: nurse._id },
        { $unset: { chargeNurseId: '' } }
      );
    }

    // Update nursing care records to remove nurse reference
    await NursingCare.updateMany(
      { nurseId: id },
      { nurseId: null }
    );

    // Update vitals records to remove nurse reference
    await Vitals.updateMany(
      { nurseId: id },
      { nurseId: null }
    );

    // Delete nurse profile
    await Nurse.deleteOne({ userId: id });

    // Delete user account
    await User.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Nurse deleted successfully'
    });

  } catch (error) {
    throw error;
  }
});
// Toggle nurse active status
exports.toggleNurseStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  // Update nurse status
  nurse.isActive = isActive;
  await nurse.save();

  // Update user status as well
  await User.findByIdAndUpdate(id, { isActive });

  res.status(200).json({
    success: true,
    message: `Nurse ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: nurse._id,
      employeeId: nurse.employeeId,
      isActive: nurse.isActive
    }
  });
});

/* =====================
   NURSE WARD MANAGEMENT
===================== */

// Assign nurse to ward
exports.assignNurseToWard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { wardId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  if (!wardId) {
    res.status(400);
    throw new Error('Ward ID is required');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const ward = await Ward.findById(wardId);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  // Update nurse's ward
  nurse.wardId = wardId;
  await nurse.save();

  res.status(200).json({
    success: true,
    message: `Nurse assigned to ward ${ward.wardNumber} successfully`,
    data: {
      nurse: {
        id: nurse._id,
        employeeId: nurse.employeeId,
        name: (await User.findById(id)).name
      },
      ward: {
        id: ward._id,
        wardNumber: ward.wardNumber,
        name: ward.name,
        floor: ward.floor
      }
    }
  });
});

// Set/Remove charge nurse for ward
exports.manageChargeNurse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { wardId, action = 'set' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  if (!wardId) {
    res.status(400);
    throw new Error('Ward ID is required');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const ward = await Ward.findById(wardId);
  if (!ward) {
    res.status(404);
    throw new Error('Ward not found');
  }

  // Check if nurse is assigned to this ward
  if (nurse.wardId.toString() !== wardId) {
    res.status(400);
    throw new Error('Nurse is not assigned to this ward');
  }

  if (action === 'set') {
    // Check if ward already has a charge nurse
    if (ward.chargeNurseId) {
      const currentChargeNurse = await Nurse.findById(ward.chargeNurseId);
      if (currentChargeNurse) {
        res.status(409);
        throw new Error(`Ward already has a charge nurse: ${currentChargeNurse.employeeId}`);
      }
    }
    
    // Set as charge nurse
    ward.chargeNurseId = nurse._id;
    await ward.save();

    res.status(200).json({
      success: true,
      message: 'Nurse set as charge nurse successfully',
      data: {
        nurse: {
          id: nurse._id,
          employeeId: nurse.employeeId,
          name: (await User.findById(id)).name
        },
        ward: {
          id: ward._id,
          wardNumber: ward.wardNumber,
          name: ward.name
        }
      }
    });

  } else if (action === 'remove') {
    // Remove as charge nurse
    if (ward.chargeNurseId?.toString() !== nurse._id.toString()) {
      res.status(400);
      throw new Error('Nurse is not the charge nurse of this ward');
    }
    
    ward.chargeNurseId = null;
    await ward.save();

    res.status(200).json({
      success: true,
      message: 'Nurse removed as charge nurse successfully',
      data: {
        nurse: {
          id: nurse._id,
          employeeId: nurse.employeeId,
          name: (await User.findById(id)).name
        },
        ward: {
          id: ward._id,
          wardNumber: ward.wardNumber,
          name: ward.name
        }
      }
    });

  } else {
    res.status(400);
    throw new Error('Invalid action. Use "set" or "remove"');
  }
});

// Get nurses by ward
exports.getNursesByWard = asyncHandler(async (req, res, next) => {
  const { wardId } = req.params;
  const { shift, activeOnly = true } = req.query;

  if (!mongoose.Types.ObjectId.isValid(wardId)) {
    res.status(400);
    throw new Error('Invalid ward ID');
  }

  const query = { wardId };
  
  if (activeOnly === 'true') {
    query.isActive = true;
  }
  
  if (shift) {
    query.shift = shift;
  }

  const nurses = await Nurse.find(query)
    .populate('userId', 'name email phone')
    .lean();

  // Get ward details
  const ward = await Ward.findById(wardId).select('wardNumber name floor specialty chargeNurseId');

  // Get charge nurse details
  let chargeNurse = null;
  if (ward.chargeNurseId) {
    chargeNurse = await Nurse.findById(ward.chargeNurseId)
      .populate('userId', 'name')
      .lean();
  }

  res.status(200).json({
    success: true,
    data: {
      ward: {
        ...ward.toObject(),
        chargeNurse: chargeNurse ? {
          id: chargeNurse._id,
          employeeId: chargeNurse.employeeId,
          name: chargeNurse.userId.name
        } : null
      },
      nurses: nurses.map(nurse => ({
        id: nurse._id,
        employeeId: nurse.employeeId,
        name: nurse.userId.name,
        email: nurse.userId.email,
        phone: nurse.userId.phone,
        specialization: nurse.specialization,
        shift: nurse.shift,
        experience: nurse.experience,
        isActive: nurse.isActive,
        isChargeNurse: ward.chargeNurseId?.toString() === nurse._id.toString()
      })),
      count: nurses.length,
      statistics: {
        total: nurses.length,
        morning: nurses.filter(n => n.shift === 'Morning').length,
        evening: nurses.filter(n => n.shift === 'Evening').length,
        night: nurses.filter(n => n.shift === 'Night').length,
        rotating: nurses.filter(n => n.shift === 'Rotating').length,
        active: nurses.filter(n => n.isActive).length
      }
    }
  });
});

/* =====================
   NURSE PERFORMANCE & ANALYTICS
===================== */

// Get nurse performance metrics
exports.getNursePerformance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = Object.keys(dateFilter).length > 0 
    ? { nurseId: id, createdAt: dateFilter } 
    : { nurseId: id };

  const [
    careMetrics,
    vitalMetrics,
    patientMetrics,
    timelineMetrics,
    efficiencyMetrics
  ] = await Promise.all([
    // Nursing care metrics
    NursingCare.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            careType: '$careType',
            status: '$status'
          },
          count: { $sum: 1 },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.careType',
          total: { $sum: '$count' },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Completed'] }, '$count', 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Scheduled'] }, '$count', 0]
            }
          },
          avgCompletionHours: {
            $avg: {
              $divide: ['$avgCompletionTime', 1000 * 60 * 60]
            }
          }
        }
      }
    ]),

    // Vitals recording metrics
    Vitals.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' }
          },
          count: { $sum: 1 },
          patients: { $addToSet: '$patientId' }
        }
      },
      {
        $group: {
          _id: null,
          totalVitals: { $sum: '$count' },
          avgDailyVitals: { $avg: '$count' },
          uniquePatients: { $sum: { $size: '$patients' } }
        }
      }
    ]),

    // Patient interaction metrics
    NursingCare.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$patientId',
          interactionCount: { $sum: 1 },
          firstInteraction: { $min: '$createdAt' },
          lastInteraction: { $max: '$updatedAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalPatients: { $sum: 1 },
          avgInteractionsPerPatient: { $avg: '$interactionCount' }
        }
      }
    ]),

    // Timeline metrics (hourly distribution)
    NursingCare.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Efficiency metrics
    NursingCare.aggregate([
      { 
        $match: { 
          ...matchStage,
          status: 'Completed'
        } 
      },
      {
        $project: {
          completionTime: { $subtract: ['$updatedAt', '$createdAt'] },
          careType: 1
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: '$completionTime' },
          minCompletionTime: { $min: '$completionTime' },
          maxCompletionTime: { $max: '$completionTime' },
          totalTasks: { $sum: 1 }
        }
      }
    ])
  ]);

  const user = await User.findById(id).select('name email');

  // Calculate performance score
  const performanceScore = calculatePerformanceScore({
    careMetrics,
    vitalMetrics: vitalMetrics[0],
    patientMetrics: patientMetrics[0],
    efficiencyMetrics: efficiencyMetrics[0]
  });

  res.status(200).json({
    success: true,
    data: {
      nurse: {
        ...user.toObject(),
        ...nurse.toObject()
      },
      performanceMetrics: {
        careDistribution: careMetrics,
        vitalsRecording: vitalMetrics[0] || {},
        patientInteractions: patientMetrics[0] || {},
        activityTimeline: timelineMetrics,
        efficiency: efficiencyMetrics[0] || {},
        performanceScore: performanceScore,
        performanceGrade: getPerformanceGrade(performanceScore)
      }
    }
  });
});

// Helper function to calculate performance score
function calculatePerformanceScore(metrics) {
  let score = 100;

  // Deduct points based on metrics
  if (metrics.careMetrics) {
    const totalTasks = metrics.careMetrics.reduce((sum, m) => sum + m.total, 0);
    const completedTasks = metrics.careMetrics.reduce((sum, m) => sum + m.completed, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    
    if (completionRate < 90) score -= (90 - completionRate);
  }

  // Add points for efficiency
  if (metrics.efficiencyMetrics?.avgCompletionTime) {
    const avgHours = metrics.efficiencyMetrics.avgCompletionTime / (1000 * 60 * 60);
    if (avgHours < 2) score += 10; // Bonus for fast completion
    else if (avgHours > 8) score -= 20; // Penalty for slow completion
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to get performance grade
function getPerformanceGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

// Get nurse statistics by department/specialty
exports.getNurseStatistics = asyncHandler(async (req, res, next) => {
  const { groupBy = 'specialization' } = req.query;

  let groupField;
  switch (groupBy) {
    case 'specialization':
      groupField = '$specialization';
      break;
    case 'shift':
      groupField = '$shift';
      break;
    case 'ward':
      groupField = '$wardId';
      break;
    default:
      groupField = '$specialization';
  }

  const statistics = await Nurse.aggregate([
    {
      $group: {
        _id: groupField,
        total: { $sum: 1 },
        active: { 
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        avgExperience: { $avg: '$experience' },
        minExperience: { $min: '$experience' },
        maxExperience: { $max: '$experience' }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // Populate ward names if grouping by ward
  if (groupBy === 'ward') {
    const wardIds = statistics.map(s => s._id);
    const wards = await Ward.find({ _id: { $in: wardIds } }).select('wardNumber name');
    const wardMap = {};
    wards.forEach(ward => {
      wardMap[ward._id] = `${ward.wardNumber} - ${ward.name}`;
    });

    statistics.forEach(stat => {
      stat.wardName = wardMap[stat._id] || 'Unknown Ward';
    });
  }

  res.status(200).json({
    success: true,
    data: {
      statistics,
      summary: {
        totalNurses: await Nurse.countDocuments(),
        activeNurses: await Nurse.countDocuments({ isActive: true }),
        averageExperience: await Nurse.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avg: { $avg: '$experience' } } }
        ]).then(result => result[0]?.avg || 0)
      }
    }
  });
});

/* =====================
   NURSE SCHEDULE MANAGEMENT
===================== */

// Get nurse schedule
exports.getNurseSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = Object.keys(dateFilter).length > 0 
    ? { nurseId: id, createdAt: dateFilter } 
    : { nurseId: id };

  // Get nursing care schedule
  const schedule = await NursingCare.find({
    ...matchStage,
    status: { $in: ['Scheduled', 'In Progress'] }
  })
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ createdAt: 1 })
    .lean();

  // Get shift pattern
  const shiftPattern = nurse.shift === 'Rotating' 
    ? generateRotatingSchedule(new Date(startDate || new Date()), 7)
    : [{ date: new Date(), shift: nurse.shift }];

  res.status(200).json({
    success: true,
    data: {
      nurse: {
        id: nurse._id,
        employeeId: nurse.employeeId,
        name: (await User.findById(id)).name,
        shift: nurse.shift,
        ward: nurse.wardId
      },
      schedule: {
        upcomingTasks: schedule,
        shiftPattern,
        totalScheduled: schedule.length,
        todayTasks: schedule.filter(task => 
          isSameDay(new Date(task.createdAt), new Date())
        ).length
      }
    }
  });
});

// Update nurse shift
exports.updateNurseShift = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { shift } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid nurse ID');
  }

  if (!shift || !['Morning', 'Evening', 'Night', 'Rotating'].includes(shift)) {
    res.status(400);
    throw new Error('Valid shift is required');
  }

  const nurse = await Nurse.findOne({ userId: id });
  
  if (!nurse) {
    res.status(404);
    throw new Error('Nurse not found');
  }

  nurse.shift = shift;
  await nurse.save();

  res.status(200).json({
    success: true,
    message: 'Nurse shift updated successfully',
    data: {
      id: nurse._id,
      employeeId: nurse.employeeId,
      shift: nurse.shift
    }
  });
});

// Helper functions for schedule
function generateRotatingSchedule(startDate, days) {
  const shifts = ['Morning', 'Evening', 'Night'];
  const schedule = [];
  let shiftIndex = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    schedule.push({
      date,
      shift: shifts[shiftIndex % shifts.length]
    });
    
    shiftIndex++;
  }

  return schedule;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

/* =====================
   NURSE BULK OPERATIONS
===================== */

// Bulk import nurses
exports.bulkImportNurses = asyncHandler(async (req, res, next) => {
  const { nurses } = req.body;

  if (!Array.isArray(nurses) || nurses.length === 0) {
    res.status(400);
    throw new Error('Nurses array is required');
  }

  if (nurses.length > 100) {
    res.status(400);
    throw new Error('Maximum 100 nurses can be imported at once');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const results = {
      success: [],
      failed: []
    };

    for (const nurseData of nurses) {
      try {
        const { 
          name, 
          email, 
          password, 
          phone, 
          specialization, 
          licenseNumber, 
          wardId,
          shift,
          experience,
          employeeId 
        } = nurseData;

        // Validate required fields
        if (!name || !email || !password || !licenseNumber || !wardId) {
          results.failed.push({
            email: email || 'N/A',
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.failed.push({
            email,
            reason: 'Email already exists'
          });
          continue;
        }

        // Validate ward exists
        const ward = await Ward.findById(wardId);
        if (!ward) {
          results.failed.push({
            email,
            reason: 'Ward not found'
          });
          continue;
        }

        // Create user account
        const user = await User.create([{
          name,
          email,
          password,
          role: 'NURSE',
          phone,
          isActive: true
        }], { session });

        // Create nurse profile
        const nurse = await Nurse.create([{
          userId: user[0]._id,
          employeeId: employeeId || `NUR${Date.now()}`,
          specialization: specialization || 'General',
          licenseNumber,
          wardId,
          shift: shift || 'Rotating',
          experience: experience || 0,
          isActive: true,
          joinDate: new Date()
        }], { session });

        results.success.push({
          email,
          userId: user[0]._id,
          nurseId: nurse[0]._id,
          employeeId: nurse[0].employeeId
        });

      } catch (error) {
        results.failed.push({
          email: nurseData.email || 'N/A',
          reason: error.message
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.success.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Export nurses data
exports.exportNurses = asyncHandler(async (req, res, next) => {
  const { format = 'json', includeInactive = false } = req.query;

  const query = {};
  if (includeInactive !== 'true') {
    query.isActive = true;
  }

  const nurses = await Nurse.find(query)
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name floor')
    .populate('chargeNurseId', 'employeeId')
    .lean();

  const exportData = nurses.map(nurse => ({
    employeeId: nurse.employeeId,
    name: nurse.userId.name,
    email: nurse.userId.email,
    phone: nurse.userId.phone,
    specialization: nurse.specialization,
    licenseNumber: nurse.licenseNumber,
    ward: nurse.wardId ? `${nurse.wardId.wardNumber} - ${nurse.wardId.name}` : 'Not assigned',
    shift: nurse.shift,
    experience: nurse.experience,
    isActive: nurse.isActive,
    joinDate: nurse.joinDate,
    isChargeNurse: nurse._id.equals(nurse.wardId?.chargeNurseId?._id) || false
  }));

  if (format === 'csv') {
    // Convert to CSV
    const csv = convertToCSV(exportData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=nurses_export.csv');
    
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
   NURSE ACTIVITY REPORTS
===================== */

// Get nurse activity report
exports.getNurseActivityReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, nurseId, wardId } = req.query;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (nurseId) {
    matchStage.nurseId = nurseId;
  }

  // If wardId is provided, get all nurses in that ward
  let nurseIds = [];
  if (wardId) {
    const nursesInWard = await Nurse.find({ wardId }).select('userId');
    nurseIds = nursesInWard.map(n => n.userId);
    matchStage.nurseId = { $in: nurseIds };
  }

  const [nursingCare, vitals] = await Promise.all([
    NursingCare.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            nurseId: '$nurseId',
            careType: '$careType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.nurseId',
          foreignField: '_id',
          as: 'nurseInfo'
        }
      },
      {
        $unwind: {
          path: '$nurseInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'nurses',
          localField: '_id.nurseId',
          foreignField: 'userId',
          as: 'nurseProfile'
        }
      },
      {
        $unwind: {
          path: '$nurseProfile',
          preserveNullAndEmptyArrays: true
        }
      }
    ]),
    Vitals.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$nurseId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'nurseInfo'
        }
      },
      {
        $unwind: {
          path: '$nurseInfo',
          preserveNullAndEmptyArrays: true
        }
      }
    ])
  ]);

  // Format the response
  const nurseActivity = {};

  // Process nursing care data
  nursingCare.forEach(item => {
    const nurseId = item._id.nurseId;
    if (!nurseActivity[nurseId]) {
      nurseActivity[nurseId] = {
        nurse: {
          id: nurseId,
          name: item.nurseInfo?.name || 'Unknown',
          employeeId: item.nurseProfile?.employeeId || 'N/A'
        },
        activities: {
          nursingCare: {},
          vitals: 0
        }
      };
    }

    if (!nurseActivity[nurseId].activities.nursingCare[item._id.careType]) {
      nurseActivity[nurseId].activities.nursingCare[item._id.careType] = {
        total: 0,
        completed: 0,
        pending: 0
      };
    }

    nurseActivity[nurseId].activities.nursingCare[item._id.careType].total += item.count;
    if (item._id.status === 'Completed') {
      nurseActivity[nurseId].activities.nursingCare[item._id.careType].completed += item.count;
    } else if (item._id.status === 'Scheduled') {
      nurseActivity[nurseId].activities.nursingCare[item._id.careType].pending += item.count;
    }
  });

  // Process vitals data
  vitals.forEach(item => {
    const nurseId = item._id;
    if (!nurseActivity[nurseId]) {
      nurseActivity[nurseId] = {
        nurse: {
          id: nurseId,
          name: item.nurseInfo?.name || 'Unknown',
          employeeId: 'N/A'
        },
        activities: {
          nursingCare: {},
          vitals: 0
        }
      };
    }
    nurseActivity[nurseId].activities.vitals = item.count;
  });

  const result = Object.values(nurseActivity).map(nurse => ({
    ...nurse,
    totalActivities: Object.values(nurse.activities.nursingCare).reduce((sum, care) => sum + care.total, 0) + nurse.activities.vitals
  }));

  res.status(200).json({
    success: true,
    data: {
      reportPeriod: {
        startDate: startDate || 'Not specified',
        endDate: endDate || 'Not specified'
      },
      nurses: result,
      summary: {
        totalNurses: result.length,
        totalActivities: result.reduce((sum, nurse) => sum + nurse.totalActivities, 0),
        avgActivitiesPerNurse: result.length > 0 
          ? Math.round(result.reduce((sum, nurse) => sum + nurse.totalActivities, 0) / result.length)
          : 0
      }
    }
  });
});