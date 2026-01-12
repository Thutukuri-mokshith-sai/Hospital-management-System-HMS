const mongoose = require('mongoose');
const { 
  User, 
  Patient, 
  Doctor, 
  Appointment, 
  Prescription, 
  Medicine, 
  Vitals, 
  NursingCare,
  LabTest,
  LabReport,
  Ward
} = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   DOCTOR DASHBOARD
===================== */
exports.getDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get doctor profile
  const doctorProfile = await Doctor.findOne({ userId: doctorId })
    .populate('userId', 'name email phone');

  if (!doctorProfile) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get all patient IDs under doctor's care
  const appointments = await Appointment.find({ doctorId })
    .distinct('patientId');

  // Parallel execution for better performance
  const [
    todaysAppointments,
    admittedPatients,
    pendingLabTests,
    activePrescriptions,
    criticalAlerts
  ] = await Promise.all([
    // Today's appointments count
    Appointment.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: 'Scheduled'
    }),

    // Current admitted patients
    Patient.countDocuments({
      _id: { $in: appointments },
      admissionStatus: 'Admitted'
    }),

    // Pending lab tests
    LabTest.countDocuments({
      doctorId,
      status: { $in: ['Requested', 'Processing'] }
    }),

    // Active prescriptions
    Prescription.countDocuments({
      doctorId,
      'medicines.administrationStatus': 'Pending'
    }),

    // Critical alerts
    getCriticalAlerts(doctorId)
  ]);

  res.status(200).json({
    success: true,
    data: {
      doctorProfile: {
        ...doctorProfile.toObject(),
        userId: {
          id: doctorProfile.userId._id,
          name: doctorProfile.userId.name,
          email: doctorProfile.userId.email,
          phone: doctorProfile.userId.phone
        }
      },
      counts: {
        todaysAppointments,
        admittedPatients,
        pendingLabTests,
        activePrescriptions,
        totalPatients: appointments.length
      },
      criticalAlerts: criticalAlerts.slice(0, 10) // Limit to 10 most critical
    }
  });
});

/* =====================
   APPOINTMENT MANAGEMENT
===================== */

