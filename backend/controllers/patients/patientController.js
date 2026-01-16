const mongoose = require('mongoose');
const { 
  Patient, 
  Appointment, 
  Prescription, 
  LabTest, 
  LabReport, 
  Vitals, 
  NursingCare, 
  Billing, 
  Doctor, 
  Nurse,
  User,
  Ward
} = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');
const PDFDocument = require('pdfkit');
/* =========================================================
   HELPER FUNCTIONS
========================================================= */

// Helper function to generate time slots
const generateTimeSlots = (start, end, interval) => {
  const slots = [];
  let current = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  
  while (current < endTime) {
    slots.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + interval);
  }
  
  return slots;
};

// Helper to get patient record
const getPatientRecord = async (userId) => {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error('Patient profile not found');
  }
  return patient;
};

/* =========================================================
   1. PATIENT PROFILE MANAGEMENT
========================================================= */

// @desc    Get logged-in patient profile
// @route   GET /api/v1/patients/me
// @access  Private/Patient
exports.getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user._id })
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name floor specialty');

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

// @desc    Update patient profile
// @route   PUT /api/v1/patients/me
// @access  Private/Patient
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['age', 'gender', 'address', 'bloodGroup'];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update patient profile
  const patient = await Patient.findOneAndUpdate(
    { userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('userId', 'name email phone');

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Update user phone if provided
  if (req.body.phone) {
    await User.findByIdAndUpdate(req.user._id, { phone: req.body.phone });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: patient
  });
});

/* =========================================================
   2. APPOINTMENTS
========================================================= */

// @desc    Get patient's appointments
// @route   GET /api/v1/patients/appointments
// @access  Private/Patient
exports.getMyAppointments = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
  
  const filter = { patientId: patient._id };
  
  if (status) {
    filter.status = status;
  }
  
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  // Pagination
  const skip = (page - 1) * limit;

  const appointments = await Appointment.find(filter)
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .sort({ date: -1, time: -1 })
    .skip(skip)
    .limit(parseInt(limit));

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

// @desc    Get single appointment details
// @route   GET /api/v1/patients/appointments/:id
// @access  Private/Patient
exports.getAppointmentById = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patientId: patient._id
  })
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

// @desc    Cancel appointment
// @route   PUT /api/v1/patients/appointments/:id
// @access  Private/Patient
exports.cancelAppointment = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patientId: patient._id,
    status: 'Scheduled',
    date: { $gt: new Date() } // Can only cancel future appointments
  });

  if (!appointment) {
    res.status(400);
    throw new Error('Cannot cancel this appointment. Either not found, not scheduled, or already passed.');
  }

  appointment.status = 'Cancelled';
  appointment.notes = appointment.notes 
    ? `${appointment.notes}\n[Cancelled by patient: ${new Date().toLocaleString()}]`
    : `Cancelled by patient: ${new Date().toLocaleString()}`;
  
  await appointment.save();

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: appointment
  });
});

// @desc    Request new appointment
// @route   POST /api/v1/patients/appointments
// @access  Private/Patient
exports.requestAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, reason } = req.body;

  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  // Validate required fields
  if (!doctorId || !date || !time) {
    res.status(400);
    throw new Error('Please provide doctorId, date, and time');
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Check for existing appointment at same time
  const existingAppointment = await Appointment.findOne({
    doctorId,
    date: new Date(date),
    time,
    status: 'Scheduled'
  });

  if (existingAppointment) {
    res.status(409);
    throw new Error('Appointment slot already booked');
  }

  // Create appointment
  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId,
    date: new Date(date),
    time,
    reason: reason || '',
    status: 'Scheduled'
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });

  res.status(201).json({
    success: true,
    message: 'Appointment requested successfully',
    data: populatedAppointment
  });
});

/* =========================================================
   3. DOCTOR AVAILABILITY
========================================================= */

// @desc    Get available doctors
// @route   GET /api/v1/patients/doctors/available
// @access  Private/Patient
exports.getAvailableDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find()
    .populate('userId', 'name email')
    .select('specialization department consultationFee phone availability');

  res.status(200).json({
    success: true,
    count: doctors.length,
    data: doctors
  });
});

// @desc    Get doctor availability for a specific date
// @route   GET /api/v1/patients/doctors/:doctorId/availability/:date
// @access  Private/Patient
exports.getDoctorAvailability = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.params;
  
  // Get doctor's working hours and existing appointments
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const appointments = await Appointment.find({
    doctorId,
    date: new Date(date),
    status: { $ne: 'Cancelled' }
  });
  
  // Generate available time slots
  const workingHours = doctor.availability?.workingHours || { start: '09:00', end: '17:00' };
  const interval = 30; // minutes
  const bookedSlots = appointments.map(a => a.time);
  
  const availableSlots = generateTimeSlots(workingHours.start, workingHours.end, interval)
    .filter(slot => !bookedSlots.includes(slot));
  
  res.status(200).json({
    success: true,
    data: {
      doctor: {
        name: doctor.userId?.name || 'Doctor',
        specialization: doctor.specialization
      },
      date,
      workingHours,
      availableSlots,
      bookedSlots
    }
  });
});

/* =========================================================
   4. PRESCRIPTIONS
========================================================= */

