const mongoose = require('mongoose');
const { Doctor, Appointment, Patient, Prescription, LabTest, LabReport, Vitals, User, NursingCare, Medicine, Billing,LabTech } =
  require('../../models/schema');

const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =========================================================
   1. DOCTOR PROFILE
========================================================= */

// @desc    Get logged-in doctor profile
// @route   GET /api/v1/doctors/me
// @access  Private/Doctor
exports.getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id })
    .populate('userId', 'name email phone');

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  res.status(200).json({
    success: true,
    data: doctor
  });
});

// @desc    Update doctor profile
// @route   PUT /api/v1/doctors/me
// @access  Private/Doctor
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['specialization', 'department'];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update doctor profile
  const doctor = await Doctor.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('userId', 'name email phone');

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Update user phone if provided
  if (req.body.phone) {
    await User.findByIdAndUpdate(req.user._id, { phone: req.body.phone });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: doctor
  });
});

/* =========================================================
   2. APPOINTMENTS
========================================================= */

// @desc    Get all appointments for logged-in doctor
// @route   GET /api/v1/doctors/appointments
// @access  Private/Doctor
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 10 } = req.query;
  
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Build filter using doctor's ObjectId
  const filter = { doctorId: doctor._id };
  
  if (status) {
    filter.status = status;
  }
  
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    filter.date = { $gte: startDate, $lte: endDate };
  }

  // Pagination
  const skip = (page - 1) * limit;

  const appointments = await Appointment.find(filter)
    .populate({
      path: 'patientId',
      select: 'age gender admissionStatus',
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
    .sort({ date: 1, time: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: appointments
  });
});

// @desc    Get single appointment
// @route   GET /api/v1/doctors/appointments/:id
// @access  Private/Doctor
// @desc    Get single appointment
// @route   GET /api/v1/doctors/appointments/:id
// @access  Private/Doctor
exports.getAppointmentById = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctorId: doctor._id
  })
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup admissionStatus wardId bedNumber',
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
    .lean();

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Get related data - FIX: Check if appointment.patientId exists
  const patientId = appointment.patientId ? appointment.patientId._id : null;
  
  const [prescription, labTests, vitals, billing] = await Promise.all([
    Prescription.findOne({ appointmentId: appointment._id })
      .populate({
        path: 'patientId',
        select: 'userId',
        populate: { path: 'userId', select: 'name' }
      })
      .lean(),
    LabTest.find({ appointmentId: appointment._id })
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
      .lean(),
    // FIX: Only query vitals if patientId exists
    patientId ? Vitals.findOne({ patientId: patientId })
      .sort({ recordedAt: -1 })
      .lean() : Promise.resolve(null),
    Billing.findOne({ appointmentId: appointment._id })
      .lean()
  ]);

  res.status(200).json({
    success: true,
    data: {
      appointment,
      relatedData: {
        prescription: prescription || null,
        labTests: labTests || [],
        latestVitals: vitals || null,
        billing: billing || null
      }
    }
  });
});
// @desc    Update appointment status
// @route   PUT /api/v1/doctors/appointments/:id/status
// @access  Private/Doctor
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status (Scheduled, Completed, Cancelled)');
  }

  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: req.params.id,
      doctorId: doctor._id
    },
    {
      status,
      lastUpdatedBy: {
        role: 'DOCTOR',
        userId: req.user._id,
        name: req.user.name,
        updatedAt: Date.now()
      }
    },
    { new: true, runValidators: true }
  );

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  res.status(200).json({
    success: true,
    message: `Appointment ${status.toLowerCase()} successfully`,
    data: appointment
  });
});

// @desc    Add/update appointment notes
// @route   PUT /api/v1/doctors/appointments/:id/notes
// @access  Private/Doctor
exports.addAppointmentNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  if (!notes || notes.trim().length === 0) {
    res.status(400);
    throw new Error('Please provide notes');
  }

  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: req.params.id,
      doctorId: doctor._id
    },
    {
      notes: notes.trim(),
      lastUpdatedBy: {
        role: 'DOCTOR',
        userId: req.user._id,
        name: req.user.name,
        updatedAt: Date.now()
      }
    },
    { new: true, runValidators: true }
  );

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  res.status(200).json({
    success: true,
    message: 'Notes updated successfully',
    data: appointment
  });
});

/* =========================================================
   3. PATIENTS
========================================================= */

// @desc    Get patients seen by doctor
// @route   GET /api/v1/doctors/patients
// @access  Private/Doctor
exports.getMyPatients = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get appointment IDs for this doctor
  const appointments = await Appointment.find({ doctorId: doctor._id })
    .distinct('patientId');

  if (appointments.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  // Build filter
  const filter = { _id: { $in: appointments } };
  
  if (status === 'admitted') {
    filter.isAdmitted = true;
  } else if (status === 'discharged') {
    filter.isAdmitted = false;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const patients = await Patient.find(filter)
    .populate('userId', 'name email phone')
    .select('userId age gender bloodGroup admissionStatus isAdmitted admissionDate dischargeDate')
    .sort({ admissionDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Patient.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: patients.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: patients
  });
});

