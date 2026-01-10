const mongoose = require('mongoose');
const { User, LabTech, LabTest, Patient, Doctor } = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   LAB TECH MANAGEMENT (CRUD)
===================== */

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
exports.getLabTechById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  const user = await User.findById(id).select('-password');
  
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  const labTech = await LabTech.findOne({ userId: id })
    .populate('userId', 'name email phone createdAt')
    .lean();
  
  if (!labTech) {
    res.status(404);
    throw new Error('Lab technician profile not found');
  }

  // Get recent lab tests conducted
  const recentLabTests = await LabTest.find({
    labTechId: id,
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
  const monthlyStats = await LabTest.aggregate([
    {
      $match: {
        labTechId: id,
        status: 'Completed',
        updatedAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$updatedAt' },
        count: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' }
      }
    },
    {
      $project: {
        month: '$_id',
        testsConducted: '$count',
        uniquePatients: { $size: '$uniquePatients' }
      }
    },
    { $sort: { month: 1 } }
  ]);

  // Get test type distribution
  const testTypeStats = await LabTest.aggregate([
    {
      $match: {
        labTechId: id,
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
exports.updateLabTech = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  const labTech = await LabTech.findOne({ userId: id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('Lab technician profile not found');
  }

  try {
    // Update user info if provided
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== id) {
        throw new Error('Email already in use');
      }
      userUpdate.email = updateData.email;
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(id, userUpdate); // REMOVED SESSION PARAMETER
    }

    // Remove user fields from lab tech update
    delete updateData.name;
    delete updateData.phone;
    delete updateData.email;

    // Handle employee ID uniqueness
    if (updateData.employeeId && updateData.employeeId !== labTech.employeeId) {
      const existingEmployee = await LabTech.findOne({ 
        employeeId: updateData.employeeId 
      });
      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }
    }

    // Handle license number uniqueness
    if (updateData.licenseNumber && updateData.licenseNumber !== labTech.licenseNumber) {
      const existingLicense = await LabTech.findOne({ 
        licenseNumber: updateData.licenseNumber 
      });
      if (existingLicense) {
        throw new Error('License number already exists');
      }
    }

    // Update lab tech profile - REMOVED SESSION PARAMETER
    const updatedLabTech = await LabTech.findOneAndUpdate(
      { userId: id },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Lab technician updated successfully',
      data: updatedLabTech
    });

  } catch (error) {
    // REMOVED TRANSACTION ABORT LOGIC
    throw error;
  }
});

// Update lab technician status (active/inactive)
exports.updateLabTechStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab tech ID');
  }

  if (isActive === undefined) {
    res.status(400);
    throw new Error('Status is required');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'LAB_TECH') {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  const labTech = await LabTech.findOne({ userId: id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('Lab technician profile not found');
  }

  labTech.isActive = isActive;
  await labTech.save();

  // Also update user active status
  if (user.isActive !== isActive) {
    user.isActive = isActive;
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `Lab technician ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      isActive: labTech.isActive,
      employeeId: labTech.employeeId
    }
  });
});

// Assign lab technician to lab test
exports.assignLabTechToTest = asyncHandler(async (req, res, next) => {
  const { testId } = req.params;
  const { labTechId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(labTechId)) {
    res.status(400);
    throw new Error('Invalid test ID or lab tech ID');
  }

  // Check if lab test exists
  const labTest = await LabTest.findById(testId);
  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // Check if lab technician exists and is active
  const labTech = await LabTech.findOne({ userId: labTechId });
  if (!labTech || !labTech.isActive) {
    res.status(404);
    throw new Error('Lab technician not found or inactive');
  }

  // Check if lab tech is certified for this test type
  const isCertified = labTech.certifiedTests.some(
    cert => cert.testName.toLowerCase().includes(labTest.testName.toLowerCase())
  );

  if (!isCertified) {
    res.status(400);
    throw new Error('Lab technician is not certified for this test type');
  }

  // Update lab test with lab tech assignment
  labTest.labTechId = labTechId;
  labTest.status = 'Processing';
  labTest.assignedAt = new Date();
  
  await labTest.save();

  // Get updated test with populated data
  const updatedTest = await LabTest.findById(testId)
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
    .populate({
      path: 'labTechId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Lab technician assigned to test successfully',
    data: updatedTest
  });
});

// Get lab technician performance report
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

  const labTech = await LabTech.findOne({ userId: id });
  
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