// @desc    Get patient's prescriptions
// @route   GET /api/v1/patients/prescriptions
// @access  Private/Patient
exports.getMyPrescriptions = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { status, page = 1, limit = 10 } = req.query;
  
  const filter = { patientId: patient._id };
  
  if (status) {
    if (status === 'pending') {
      filter['medicines.administrationStatus'] = 'Pending';
    } else if (status === 'completed') {
      filter['medicines.administrationStatus'] = 'Administered';
    }
  }

  // Pagination
  const skip = (page - 1) * limit;

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate('appointmentId', 'date time')
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
// @route   GET /api/v1/patients/prescriptions/:id
// @access  Private/Patient
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const prescription = await Prescription.findOne({
    _id: req.params.id,
    patientId: patient._id
  })
    .populate({
      path: 'doctorId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name email'
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
   5. LAB TESTS & REPORTS
========================================================= */

// @desc    Get patient's lab tests
// @route   GET /api/v1/patients/lab-tests
// @access  Private/Patient
exports.getMyLabTests = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { status, page = 1, limit = 10 } = req.query;
  
  const filter = { patientId: patient._id };
  
  if (status) {
    filter.status = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const labTests = await LabTest.find(filter)
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'labTechId',
      select: 'specialization department',
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

// @desc    Get lab test details with report
// @route   GET /api/v1/patients/lab-tests/:id
// @access  Private/Patient
exports.getLabTestById = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const labTest = await LabTest.findOne({
    _id: req.params.id,
    patientId: patient._id
  })
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'labTechId',
      select: 'specialization department',
      populate: {
        path: 'userId',
        select: 'name'
      }
    });

  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // Get lab report if exists
  const labReport = await LabReport.findOne({ labTestId: labTest._id });

  res.status(200).json({
    success: true,
    data: {
      labTest,
      labReport: labReport || null
    }
  });
});
// @desc    Download lab report as PDF (Patient version)
// @route   GET /api/v1/patients/lab-reports/:labTestId/download
// @access  Private/Patient
exports.downloadLabReportPDF = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { labTestId } = req.params;

  // Check if lab test belongs to patient
  const labTest = await LabTest.findOne({
    _id: labTestId,
    patientId: patient._id,
    status: 'Completed'
  });

  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found or not completed');
  }

  const report = await LabReport.findOne({ labTestId });
  if (!report) {
    res.status(404);
    throw new Error('Lab report not found');
  }

  // Populate patient and doctor info
  const populatedTest = await LabTest.findById(labTestId)
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

  // Create PDF
  const doc = new PDFDocument({ margin: 50 });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="LabReport_${labTestId}_${patient.userId.name}.pdf"`);

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
    // Add content to PDF
    doc.fontSize(20).text('LABORATORY TEST REPORT', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Report ID: ${report._id}`);
    doc.text(`Report Date: ${new Date(report.reportDate).toLocaleDateString()}`);
    doc.moveDown();

    // Patient Information
    doc.fontSize(14).text('PATIENT INFORMATION', { underline: true });
    doc.fontSize(12);
    
    const patientName = populatedTest.patientId?.userId?.name || 'Unknown Patient';
    const patientAge = populatedTest.patientId?.age || 'N/A';
    const patientGender = populatedTest.patientId?.gender || 'N/A';
    const patientBloodGroup = populatedTest.patientId?.bloodGroup || 'N/A';
    
    doc.text(`Name: ${patientName}`);
    doc.text(`Age: ${patientAge}`);
    doc.text(`Gender: ${patientGender}`);
    doc.text(`Blood Group: ${patientBloodGroup}`);
    doc.moveDown();

    // Test Information
    doc.fontSize(14).text('TEST DETAILS', { underline: true });
    doc.fontSize(12);
    doc.text(`Test Name: ${populatedTest.testName}`);
    doc.text(`Test ID: ${populatedTest._id}`);
    doc.text(`Priority: ${populatedTest.priority}`);
    doc.text(`Status: ${populatedTest.status}`);
    
    const doctorName = populatedTest.doctorId?.userId?.name || 'Unknown Doctor';
    doc.text(`Requested By: Dr. ${doctorName}`);
    
    // Get lab tech info if available
    if (populatedTest.labTechId) {
      const labTechUser = await User.findById(populatedTest.labTechId);
      doc.text(`Conducted By: ${labTechUser?.name || 'Lab Technician'}`);
    }
    
    doc.moveDown();

    // Results
    doc.fontSize(14).text('TEST RESULTS', { underline: true });
    doc.fontSize(12);
    doc.text(report.result || 'No results available');
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
    doc.text('For patient use only - Medical Confidential', { align: 'center' });
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
    if (!doc._readableState.ended) {
      doc.end();
    }
  }
});
// @desc    Get lab report details (without PDF)
// @route   GET /api/v1/patients/lab-reports/:labTestId
// @access  Private/Patient
exports.getLabReport = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { labTestId } = req.params;

  // Check if lab test belongs to patient
  const labTest = await LabTest.findOne({
    _id: labTestId,
    patientId: patient._id
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

  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  const report = await LabReport.findOne({ labTestId });
  
  if (!report) {
    return res.status(200).json({
      success: true,
      data: {
        labTest,
        hasReport: false,
        message: 'Report not yet generated'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      labTest,
      labReport: report,
      hasReport: true
    }
  });
});
/* =========================================================
   6. MEDICAL HISTORY & VITALS
========================================================= */

// @desc    Get patient's medical history summary
// @route   GET /api/v1/patients/medical-history
// @access  Private/Patient
exports.getMedicalHistory = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const patientId = patient._id;

  // Get all data in parallel for comprehensive history
  const [
    appointments,
    prescriptions,
    labTests,
    vitals,
    nursingCare,
    billing
  ] = await Promise.all([
    Appointment.find({ patientId })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ date: -1 })
      .limit(10),
    
    Prescription.find({ patientId })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(10),
    
    LabTest.find({ patientId })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(10),
    
    Vitals.find({ patientId })
      .populate({
        path: 'nurseId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ recordedAt: -1 })
      .limit(10),
    
    NursingCare.find({ patientId })
      .populate({
        path: 'nurseId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(10),
    
    Billing.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Get statistics
  const stats = {
    totalAppointments: appointments.length,
    totalPrescriptions: prescriptions.length,
    totalLabTests: labTests.length,
    totalVitalsRecords: vitals.length,
    totalNursingCare: nursingCare.length,
    totalBills: billing.length,
    admissionStatus: patient.admissionStatus,
    isAdmitted: patient.isAdmitted,
    admissionDate: patient.admissionDate,
    dischargeDate: patient.dischargeDate
  };

  res.status(200).json({
    success: true,
    data: {
      patientInfo: patient,
      statistics: stats,
      history: {
        appointments,
        prescriptions,
        labTests,
        vitals,
        nursingCare,
        billing
      }
    }
  });
});

// @desc    Get patient's vitals history
// @route   GET /api/v1/patients/vitals
// @access  Private/Patient
exports.getMyVitals = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { page = 1, limit = 20, dateFrom, dateTo } = req.query;
  const skip = (page - 1) * limit;

  const filter = { patientId: patient._id };
  
  if (dateFrom || dateTo) {
    filter.recordedAt = {};
    if (dateFrom) filter.recordedAt.$gte = new Date(dateFrom);
    if (dateTo) filter.recordedAt.$lte = new Date(dateTo);
  }

  const vitals = await Vitals.find(filter)
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

  const total = await Vitals.countDocuments(filter);

  // Calculate vital trends (last 7 readings)
  const recentVitals = vitals.slice(0, 7).reverse();
  const trends = {
    temperature: recentVitals.map(v => v.temperature).filter(t => t != null),
    bloodPressure: recentVitals.map(v => ({
      systolic: v.bloodPressure?.systolic,
      diastolic: v.bloodPressure?.diastolic,
      date: v.recordedAt
    })).filter(bp => bp.systolic != null && bp.diastolic != null),
    heartRate: recentVitals.map(v => v.heartRate).filter(hr => hr != null),
    oxygenSaturation: recentVitals.map(v => v.oxygenSaturation).filter(o2 => o2 != null)
  };

  res.status(200).json({
    success: true,
    count: vitals.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: vitals,
    trends
  });
});
/* =========================================================
   7. BILLING & PAYMENTS (UPDATED)
========================================================= */

// @desc    Get patient's billing history with detailed information
// @route   GET /api/v1/patients/bills
// @access  Private/Patient
exports.getMyBills = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const { status, page = 1, limit = 10 } = req.query;
  
  const filter = { patientId: patient._id };
  
  if (status) {
    filter.paymentStatus = status;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const bills = await Billing.find(filter)
    .populate({
      path: 'prescriptionId',
      populate: {
        path: 'medicines.medicineId',
        model: 'Medicine',
        select: 'name category price unit'
      }
    })
    .populate('appointmentId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Process bills to include medicine details
  const processedBills = bills.map(bill => {
    const billObj = bill.toObject();
    
    if (billObj.prescriptionId && billObj.prescriptionId.medicines) {
      let medicineTotal = 0;
      const medicineDetails = [];
      
      billObj.prescriptionId.medicines.forEach(medicine => {
        const medicineInfo = {
          name: medicine.name,
          quantity: medicine.quantity || 1,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          duration: medicine.duration,
          unitPrice: medicine.medicineId?.price || 0,
          unit: medicine.medicineId?.unit || 'unit'
        };
        
        // Calculate total for this medicine
        const total = medicineInfo.quantity * medicineInfo.unitPrice;
        medicineInfo.total = total;
        medicineTotal += total;
        
        medicineDetails.push(medicineInfo);
      });
      
      billObj.medicineDetails = medicineDetails;
      billObj.medicineTotal = medicineTotal;
      billObj.serviceCharge = billObj.amount - medicineTotal;
    } else {
      billObj.medicineDetails = [];
      billObj.medicineTotal = 0;
      billObj.serviceCharge = billObj.amount;
    }
    
    return billObj;
  });

  const total = await Billing.countDocuments(filter);

  // Calculate detailed summary
  const summary = await Billing.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$amount', 0]
          }
        },
        totalBills: { $sum: 1 },
        paidBills: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0]
          }
        },
        pendingBills: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0]
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
      paidAmount: 0,
      pendingAmount: 0,
      totalBills: 0,
      paidBills: 0,
      pendingBills: 0
    },
    data: processedBills
  });
});