// @desc    Get patient details
// @route   GET /api/v1/doctors/patients/:id
// @access  Private/Doctor
exports.getPatientById = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check if doctor has seen this patient
  const hasAppointment = await Appointment.findOne({
    patientId: req.params.id,
    doctorId: doctor._id
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to view this patient');
  }

  const patient = await Patient.findById(req.params.id)
    .populate('userId', 'name email phone');

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

// @desc    Get patient vitals
// @route   GET /api/v1/doctors/patients/:id/vitals
// @access  Private/Doctor
exports.getPatientVitals = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check authorization
  const hasAppointment = await Appointment.findOne({
    patientId: req.params.id,
    doctorId: doctor._id
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to view this patient');
  }

  const { limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;

  const vitals = await Vitals.find({ patientId: req.params.id })
    .populate({
      path: 'nurseId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ recordedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Vitals.countDocuments({ patientId: req.params.id });

  res.status(200).json({
    success: true,
    count: vitals.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: vitals
  });
});

// @desc    Get patient medical history
// @route   GET /api/v1/doctors/patients/:id/history
// @access  Private/Doctor
exports.getPatientHistory = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check authorization
  const hasAppointment = await Appointment.findOne({
    patientId: req.params.id,
    doctorId: doctor._id
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to view this patient');
  }

  const patientId = req.params.id;

  // Get all data in parallel
  const [
    appointments,
    prescriptions,
    labTests,
    nursingCare,
    vitals
  ] = await Promise.all([
    Appointment.find({ patientId }).sort({ date: -1 }).limit(5),
    Prescription.find({ patientId }).sort({ createdAt: -1 }).limit(5),
    LabTest.find({ patientId }).sort({ createdAt: -1 }).limit(5),
    NursingCare.find({ patientId }).sort({ createdAt: -1 }).limit(5),
    Vitals.find({ patientId }).sort({ recordedAt: -1 }).limit(5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      appointments,
      prescriptions,
      labTests,
      nursingCare,
      vitals
    }
  });
});

/* =========================================================
   4. PRESCRIPTIONS
========================================================= */

// @desc    Create prescription
// @route   POST /api/v1/doctors/prescriptions
// @access  Private/Doctor
exports.createPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, medicines } = req.body;

  // Validate required fields
  if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
    res.status(400);
    throw new Error('Please provide patientId and medicines array');
  }

  // Get doctor's record
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Check if doctor has appointment with this patient
  if (appointmentId) {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
      patientId: patientId
    });

    if (!appointment) {
      res.status(403);
      throw new Error('Appointment not found');
    }
  }

  // Validate medicines array
  const validMedicines = medicines.filter(med => 
    med.name && med.dosage && med.frequency && med.duration
  );

  if (validMedicines.length === 0) {
    res.status(400);
    throw new Error('Please provide valid medicines with name, dosage, frequency, and duration');
  }

  // Create prescription
  const prescription = await Prescription.create({
    patientId,
    doctorId: doctor._id,
    appointmentId: appointmentId || null,
    medicines: validMedicines.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions || '',
      administrationStatus: 'Pending'
    }))
  });

  // Populate response
  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  res.status(201).json({
    success: true,
    message: 'Prescription created successfully',
    data: populatedPrescription
  });
});

// @desc    Get doctor's prescriptions
// @route   GET /api/v1/doctors/prescriptions
// @access  Private/Doctor
exports.getMyPrescriptions = asyncHandler(async (req, res) => {
  const { patientId, status, page = 1, limit = 10 } = req.query;
  
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Build filter
  const filter = { doctorId: doctor._id };
  
  if (patientId) {
    filter.patientId = patientId;
  }
  
  if (status) {
    filter['medicines.administrationStatus'] = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate('appointmentId', 'date time status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prescriptions
  });
});

// @desc    Get prescription details
// @route   GET /api/v1/doctors/prescriptions/:id
// @access  Private/Doctor
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const prescription = await Prescription.findOne({
    _id: req.params.id,
    doctorId: doctor._id
  })
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup',
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

  res.status(200).json({
    success: true,
    data: prescription
  });
});

/* =========================================================
   5. LAB TESTS
========================================================= */

// @desc    Request lab test
// @route   POST /api/v1/doctors/lab-tests
// @access  Private/Doctor
exports.requestLabTest = asyncHandler(async (req, res) => {
  const { patientId, testName, priority, notes } = req.body;

  if (!patientId || !testName) {
    res.status(400);
    throw new Error('Please provide patientId and testName');
  }

  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Check if doctor has seen this patient
  const hasAppointment = await Appointment.findOne({
    patientId,
    doctorId: doctor._id
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to request tests for this patient');
  }

  // Create lab test
  const labTest = await LabTest.create({
    patientId,
    doctorId: doctor._id,
    testName,
    priority: priority || 'Medium',
    notes: notes || '',
    status: 'Requested'
  });

  const populatedLabTest = await LabTest.findById(labTest._id)
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  res.status(201).json({
    success: true,
    message: 'Lab test requested successfully',
    data: populatedLabTest
  });
});

// @desc    Get doctor's lab tests
// @route   GET /api/v1/doctors/lab-tests
// @access  Private/Doctor
exports.getMyLabTests = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const { patientId, status, priority, page = 1, limit = 10 } = req.query;
  
  // Build filter
  const filter = { doctorId: doctor._id };
  
  if (patientId) {
    filter.patientId = patientId;
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (priority) {
    filter.priority = priority;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const labTests = await LabTest.find(filter)
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'labTechId',
      select: 'employeeId specialization department',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await LabTest.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: labTests.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: labTests
  });
});

