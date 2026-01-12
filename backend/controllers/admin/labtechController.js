const mongoose = require('mongoose');
const { User, LabTech, LabTest, Patient, Doctor } = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   LAB TECH MANAGEMENT (CRUD)
===================== */
/* =====================
   HELPER FUNCTIONS
===================== */

// Find lab tech by various identifiers
const findLabTechByIdentifier = async (identifier) => {
  let labTech = null;
  let user = null;

  // Check if identifier is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier);
    if (user && user.role === 'LAB_TECH') {
      labTech = await LabTech.findOne({ userId: user._id });
    }
  } else {
    // Try to find by employeeId
    labTech = await LabTech.findOne({ employeeId: identifier });
    
    if (!labTech) {
      // Try to find by user email or name
      user = await User.findOne({
        $or: [
          { email: identifier },
          { name: { $regex: `^${identifier}$`, $options: 'i' } }
        ],
        role: 'LAB_TECH'
      });
      
      if (user) {
        labTech = await LabTech.findOne({ userId: user._id });
      }
    } else {
      user = await User.findById(labTech.userId);
    }
  }

  return { user, labTech };
};

// Validate lab tech exists and is active
const validateLabTech = async (identifier) => {
  const { user, labTech } = await findLabTechByIdentifier(identifier);
  
  if (!user || !labTech) {
    throw new Error('Lab technician not found');
  }
  
  if (!labTech.isActive) {
    throw new Error('Lab technician is inactive');
  }
  
  return { user, labTech };
};
// Get all lab technicians
exports.getAllLabTechs = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    department,
    specialization,
    shift,
    isActive,
    search
  } = req.query;

  const query = { role: 'LAB_TECH' };
  const labTechQuery = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (department) {
    labTechQuery.department = department;
  }

  if (specialization) {
    labTechQuery.specialization = specialization;
  }

  if (shift) {
    labTechQuery.shift = shift;
  }

  if (isActive !== undefined) {
    labTechQuery.isActive = isActive === 'true';
  }

  // Get lab tech profiles first
  const labTechs = await LabTech.find(labTechQuery).select('userId').lean();
  const labTechUserIds = labTechs.map(lt => lt.userId);

  query._id = { $in: labTechUserIds };

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const detailedLabTechs = await Promise.all(
    users.map(async (user) => {
      const labTech = await LabTech.findOne({ userId: user._id })
        .populate('userId', 'name email phone')
        .lean();
      
      // Get lab test statistics
      const labTestStats = await LabTest.aggregate([
        { 
          $match: { 
            status: 'Completed',
            labTechId: user._id 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ]);

      // Get pending tests
      const pendingTests = await LabTest.countDocuments({
        status: { $in: ['Requested', 'Processing'] }
      });

      return {
        user,
        labTech,
        statistics: {
          totalTestsConducted: await LabTest.countDocuments({ labTechId: user._id }),
          pendingTests,
          labTestStats,
          accuracyRate: labTech?.accuracyRate || 0
        }
      };
    })
  );

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: detailedLabTechs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: detailedLabTechs
  });
});