// @desc    Get detailed bill information
// @route   GET /api/v1/patients/bills/:id
// @access  Private/Patient
exports.getBillById = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const bill = await Billing.findOne({
    _id: req.params.id,
    patientId: patient._id
  })
    .populate({
      path: 'prescriptionId',
      populate: {
        path: 'medicines.medicineId',
        model: 'Medicine',
        select: 'name category price unit'
      }
    })
    .populate({
      path: 'appointmentId',
      populate: {
        path: 'doctorId',
        select: 'specialization department',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }
    })
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    });

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Process bill to include detailed information
  const billObj = bill.toObject();
  
  let medicineTotal = 0;
  const medicineDetails = [];
  
  if (billObj.prescriptionId && billObj.prescriptionId.medicines) {
    billObj.prescriptionId.medicines.forEach(medicine => {
      const medicineInfo = {
        name: medicine.name,
        quantity: medicine.quantity || 1,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instructions: medicine.instructions,
        unitPrice: medicine.medicineId?.price || 0,
        unit: medicine.medicineId?.unit || 'unit'
      };
      
      // Calculate total for this medicine
      const total = medicineInfo.quantity * medicineInfo.unitPrice;
      medicineInfo.total = total;
      medicineTotal += total;
      
      medicineDetails.push(medicineInfo);
    });
  }
  
  billObj.medicineDetails = medicineDetails;
  billObj.medicineTotal = medicineTotal;
  billObj.serviceCharge = billObj.amount - medicineTotal;
  
  // Add breakdown
  billObj.breakdown = {
    medicines: medicineTotal,
    consultation: billObj.appointmentId ? 50 : 0, // Example consultation fee
    serviceCharge: billObj.serviceCharge,
    tax: billObj.amount * 0.18, // 18% GST example
    grandTotal: billObj.amount
  };

  res.status(200).json({
    success: true,
    data: billObj
  });
});