// @desc    Get lab test details
// @route   GET /api/v1/doctors/lab-tests/:id
// @access  Private/Doctor
exports.getLabTestById = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const labTest = await LabTest.findOne({
    _id: req.params.id,
    doctorId: doctor._id
  })
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate({
      path: 'labTechId',
      select: 'employeeId specialization department',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  res.status(200).json({
    success: true,
    data: labTest
  });
});

/* =========================================================
   6. LAB REPORTS
========================================================= */

// @desc    Get lab report by test ID
// @route   GET /api/v1/doctors/lab-reports/:labTestId
// @access  Private/Doctor
// @desc    Get lab report by lab test ID
// @route   GET /api/v1/doctors/lab-reports/:labTestId
// @access  Private/Doctor
exports.getLabReport = asyncHandler(async (req, res) => {
  const { labTestId } = req.params;

  // Get logged-in doctor
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  try {
    // First get the lab test
    const labTest = await LabTest.findById(labTestId)
      .populate({
        path: 'patientId',
        select: 'age gender bloodGroup',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'labTechId',
        select: 'employeeId department specialization experience'
      })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });

    if (!labTest) {
      res.status(404);
      throw new Error('Lab test not found');
    }

    // Verify the doctor has access to this lab test
    if (labTest.doctorId._id.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this lab test');
    }

    // Get the lab report
    const labReport = await LabReport.findOne({ labTestId })
      .populate('labTestId', 'testName priority status');

    if (!labReport) {
      res.status(404);
      throw new Error('Lab report not found');
    }

    // Prepare response data
    const responseData = {
      ...labReport.toObject(),
      labTestDetails: labTest.toObject()
    };

    // If lab test has lab tech, get user details separately
    if (labTest.labTechId && labTest.labTechId._id) {
      try {
        const labTechWithUser = await LabTech.findById(labTest.labTechId._id)
          .populate('userId', 'name email');
        
        if (labTechWithUser && labTechWithUser.userId) {
          responseData.labTestDetails.labTechId.userId = {
            name: labTechWithUser.userId.name,
            email: labTechWithUser.userId.email
          };
        }
      } catch (error) {
        console.error('Error fetching lab tech user details:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching lab report:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch lab report'
    });
  }
});
/* =========================================================
   7. DASHBOARD STATISTICS (Enhanced with Visualizations)
========================================================= */