// Get single lab tech details
// Get single lab tech details
exports.getLabTechById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check if id is a valid ObjectId or an employeeId
  let user = null;
  let labTech = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    // Find by User._id
    user = await User.findById(id).select('-password');
    if (user && user.role === 'LAB_TECH') {
      labTech = await LabTech.findOne({ userId: id });
    }
  } else {
    // Try to find by employeeId
    labTech = await LabTech.findOne({ employeeId: id })
      .populate('userId', 'name email phone createdAt');
    
    if (labTech) {
      user = labTech.userId;
    }
  }

  if (!user || !labTech) {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  // Rest of the function remains the same...
  const recentLabTests = await LabTest.find({
    labTechId: user._id, // Use User._id
    status: 'Completed'
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
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean();

  // Get pending tests
  const pendingTests = await LabTest.find({
    status: { $in: ['Requested', 'Processing'] }
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
    .sort({ createdAt: 1 })
    .limit(5)
    .lean();

  // Get monthly performance stats
  const currentYear = new Date().getFullYear();
  // In getLabTechById function, change these aggregation queries:

// Get monthly performance stats
const monthlyStats = await LabTest.aggregate([
  {
    $match: {
      labTechId: user._id, // Changed from 'id' to 'user._id'
      status: 'Completed',
      updatedAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    }
  },
  // ... rest of the aggregation
]);

// Get test type distribution
const testTypeStats = await LabTest.aggregate([
  {
    $match: {
      labTechId: user._id, // Changed from 'id' to 'user._id'
      status: 'Completed'
    }
  },
    {
      $group: {
        _id: '$testName',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      labTech,
      statistics: {
        totalTests: await LabTest.countDocuments({ labTechId: id }),
        completedTests: await LabTest.countDocuments({ labTechId: id, status: 'Completed' }),
        pendingTests: await LabTest.countDocuments({ 
          labTechId: id, 
          status: { $in: ['Requested', 'Processing'] } 
        }),
        monthlyStats,
        testTypeStats,
        accuracyRate: labTech.accuracyRate || 0
      },
      recentActivity: {
        recentLabTests,
        pendingTests
      }
    }
  });
});

// Create lab technician - TRANSACTIONS REMOVED
exports.createLabTech = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    email, 
    password, 
    phone, 
    employeeId,
    department,
    licenseNumber,
    specialization,
    shift,
    experience,
    equipmentPermissions,
    certifiedTests
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !employeeId || !department || !licenseNumber) {
    res.status(400);
    throw new Error('Name, email, password, employee ID, department, and license number are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('User with this email already exists');
  }

  // Check if employee ID already exists
  const existingEmployee = await LabTech.findOne({ employeeId });
  if (existingEmployee) {
    res.status(409);
    throw new Error('Employee ID already exists');
  }

  // Check if license number already exists
  const existingLicense = await LabTech.findOne({ licenseNumber });
  if (existingLicense) {
    res.status(409);
    throw new Error('License number already exists');
  }

  try {
    // Create user - REMOVED SESSION PARAMETER
    const user = await User.create({
      name,
      email,
      password,
      role: 'LAB_TECH',
      phone
    });

    // Create lab tech profile - REMOVED SESSION PARAMETER
    const labTech = await LabTech.create({
      userId: user._id,
      employeeId,
      department,
      licenseNumber,
      specialization: specialization || 'General',
      shift: shift || 'Rotating',
      experience: experience || 0,
      equipmentPermissions: equipmentPermissions || [],
      certifiedTests: certifiedTests || []
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Lab technician created successfully',
      data: {
        user: userResponse,
        labTech: labTech
      }
    });

  } catch (error) {
    // REMOVED TRANSACTION ABORT LOGIC
    throw error;
  }
});

// Update lab technician profile - TRANSACTIONS REMOVED
// Update lab technician profile
exports.updateLabTech = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Try to find lab technician by various identifiers
  let labTech = null;
  let user = null;

  // Check if id is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    // First try to find by LabTech._id
    labTech = await LabTech.findById(id).populate('userId', 'name email role phone');
    
    // If not found by LabTech._id, try to find by userId
    if (!labTech) {
      // Find by User._id
      user = await User.findById(id);
      if (user && user.role === 'LAB_TECH') {
        labTech = await LabTech.findOne({ userId: id }).populate('userId', 'name email role phone');
      }
    } else {
      user = labTech.userId;
    }
  } else {
    // Try to find by employeeId
    labTech = await LabTech.findOne({ employeeId: id }).populate('userId', 'name email role phone');
    
    if (labTech) {
      user = labTech.userId;
    } else {
      // Try to find by user email or name
      user = await User.findOne({
        $or: [
          { email: id },
          { name: { $regex: `^${id}$`, $options: 'i' } }
        ],
        role: 'LAB_TECH'
      });
      
      if (user) {
        labTech = await LabTech.findOne({ userId: user._id }).populate('userId', 'name email role phone');
      }
    }
  }

  if (!user || !labTech) {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  try {
    // Update user info if provided
    const userUpdate = {};
    
    if (updateData.name && updateData.name !== user.name) {
      userUpdate.name = updateData.name;
    }
    
    if (updateData.phone && updateData.phone !== user.phone) {
      userUpdate.phone = updateData.phone;
    }
    
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        throw new Error('Email already in use by another user');
      }
      userUpdate.email = updateData.email;
    }

    // Update password if provided
    if (updateData.password) {
      userUpdate.password = updateData.password;
    }

    // Update user active status if provided
    if (updateData.isActive !== undefined && updateData.isActive !== user.isActive) {
      userUpdate.isActive = updateData.isActive;
    }

    // Update user if there are changes
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(user._id, userUpdate, { new: true, runValidators: true });
    }

    // Remove user fields from lab tech update
    delete updateData.name;
    delete updateData.phone;
    delete updateData.email;
    delete updateData.password;
    delete updateData.isActive;

    // Handle employee ID uniqueness
    if (updateData.employeeId && updateData.employeeId !== labTech.employeeId) {
      const existingEmployee = await LabTech.findOne({ 
        employeeId: updateData.employeeId,
        _id: { $ne: labTech._id } // Exclude current lab tech
      });
      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }
    }

    // Handle license number uniqueness
    if (updateData.licenseNumber && updateData.licenseNumber !== labTech.licenseNumber) {
      const existingLicense = await LabTech.findOne({ 
        licenseNumber: updateData.licenseNumber,
        _id: { $ne: labTech._id } // Exclude current lab tech
      });
      if (existingLicense) {
        throw new Error('License number already exists');
      }
    }

    // Prepare lab tech update object
    const labTechUpdate = {};
    
    // Only update fields that are provided and different
    const labTechFields = [
      'employeeId', 'department', 'licenseNumber', 'specialization',
      'shift', 'experience', 'equipmentPermissions', 'certifiedTests',
      'accuracyRate', 'notes'
    ];
    
    labTechFields.forEach(field => {
      if (updateData[field] !== undefined) {
        labTechUpdate[field] = updateData[field];
      }
    });

    // Update lastUpdated timestamp
    labTechUpdate.lastUpdated = new Date();

    // Update lab tech profile
    const updatedLabTech = await LabTech.findByIdAndUpdate(
      labTech._id,
      labTechUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone isActive');

    // Get updated user info
    const updatedUser = await User.findById(user._id).select('-password');

    // Get updated statistics
    const stats = {
      totalTests: await LabTest.countDocuments({ labTechId: user._id }),
      completedTests: await LabTest.countDocuments({ labTechId: user._id, status: 'Completed' }),
      pendingTests: await LabTest.countDocuments({ 
        labTechId: user._id, 
        status: { $in: ['Requested', 'Processing'] } 
      }),
      lastActivity: await LabTest.findOne({ 
        labTechId: user._id 
      }).sort({ updatedAt: -1 }).select('updatedAt testName').lean()
    };

    res.status(200).json({
      success: true,
      message: 'Lab technician updated successfully',
      data: {
        user: updatedUser,
        labTech: updatedLabTech,
        statistics: stats
      },
      updatedFields: {
        user: Object.keys(userUpdate),
        labTech: Object.keys(labTechUpdate)
      }
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400);
      throw new Error(`Validation error: ${error.message}`);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(409);
      const field = Object.keys(error.keyPattern)[0];
      throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
    }
    
    throw error;
  }
});
// Update lab technician status (active/inactive)
// Update lab technician status (active/inactive)
exports.updateLabTechStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive, reason, notes } = req.body;

  // Validate input
  if (isActive === undefined) {
    res.status(400);
    throw new Error('Status is required');
  }

  if (typeof isActive !== 'boolean') {
    res.status(400);
    throw new Error('Status must be a boolean value (true or false)');
  }

  let user = null;
  let labTech = null;

  // Find lab tech by various identifiers
  if (mongoose.Types.ObjectId.isValid(id)) {
    // Find by User._id
    user = await User.findById(id);
    if (user && user.role === 'LAB_TECH') {
      labTech = await LabTech.findOne({ userId: id });
    }
  } else {
    // Try to find by employeeId
    labTech = await LabTech.findOne({ employeeId: id });
    
    if (labTech) {
      user = await User.findById(labTech.userId);
    } else {
      // Try to find by user email
      user = await User.findOne({ 
        $or: [
          { email: id },
          { name: { $regex: `^${id}$`, $options: 'i' } }
        ],
        role: 'LAB_TECH'
      });
      
      if (user) {
        labTech = await LabTech.findOne({ userId: user._id });
      }
    }
  }

  if (!user || !labTech) {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  // Check if status is already the same
  if (labTech.isActive === isActive) {
    res.status(400);
    throw new Error(`Lab technician is already ${isActive ? 'active' : 'inactive'}`);
  }

  // Store previous status for audit
  const previousStatus = labTech.isActive;
  
  // Update lab tech status
  labTech.isActive = isActive;
  
  // Add status change history
  if (!labTech.statusHistory) {
    labTech.statusHistory = [];
  }
  
  labTech.statusHistory.push({
    previousStatus,
    newStatus: isActive,
    changedBy: req.user._id,
    changedByName: req.user.name,
    reason: reason || 'No reason provided',
    notes: notes || '',
    changedAt: new Date()
  });

  // If deactivating, check for pending tests
  if (!isActive) {
    const pendingTests = await LabTest.countDocuments({
      labTechId: user._id,
      status: { $in: ['Requested', 'Processing'] }
    });

    if (pendingTests > 0) {
      res.status(400);
      throw new Error(`Cannot deactivate lab technician with ${pendingTests} pending test(s). Reassign or complete tests first.`);
    }
  }

  // Also update user active status
  if (user.isActive !== isActive) {
    user.isActive = isActive;
    
    // Add user status history
    if (!user.statusHistory) {
      user.statusHistory = [];
    }
    
    user.statusHistory.push({
      previousStatus: user.isActive,
      newStatus: isActive,
      changedBy: req.user._id,
      changedByName: req.user.name,
      reason: reason || 'Lab technician status change',
      changedAt: new Date()
    });
    
    await user.save();
  }

  // Save lab tech updates
  await labTech.save();

  // Get updated lab tech with populated data
  const updatedLabTech = await LabTech.findOne({ userId: user._id })
    .populate('userId', 'name email phone')
    .lean();

  // Get statistics for response
  const stats = {
    totalTests: await LabTest.countDocuments({ labTechId: user._id }),
    completedTests: await LabTest.countDocuments({ labTechId: user._id, status: 'Completed' }),
    pendingTests: await LabTest.countDocuments({ 
      labTechId: user._id, 
      status: { $in: ['Requested', 'Processing'] } 
    }),
    lastActivity: await LabTest.findOne({ 
      labTechId: user._id 
    }).sort({ updatedAt: -1 }).select('updatedAt testName').lean()
  };

  // If lab tech is being deactivated, create an audit log
  if (!isActive) {
    const AuditLog = require('../../models/AuditLog'); // If you have an audit log model
    
    if (AuditLog) {
      await AuditLog.create({
        action: 'LAB_TECH_DEACTIVATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        targetUser: user._id,
        targetUserName: user.name,
        details: {
          reason: reason || 'Lab technician deactivated',
          notes: notes || '',
          employeeId: labTech.employeeId,
          department: labTech.department,
          pendingTestsAtTime: stats.pendingTests,
          totalTestsConducted: stats.totalTests
        },
        timestamp: new Date()
      });
    }
  }

  // Prepare response
  const response = {
    success: true,
    message: `Lab technician ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: updatedLabTech.employeeId,
      department: updatedLabTech.department,
      specialization: updatedLabTech.specialization,
      previousStatus,
      newStatus: isActive,
      changedAt: new Date(),
      changedBy: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role
      },
      reason: reason || '',
      statistics: stats,
      lastStatusChange: labTech.statusHistory?.[labTech.statusHistory.length - 1]
    },
    warnings: !isActive && stats.pendingTests > 0 ? 
      [`Lab technician had ${stats.pendingTests} pending test(s) at time of deactivation`] : []
  };

  // If deactivating, suggest reassigning tests
  if (!isActive && stats.pendingTests > 0) {
    response.suggestions = [
      `Consider reassigning ${stats.pendingTests} pending test(s) to another active lab technician`,
      'Lab technician will not receive new test assignments until reactivated'
    ];
  }

  res.status(200).json(response);
});

// Bulk update lab technician statuses
exports.bulkUpdateLabTechStatus = asyncHandler(async (req, res, next) => {
  const { labTechIds, isActive, reason, notes } = req.body;

  if (!labTechIds || !Array.isArray(labTechIds) || labTechIds.length === 0) {
    res.status(400);
    throw new Error('Lab technician IDs array is required');
  }

  if (isActive === undefined) {
    res.status(400);
    throw new Error('Status is required');
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const identifier of labTechIds) {
    try {
      let user = null;
      let labTech = null;

      // Find lab tech
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        user = await User.findById(identifier);
        if (user && user.role === 'LAB_TECH') {
          labTech = await LabTech.findOne({ userId: identifier });
        }
      } else {
        labTech = await LabTech.findOne({ employeeId: identifier });
        if (labTech) {
          user = await User.findById(labTech.userId);
        }
      }

      if (!user || !labTech) {
        results.failed.push({
          identifier,
          error: 'Lab technician not found'
        });
        continue;
      }

      // Skip if status is already the same
      if (labTech.isActive === isActive) {
        results.failed.push({
          identifier,
          error: `Already ${isActive ? 'active' : 'inactive'}`
        });
        continue;
      }

      // Check for pending tests if deactivating
      if (!isActive) {
        const pendingTests = await LabTest.countDocuments({
          labTechId: user._id,
          status: { $in: ['Requested', 'Processing'] }
        });

        if (pendingTests > 0) {
          results.failed.push({
            identifier,
            error: `${pendingTests} pending tests`
          });
          continue;
        }
      }

      // Update status
      const previousStatus = labTech.isActive;
      labTech.isActive = isActive;
      
      // Add to status history
      if (!labTech.statusHistory) {
        labTech.statusHistory = [];
      }
      
      labTech.statusHistory.push({
        previousStatus,
        newStatus: isActive,
        changedBy: req.user._id,
        changedByName: req.user.name,
        reason: reason || 'Bulk update',
        notes: notes || '',
        changedAt: new Date()
      });

      await labTech.save();

      // Update user status
      user.isActive = isActive;
      await user.save();

      results.successful.push({
        id: user._id,
        employeeId: labTech.employeeId,
        name: user.name,
        email: user.email,
        previousStatus,
        newStatus: isActive
      });

    } catch (error) {
      results.failed.push({
        identifier,
        error: error.message
      });
    }
  }

  const response = {
    success: true,
    message: `Bulk status update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    data: {
      totalProcessed: labTechIds.length,
      successful: results.successful.length,
      failed: results.failed.length,
      details: {
        successful: results.successful,
        failed: results.failed
      }
    }
  };

  // If all failed, return error status
  if (results.successful.length === 0 && results.failed.length > 0) {
    res.status(207); // Multi-status
  }

  res.status(results.successful.length === 0 ? 207 : 200).json(response);
});
// Assign lab technician to lab test
// Assign lab technician to lab test
// Assign lab technician to lab test
// Assign lab technician to lab test (without certification requirement)
exports.assignLabTechToTest = asyncHandler(async (req, res, next) => {
  const { testId } = req.params;
  const { labTechId } = req.body;

  // Validate testId
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    res.status(400);
    throw new Error('Invalid test ID');
  }

  let labTech = null;
  let user = null;

  // Check if labTechId is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(labTechId)) {
    // FIRST: Try to find by LabTech._id
    labTech = await LabTech.findById(labTechId);
    
    if (!labTech) {
      // SECOND: Try to find by userId (User._id)
      labTech = await LabTech.findOne({ userId: labTechId });
    }
    
    if (labTech) {
      user = await User.findById(labTech.userId);
    }
  } else if (typeof labTechId === 'string') {
    // Try to find by employeeId
    labTech = await LabTech.findOne({ employeeId: labTechId });
    
    if (!labTech) {
      // Try to find by user email
      user = await User.findOne({ 
        $or: [
          { email: labTechId },
          { name: { $regex: labTechId, $options: 'i' } }
        ],
        role: 'LAB_TECH'
      });
      
      if (user) {
        labTech = await LabTech.findOne({ userId: user._id });
      }
    } else {
      user = await User.findById(labTech.userId);
    }
  }

  if (!user || !labTech) {
    res.status(404);
    throw new Error('Lab technician not found. Please provide valid lab tech ID, employee ID, or email.');
  }

  if (!labTech.isActive) {
    res.status(400);
    throw new Error('Lab technician is inactive');
  }

  // Check if lab test exists
  const labTest = await LabTest.findById(testId);
  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // REMOVED CERTIFICATION CHECK - COMMENTED OUT OPTIONALLY
  /*
  // Check if lab tech is certified for this test type (OPTIONAL)
  const isCertified = labTech.certifiedTests?.some(cert => {
    if (!cert.testName || !labTest.testName) return false;
    return cert.testName.toLowerCase().includes(labTest.testName.toLowerCase()) ||
           labTest.testName.toLowerCase().includes(cert.testName.toLowerCase());
  });

  if (!isCertified && labTech.certifiedTests?.length > 0) {
    res.status(400);
    throw new Error(`Lab technician is not certified for "${labTest.testName}". Certified tests: ${labTech.certifiedTests.map(ct => ct.testName).join(', ')}`);
  }
  */

  // Update lab test with lab tech assignment
  labTest.labTechId = labTech.userId; // Store the User._id as reference
  labTest.status = 'Processing';
  labTest.assignedAt = new Date();
  labTest.assignedBy = req.user._id; // Store who assigned this
  
  await labTest.save();

  // Get updated test with populated data
  const updatedTest = await LabTest.findById(testId)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name age gender'
      }
    })
    .populate({
      path: 'doctorId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'labTechId',
      select: 'name email'
    })
    .lean();

  // Get lab tech user info
  const labTechUser = await User.findById(labTech.userId).select('name email');
  
  // Add lab tech details
  updatedTest.labTechDetails = {
    name: labTechUser?.name,
    email: labTechUser?.email,
    employeeId: labTech.employeeId,
    department: labTech.department,
    specialization: labTech.specialization,
    experience: labTech.experience,
    isActive: labTech.isActive
  };

  // Log assignment in lab tech's record
  if (!labTech.testAssignments) {
    labTech.testAssignments = [];
  }
  
  labTech.testAssignments.push({
    testId: labTest._id,
    testName: labTest.testName || 'Unnamed Test',
    assignedAt: new Date(),
    status: 'Processing',
    patientId: labTest.patientId,
    doctorId: labTest.doctorId
  });
  
  await labTech.save();

  res.status(200).json({
    success: true,
    message: 'Lab technician assigned to test successfully',
    data: updatedTest,
    assignmentDetails: {
      assignedBy: req.user.name,
      assignedAt: new Date(),
      technicianDetails: {
        name: labTechUser?.name,
        employeeId: labTech.employeeId,
        department: labTech.department,
        specialization: labTech.specialization
      }
    }
  });
});// Get lab technician performance report
exports.getLabTechPerformanceReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate, groupBy = 'month' } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  const user = await User.findById(id);
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { labTechId: id, status: 'Completed' };
  if (Object.keys(dateFilter).length > 0) {
    matchStage.updatedAt = dateFilter;
  }

  let groupStage = {};
  let sortStage = {};

  switch (groupBy) {
    case 'day':
      groupStage = {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' },
          day: { $dayOfMonth: '$updatedAt' }
        }
      };
      sortStage = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
      break;
    case 'week':
      groupStage = {
        _id: {
          year: { $year: '$updatedAt' },
          week: { $week: '$updatedAt' }
        }
      };
      sortStage = { '_id.year': 1, '_id.week': 1 };
      break;
    case 'month':
      groupStage = {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' }
        }
      };
      sortStage = { '_id.year': 1, '_id.month': 1 };
      break;
    case 'testType':
      groupStage = { _id: '$testName' };
      sortStage = { count: -1 };
      break;
    default:
      groupStage = { _id: null };
  }

  const performanceReport = await LabTest.aggregate([
    { $match: matchStage },
    {
      $group: {
        ...groupStage,
        count: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' },
        avgProcessingTime: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      }
    },
    {
      $project: {
        period: '$_id',
        testsConducted: '$count',
        uniquePatients: { $size: '$uniquePatients' },
        avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
        efficiency: {
          $cond: [
            { $lt: ['$avgProcessingTime', 24] },
            'High',
            { $cond: [{ $lt: ['$avgProcessingTime', 48] }, 'Medium', 'Low'] }
          ]
        }
      }
    },
    { $sort: sortStage }
  ]);

  // Get overall statistics
  const overallStats = await LabTest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' },
        avgProcessingTime: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        },
        minProcessingTime: {
          $min: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        },
        maxProcessingTime: {
          $max: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        }
      }
    }
  ]);

  // Get test type distribution
  const testTypeDistribution = await LabTest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$testName',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      labTech: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      overallStats: overallStats[0] || {},
      performanceReport,
      testTypeDistribution,
      dateRange: dateFilter
    }
  });
});