// @desc    Download bill as PDF
// @route   GET /api/v1/patients/bills/:id/download
// @access  Private/Patient
exports.downloadBillPDF = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const bill = await Billing.findOne({
    _id: req.params.id,
    patientId: patient._id
  })
    .populate({
      path: 'prescriptionId',
      populate: {
        path: 'medicines.medicineId',
        model: 'Medicine',
        select: 'name category price unit'
      }
    })
    .populate({
      path: 'appointmentId',
      populate: {
        path: 'doctorId',
        select: 'specialization department',
        populate: {
          path: 'userId',
          select: 'name'
        }
      }
    })
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    });

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Calculate medicine details
  let medicineTotal = 0;
  const medicineDetails = [];
  
  if (bill.prescriptionId && bill.prescriptionId.medicines) {
    bill.prescriptionId.medicines.forEach(medicine => {
      const unitPrice = medicine.medicineId?.price || 0;
      const quantity = medicine.quantity || 1;
      const total = unitPrice * quantity;
      
      medicineDetails.push({
        name: medicine.name,
        quantity,
        unitPrice,
        total,
        unit: medicine.medicineId?.unit || 'unit',
        dosage: medicine.dosage
      });
      
      medicineTotal += total;
    });
  }

  const serviceCharge = bill.amount - medicineTotal;
  const tax = bill.amount * 0.18;
  const grandTotal = bill.amount + tax;

  // Create PDF with custom styling
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4'
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Bill_${bill._id}_${patient.userId.name}.pdf"`);

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
    // Color scheme
    const colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      text: '#1e293b',
      lightGray: '#f1f5f9',
      border: '#e2e8f0'
    };

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x, y, width, height, radius, fillColor) => {
      doc.fillColor(fillColor)
         .roundedRect(x, y, width, height, radius)
         .fill();
    };

    // Helper function to format currency
    const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

    // Helper function to format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    // Helper function to format time
    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // ============ HEADER SECTION ============
    // Background accent
    drawRoundedRect(0, 0, 612, 130, 0, colors.primary);
    
    // Hospital/Clinic Name
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('HealthCare Plus', 50, 40);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text('Advanced Medical Services | Trusted Care', 50, 72)
       .text('123 Medical Street, Healthcare City | Phone: (555) 123-4567', 50, 88);

    // Invoice badge
    drawRoundedRect(420, 45, 140, 40, 8, '#ffffff');
    doc.fillColor(colors.primary)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('INVOICE', 445, 56, { width: 100, align: 'center' });

    // ============ BILL INFO SECTION ============
    let yPos = 160;
    
    // Bill details box (left side)
    drawRoundedRect(50, yPos, 250, 110, 8, colors.lightGray);
    
    doc.fillColor(colors.primary)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('INVOICE DETAILS', 65, yPos + 12);

    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Invoice ID:', 65, yPos + 32)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(bill._id.toString().substring(0, 16).toUpperCase(), 140, yPos + 32);

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Date:', 65, yPos + 50)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(formatDate(bill.createdAt), 140, yPos + 50);

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Time:', 65, yPos + 68)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(formatTime(bill.createdAt), 140, yPos + 68);

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Status:', 65, yPos + 86);
    
    // Status badge
    const statusColor = bill.paymentStatus === 'paid' ? colors.success : colors.warning;
    drawRoundedRect(135, yPos + 83, 70, 20, 5, statusColor);
    doc.fillColor('#ffffff')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(bill.paymentStatus.toUpperCase(), 145, yPos + 88);

    // Patient details box (right side)
    drawRoundedRect(320, yPos, 242, 110, 8, colors.lightGray);
    
    doc.fillColor(colors.primary)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('PATIENT DETAILS', 335, yPos + 12);

    const patientName = bill.patientId?.userId?.name || 'Unknown Patient';
    const patientPhone = bill.patientId?.userId?.phone || 'N/A';
    const patientEmail = bill.patientId?.userId?.email || 'N/A';
    const patientAge = bill.patientId?.age || 'N/A';
    const patientGender = bill.patientId?.gender || 'N/A';

    doc.fillColor(colors.text)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Name:', 335, yPos + 32)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(patientName, 385, yPos + 32, { width: 165 });

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Contact:', 335, yPos + 50)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(patientPhone, 385, yPos + 50);

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Email:', 335, yPos + 68)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(patientEmail, 385, yPos + 68, { width: 165 });

    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text('Age/Gender:', 335, yPos + 86)
       .font('Helvetica')
       .fillColor(colors.secondary)
       .text(`${patientAge} / ${patientGender}`, 385, yPos + 86);

    // ============ DOCTOR INFO ============
    yPos = 290;
    if (bill.appointmentId && bill.appointmentId.doctorId) {
      drawRoundedRect(50, yPos, 512, 60, 8, '#ecfdf5');
      
      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('👨‍⚕️ Consulting Doctor:', 65, yPos + 12)
         .font('Helvetica')
         .fillColor(colors.secondary)
         .fontSize(11)
         .text(`Dr. ${bill.appointmentId.doctorId?.userId?.name || 'N/A'}`, 200, yPos + 12);

      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Specialization:', 65, yPos + 32)
         .font('Helvetica')
         .fillColor(colors.secondary)
         .text(bill.appointmentId.doctorId?.specialization || 'N/A', 200, yPos + 32);

      yPos += 80;
    } else {
      yPos += 20;
    }

    // ============ BILLING TABLE ============
    doc.fillColor(colors.primary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('BILLING DETAILS', 50, yPos);

    yPos += 30;

    // Table header
    drawRoundedRect(50, yPos, 512, 32, 6, colors.primary);
    
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('ITEM DESCRIPTION', 65, yPos + 11, { width: 220 })
       .text('QTY', 295, yPos + 11, { width: 50, align: 'center' })
       .text('UNIT PRICE', 355, yPos + 11, { width: 80, align: 'right' })
       .text('AMOUNT', 460, yPos + 11, { width: 90, align: 'right' });

    yPos += 38;

    // Service charge row
    if (serviceCharge > 0) {
      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Consultation & Service Charges', 65, yPos, { width: 220 })
         .font('Helvetica')
         .text('1', 295, yPos, { width: 50, align: 'center' })
         .text(formatCurrency(serviceCharge), 355, yPos, { width: 80, align: 'right' })
         .font('Helvetica-Bold')
         .text(formatCurrency(serviceCharge), 460, yPos, { width: 90, align: 'right' });

      yPos += 28;
      
      // Separator line
      doc.strokeColor(colors.border)
         .lineWidth(0.5)
         .moveTo(50, yPos)
         .lineTo(562, yPos)
         .stroke();
      
      yPos += 18;
    }

    // Medicine rows
    medicineDetails.forEach((item, index) => {
      // Check for page break
      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.fillColor(colors.lightGray)
           .rect(50, yPos - 6, 512, 28)
           .fill();
      }

      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(item.name, 65, yPos, { width: 200 });

      if (item.dosage) {
        doc.fillColor(colors.secondary)
           .fontSize(8)
           .font('Helvetica')
           .text(`Dosage: ${item.dosage}`, 65, yPos + 12, { width: 200 });
      }

      doc.fillColor(colors.text)
         .fontSize(10)
         .font('Helvetica')
         .text(`${item.quantity} ${item.unit}`, 295, yPos, { width: 50, align: 'center' })
         .text(formatCurrency(item.unitPrice), 355, yPos, { width: 80, align: 'right' })
         .font('Helvetica-Bold')
         .text(formatCurrency(item.total), 460, yPos, { width: 90, align: 'right' });

      yPos += 32;
    });

    // ============ TOTALS SECTION ============
    yPos += 15;
    
    // Separator line
    doc.strokeColor(colors.primary)
       .lineWidth(2)
       .moveTo(350, yPos)
       .lineTo(562, yPos)
       .stroke();

    yPos += 20;

    // Subtotal
    doc.fillColor(colors.text)
       .fontSize(11)
       .font('Helvetica')
       .text('Subtotal:', 370, yPos)
       .font('Helvetica-Bold')
       .text(formatCurrency(bill.amount), 460, yPos, { width: 90, align: 'right' });

    yPos += 22;

    // Tax
    doc.font('Helvetica')
       .text('GST (18%):', 370, yPos)
       .font('Helvetica-Bold')
       .text(formatCurrency(tax), 460, yPos, { width: 90, align: 'right' });

    yPos += 30;

    // Grand total box
    drawRoundedRect(350, yPos - 8, 212, 40, 8, colors.primary);
    
    doc.fillColor('#ffffff')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('GRAND TOTAL:', 365, yPos + 5)
       .fontSize(16)
       .text(formatCurrency(grandTotal), 460, yPos + 5, { width: 90, align: 'right' });

    // ============ PAYMENT INFO ============
    if (bill.paymentDate || bill.paymentMethod || bill.transactionId) {
      yPos += 60;

      drawRoundedRect(50, yPos, 512, 80, 8, '#f0fdf4');

      doc.fillColor(colors.text)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('💳 PAYMENT INFORMATION', 65, yPos + 12);

      let paymentY = yPos + 32;

      if (bill.paymentDate) {
        doc.fillColor(colors.text)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Payment Date:', 65, paymentY)
           .font('Helvetica')
           .fillColor(colors.secondary)
           .text(formatDate(bill.paymentDate), 180, paymentY);
        paymentY += 18;
      }

      if (bill.paymentMethod) {
        doc.fillColor(colors.text)
           .font('Helvetica-Bold')
           .text('Payment Method:', 65, paymentY)
           .font('Helvetica')
           .fillColor(colors.secondary)
           .text(bill.paymentMethod, 180, paymentY);
        paymentY += 18;
      }

      if (bill.transactionId) {
        doc.fillColor(colors.text)
           .font('Helvetica-Bold')
           .text('Transaction ID:', 65, paymentY)
           .font('Helvetica')
           .fillColor(colors.secondary)
           .text(bill.transactionId, 180, paymentY);
      }
    }

    // ============ FOOTER ============
    yPos = 750;
    
    doc.strokeColor(colors.border)
       .lineWidth(1)
       .moveTo(50, yPos)
       .lineTo(562, yPos)
       .stroke();

    doc.fillColor(colors.secondary)
       .fontSize(9)
       .font('Helvetica')
       .text('Thank you for choosing HealthCare Plus!', 
             50, yPos + 12, { width: 512, align: 'center' });

    doc.fontSize(8)
       .text('For billing inquiries, contact: billing@healthcareplus.com | Phone: (555) 123-4567', 
             50, yPos + 26, { width: 512, align: 'center' });

    doc.fontSize(7)
       .fillColor(colors.secondary)
       .text('This is a computer-generated invoice and does not require a signature.', 
             50, yPos + 38, { width: 512, align: 'center' });

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
    if (!doc._readableState.ended) {
      doc.end();
    }
  }
});
// @desc    Make payment for a bill with detailed receipt
// @route   POST /api/v1/patients/bills/:id/pay
// @access  Private/Patient
exports.payBill = asyncHandler(async (req, res) => {
  const { paymentMethod, transactionId } = req.body;

  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const bill = await Billing.findOne({
    _id: req.params.id,
    patientId: patient._id,
    paymentStatus: 'Pending'
  })
    .populate({
      path: 'prescriptionId',
      populate: {
        path: 'medicines.medicineId',
        model: 'Medicine',
        select: 'name price unit'
      }
    });

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found or already paid');
  }

  // Calculate medicine details for receipt
  let medicineTotal = 0;
  const medicineDetails = [];
  
  if (bill.prescriptionId && bill.prescriptionId.medicines) {
    bill.prescriptionId.medicines.forEach(medicine => {
      const unitPrice = medicine.medicineId?.price || 0;
      const quantity = medicine.quantity || 1;
      const total = unitPrice * quantity;
      
      medicineDetails.push({
        name: medicine.name,
        quantity,
        unitPrice,
        total,
        unit: medicine.medicineId?.unit || 'unit'
      });
      
      medicineTotal += total;
    });
  }

  const serviceCharge = bill.amount - medicineTotal;
  const tax = bill.amount * 0.18; // 18% GST example
  const grandTotal = bill.amount + tax;

  // Update bill payment status
  bill.paymentStatus = 'Paid';
  bill.paymentDate = new Date();
  bill.paymentMethod = paymentMethod || 'Online';
  bill.transactionId = transactionId;
  
  await bill.save();

  // Create receipt data
  const receipt = {
    billId: bill._id,
    paymentDate: bill.paymentDate,
    paymentMethod: bill.paymentMethod,
    transactionId: bill.transactionId,
    breakdown: {
      medicines: medicineTotal,
      serviceCharge: serviceCharge,
      subtotal: bill.amount,
      tax: tax,
      grandTotal: grandTotal
    },
    medicineDetails: medicineDetails
  };

  res.status(200).json({
    success: true,
    message: 'Payment successful',
    data: {
      bill: bill,
      receipt: receipt
    }
  });
});
//@desc    Make payment for a bill
// @route   POST /api/v1/patients/bills/:id/pay
// @access  Private/Patient
exports.payBill = asyncHandler(async (req, res) => {
  const { paymentMethod, transactionId } = req.body;

  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const bill = await Billing.findOne({
    _id: req.params.id,
    patientId: patient._id,
    paymentStatus: 'Pending'
  });

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found or already paid');
  }

  bill.paymentStatus = 'Paid';
  bill.paymentDate = new Date();
  bill.paymentMethod = paymentMethod || 'Online';
  bill.transactionId = transactionId;
  
  await bill.save();

  res.status(200).json({
    success: true,
    message: 'Payment successful',
    data: bill
  });
});