// @desc    Get doctor dashboard statistics
// @route   GET /api/v1/doctors/dashboard/stats
// @access  Private/Doctor
exports.getDashboardStats = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const doctorId = doctor._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Get stats in parallel
  const [
    totalAppointments,
    todayAppointments,
    weekAppointments,
    monthAppointments,
    totalPatients,
    activePrescriptions,
    pendingLabTests,
    completedLabTests,
    
    // Appointment statistics for chart
    appointmentByStatus,
    appointmentTrends,
    patientDemographics,
    prescriptionStats,
    topMedicines
  ] = await Promise.all([
    // Total appointments
    Appointment.countDocuments({ doctorId }),
    
    // Today's appointments
    Appointment.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow }
    }),
    
    // Week's appointments
    Appointment.countDocuments({
      doctorId,
      date: { $gte: oneWeekAgo }
    }),
    
    // Month's appointments
    Appointment.countDocuments({
      doctorId,
      date: { $gte: oneMonthAgo }
    }),
    
    // Total unique patients
    Appointment.distinct('patientId', { doctorId }).then(patients => patients.length),
    
    // Active prescriptions (with pending medicines)
    Prescription.countDocuments({
      doctorId,
      'medicines.administrationStatus': 'Pending'
    }),
    
    // Pending lab tests
    LabTest.countDocuments({
      doctorId,
      status: { $in: ['Requested', 'Processing'] }
    }),
    
    // Completed lab tests
    LabTest.countDocuments({
      doctorId,
      status: 'Completed'
    }),
    
    // Appointment by status for pie chart
    Appointment.aggregate([
      { $match: { doctorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    // Appointment trends for line chart (last 7 days)
    Appointment.aggregate([
      { 
        $match: { 
          doctorId,
          date: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Patient demographics for bar chart
    Patient.aggregate([
      {
        $match: {
          _id: { $in: await Appointment.distinct('patientId', { doctorId }) }
        }
      },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
          avgAge: { $avg: '$age' }
        }
      }
    ]),
    
    // Prescription statistics
    Prescription.aggregate([
      { $match: { doctorId } },
      {
        $facet: {
          totalPrescriptions: [{ $count: 'count' }],
          prescriptionsByStatus: [
            { $unwind: '$medicines' },
            {
              $group: {
                _id: '$medicines.administrationStatus',
                count: { $sum: 1 }
              }
            }
          ],
          prescriptionsTrend: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 7 }
          ]
        }
      }
    ]),
    
    // Top prescribed medicines
    Prescription.aggregate([
      { $match: { doctorId } },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.name',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$medicines.quantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      // Summary stats
      summary: {
        totalAppointments,
        todayAppointments,
        weekAppointments,
        monthAppointments,
        totalPatients,
        activePrescriptions,
        pendingLabTests,
        completedLabTests
      },
      
      // Visualization data
      visualizations: {
        // Pie chart: Appointment by status
        appointmentStatus: appointmentByStatus.map(item => ({
          status: item._id,
          count: item.count
        })),
        
        // Line chart: Appointment trends (last 7 days)
        appointmentTrends: appointmentTrends.map(item => ({
          date: item._id,
          count: item.count
        })),
        
        // Bar chart: Patient demographics
        patientDemographics: patientDemographics.map(item => ({
          gender: item._id || 'Not Specified',
          count: item.count,
          avgAge: Math.round(item.avgAge || 0)
        })),
        
        // Prescription data
        prescriptionStats: {
          total: prescriptionStats[0].totalPrescriptions[0]?.count || 0,
          byStatus: prescriptionStats[0].prescriptionsByStatus,
          trend: prescriptionStats[0].prescriptionsTrend
        },
        
        // Top medicines
        topMedicines: topMedicines.map(item => ({
          name: item._id,
          count: item.count,
          totalQuantity: item.totalQuantity
        }))
      }
    }
  });
});

/* =========================================================
   8. NOTIFICATIONS (Recent appointments & activities)
========================================================= */

// @desc    Get doctor notifications
// @route   GET /api/v1/doctors/notifications
// @access  Private/Doctor
exports.getNotifications = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const doctorId = doctor._id;
  const { limit = 10 } = req.query;
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Get upcoming appointments (next 2 days)
  const upcomingAppointments = await Appointment.find({
    doctorId,
    status: 'Scheduled',
    date: { $gte: today, $lte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) }
  })
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ date: 1, time: 1 })
    .limit(5);

  // Get recent lab test results
  const recentLabResults = await LabReport.find()
    .populate({
      path: 'labTestId',
      match: { doctorId },
      populate: {
        path: 'patientId',
        select: 'userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }
    })
    .sort({ reportDate: -1 })
    .limit(5);

  // Filter out null labTestIds
  const validLabResults = recentLabResults.filter(report => report.labTestId);

  // Get pending prescriptions
  const pendingPrescriptions = await Prescription.aggregate([
    { $match: { doctorId } },
    { $unwind: '$medicines' },
    { $match: { 'medicines.administrationStatus': 'Pending' } },
    {
      $group: {
        _id: '$patientId',
        prescriptionId: { $first: '$_id' },
        pendingCount: { $sum: 1 },
        medicines: { $push: '$medicines.name' }
      }
    },
    { $limit: 5 }
  ]);

  // Get patient info for pending prescriptions
  const pendingPrescriptionsWithInfo = await Promise.all(
    pendingPrescriptions.map(async item => {
      const patient = await Patient.findById(item._id)
        .populate('userId', 'name');
      return {
        patientName: patient?.userId?.name || 'Unknown',
        prescriptionId: item.prescriptionId,
        pendingCount: item.pendingCount,
        medicines: item.medicines.slice(0, 3) // Show first 3 medicines
      };
    })
  );

  // Format notifications
  const notifications = [
    // Upcoming appointments
    ...upcomingAppointments.map(apt => ({
      type: 'APPOINTMENT_REMINDER',
      title: 'Upcoming Appointment',
      message: `Appointment with ${apt.patientId.userId.name} at ${apt.time} on ${new Date(apt.date).toLocaleDateString()}`,
      data: {
        appointmentId: apt._id,
        patientId: apt.patientId._id,
        date: apt.date,
        time: apt.time
      },
      priority: 'high',
      timestamp: apt.createdAt
    })),
    
    // Lab results
    ...validLabResults.map(report => ({
      type: 'LAB_RESULT',
      title: 'Lab Result Available',
      message: `Lab report for ${report.labTestId.patientId.userId.name} is ready`,
      data: {
        labTestId: report.labTestId._id,
        labReportId: report._id,
        patientId: report.labTestId.patientId._id
      },
      priority: 'medium',
      timestamp: report.reportDate
    })),
    
    // Pending prescriptions
    ...pendingPrescriptionsWithInfo.map(item => ({
      type: 'PENDING_PRESCRIPTION',
      title: 'Pending Medication Administration',
      message: `${item.pendingCount} medicines pending for ${item.patientName}`,
      data: {
        prescriptionId: item.prescriptionId,
        patientName: item.patientName,
        medicines: item.medicines
      },
      priority: 'medium',
      timestamp: new Date()
    }))
  ];

  // Sort by timestamp (most recent first) and limit
  notifications.sort((a, b) => b.timestamp - a.timestamp);
  const limitedNotifications = notifications.slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    count: limitedNotifications.length,
    data: limitedNotifications
  });
});

/* =========================================================
   9. PHARMACY REPORTS
========================================================= */

// @desc    Send prescription to pharmacy
// @route   POST /api/v1/doctors/prescriptions/:id/send-to-pharmacy
// @access  Private/Doctor
exports.sendToPharmacy = asyncHandler(async (req, res) => {
  const prescriptionId = req.params.id;
  
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get prescription with doctor verification
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    doctorId: doctor._id
  })
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('appointmentId', 'date time');

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check if patient has appointment
  if (!prescription.appointmentId) {
    res.status(400);
    throw new Error('Prescription is not linked to an appointment');
  }

  // Create pharmacy report
  const pharmacyReport = {
    prescriptionId: prescription._id,
    doctorId: doctor._id,
    doctorName: req.user.name,
    patientInfo: {
      patientId: prescription.patientId._id,
      name: prescription.patientId.userId.name,
      email: prescription.patientId.userId.email,
      phone: prescription.patientId.userId.phone,
      age: prescription.patientId.age,
      gender: prescription.patientId.gender
    },
    appointmentInfo: {
      appointmentId: prescription.appointmentId._id,
      date: prescription.appointmentId.date,
      time: prescription.appointmentId.time
    },
    medicines: prescription.medicines.map(med => ({
      name: med.name,
      quantity: med.quantity,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions
    })),
    totalMedicines: prescription.medicines.length,
    issuedAt: new Date(),
    status: 'Pending',
    notes: req.body.notes || ''
  };

  // In a real system, you would:
  // 1. Save this to a Pharmacy collection
  // 2. Send notification to pharmacists
  // 3. Update prescription status
  
  // For now, we'll return the report
  res.status(200).json({
    success: true,
    message: 'Prescription sent to pharmacy successfully',
    data: {
      report: pharmacyReport,
      prescriptionId: prescription._id,
      patientName: prescription.patientId.userId.name,
      medicinesCount: prescription.medicines.length
    }
  });
});

