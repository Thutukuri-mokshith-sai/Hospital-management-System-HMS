const mongoose = require('mongoose');
const { asyncHandler } = require('../../middleware/errorMiddleware');
const { User, LabTech, LabTest, LabReport, Patient, Doctor } = require('../../models/schema');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/* =====================
   HELPER: GET LAB TECH PROFILE
===================== */
const getLabTechProfileById = async (userId) => {
  const labTech = await LabTech.findOne({ userId });
  if (!labTech) {
    throw new Error('LabTech profile not found. Please contact administrator.');
  }
  return labTech;
};
/* =====================
   🔄 UPDATE PROFILE
===================== */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { specialization, shift, certifiedTests, equipmentPermissions } = req.body;
  
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found');
  }

  // Simple assignment - assuming frontend sends correct format
  if (specialization !== undefined) labTech.specialization = specialization;
  if (shift !== undefined) labTech.shift = shift;
  if (certifiedTests !== undefined) labTech.certifiedTests = certifiedTests;
  if (equipmentPermissions !== undefined) labTech.equipmentPermissions = equipmentPermissions;

  await labTech.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      specialization: labTech.specialization,
      shift: labTech.shift,
      certifiedTests: labTech.certifiedTests,
      equipmentPermissions: labTech.equipmentPermissions,
      updatedAt: labTech.updatedAt
    }
  });
});
/* =====================
   🔒 CHANGE PASSWORD
===================== */
/* =====================
   🔒 CHANGE PASSWORD
===================== */
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  console.log('Password change request received');

  // Validate input
  if (!oldPassword || typeof oldPassword !== 'string' || oldPassword.trim() === '') {
    res.status(400);
    throw new Error('Current password is required and must be a non-empty string');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
    res.status(400);
    throw new Error('New password is required and must be a non-empty string');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters long');
  }

  // Find the user
  const user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  console.log('User found, comparing passwords...');

  // Verify old password
  if (!user.password) {
    res.status(500);
    throw new Error('User password hash not found');
  }

  try {
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error.message);
    if (error.message.includes('data and hash arguments required')) {
      res.status(400);
      throw new Error('Password comparison failed - invalid data format');
    }
    throw error;
  }
});/* =====================
   1️⃣ GET LOGGED-IN LAB TECH PROFILE
===================== */
exports.getLabTechProfile = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id })
    .populate('userId', 'name email phone');

  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found. Please complete your profile setup.');
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      },
      profile: {
        employeeId: labTech.employeeId,
        department: labTech.department,
        specialization: labTech.specialization,
        licenseNumber: labTech.licenseNumber,
        experience: labTech.experience,
        shift: labTech.shift,
        isActive: labTech.isActive,
        joinDate: labTech.joinDate,
        equipmentPermissions: labTech.equipmentPermissions,
        certifiedTests: labTech.certifiedTests,
        testsConducted: labTech.testsConducted,
        accuracyRate: labTech.accuracyRate,
        lastCertificationCheck: labTech.lastCertificationCheck
      }
    }
  });
});

/* =====================
   2️⃣ LAB TECH DASHBOARD
===================== */
exports.getDashboard = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found. Please complete your profile setup.');
  }
  
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  const [
    assignedToday,
    pendingTests,
    completedToday,
    criticalTests,
    recentCompleted
  ] = await Promise.all([
    // FIX: Use User._id (req.user._id) instead of LabTech._id
    // FIX: Change all these from labTech._id to req.user._id
LabTest.countDocuments({
  labTechId: req.user._id,  // ✅ CORRECT
  assignedAt: { $gte: todayStart, $lte: todayEnd }
}),

LabTest.countDocuments({
  labTechId: req.user._id,  // ✅ CORRECT
  status: { $in: ['Requested', 'Processing'] }
}),
// ... repeat for all other queries in getDashboard

    // FIX: Use User._id
    LabTest.countDocuments({
      labTechId: req.user._id,
      status: 'Completed',
      completedAt: { $gte: todayStart, $lte: todayEnd }
    }),

    // FIX: Use User._id
    LabTest.countDocuments({
      labTechId: req.user._id,
      priority: 'Critical',
      status: { $in: ['Requested', 'Processing'] }
    }),

    // FIX: Use User._id
    LabTest.find({
      labTechId: req.user._id,
      status: 'Completed'
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('patientId', 'userId')
      .populate('doctorId', 'userId')
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        assignedToday,
        pendingTests,
        completedToday,
        criticalTests,
        totalTestsConducted: labTech.testsConducted,
        accuracyRate: labTech.accuracyRate
      },
      recentCompleted: recentCompleted.map(test => ({
        testId: test._id,
        testName: test.testName,
        patientName: test.patientId?.userId?.name || 'N/A',
        doctorName: test.doctorId?.userId?.name || 'N/A',
        completedAt: test.completedAt,
        priority: test.priority
      }))
    }
  });
});