/* =========================================================
   8. DASHBOARD & OVERVIEW
========================================================= */

// @desc    Get patient dashboard overview
// @route   GET /api/v1/patients/dashboard
// @access  Private/Patient
exports.getDashboard = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const patientId = patient._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    upcomingAppointments,
    pendingPrescriptions,
    recentLabTests,
    recentVitals,
    pendingBills,
    recentNursingCare,
    admissionInfo,
    careNotes
  ] = await Promise.all([
    // Upcoming appointments (next 7 days)
    Appointment.find({
      patientId,
      status: 'Scheduled',
      date: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }
    })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ date: 1, time: 1 })
      .limit(3),

    // Prescriptions with pending medicines
    Prescription.find({
      patientId,
      'medicines.administrationStatus': 'Pending'
    })
      .populate({
        path: 'doctorId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(3),

    // Recent lab tests
    LabTest.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(3),

    // Recent vitals (last 3 readings)
    Vitals.find({ patientId })
      .sort({ recordedAt: -1 })
      .limit(3),

    // Pending bills
    Billing.find({
      patientId,
      paymentStatus: 'Pending'
    })
      .sort({ createdAt: -1 })
      .limit(3),

    // Recent nursing care
    NursingCare.find({ patientId })
      .populate({
        path: 'nurseId',
        select: 'specialization',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(3),

    // Admission info if admitted
    patient.isAdmitted ? Promise.resolve({
      wardId: patient.wardId,
      bedNumber: patient.bedNumber,
      admissionDate: patient.admissionDate,
      admissionStatus: patient.admissionStatus
    }) : Promise.resolve(null),

    // Recent care notes
    patient.careNotes ? patient.careNotes.slice(-5) : Promise.resolve([])
  ]);

  // Get statistics
  const stats = await Promise.all([
    Appointment.countDocuments({ patientId, status: 'Scheduled' }),
    Prescription.aggregate([
      { $match: { patientId } },
      { $unwind: '$medicines' },
      { $match: { 'medicines.administrationStatus': 'Pending' } },
      { $count: 'pendingMedicines' }
    ]),
    LabTest.countDocuments({ patientId, status: { $in: ['Requested', 'Processing'] } }),
    Billing.aggregate([
      { $match: { patientId, paymentStatus: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      patientInfo: {
        name: req.user.name,
        admissionStatus: patient.admissionStatus,
        isAdmitted: patient.isAdmitted,
        wardInfo: admissionInfo
      },
      statistics: {
        upcomingAppointments: stats[0],
        pendingMedicines: stats[1][0]?.pendingMedicines || 0,
        pendingLabTests: stats[2],
        pendingBillsAmount: stats[3][0]?.total || 0
      },
      overview: {
        upcomingAppointments,
        pendingPrescriptions,
        recentLabTests,
        recentVitals,
        pendingBills,
        recentNursingCare,
        recentCareNotes: careNotes
      }
    }
  });
});

/* =========================================================
   9. NOTIFICATIONS & ALERTS
========================================================= */

// @desc    Get patient notifications
// @route   GET /api/v1/patients/notifications
// @access  Private/Patient
exports.getNotifications = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  const patientId = patient._id;
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const notifications = [];

  // 1. Appointment reminders (next 24 hours)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingAppointments = await Appointment.find({
    patientId,
    status: 'Scheduled',
    date: { $gte: now, $lte: tomorrow }
  })
    .populate({
      path: 'doctorId',
      select: 'specialization',
      populate: { path: 'userId', select: 'name' }
    })
    .limit(5);

  upcomingAppointments.forEach(appointment => {
    const hoursUntil = Math.round((appointment.date - now) / (1000 * 60 * 60));
    notifications.push({
      type: 'APPOINTMENT_REMINDER',
      title: 'Appointment Reminder',
      message: `You have an appointment with Dr. ${appointment.doctorId.userId.name} in ${hoursUntil} hours`,
      data: {
        appointmentId: appointment._id,
        doctorName: appointment.doctorId.userId.name,
        date: appointment.date,
        time: appointment.time
      },
      priority: 'high',
      timestamp: appointment.createdAt
    });
  });

  // 2. New lab results (last 24 hours)
  const newLabResults = await LabReport.aggregate([
    {
      $lookup: {
        from: 'labtests',
        localField: 'labTestId',
        foreignField: '_id',
        as: 'labTest'
      }
    },
    { $unwind: '$labTest' },
    {
      $match: {
        'labTest.patientId': patientId,
        reportDate: { $gte: yesterday }
      }
    }
  ]);

  newLabResults.forEach(report => {
    notifications.push({
      type: 'LAB_RESULT',
      title: 'New Lab Result',
      message: `Your lab test results are ready`,
      data: {
        labTestId: report.labTestId,
        reportId: report._id,
        testName: report.labTest.testName
      },
      priority: 'medium',
      timestamp: report.reportDate
    });
  });

  // 3. Medication reminders (due today)
  const dueMedications = await Prescription.aggregate([
    { $match: { patientId } },
    { $unwind: '$medicines' },
    {
      $match: {
        'medicines.administrationStatus': 'Pending',
        'medicines.nextDue': { $gte: now, $lte: tomorrow }
      }
    },
    { $limit: 5 }
  ]);

  dueMedications.forEach(prescription => {
    notifications.push({
      type: 'MEDICATION_REMINDER',
      title: 'Medication Due',
      message: `Time to take ${prescription.medicines.name}`,
      data: {
        prescriptionId: prescription._id,
        medicineName: prescription.medicines.name,
        dosage: prescription.medicines.dosage,
        dueTime: prescription.medicines.nextDue
      },
      priority: 'medium',
      timestamp: new Date()
    });
  });

  // 4. Bill payment reminders (overdue)
  const overdueBills = await Billing.find({
    patientId,
    paymentStatus: 'Pending',
    createdAt: { $lte: yesterday }
  }).limit(3);

  overdueBills.forEach(bill => {
    const daysOverdue = Math.round((now - bill.createdAt) / (1000 * 60 * 60 * 24));
    notifications.push({
      type: 'BILL_REMINDER',
      title: 'Payment Reminder',
      message: `Bill of $${bill.amount} is ${daysOverdue} days overdue`,
      data: {
        billId: bill._id,
        amount: bill.amount,
        overdueDays: daysOverdue
      },
      priority: 'high',
      timestamp: bill.createdAt
    });
  });

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
    data: notifications.slice(0, 20) // Limit to 20 notifications
  });
});