// @desc    Get pharmacy reports sent by doctor
// @route   GET /api/v1/doctors/pharmacy-reports
// @access  Private/Doctor
exports.getPharmacyReports = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // In a real system, this would query Pharmacy collection
  // For now, we'll return prescriptions that need pharmacy attention
  
  const { status = 'Pending', page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  const prescriptions = await Prescription.find({
    doctorId: doctor._id,
    appointmentId: { $ne: null }
  })
    .populate({
      path: 'patientId',
      select: 'age gender',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('appointmentId', 'date time status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments({
    doctorId: doctor._id,
    appointmentId: { $ne: null }
  });

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prescriptions.map(prescription => ({
      prescriptionId: prescription._id,
      patientName: prescription.patientId.userId.name,
      appointmentDate: prescription.appointmentId?.date,
      appointmentTime: prescription.appointmentId?.time,
      medicinesCount: prescription.medicines.length,
      status: 'Pending', // This would come from Pharmacy collection
      createdAt: prescription.createdAt
    }))
  });
});

/* =========================================================
   10. PATIENT DISCHARGE SUMMARY
========================================================= */

// @desc    Create patient discharge summary
// @route   POST /api/v1/doctors/patients/:id/discharge
// @access  Private/Doctor
exports.createDischargeSummary = asyncHandler(async (req, res) => {
  const { summary, followUpDate, instructions, medications } = req.body;
  const patientId = req.params.id;

  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Check authorization
  const hasAppointment = await Appointment.findOne({
    patientId,
    doctorId: doctor._id
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to discharge this patient');
  }

  // Get patient details
  const patient = await Patient.findById(patientId)
    .populate('userId', 'name email phone');

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Update patient admission status
  patient.isAdmitted = false;
  patient.admissionStatus = 'Discharged';
  patient.dischargeDate = new Date();
  await patient.save();

  // Get patient's recent data for summary
  const [recentAppointments, recentPrescriptions, recentLabTests, recentVitals] = await Promise.all([
    Appointment.find({ patientId, doctorId: doctor._id }).sort({ date: -1 }).limit(5),
    Prescription.find({ patientId, doctorId: doctor._id }).sort({ createdAt: -1 }).limit(5),
    LabTest.find({ patientId, doctorId: doctor._id }).sort({ createdAt: -1 }).limit(5),
    Vitals.find({ patientId }).sort({ recordedAt: -1 }).limit(5)
  ]);

  // Create discharge summary
  const dischargeSummary = {
    patientId: patient._id,
    patientName: patient.userId.name,
    doctorId: doctor._id,
    doctorName: req.user.name,
    admissionDate: patient.admissionDate,
    dischargeDate: new Date(),
    summary: summary || 'Patient discharged in stable condition',
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    instructions: instructions || [],
    medications: medications || [],
    diagnosis: req.body.diagnosis || [],
    procedures: req.body.procedures || [],
    vitalsOnDischarge: recentVitals[0] || null,
    lastAppointment: recentAppointments[0] || null,
    activePrescriptions: recentPrescriptions.filter(p => 
      p.medicines.some(m => m.administrationStatus === 'Pending')
    ),
    pendingLabResults: recentLabTests.filter(t => t.status !== 'Completed'),
    createdAt: new Date()
  };

  // In a real system, save to DischargeSummary collection
  // For now, return the summary
  
  res.status(201).json({
    success: true,
    message: 'Patient discharged successfully',
    data: dischargeSummary
  });
});

/* =========================================================
   11. QUICK STATS FOR DASHBOARD WIDGETS
========================================================= */

// @desc    Get quick stats for dashboard widgets
// @route   GET /api/v1/doctors/dashboard/quick-stats
// @access  Private/Doctor
exports.getQuickStats = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const doctorId = doctor._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    todaysAppointments,
    upcomingAppointments,
    pendingPrescriptions,
    criticalPatients,
    lowStockMedicines,
    recentAlerts
  ] = await Promise.all([
    // Today's appointments
    Appointment.countDocuments({
      doctorId,
      date: { $gte: today },
      status: 'Scheduled'
    }),
    
    // Upcoming appointments (next 3 days)
    Appointment.countDocuments({
      doctorId,
      date: { $gte: today, $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) },
      status: 'Scheduled'
    }),
    
    // Pending prescriptions
    Prescription.countDocuments({
      doctorId,
      'medicines.administrationStatus': 'Pending'
    }),
    
    // Patients with critical vitals (example: high BP or low O2)
    Vitals.aggregate([
      {
        $match: {
          $or: [
            { 'bloodPressure.systolic': { $gt: 180 } },
            { 'bloodPressure.diastolic': { $gt: 120 } },
            { oxygenSaturation: { $lt: 90 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'appointments',
          let: { patientId: '$patientId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$patientId'] }, doctorId } }
          ],
          as: 'doctorAppointments'
        }
      },
      { $match: { doctorAppointments: { $ne: [] } } },
      { $group: { _id: '$patientId' } },
      { $count: 'count' }
    ]),
    
    // Medicines with low stock (if doctor has access)
    Medicine.countDocuments({ stockQuantity: { $lt: 10 } }),
    
    // Recent system alerts/notifications count
    Promise.resolve(0) // Placeholder for notification system
  ]);

  res.status(200).json({
    success: true,
    data: {
      todaysAppointments,
      upcomingAppointments,
      pendingPrescriptions,
      criticalPatients: criticalPatients[0]?.count || 0,
      lowStockMedicines,
      recentAlerts
    }
  });
});