// Get all appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  console.log(doctorId);
  const { status, date, page = 1, limit = 10 } = req.query;

  const filter = { doctorId };
  
  if (status) filter.status = status;
  if (date) {
    const filterDate = new Date(date);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: filterDate, $lt: nextDay };
  }

  const appointments = await Appointment.find(filter)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .sort({ date: 1, time: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get single appointment
exports.getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if doctor owns this appointment
  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this appointment');
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

// Update appointment
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { status, notes, nursingNotes, preparationStatus } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if doctor owns this appointment
  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this appointment');
  }

  // Update fields if provided
  const updates = {};
  if (status && ['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
    updates.status = status;
  }
  if (notes) updates.notes = notes;
  if (nursingNotes) updates.nursingNotes = nursingNotes;
  if (preparationStatus) updates.preparationStatus = preparationStatus;

  // Apply updates
  Object.assign(appointment, updates);

  // Track who updated
  appointment.lastUpdatedBy = {
    role: 'DOCTOR',
    userId: req.user._id,
    name: req.user.name,
    updatedAt: new Date()
  };

  await appointment.save();

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/* =====================
   PATIENT MANAGEMENT
===================== */

// Get doctor's patients
exports.getPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { search, admissionStatus, page = 1, limit = 10 } = req.query;

  // Get all patient IDs that this doctor has appointments with
  const appointmentPatientIds = await Appointment.find({ doctorId })
    .distinct('patientId');

  // Get all patient IDs from prescriptions (for doctors who prescribed but no appointment)
  const prescriptionPatientIds = await Prescription.find({ doctorId })
    .distinct('patientId');

  // Combine and deduplicate
  const allPatientIds = [...new Set([
    ...appointmentPatientIds.map(id => id.toString()),
    ...prescriptionPatientIds.map(id => id.toString())
  ])].map(id => new mongoose.Types.ObjectId(id));

  if (allPatientIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  }

  // Build search query
  let searchQuery = {};
  if (search) {
    const users = await User.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    
    const userIds = users.map(user => user._id);
    
    const patients = await Patient.find({
      userId: { $in: userIds }
    }).select('_id');
    
    const patientIdsFromSearch = patients.map(p => p._id);
    
    searchQuery = { _id: { $in: patientIdsFromSearch } };
  }

  // Build admission status query
  let admissionQuery = {};
  if (admissionStatus) {
    admissionQuery.admissionStatus = admissionStatus;
  }

  const finalQuery = {
    _id: { $in: allPatientIds },
    ...searchQuery,
    ...admissionQuery
  };

  const patients = await Patient.find(finalQuery)
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ updatedAt: -1 });

  const total = await Patient.countDocuments(finalQuery);

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get single patient with full clinical view
exports.getPatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const doctorId = req.user._id;

  // Verify patient is under doctor's care through appointments or prescriptions
  const [hasAppointment, hasPrescription] = await Promise.all([
    Appointment.findOne({ doctorId, patientId }),
    Prescription.findOne({ doctorId, patientId })
  ]);

  if (!hasAppointment && !hasPrescription) {
    res.status(403);
    throw new Error('Not authorized to access this patient');
  }

  // Get patient with user info
  const patient = await Patient.findById(patientId)
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name floor specialty');

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Parallel fetch for all related data
  const [
    latestVitals,
    nursingCare,
    appointments,
    prescriptions,
    labTests
  ] = await Promise.all([
    // Latest vitals
    Vitals.findOne({ patientId })
      .sort({ recordedAt: -1 })
      .populate({
        path: 'nurseId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }),

    // Nursing care notes
    NursingCare.find({ patientId })
      .populate({
        path: 'nurseId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10),

    // Appointment history with this doctor
    Appointment.find({
      patientId,
      doctorId
    })
      .sort({ date: -1 })
      .limit(10),

    // Prescriptions by this doctor
    Prescription.find({
      patientId,
      doctorId
    })
      .sort({ createdAt: -1 })
      .limit(5),

    // Lab tests ordered by this doctor
    LabTest.find({
      patientId,
      doctorId
    })
      .populate('labTechId', 'userId')
      .populate({
        path: 'labTechId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      patient: {
        ...patient.toObject(),
        userId: {
          id: patient.userId._id,
          name: patient.userId.name,
          email: patient.userId.email,
          phone: patient.userId.phone
        }
      },
      clinicalData: {
        latestVitals,
        nursingCare,
        appointments,
        prescriptions,
        labTests
      }
    }
  });
});

/* =====================
   PRESCRIPTIONS MANAGEMENT
===================== */

// Create prescription
exports.createPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, medicines } = req.body;
  const doctorId = req.user._id;

  // Validate required fields
  if (!patientId || !medicines || medicines.length === 0) {
    res.status(400);
    throw new Error('Patient ID and medicines are required');
  }

  // Validate patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate medicines
  const validatedMedicines = await Promise.all(
    medicines.map(async (medicine) => {
      if (medicine.medicineId) {
        const medExists = await Medicine.findById(medicine.medicineId);
        if (!medExists) {
          res.status(404);
          throw new Error(`Medicine with ID ${medicine.medicineId} not found`);
        }
      }
      return {
        ...medicine,
        administrationStatus: 'Pending'
      };
    })
  );

  // Create prescription
  const prescription = await Prescription.create({
    patientId,
    doctorId,
    appointmentId: appointmentId || undefined,
    medicines: validatedMedicines
  });

  // Populate patient info for response
  await prescription.populate({
    path: 'patientId',
    populate: {
      path: 'userId',
      select: 'name'
    }
  });

  res.status(201).json({
    success: true,
    data: prescription
  });
});

// Get prescriptions
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { patientId, status, page = 1, limit = 10 } = req.query;

  const filter = { doctorId };
  if (patientId) filter.patientId = patientId;
  if (status) {
    if (['Pending', 'Administered', 'Skipped', 'Cancelled'].includes(status)) {
      filter['medicines.administrationStatus'] = status;
    }
  }

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    data: prescriptions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Update prescription
exports.updatePrescription = asyncHandler(async (req, res) => {
  const { medicines } = req.body;

  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  if (prescription.doctorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this prescription');
  }

  // Validate medicines if provided
  if (medicines) {
    const validatedMedicines = await Promise.all(
      medicines.map(async (medicine) => {
        if (medicine.medicineId) {
          const medExists = await Medicine.findById(medicine.medicineId);
          if (!medExists) {
            res.status(404);
            throw new Error(`Medicine with ID ${medicine.medicineId} not found`);
          }
        }
        return medicine;
      })
    );
    prescription.medicines = validatedMedicines;
  }

  await prescription.save();

  res.status(200).json({
    success: true,
    data: prescription
  });
});

/* =====================
   LAB TESTS MANAGEMENT
===================== */

// Order lab test
exports.orderLabTest = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, testName, priority, notes } = req.body;
  const doctorId = req.user._id;

  // Validate required fields
  if (!patientId || !testName) {
    res.status(400);
    throw new Error('Patient ID and test name are required');
  }

  // Validate patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate priority
  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (priority && !validPriorities.includes(priority)) {
    res.status(400);
    throw new Error('Invalid priority level');
  }

  // Create lab test
  const labTest = await LabTest.create({
    patientId,
    doctorId,
    appointmentId: appointmentId || undefined,
    testName,
    priority: priority || 'Medium',
    notes: notes || '',
    status: 'Requested',
    assignedAt: new Date()
  });

  // Populate for response
  await labTest.populate({
    path: 'patientId',
    populate: {
      path: 'userId',
      select: 'name'
    }
  });

  res.status(201).json({
    success: true,
    data: labTest
  });
});