/* =========================================================
   10. DOCTORS & HEALTHCARE TEAM
========================================================= */

// @desc    Get doctors who treated the patient
// @route   GET /api/v1/patients/doctors
// @access  Private/Patient
exports.getMyDoctors = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  // Get distinct doctors from appointments
  const doctorIds = await Appointment.distinct('doctorId', { patientId: patient._id });

  if (doctorIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  const doctors = await Doctor.find({ _id: { $in: doctorIds } })
    .populate('userId', 'name email phone')
    .select('specialization department');

  res.status(200).json({
    success: true,
    count: doctors.length,
    data: doctors
  });
});

// @desc    Get nurses who cared for the patient
// @route   GET /api/v1/patients/nurses
// @access  Private/Patient
exports.getMyNurses = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await getPatientRecord(req.user._id);

  // Get distinct nurses from vitals and nursing care
  const [vitalNurses, careNurses] = await Promise.all([
    Vitals.distinct('nurseId', { patientId: patient._id }),
    NursingCare.distinct('nurseId', { patientId: patient._id })
  ]);

  const allNurseIds = [...new Set([...vitalNurses, ...careNurses])];

  if (allNurseIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  const nurses = await Nurse.find({ _id: { $in: allNurseIds } })
    .populate('userId', 'name')
    .select('specialization shift wardId');

  res.status(200).json({
    success: true,
    count: nurses.length,
    data: nurses
  });
});