// @desc    Get recent doctor activity
// @route   GET /api/v1/doctors/dashboard/activity
// @access  Private/Doctor
exports.getRecentActivity = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const doctorId = doctor._id;

  const [recentAppointments, recentLabTests, recentPrescriptions] =
    await Promise.all([
      Appointment.find({ doctorId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' }
        }),

      LabTest.find({ doctorId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' }
        }),

      Prescription.find({ doctorId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' }
        })
    ]);

  res.status(200).json({
    success: true,
    data: {
      appointments: recentAppointments,
      labTests: recentLabTests,
      prescriptions: recentPrescriptions
    }
  });
});
/* =========================================================
   4A. FULL PRESCRIPTION DETAILS
========================================================= */

// @desc    Get full prescription details with all related data
// @route   GET /api/v1/doctors/prescriptions/:id/full
// @access  Private/Doctor
exports.getFullPrescriptionById = asyncHandler(async (req, res) => {
  // Get doctor's record first
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get the main prescription with detailed population
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    doctorId: doctor._id
  })
    .populate({
      path: 'patientId',
      select: 'age gender bloodGroup address admissionStatus isAdmitted wardId bedNumber',
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
        select: 'name email phone'
      }
    })
    .populate('appointmentId', 'date time status notes nursingNotes preparationStatus')
    .populate('medicines.medicineId', 'name category price stockQuantity unit')
    .lean();

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  const patientId = prescription.patientId?._id;
  const appointmentId = prescription.appointmentId?._id;

  // Get all related data in parallel for comprehensive view
  const [
    patientVitals,
    patientLabTests,
    patientNursingCare,
    patientBilling,
    medicineStockInfo,
    administrationHistory,
    patientAllergies,
    medicationInteractions,
    pharmacyStatus,
    followUpAppointments
  ] = await Promise.all([
    // 1. Recent patient vitals (last 3 readings)
    patientId ? Vitals.find({ patientId })
      .sort({ recordedAt: -1 })
      .limit(3)
      .populate({
        path: 'nurseId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .lean() : Promise.resolve([]),

    // 2. Recent lab tests related to this prescription/appointment
    patientId ? LabTest.find({
      $or: [
        { patientId, appointmentId: appointmentId || null },
        { patientId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'labTechId',
        select: 'specialization department',
        populate: { path: 'userId', select: 'name' }
      })
      .lean() : Promise.resolve([]),

    // 3. Recent nursing care activities
    patientId ? NursingCare.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'nurseId',
        select: 'specialization shift',
        populate: { path: 'userId', select: 'name' }
      })
      .lean() : Promise.resolve([]),

    // 4. Billing information
    appointmentId ? Billing.findOne({ appointmentId }).lean() : Promise.resolve(null),

    // 5. Medicine stock information from pharmacy
    prescription.medicines && prescription.medicines.length > 0 ?
      Medicine.find({
        name: { $in: prescription.medicines.map(m => m.name) }
      })
        .select('name stockQuantity price unit category')
        .lean() : Promise.resolve([]),

    // 6. Administration records for this prescription
    prescription.administrationRecords ? 
      Promise.resolve(prescription.administrationRecords.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )) : Promise.resolve([]),

    // 7. Patient allergies (from patient profile)
    patientId ? Patient.findById(patientId)
      .select('careNotes')
      .lean()
      .then(patient => {
        // Extract allergy notes from careNotes
        const allergies = (patient?.careNotes || [])
          .filter(note => note.noteType === 'Concern' && 
            note.content.toLowerCase().includes('allergy'))
          .map(note => ({
            content: note.content,
            priority: note.priority,
            createdBy: note.createdBy,
            createdAt: note.createdAt
          }));
        return allergies;
      }) : Promise.resolve([]),

    // 8. Medication interactions check (simulated)
    Promise.resolve({
      hasInteractions: false,
      warnings: [],
      // In real system, would call medication interaction API
      checkedAt: new Date()
    }),

    // 9. Pharmacy dispensing status
    Promise.resolve({
      status: prescription.medicines.some(m => m.administrationStatus === 'Pending') 
        ? 'Pending Dispensing' : 'Completed',
      lastUpdated: new Date(),
      // In real system, would query Pharmacy collection
    }),

    // 10. Follow-up appointments
    patientId ? Appointment.find({
      patientId,
      doctorId: doctor._id,
      status: 'Scheduled',
      date: { $gt: new Date() }
    })
      .sort({ date: 1 })
      .limit(2)
      .lean() : Promise.resolve([])
  ]);

  // Calculate prescription statistics
  const prescriptionStats = {
    totalMedicines: prescription.medicines.length,
    pendingMedicines: prescription.medicines.filter(m => 
      m.administrationStatus === 'Pending'
    ).length,
    administeredMedicines: prescription.medicines.filter(m => 
      m.administrationStatus === 'Administered'
    ).length,
    completionPercentage: prescription.medicines.length > 0 ?
      Math.round((prescription.medicines.filter(m => 
        m.administrationStatus === 'Administered'
      ).length / prescription.medicines.length) * 100) : 0,
    
    // Medicine cost estimation
    estimatedCost: prescription.medicines.reduce((total, med) => {
      const medInfo = medicineStockInfo.find(m => m.name === med.name);
      return total + (medInfo?.price || 0) * (med.quantity || 1);
    }, 0),
    
    // Duration analysis
    startDate: prescription.createdAt,
    expectedCompletion: prescription.medicines.reduce((latest, med) => {
      if (med.nextDue) {
        const dueDate = new Date(med.nextDue);
        return dueDate > latest ? dueDate : latest;
      }
      return latest;
    }, new Date(prescription.createdAt)),
    
    // Priority analysis
    highPriorityMeds: prescription.medicines.filter(med => 
      med.priority === 'High' || med.priority === 'Critical'
    ).length
  };

  // Structure the comprehensive response
  const fullPrescriptionData = {
    // Prescription basic info
    prescription: {
      ...prescription,
      // Add calculated fields
      stats: prescriptionStats
    },

    // Patient context
    patientContext: {
      basicInfo: prescription.patientId,
      vitals: patientVitals,
      allergies: patientAllergies,
      admissionStatus: prescription.patientId?.admissionStatus,
      isAdmitted: prescription.patientId?.isAdmitted,
      wardInfo: prescription.patientId?.wardId ? {
        wardId: prescription.patientId.wardId,
        bedNumber: prescription.patientId.bedNumber
      } : null
    },

    // Medical context
    medicalContext: {
      labTests: patientLabTests,
      nursingCare: patientNursingCare,
      followUpAppointments,
      appointmentDetails: prescription.appointmentId
    },

    // Medication details
    medicationDetails: {
      medicines: prescription.medicines.map(med => ({
        ...med,
        stockInfo: medicineStockInfo.find(m => m.name === med.name) || null,
        nextAdministration: med.nextDue ? {
          dueDate: med.nextDue,
          status: med.administrationStatus,
          administeredBy: med.administeredBy
        } : null
      })),
      interactions: medicationInteractions,
      administrationHistory: administrationHistory.slice(0, 10), // Last 10 administrations
      pharmacyStatus
    },

    // Administrative & financial
    administrative: {
      billing: patientBilling,
      createdDate: prescription.createdAt,
      lastUpdated: prescription.updatedAt,
      createdBy: {
        doctorName: prescription.doctorId?.userId?.name,
        specialization: prescription.doctorId?.specialization
      }
    },

    // Summary & recommendations
    summary: {
      status: prescriptionStats.completionPercentage === 100 ? 'Completed' :
        prescriptionStats.completionPercentage > 0 ? 'In Progress' : 'Not Started',
      nextActions: prescription.medicines.filter(m => 
        m.administrationStatus === 'Pending' && m.nextDue
      ).map(m => ({
        medicine: m.name,
        due: m.nextDue,
        dosage: m.dosage
      })),
      alerts: prescriptionStats.highPriorityMeds > 0 ? [
        `${prescriptionStats.highPriorityMeds} high priority medications require attention`
      ] : [],
      recommendations: medicineStockInfo.some(m => m.stockQuantity < 10) ? [
        'Low stock alert for some medications'
      ] : []
    }
  };

  res.status(200).json({
    success: true,
    data: fullPrescriptionData
  });
});
// Add these functions to doctorController.js