/* =====================
   3️⃣ RECENT NOTIFICATIONS (Newly Assigned Tests)
===================== */
exports.getNotifications = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // FIX: Use User._id
  // FIX: Change from labTech._id to req.user._id
const newAssignments = await LabTest.find({
  labTechId: req.user._id,  // ✅ CORRECT
  assignedAt: { $gte: twentyFourHoursAgo },
  status: { $in: ['Requested', 'Processing'] }
})
    .populate('patientId', 'userId')
    .populate('doctorId', 'userId')
    .sort({ assignedAt: -1 })
    .limit(10);

  const notifications = newAssignments.map(test => ({
    type: 'TEST_ASSIGNED',
    testId: test._id,
    testName: test.testName,
    priority: test.priority,
    patientName: test.patientId?.userId?.name || 'Unknown',
    doctorName: test.doctorId?.userId?.name || 'Unknown',
    assignedAt: test.assignedAt,
    status: test.status,
    isRead: false,
    message: `New ${test.priority} priority test assigned: ${test.testName}`
  }));

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount: notifications.length
    }
  });
});

/* =====================
   4️⃣ GET ALL ASSIGNED TESTS
===================== */
exports.getAssignedTests = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // FIX: Use User._id (req.user._id) instead of LabTech._id
  const filter = { labTechId: req.user._id };
  
  if (status) {
    if (status.includes(',')) {
      // Handle multiple statuses (e.g., "Requested,Processing")
      filter.status = { $in: status.split(',') };
    } else {
      filter.status = status;
    }
  }
  
  if (priority) {
    filter.priority = priority;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const tests = await LabTest.find(filter)
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'userId specialization department',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    // FIX: Populate labTechId as User (since that's what's stored)
    .populate('labTechId', 'name email')
    .sort(sort);

  // Also get lab tech profile to include lab tech details
  const labTechProfile = await LabTech.findOne({ userId: req.user._id })
    .select('employeeId department specialization');

  res.status(200).json({
    success: true,
    count: tests.length,
    data: tests.map(test => ({
      id: test._id,
      testName: test.testName,
      status: test.status,
      priority: test.priority,
      assignedAt: test.assignedAt,
      estimatedCompletion: test.estimatedCompletion,
      notes: test.notes,
      patient: {
        id: test.patientId?._id,
        name: test.patientId?.userId?.name,
        age: test.patientId?.age,
        gender: test.patientId?.gender,
        bloodGroup: test.patientId?.bloodGroup,
        phone: test.patientId?.userId?.phone
      },
      doctor: {
        id: test.doctorId?._id,
        name: test.doctorId?.userId?.name,
        specialization: test.doctorId?.specialization,
        department: test.doctorId?.department,
        phone: test.doctorId?.userId?.phone
      },
      // FIX: Use labTechProfile instead of test.labTechId
      labTech: labTechProfile ? {
        employeeId: labTechProfile.employeeId,
        department: labTechProfile.department,
        specialization: labTechProfile.specialization
      } : null,
      assignedLabTech: test.labTechId ? {
        name: test.labTechId.name,
        email: test.labTechId.email
      } : null,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    }))
  });
});

/* =====================
   5️⃣ START PROCESSING A TEST
===================== */
exports.startTest = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { testId } = req.params;

  // FIX: Use User._id
  const test = await LabTest.findOne({
    _id: testId,
    labTechId: req.user._id,
    status: 'Requested'
  });

  if (!test) {
    res.status(404);
    throw new Error('Test not found or already in progress');
  }

  test.status = 'Processing';
  test.assignedAt = new Date();
  
  // Set estimated completion (default: 2 hours from now)
  const estimatedCompletion = new Date();
  estimatedCompletion.setHours(estimatedCompletion.getHours() + 2);
  test.estimatedCompletion = estimatedCompletion;

  await test.save();

  res.status(200).json({
    success: true,
    message: 'Test processing started',
    data: {
      testId: test._id,
      status: test.status,
      assignedAt: test.assignedAt,
      estimatedCompletion: test.estimatedCompletion
    }
  });
});