// Get lab tests
exports.getLabTests = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { patientId, status, priority, page = 1, limit = 10 } = req.query;

  const filter = { doctorId };
  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const labTests = await LabTest.find(filter)
    .populate({
      path: 'patientId',
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
    .sort({ 
      priority: 1, // Critical first
      createdAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await LabTest.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: labTests.length,
    data: labTests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get lab reports
exports.getLabReports = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { patientId, page = 1, limit = 10 } = req.query;

  // Get lab tests by this doctor
  const labTestFilter = { doctorId };
  if (patientId) labTestFilter.patientId = patientId;
  
  const labTests = await LabTest.find(labTestFilter)
    .distinct('_id');

  if (labTests.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  }

  const labReports = await LabReport.find({ labTestId: { $in: labTests } })
    .populate({
      path: 'labTestId',
      populate: [
        {
          path: 'patientId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        },
        {
          path: 'labTechId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        }
      ]
    })
    .sort({ reportDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await LabReport.countDocuments({ labTestId: { $in: labTests } });

  res.status(200).json({
    success: true,
    count: labReports.length,
    data: labReports,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/* =====================
   IN-PATIENT MONITORING
===================== */

// Get admitted patients
exports.getAdmittedPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { wardId, page = 1, limit = 10 } = req.query;

  // Get patient IDs that this doctor has appointments with
  const appointments = await Appointment.find({ doctorId })
    .distinct('patientId');

  if (appointments.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  }

  let filter = {
    _id: { $in: appointments },
    admissionStatus: 'Admitted'
  };
  
  if (wardId) filter.wardId = wardId;

  const patients = await Patient.find(filter)
    .populate('userId', 'name email phone age gender')
    .populate('wardId', 'wardNumber name floor specialty')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ admissionDate: -1 });

  // Get additional data for each patient in parallel
  const patientsWithDetails = await Promise.all(
    patients.map(async (patient) => {
      const [latestVitals, activePrescriptions, lastAppointment] = await Promise.all([
        Vitals.findOne({ patientId: patient._id })
          .sort({ recordedAt: -1 })
          .select('temperature bloodPressure heartRate oxygenSaturation recordedAt'),
        Prescription.findOne({
          patientId: patient._id,
          'medicines.administrationStatus': 'Pending'
        }),
        Appointment.findOne({
          patientId: patient._id,
          doctorId
        })
          .sort({ date: -1 })
          .select('date')
      ]);

      return {
        ...patient.toObject(),
        latestVitals,
        hasActivePrescriptions: !!activePrescriptions,
        lastVisit: lastAppointment ? lastAppointment.date : null
      };
    })
  );

  const total = await Patient.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patientsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/* =====================
   ALERTS & NOTIFICATIONS
===================== */

exports.getAlerts = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  
  const alerts = await getCriticalAlerts(doctorId);

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

/* =====================
   PROFILE & SETTINGS
===================== */

// Get doctor profile
exports.getProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id })
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name');

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  res.status(200).json({
    success: true,
    data: {
      ...doctor.toObject(),
      userId: {
        id: doctor.userId._id,
        name: doctor.userId.name,
        email: doctor.userId.email,
        phone: doctor.userId.phone
      }
    }
  });
});

// Update profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { specialization, department, phone } = req.body;

  let updateUser = {};
  let updateDoctor = {};

  if (phone) {
    updateUser.phone = phone;
  }

  if (specialization || department) {
    if (specialization) updateDoctor.specialization = specialization;
    if (department) updateDoctor.department = department;
  }

  // Update user if needed
  if (Object.keys(updateUser).length > 0) {
    await User.findByIdAndUpdate(req.user._id, updateUser, { new: true });
  }

  // Update doctor profile
  let doctor;
  if (Object.keys(updateDoctor).length > 0) {
    doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      updateDoctor,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');
  } else {
    doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone');
  }

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  res.status(200).json({
    success: true,
    data: {
      ...doctor.toObject(),
      userId: {
        id: doctor.userId._id,
        name: doctor.userId.name,
        email: doctor.userId.email,
        phone: doctor.userId.phone
      }
    }
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

/* =====================
   HELPER FUNCTIONS
===================== */

// Get critical alerts for doctor
async function getCriticalAlerts(doctorId) {
  const alerts = [];

  try {
    // 1. Get doctor's patients
    const appointmentPatientIds = await Appointment.find({ doctorId })
      .distinct('patientId');

    const prescriptionPatientIds = await Prescription.find({ doctorId })
      .distinct('patientId');

    const allPatientIds = [...new Set([
      ...appointmentPatientIds.map(id => id.toString()),
      ...prescriptionPatientIds.map(id => id.toString())
    ])].map(id => new mongoose.Types.ObjectId(id));

    if (allPatientIds.length === 0) {
      return alerts;
    }

    // 2. Critical vitals (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const criticalVitals = await Vitals.find({
      patientId: { $in: allPatientIds },
      recordedAt: { $gte: twentyFourHoursAgo },
      $or: [
        { 'bloodPressure.systolic': { $gt: 180 } },
        { 'bloodPressure.systolic': { $lt: 90 } },
        { 'bloodPressure.diastolic': { $gt: 120 } },
        { 'bloodPressure.diastolic': { $lt: 60 } },
        { heartRate: { $gt: 120 } },
        { heartRate: { $lt: 50 } },
        { oxygenSaturation: { $lt: 92 } },
        { temperature: { $gt: 39 } },
        { temperature: { $lt: 35 } }
      ]
    })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ recordedAt: -1 })
      .limit(10);

    criticalVitals.forEach(vital => {
      alerts.push({
        type: 'CRITICAL_VITAL',
        severity: 'HIGH',
        patientId: vital.patientId._id,
        patientName: vital.patientId.userId.name,
        message: 'Abnormal vital readings detected',
        data: {
          temperature: vital.temperature,
          bloodPressure: vital.bloodPressure,
          heartRate: vital.heartRate,
          oxygenSaturation: vital.oxygenSaturation
        },
        timestamp: vital.recordedAt,
        alertId: `vital_${vital._id}`
      });
    });

    // 3. Critical lab tests (pending)
    const criticalLabTests = await LabTest.find({
      patientId: { $in: allPatientIds },
      priority: 'Critical',
      status: { $in: ['Requested', 'Processing'] }
    })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .limit(5);

    criticalLabTests.forEach(test => {
      alerts.push({
        type: 'CRITICAL_LAB_TEST',
        severity: 'CRITICAL',
        patientId: test.patientId._id,
        patientName: test.patientId.userId.name,
        message: `Critical lab test pending: ${test.testName}`,
        data: {
          testName: test.testName,
          status: test.status,
          priority: test.priority,
          assignedAt: test.assignedAt
        },
        timestamp: test.updatedAt || test.createdAt,
        alertId: `lab_${test._id}`
      });
    });

    // 4. High-priority nursing notes (last 48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const patientsWithNotes = await Patient.find({
      _id: { $in: allPatientIds },
      'careNotes.priority': { $in: ['High', 'Critical'] },
      'careNotes.createdAt': { $gte: fortyEightHoursAgo }
    })
      .populate('userId', 'name')
      .select('careNotes userId')
      .limit(5);

    patientsWithNotes.forEach(patient => {
      const criticalNotes = patient.careNotes.filter(
        note => ['High', 'Critical'].includes(note.priority) && 
                note.createdAt >= fortyEightHoursAgo
      ).sort((a, b) => b.createdAt - a.createdAt);

      criticalNotes.forEach(note => {
        alerts.push({
          type: 'HIGH_PRIORITY_NOTE',
          severity: note.priority === 'Critical' ? 'CRITICAL' : 'HIGH',
          patientId: patient._id,
          patientName: patient.userId.name,
          message: `${note.priority} priority nursing note`,
          data: {
            noteType: note.noteType,
            content: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
            priority: note.priority,
            createdBy: note.createdBy
          },
          timestamp: note.createdAt,
          alertId: `note_${patient._id}_${note._id}`
        });
      });
    });

    // 5. Missed medications (last 24 hours)
    const missedMedications = await Prescription.aggregate([
      { $match: { patientId: { $in: allPatientIds } } },
      { $unwind: '$medicines' },
      { $match: { 
        'medicines.administrationStatus': 'Skipped',
        'medicines.lastAdministered': { $gte: twentyFourHoursAgo }
      }},
      { $sort: { 'medicines.lastAdministered': -1 } },
      { $limit: 5 },
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
        $project: {
          patientId: '$patient._id',
          patientName: '$user.name',
          medicine: '$medicines',
          timestamp: '$medicines.lastAdministered'
        }
      }
    ]);

    missedMedications.forEach(item => {
      alerts.push({
        type: 'MISSED_MEDICATION',
        severity: 'MEDIUM',
        patientId: item.patientId,
        patientName: item.patientName,
        message: `Missed medication: ${item.medicine.name}`,
        data: {
          medicineName: item.medicine.name,
          dosage: item.medicine.dosage,
          frequency: item.medicine.frequency,
          reason: 'Skipped by nurse'
        },
        timestamp: item.timestamp,
        alertId: `med_${item._id}`
      });
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    // Don't throw error, return empty alerts instead
  }

  // Sort by severity and timestamp
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return alerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}