/* =====================
   LAB TECH MANAGEMENT (READ-ONLY ACCESS FOR DOCTORS)
===================== */

// Get all lab technicians (doctors can view but not modify)
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
        status: { $in: ['Requested', 'Processing'] },
        labTechId: user._id
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
// @desc    Get lab tests by doctor and patient
// @route   GET /api/v1/doctors/patients/:patientId/lab-tests
// @access  Private/Doctor
exports.getLabTestsByDoctorAndPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status, priority, page = 1, limit = 10 } = req.query;

  // Get logged-in doctor
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Verify doctor has treated this patient
  const hasAppointment = await Appointment.findOne({
    doctorId: doctor._id,
    patientId
  });

  if (!hasAppointment) {
    res.status(403);
    throw new Error('Not authorized to view lab tests for this patient');
  }

  // Build filter
  const filter = {
    doctorId: doctor._id,
    patientId
  };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Pagination
  const skip = (page - 1) * limit;

  try {
    // Get lab tests with proper population
    const labTests = await LabTest.find(filter)
      .populate({
        path: 'patientId',
        select: 'age gender bloodGroup',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'labTechId',
        select: 'employeeId department specialization experience'
      })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // For lab tests that have labTechId, populate the user details separately
    const labTestsWithTechDetails = await Promise.all(
      labTests.map(async (labTest) => {
        const labTestObj = labTest.toObject();
        
        // If there's a labTechId, get the lab tech's user details
        if (labTestObj.labTechId && labTestObj.labTechId._id) {
          try {
            const labTech = await LabTech.findById(labTestObj.labTechId._id)
              .populate('userId', 'name email');
            
            if (labTech && labTech.userId) {
              // Add user details to labTechId object
              labTestObj.labTechId.userId = {
                name: labTech.userId.name,
                email: labTech.userId.email
              };
            }
          } catch (error) {
            console.error('Error fetching lab tech details:', error);
          }
        }
        
        return labTestObj;
      })
    );

    const total = await LabTest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: labTestsWithTechDetails.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: labTestsWithTechDetails
    });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  }
});
// Get single lab tech details
exports.getLabTechById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let user = null;
  let labTech = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    user = await User.findById(id).select('-password');
    if (user && user.role === 'LAB_TECH') {
      labTech = await LabTech.findOne({ userId: id });
    }
  } else {
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

  const recentLabTests = await LabTest.find({
    labTechId: user._id,
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

  const currentYear = new Date().getFullYear();
  
  const monthlyStats = await LabTest.aggregate([
    {
      $match: {
        labTechId: user._id,
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
        avgProcessingHours: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const testTypeStats = await LabTest.aggregate([
    {
      $match: {
        labTechId: user._id,
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
              1000 * 60 * 60
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
        totalTests: await LabTest.countDocuments({ labTechId: user._id }),
        completedTests: await LabTest.countDocuments({ labTechId: user._id, status: 'Completed' }),
        pendingTests: await LabTest.countDocuments({ 
          labTechId: user._id, 
          status: { $in: ['Requested', 'Processing'] } 
        }),
        monthlyStats,
        testTypeStats,
        accuracyRate: labTech.accuracyRate || 0
      },
      recentActivity: {
        recentLabTests
      }
    }
  });
});

// Assign lab technician to lab test (doctors can assign)
exports.assignLabTechToTest = asyncHandler(async (req, res, next) => {
  const { testId } = req.params;
  const { labTechId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(testId)) {
    res.status(400);
    throw new Error('Invalid test ID');
  }

  let labTech = null;
  let user = null;

  if (mongoose.Types.ObjectId.isValid(labTechId)) {
    labTech = await LabTech.findById(labTechId);
    
    if (!labTech) {
      labTech = await LabTech.findOne({ userId: labTechId });
    }
    
    if (labTech) {
      user = await User.findById(labTech.userId);
    }
  } else if (typeof labTechId === 'string') {
    labTech = await LabTech.findOne({ employeeId: labTechId });
    
    if (!labTech) {
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
    throw new Error('Lab technician not found');
  }

  if (!labTech.isActive) {
    res.status(400);
    throw new Error('Lab technician is inactive');
  }

  const labTest = await LabTest.findById(testId);
  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // // Verify doctor owns this test
  // if (labTest.doctorId.toString() !== req.user._id.toString()) {
  //   res.status(403);
  //   throw new Error('Not authorized to assign lab tech to this test');
  // }

  labTest.labTechId = labTech.userId;
  labTest.status = 'Processing';
  labTest.assignedAt = new Date();
  labTest.assignedBy = req.user._id;
  
  await labTest.save();

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

  const labTechUser = await User.findById(labTech.userId).select('name email');
  
  updatedTest.labTechDetails = {
    name: labTechUser?.name,
    email: labTechUser?.email,
    employeeId: labTech.employeeId,
    department: labTech.department,
    specialization: labTech.specialization
  };

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

  const total = await LabTech.countDocuments(query);

  res.status(200).json({
    success: true,
    count: labTechs.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    department: department,
    data: labTechs
  });
});

// Get available lab techs for assignment
exports.getAvailableLabTechs = asyncHandler(async (req, res, next) => {
  const { department, testType } = req.query;

  const query = { isActive: true };

  if (department) {
    query.department = department;
  }

  if (testType) {
    query.certifiedTests = {
      $elemMatch: {
        testName: { $regex: testType, $options: 'i' }
      }
    };
  }

  const labTechs = await LabTech.find(query)
    .populate('userId', 'name email phone')
    .lean();

  const labTechsWithAvailability = await Promise.all(
    labTechs.map(async (labTech) => {
      const pendingTests = await LabTest.countDocuments({
        labTechId: labTech.userId._id,
        status: { $in: ['Processing'] }
      });

      return {
        ...labTech,
        availability: {
          pendingTests,
          isAvailable: pendingTests < 10, // Customize threshold as needed
          loadPercentage: Math.min((pendingTests / 10) * 100, 100)
        }
      };
    })
  );

  res.status(200).json({
    success: true,
    count: labTechsWithAvailability.length,
    data: labTechsWithAvailability
  });
});

// Get lab tech performance for doctor's tests
exports.getLabTechPerformance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  let user = null;
  let labTech = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    user = await User.findById(id);
    if (user && user.role === 'LAB_TECH') {
      labTech = await LabTech.findOne({ userId: id });
    }
  } else {
    labTech = await LabTech.findOne({ employeeId: id });
    if (labTech) {
      user = await User.findById(labTech.userId);
    }
  }

  if (!user || !labTech) {
    res.status(404);
    throw new Error('Lab technician not found');
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { 
    labTechId: user._id, 
    status: 'Completed',
    doctorId: req.user._id // Only show tests for current doctor
  };
  
  if (Object.keys(dateFilter).length > 0) {
    matchStage.updatedAt = dateFilter;
  }

  const performance = await LabTest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        avgProcessingHours: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        },
        minProcessingHours: {
          $min: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        },
        maxProcessingHours: {
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

  const recentTests = await LabTest.find({
    labTechId: user._id,
    doctorId: req.user._id,
    status: 'Completed'
  })
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      labTech: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: labTech.employeeId,
        department: labTech.department,
        specialization: labTech.specialization
      },
      performance: performance[0] || {},
      recentTests,
      dateRange: dateFilter
    }
  });
});