/* =====================
   6️⃣ COMPLETE A TEST
===================== */
exports.completeTest = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { testId } = req.params;

  // FIX: Use User._id
  const test = await LabTest.findOne({
    _id: testId,
    labTechId: req.user._id,
    status: 'Processing'
  });

  if (!test) {
    res.status(404);
    throw new Error('Test not found or not in processing state');
  }

  // Update test
  test.status = 'Completed';
  test.completedAt = new Date();

  // Update lab tech stats
  labTech.testsConducted += 1;
  
  // For demo, simulate accuracy rate (in real app, this would be calculated)
  const currentAccuracy = labTech.accuracyRate || 0;
  const newAccuracy = ((currentAccuracy * (labTech.testsConducted - 1)) + 95) / labTech.testsConducted;
  labTech.accuracyRate = Math.round(newAccuracy * 100) / 100;

  await Promise.all([test.save(), labTech.save()]);

  res.status(200).json({
    success: true,
    message: 'Test completed successfully',
    data: {
      testId: test._id,
      status: test.status,
      completedAt: test.completedAt,
      stats: {
        testsConducted: labTech.testsConducted,
        accuracyRate: labTech.accuracyRate
      }
    }
  });
});

/* =====================
   7️⃣ SUBMIT LAB REPORT
===================== */
exports.submitReport = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { testId } = req.params;
  const { result, additionalNotes } = req.body;

  if (!result) {
    res.status(400);
    throw new Error('Result is required');
  }

  // FIX: Use User._id
  const test = await LabTest.findOne({
    _id: testId,
    labTechId: req.user._id,
    status: 'Completed'
  });

  if (!test) {
    res.status(404);
    throw new Error('Test not found or not completed');
  }

  // Check if report already exists
  const existingReport = await LabReport.findOne({ labTestId: testId });
  if (existingReport) {
    res.status(400);
    throw new Error('Report already exists for this test');
  }

  // Create report
  const report = await LabReport.create({
    labTestId: testId,
    result,
    notes: additionalNotes,
    generatedBy: {
      role: 'LAB_TECH',
      userId: req.user._id,
      name: req.user.name,
      employeeId: labTech.employeeId
    }
  });

  res.status(201).json({
    success: true,
    message: 'Lab report submitted successfully',
    data: {
      reportId: report._id,
      testId: test._id,
      testName: test.testName,
      result: report.result,
      reportDate: report.reportDate,
      generatedBy: report.generatedBy
    }
  });
});

/* =====================
   8️⃣ GENERATE PDF REPORT
===================== */
exports.generatePDFReport = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { testId } = req.params;

  // FIX: Use User._id (req.user._id) instead of LabTech._id
  const test = await LabTest.findOne({
    _id: testId,
    labTechId: req.user._id  // ✅ CORRECT: Use User._id
  })
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'userId specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  const report = await LabReport.findOne({ labTestId: testId });
  if (!report) {
    res.status(404);
    throw new Error('Report not found. Please submit report first.');
  }

  // Create PDF
  const doc = new PDFDocument({ margin: 50 });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="LabReport_${testId}.pdf"`);

  // Handle PDF generation errors
  doc.on('error', (err) => {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate PDF' 
      });
    }
  });

  // Pipe PDF to response
  doc.pipe(res);

  try {
    // Add content to PDF with null checks
    doc.fontSize(20).text('LABORATORY TEST REPORT', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Report ID: ${report._id}`);
    doc.text(`Generated On: ${new Date(report.reportDate).toLocaleDateString()}`);
    doc.moveDown();

    // Patient Information
    doc.fontSize(14).text('PATIENT INFORMATION', { underline: true });
    doc.fontSize(12);
    
    // SAFE ACCESS: Check for nested null values
    const patientName = test.patientId?.userId?.name || 'Unknown Patient';
    const patientAge = test.patientId?.age || 'N/A';
    const patientGender = test.patientId?.gender || 'N/A';
    const patientBloodGroup = test.patientId?.bloodGroup || 'N/A';
    
    doc.text(`Name: ${patientName}`);
    doc.text(`Age: ${patientAge}`);
    doc.text(`Gender: ${patientGender}`);
    doc.text(`Blood Group: ${patientBloodGroup}`);
    doc.moveDown();

    // Test Information
    doc.fontSize(14).text('TEST DETAILS', { underline: true });
    doc.fontSize(12);
    doc.text(`Test Name: ${test.testName}`);
    doc.text(`Test ID: ${test._id}`);
    doc.text(`Priority: ${test.priority}`);
    doc.text(`Status: ${test.status}`);
    
    // SAFE ACCESS: Doctor name
    const doctorName = test.doctorId?.userId?.name || 'Unknown Doctor';
    doc.text(`Requested By: Dr. ${doctorName}`);
    doc.text(`Lab Technician: ${req.user.name} (${labTech.employeeId})`);
    doc.moveDown();

    // Results
    doc.fontSize(14).text('TEST RESULTS', { underline: true });
    doc.fontSize(12);
    doc.text(report.result);
    doc.moveDown();

    if (report.notes) {
      doc.fontSize(14).text('ADDITIONAL NOTES', { underline: true });
      doc.fontSize(12);
      doc.text(report.notes);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10);
    doc.text('This is an electronically generated report.', { align: 'center' });
    doc.text(`Hospital Management System | ${new Date().getFullYear()}`, { align: 'center' });

    // End the document
    doc.end();
    
  } catch (error) {
    console.error('Error during PDF content generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error generating PDF content' 
      });
    }
    // End the stream if still open
    if (!doc._readableState.ended) {
      doc.end();
    }
  }
});
/* =====================
   9️⃣ GET REASSIGNMENT HISTORY
===================== */
exports.getReassignmentHistory = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const { testId } = req.params;

  const test = await LabTest.findOne({
    _id: testId,
    $or: [
      { labTechId: labTech._id },
      { 'reassignmentHistory.toLabTech': labTech._id }
    ]
  })
    .populate('reassignmentHistory.fromLabTech reassignmentHistory.toLabTech reassignmentHistory.reassignedBy', 
      'employeeId specialization');

  if (!test) {
    res.status(404);
    throw new Error('Test not found or access denied');
  }

  res.status(200).json({
    success: true,
    data: {
      testId: test._id,
      testName: test.testName,
      reassignmentHistory: test.reassignmentHistory.map(history => ({
        from: history.fromLabTech ? {
          employeeId: history.fromLabTech.employeeId,
          specialization: history.fromLabTech.specialization
        } : null,
        to: history.toLabTech ? {
          employeeId: history.toLabTech.employeeId,
          specialization: history.toLabTech.specialization
        } : null,
        reassignedAt: history.reassignedAt,
        reason: history.reason,
        reassignedBy: history.reassignedBy ? {
          employeeId: history.reassignedBy.employeeId
        } : null
      }))
    }
  });
});