// Update lab technician certifications
exports.updateLabTechCertifications = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { certifiedTests, equipmentPermissions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  const labTech = await LabTech.findOne({
  $or: [
    { _id: id },
    { employeeId: id },
    { userId: id } // 👈 ADD THIS
  ]
});

  if (!labTech) {
    res.status(404);
    throw new Error('Lab technician profile not found');
  }

  const updateData = {};
  
  if (certifiedTests) {
    // Validate certified tests structure
    const validatedTests = certifiedTests.map(test => ({
      testName: test.testName,
      certificationDate: test.certificationDate ? new Date(test.certificationDate) : new Date(),
      renewDate: test.renewDate ? new Date(test.renewDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
    }));
    updateData.certifiedTests = validatedTests;
  }

  if (equipmentPermissions) {
    // Validate equipment permissions structure
    const validatedPermissions = equipmentPermissions.map(perm => ({
      equipmentType: perm.equipmentType,
      canOperate: perm.canOperate || false,
      trainingDate: perm.trainingDate ? new Date(perm.trainingDate) : new Date()
    }));
    updateData.equipmentPermissions = validatedPermissions;
  }

  updateData.lastCertificationCheck = new Date();

  const updatedLabTech = await LabTech.findOneAndUpdate(
    { userId: id },
    updateData,
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  res.status(200).json({
    success: true,
    message: 'Lab technician certifications updated successfully',
    data: updatedLabTech
  });
});

// Get lab technicians by department
exports.getLabTechsByDepartment = asyncHandler(async (req, res, next) => {
  const { department } = req.params;
  const { isActive, page = 1, limit = 10 } = req.query;

  if (!department) {
    res.status(400);
    throw new Error('Department is required');
  }

  const query = { department };
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const labTechs = await LabTech.find(query)
    .populate('userId', 'name email phone')
    .sort({ experience: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Get department statistics
  const departmentStats = await LabTech.aggregate([
    { $match: { department } },
    {
      $group: {
        _id: '$department',
        totalTechs: { $sum: 1 },
        activeTechs: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        avgExperience: { $avg: '$experience' },
        totalExperience: { $sum: '$experience' }
      }
    }
  ]);

  // Get recent tests by department
  const recentTests = await LabTest.aggregate([
    {
      $lookup: {
        from: 'labtechs',
        localField: 'labTechId',
        foreignField: 'userId',
        as: 'labTech'
      }
    },
    { $unwind: '$labTech' },
    { $match: { 'labTech.department': department } },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: 'userId',
        as: 'patient'
      }
    },
    { $unwind: '$patient' },
    {
      $lookup: {
        from: 'users',
        localField: 'patient.userId',
        foreignField: '_id',
        as: 'patientUser'
      }
    },
    { $unwind: '$patientUser' },
    {
      $project: {
        testName: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        patientName: '$patientUser.name',
        labTechName: '$labTech.userId.name'
      }
    }
  ]);

  const total = await LabTech.countDocuments(query);

  res.status(200).json({
    success: true,
    count: labTechs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    department: department,
    statistics: departmentStats[0] || {},
    recentTests,
    data: labTechs
  });
});

// Delete lab technician - TRANSACTIONS REMOVED
exports.deleteLabTech = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  try {
    // Check if lab tech has pending tests
    const pendingTests = await LabTest.countDocuments({
      labTechId: id,
      status: { $in: ['Requested', 'Processing'] }
    });

    if (pendingTests > 0) {
      throw new Error('Cannot delete lab technician with pending tests. Reassign tests first.');
    }

    // Remove lab tech from completed tests - REMOVED SESSION PARAMETER
    await LabTest.updateMany(
      { labTechId: id },
      { labTechId: null }
    );

    // Delete lab tech profile
    await LabTech.deleteOne({ userId: user._id });

    // Delete user
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: 'Lab technician deleted successfully'
    });

  } catch (error) {
    // REMOVED TRANSACTION ABORT LOGIC
    throw error;
  }
});