/* =========================================================
   11. ADMISSION & WARD INFORMATION
========================================================= */

// @desc    Get ward information if admitted
// @route   GET /api/v1/patients/ward-info
// @access  Private/Patient
exports.getWardInfo = asyncHandler(async (req, res) => {
  // Get patient's record first
  const patient = await Patient.findOne({ userId: req.user._id })
    .populate('wardId');

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  if (!patient.isAdmitted || !patient.wardId) {
    return res.status(200).json({
      success: true,
      message: 'Patient is not currently admitted',
      data: null
    });
  }

  // Get nurses assigned to this ward
  const wardNurses = await Nurse.find({ wardId: patient.wardId._id })
    .populate('userId', 'name')
    .select('specialization shift');

  // Get other patients in same ward
  const wardPatients = await Patient.find({
    wardId: patient.wardId._id,
    isAdmitted: true,
    _id: { $ne: patient._id }
  })
    .populate('userId', 'name')
    .select('bedNumber admissionStatus')
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      wardDetails: patient.wardId,
      bedNumber: patient.bedNumber,
      admissionDate: patient.admissionDate,
      wardNurses,
      wardPatients,
      admissionNotes: patient.careNotes?.filter(note => 
        note.noteType === 'Observation' || note.noteType === 'Instruction'
      ).slice(-5) || []
    }
  });
});