/* =====================
   🔟 PERFORMANCE STATISTICS
===================== */
exports.getPerformanceStats = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });
  
  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [recentTests, departmentStats] = await Promise.all([
    // Recent 30 days tests
    // FIX: Change from labTech._id to req.user._id
LabTest.find({
  labTechId: req.user._id,  // ✅ CORRECT
  completedAt: { $gte: thirtyDaysAgo }
}),

LabTest.aggregate([
  {
    $match: {
      labTechId: req.user._id,  // ✅ CORRECT
      status: 'Completed'
    }
  },
    {
        $group: {
          _id: '$testName',
          count: { $sum: 1 },
          avgCompletionTime: { $avg: { $subtract: ['$completedAt', '$assignedAt'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  // Calculate average completion time (in hours)
  let avgCompletionHours = 0;
  if (recentTests.length > 0) {
    const totalMs = recentTests.reduce((sum, test) => {
      if (test.completedAt && test.assignedAt) {
        return sum + (test.completedAt - test.assignedAt);
      }
      return sum;
    }, 0);
    avgCompletionHours = (totalMs / (1000 * 60 * 60)) / recentTests.length;
  }

  // Calculate tests by priority
  const priorityStats = await LabTest.aggregate([
    {
      $match: {
        labTechId: labTech._id,
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      basicStats: {
        testsConducted: labTech.testsConducted,
        accuracyRate: labTech.accuracyRate,
        experience: labTech.experience,
        certifiedTests: labTech.certifiedTests.length
      },
      recentPerformance: {
        testsLast30Days: recentTests.length,
        averageCompletionTime: `${avgCompletionHours.toFixed(2)} hours`,
        departmentStats: departmentStats.map(stat => ({
          testName: stat._id,
          count: stat.count,
          avgCompletionTime: stat.avgCompletionTime ? 
            `${(stat.avgCompletionTime / (1000 * 60 * 60)).toFixed(2)} hours` : 'N/A'
        })),
        priorityStats: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      recentTests: recentTests.map(test => ({
        testId: test._id,
        testName: test.testName,
        priority: test.priority,
        completedAt: test.completedAt,
        completionTime: test.completedAt && test.assignedAt ? 
          `${((test.completedAt - test.assignedAt) / (1000 * 60 * 60)).toFixed(2)} hours` : 'N/A'
      })).slice(0, 10)
    }
  });
});

/* =====================
   📜 TEST HISTORY
===================== */
exports.getTestHistory = asyncHandler(async (req, res) => {
  const labTech = await LabTech.findOne({ userId: req.user._id });

  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found.');
  }

  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    labTechId: req.user._id,
    status: 'Completed'
  };

  if (startDate || endDate) {
    filter.completedAt = {};
    if (startDate) filter.completedAt.$gte = new Date(startDate);
    if (endDate) filter.completedAt.$lte = new Date(endDate);
  }

  /* =========================
     1️⃣ PAGINATED DATA (TABLE)
     ========================= */
  const testsPromise = LabTest.find(filter)
    .populate({
      path: 'patientId',
      select: 'userId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate({
      path: 'doctorId',
      select: 'userId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  /* =========================
     2️⃣ GLOBAL STATS (ALL TIME / RANGE)
     ========================= */
  const statsPromise = LabTest.aggregate([
    { $match: filter },
    {
      $project: {
        durationHours: {
          $divide: [
            { $subtract: ['$completedAt', '$assignedAt'] },
            1000 * 60 * 60
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCompleted: { $sum: 1 },
        avgCompletionTime: { $avg: '$durationHours' }
      }
    }
  ]);

  const countPromise = LabTest.countDocuments(filter);

  const [tests, statsResult, total] = await Promise.all([
    testsPromise,
    statsPromise,
    countPromise
  ]);

  const stats = statsResult[0] || {
    totalCompleted: 0,
    avgCompletionTime: 0
  };

  /* =========================
     RESPONSE
     ========================= */
  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    stats: {
      totalCompleted: stats.totalCompleted,
      avgCompletionTimeHours: Number(stats.avgCompletionTime?.toFixed(2) || 0)
    },
    data: tests.map(test => ({
      id: test._id,
      testName: test.testName,
      patientName: test.patientId?.userId?.name,
      doctorName: test.doctorId?.userId?.name,
      priority: test.priority,
      assignedAt: test.assignedAt,
      completedAt: test.completedAt,
      hasReport: true
    }))
  });
});
/* =====================
   📋 GET REPORT STATUS
===================== */
exports.getReportStatus = asyncHandler(async (req, res) => {
  const { testId } = req.params;

  const report = await LabReport.findOne({ labTestId: testId });
  
  res.status(200).json({
    success: true,
    hasReport: !!report,
    reportId: report?._id,
    reportDate: report?.reportDate
  });
});

/* =====================
   📋 GET REPORT DETAILS
===================== */
exports.getReportDetails = asyncHandler(async (req, res) => {
  const { testId } = req.params;

  const test = await LabTest.findOne({
    _id: testId,
    labTechId: req.user._id
  })
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'userId specialization department',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  const report = await LabReport.findOne({ labTestId: testId });

  res.status(200).json({
    success: true,
    data: {
      testId: test._id,
      testName: test.testName,
      status: test.status,
      priority: test.priority,
      assignedAt: test.assignedAt,
      completedAt: test.completedAt,
      createdAt: test.createdAt,
      patientName: test.patientId?.userId?.name,
      patientAge: test.patientId?.age,
      patientGender: test.patientId?.gender,
      patientBloodGroup: test.patientId?.bloodGroup,
      doctorName: test.doctorId?.userId?.name,
      doctorSpecialization: test.doctorId?.specialization,
      hasReport: !!report,
      reportId: report?._id,
      reportDate: report?.reportDate
    }
  });
});

/* =====================
   🆕 CREATE LAB TECH PROFILE (For existing users)
===================== */
exports.createLabTechProfile = asyncHandler(async (req, res) => {
  const { 
    employeeId, 
    department, 
    licenseNumber, 
    specialization = 'General',
    experience = 0,
    shift = 'Rotating'
  } = req.body;

  // Check if user exists and is LAB_TECH
  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'LAB_TECH') {
    res.status(400);
    throw new Error('User is not registered as LabTech');
  }

  // Check if profile already exists
  const existingProfile = await LabTech.findOne({ userId: req.user._id });
  if (existingProfile) {
    res.status(400);
    throw new Error('LabTech profile already exists');
  }

  // Validate required fields
  if (!employeeId || !department || !licenseNumber) {
    res.status(400);
    throw new Error('Employee ID, Department, and License Number are required');
  }

  // Create LabTech profile
  const labTech = await LabTech.create({
    userId: req.user._id,
    employeeId,
    department,
    licenseNumber,
    specialization,
    experience,
    shift,
    isActive: true,
    joinDate: new Date(),
    testsConducted: 0,
    accuracyRate: 0
  });

  res.status(201).json({
    success: true,
    message: 'LabTech profile created successfully',
    data: {
      profile: labTech
    }
  });
});