// Reassign tests from one lab tech to another - TRANSACTIONS REMOVED
exports.reassignLabTechTests = asyncHandler(async (req, res, next) => {
  const { fromLabTechId, toLabTechId, testIds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(fromLabTechId) || !mongoose.Types.ObjectId.isValid(toLabTechId)) {
    res.status(400);
    throw new Error('Invalid lab technician IDs');
  }

  // Check if from lab tech exists
  const fromLabTech = await LabTech.findOne({ userId: fromLabTechId });
  if (!fromLabTech) {
    res.status(404);
    throw new Error('Source lab technician not found');
  }

  // Check if to lab tech exists and is active
  const toLabTech = await LabTech.findOne({ userId: toLabTechId });
  if (!toLabTech || !toLabTech.isActive) {
    res.status(404);
    throw new Error('Destination lab technician not found or inactive');
  }

  try {
    let updateQuery = { labTechId: fromLabTechId };
    
    if (testIds && testIds.length > 0) {
      updateQuery._id = { $in: testIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Update lab tests - REMOVED SESSION PARAMETER
    const updateResult = await LabTest.updateMany(
      updateQuery,
      { 
        labTechId: toLabTechId,
        $push: {
          reassignmentHistory: {
            fromLabTech: fromLabTechId,
            toLabTech: toLabTechId,
            reassignedAt: new Date(),
            reassignedBy: req.user._id
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully reassigned ${updateResult.modifiedCount} tests`,
      data: {
        fromLabTech: {
          id: fromLabTech.userId,
          name: fromLabTech.userId.name,
          employeeId: fromLabTech.employeeId
        },
        toLabTech: {
          id: toLabTech.userId,
          name: toLabTech.userId.name,
          employeeId: toLabTech.employeeId
        },
        testsReassigned: updateResult.modifiedCount
      }
    });

  } catch (error) {
    // REMOVED TRANSACTION ABORT LOGIC
    throw error;
  }
});

// Get lab technician dashboard stats
exports.getLabTechDashboardStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get all lab techs with their stats
  const labTechs = await LabTech.find()
    .populate('userId', 'name email')
    .lean();

  const dashboardStats = await Promise.all(
    labTechs.map(async (labTech) => {
      const [todayTests, weekTests, monthTests, pendingTests, completedTests] = await Promise.all([
        LabTest.countDocuments({
          labTechId: labTech.userId._id,
          updatedAt: { $gte: today },
          status: 'Completed'
        }),
        LabTest.countDocuments({
          labTechId: labTech.userId._id,
          updatedAt: { $gte: startOfWeek },
          status: 'Completed'
        }),
        LabTest.countDocuments({
          labTechId: labTech.userId._id,
          updatedAt: { $gte: startOfMonth },
          status: 'Completed'
        }),
        LabTest.countDocuments({
          labTechId: labTech.userId._id,
          status: { $in: ['Requested', 'Processing'] }
        }),
        LabTest.countDocuments({
          labTechId: labTech.userId._id,
          status: 'Completed'
        })
      ]);

      // Calculate average processing time
      const processingStats = await LabTest.aggregate([
        {
          $match: {
            labTechId: labTech.userId._id,
            status: 'Completed',
            updatedAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            avgProcessingHours: {
              $avg: {
                $divide: [
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  1000 * 60 * 60
                ]
              }
            },
            totalTests: { $sum: 1 }
          }
        }
      ]);

      const avgProcessingTime = processingStats[0]?.avgProcessingHours || 0;

      return {
        id: labTech.userId._id,
        name: labTech.userId.name,
        email: labTech.userId.email,
        employeeId: labTech.employeeId,
        department: labTech.department,
        specialization: labTech.specialization,
        isActive: labTech.isActive,
        statistics: {
          todayTests,
          weekTests,
          monthTests,
          pendingTests,
          completedTests,
          avgProcessingTime: parseFloat(avgProcessingTime.toFixed(2)),
          efficiency: avgProcessingTime < 24 ? 'High' : avgProcessingTime < 48 ? 'Medium' : 'Low'
        }
      };
    })
  );

  // Overall statistics
  const overallStats = {
    totalLabTechs: labTechs.length,
    activeLabTechs: labTechs.filter(lt => lt.isActive).length,
    averageExperience: labTechs.reduce((acc, lt) => acc + (lt.experience || 0), 0) / labTechs.length,
    departments: [...new Set(labTechs.map(lt => lt.department))],
    totalTestsToday: dashboardStats.reduce((acc, stat) => acc + stat.statistics.todayTests, 0),
    totalPendingTests: dashboardStats.reduce((acc, stat) => acc + stat.statistics.pendingTests, 0)
  };

  res.status(200).json({
    success: true,
    data: {
      overallStats,
      labTechs: dashboardStats
    }
  });
});