/* =========================================================
   12. CHANGE PASSWORD
========================================================= */

// @desc    Change patient password
// @route   PUT /api/v1/patients/change-password
// @access  Private/Patient
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters long');
  }

  // Find user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/* =========================================================
   13. EMERGENCY CONTACT & HEALTH INFO
========================================================= */

// @desc    Get/set emergency contact info
// @route   GET /api/v1/patients/emergency-contact
// @route   PUT /api/v1/patients/emergency-contact
// @access  Private/Patient
exports.getEmergencyContact = asyncHandler(async (req, res) => {
  // In a real system, you would have an EmergencyContact schema
  // For now, we'll use patient's careNotes for demonstration
  const patient = await Patient.findOne({ userId: req.user._id });
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Extract emergency contact from careNotes
  const emergencyNotes = patient.careNotes?.filter(note => 
    note.noteType === 'Concern' && note.content.includes('Emergency Contact')
  ) || [];

  res.status(200).json({
    success: true,
    data: emergencyNotes
  });
});

exports.updateEmergencyContact = asyncHandler(async (req, res) => {
  const { contactName, relationship, phone, notes } = req.body;

  const patient = await Patient.findOne({ userId: req.user._id });
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Create or update emergency contact note
  const contactNote = {
    noteType: 'Concern',
    content: `Emergency Contact: ${contactName} (${relationship}) - ${phone}. ${notes || ''}`,
    priority: 'High',
    createdBy: {
      role: 'PATIENT',
      userId: req.user._id,
      name: req.user.name
    },
    followUpRequired: false,
    createdAt: new Date()
  };

  // Remove old emergency contact notes
  patient.careNotes = patient.careNotes?.filter(note => 
    !(note.noteType === 'Concern' && note.content.includes('Emergency Contact'))
  ) || [];

  // Add new emergency contact note
  patient.careNotes.push(contactNote);
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Emergency contact updated successfully',
    data: contactNote
  });
});