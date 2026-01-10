const mongoose = require('mongoose');
const { Appointment, Doctor, Patient, User, Billing, Prescription, Vitals, NursingCare } = require('../../models/schema');
const { asyncHandler } = require('../../middleware/errorMiddleware');

/* =====================
   APPOINTMENT CRUD OPERATIONS
===================== */

// Get all appointments with advanced filtering
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const {
    status,
    date,
    doctorId,
    patientId,
    department,
    specialization,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 10,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  /* ================= BASIC FILTERS ================= */
  if (status) query.status = status;
  if (doctorId) query.doctorId = doctorId;
  if (patientId) query.patientId = patientId;

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  /* ================= DATE RANGE FILTER ================= */
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  /* ================= SEARCH ================= */
  // We'll handle search after population for patient/doctor names

  /* ================= DEPARTMENT / SPECIALIZATION ================= */
  if (department || specialization) {
    const doctorQuery = {};
    if (department) doctorQuery.department = department;
    if (specialization) doctorQuery.specialization = specialization;

    const doctors = await Doctor.find(doctorQuery).select('_id').lean();
    const doctorIds = doctors.map(d => d._id);

    if (doctorIds.length > 0) {
      query.doctorId = { $in: doctorIds };
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: Number(page),
        summary: {
          total: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0
        },
        data: []
      });
    }
  }

  /* ================= SORT ================= */
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  /* ================= PAGINATION ================= */
  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.max(parseInt(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  /* ================= FETCH APPOINTMENTS WITH PROPER POPULATION ================= */
  const appointments = await Appointment.find(query)
    .populate({
      path: 'patientId',
      select: 'userId age gender bloodGroup wardId bedNumber admissionStatus',
      // Populate the User from Patient's userId
      populate: {
        path: 'userId',
        model: 'User',
        select: 'name email phone role'
      }
    })
    .populate({
      path: 'doctorId',
      select: 'userId specialization department',
      // Populate the User from Doctor's userId
      populate: {
        path: 'userId',
        model: 'User',
        select: 'name email phone role'
      }
    })
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  /* ================= APPLY SEARCH FILTER AFTER POPULATION ================= */
  let filteredAppointments = appointments;
  if (search) {
    filteredAppointments = appointments.filter(appointment => {
      const searchLower = search.toLowerCase();
      
      // Check appointment fields
      const matchesAppointmentFields = 
        (appointment.reason && appointment.reason.toLowerCase().includes(searchLower)) ||
        (appointment.notes && appointment.notes.toLowerCase().includes(searchLower)) ||
        (appointment.nursingNotes && appointment.nursingNotes.toLowerCase().includes(searchLower));
      
      // Check patient name
      const patientName = appointment.patientId?.userId?.name || '';
      const matchesPatientName = patientName.toLowerCase().includes(searchLower);
      
      // Check doctor name
      const doctorName = appointment.doctorId?.userId?.name || '';
      const matchesDoctorName = doctorName.toLowerCase().includes(searchLower);
      
      // Check patient phone
      const patientPhone = appointment.patientId?.userId?.phone || '';
      const matchesPatientPhone = patientPhone.includes(search);
      
      // Check doctor phone
      const doctorPhone = appointment.doctorId?.userId?.phone || '';
      const matchesDoctorPhone = doctorPhone.includes(search);
      
      return matchesAppointmentFields || matchesPatientName || matchesDoctorName || 
             matchesPatientPhone || matchesDoctorPhone;
    });
  }

  /* ================= ENHANCE APPOINTMENTS ================= */
  const enhancedAppointments = await Promise.all(
    filteredAppointments.map(async (appointment) => {
      // Check for prescription
      const prescriptionExists = await Prescription.exists({
        appointmentId: appointment._id
      });

      // Get billing info
      const billing = await Billing.findOne(
        { appointmentId: appointment._id },
        'paymentStatus amount'
      ).lean();

      // Calculate revenue
      let revenue = 0;
      if (billing) {
        revenue = billing.amount || 0;
      } else if (appointment.status === 'Completed') {
        revenue = 100; // Default fee for completed appointments
      }

      // Extract patient details safely
      let patientDetails = {};
      if (appointment.patientId) {
        patientDetails = {
          _id: appointment.patientId._id,
          userId: appointment.patientId.userId?._id,
          name: appointment.patientId.userId?.name || 'Unknown',
          email: appointment.patientId.userId?.email,
          phone: appointment.patientId.userId?.phone,
          age: appointment.patientId.age,
          gender: appointment.patientId.gender,
          bloodGroup: appointment.patientId.bloodGroup,
          wardId: appointment.patientId.wardId,
          bedNumber: appointment.patientId.bedNumber,
          admissionStatus: appointment.patientId.admissionStatus
        };
      }

      // Extract doctor details safely
      let doctorDetails = {};
      if (appointment.doctorId) {
        doctorDetails = {
          _id: appointment.doctorId._id,
          userId: appointment.doctorId.userId?._id,
          name: appointment.doctorId.userId?.name || 'Unknown',
          email: appointment.doctorId.userId?.email,
          phone: appointment.doctorId.userId?.phone,
          specialization: appointment.doctorId.specialization,
          department: appointment.doctorId.department
        };
      }

      return {
        _id: appointment._id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        nursingNotes: appointment.nursingNotes,
        preparationStatus: appointment.preparationStatus,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        
        // Patient details
        patient: patientDetails,
        
        // Doctor details
        doctor: doctorDetails,
        
        // Additional info
        hasPrescription: !!prescriptionExists,
        hasBilling: !!billing,
        billingStatus: billing?.paymentStatus || 'Not Billed',
        revenue: revenue,
        lastUpdatedBy: appointment.lastUpdatedBy
      };
    })
  );

  /* ================= MANUAL SORTING FOR POPULATED FIELDS ================= */
  if (sortBy === 'patient' || sortBy === 'doctor') {
    enhancedAppointments.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'patient') {
        aValue = a.patient?.name || '';
        bValue = b.patient?.name || '';
      } else if (sortBy === 'doctor') {
        aValue = a.doctor?.name || '';
        bValue = b.doctor?.name || '';
      }
      
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      
      if (sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      } else {
        return aValue.localeCompare(bValue);
      }
    });
  }

  /* ================= GET TOTAL COUNT ================= */
  // We need to apply search filter to total count too
  let total = appointments.length;
  if (search) {
    total = filteredAppointments.length;
  } else {
    total = await Appointment.countDocuments(query);
  }

  /* ================= SUMMARY CALCULATION ================= */
  // Get all appointment IDs for the query
  let allAppointmentIds;
  if (search) {
    allAppointmentIds = filteredAppointments.map(a => a._id);
  } else {
    const allAppointments = await Appointment.find(query).select('_id status').lean();
    allAppointmentIds = allAppointments.map(a => a._id);
  }

  // Get billing amounts for revenue calculation
  let totalRevenue = 0;
  if (allAppointmentIds.length > 0) {
    const billingAgg = await Billing.aggregate([
      {
        $match: {
          appointmentId: { $in: allAppointmentIds }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    totalRevenue = billingAgg[0]?.totalRevenue || 0;
  }

  // Calculate status counts
  const summary = {
    total: allAppointmentIds.length,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: totalRevenue
  };

  // Count statuses from filtered appointments
  filteredAppointments.forEach(appointment => {
    if (appointment.status === 'Scheduled') summary.scheduled++;
    if (appointment.status === 'Completed') summary.completed++;
    if (appointment.status === 'Cancelled') summary.cancelled++;
  });

  /* ================= RESPONSE ================= */
  res.status(200).json({
    success: true,
    count: enhancedAppointments.length,
    total: summary.total,
    totalPages: Math.ceil(summary.total / limitNum),
    currentPage: pageNum,
    summary,
    data: enhancedAppointments,
    filters: {
      status,
      date,
      doctorId,
      patientId,
      department,
      specialization,
      startDate,
      endDate,
      search,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    }
  });
});
// Get single appointment details
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }

  const appointment = await Appointment.findById(id)
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
        select: 'name email'
      }
    })
    .lean();

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Get related data
  const [prescription, billing, vitals, nursingCare] = await Promise.all([
    Prescription.findOne({ appointmentId: id })
      .populate('patientId', 'userId')
      .populate('doctorId', 'userId')
      .lean(),
    Billing.findOne({ appointmentId: id }).lean(),
    Vitals.findOne({ patientId: appointment.patientId?._id })
      .sort({ recordedAt: -1 })
      .lean(),
    NursingCare.findOne({ patientId: appointment.patientId?._id })
      .sort({ createdAt: -1 })
      .lean()
  ]);

  res.status(200).json({
    success: true,
    data: {
      appointment,
      relatedData: {
        prescription: prescription || null,
        billing: billing || null,
        latestVitals: vitals || null,
        latestNursingCare: nursingCare || null
      }
    }
  });
});

// Create new appointment
exports.createAppointment = asyncHandler(async (req, res) => {
  const { 
    patientId, 
    doctorId, 
    date, 
    time, 
    reason, 
    notes,
    nursingNotes,
    preparationStatus 
  } = req.body;

  // Validation
  if (!patientId || !doctorId || !date || !time) {
    res.status(400);
    throw new Error('Patient ID, Doctor ID, date, and time are required');
  }

  // Validate patient
  const patient = await Patient.findOne({ userId: patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate doctor
  const doctor = await Doctor.findOne({ userId: doctorId });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Check for conflicting appointments
  const appointmentDate = new Date(date);
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingDoctorAppointment = await Appointment.findOne({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    time,
    status: 'Scheduled'
  });

  if (existingDoctorAppointment) {
    res.status(409);
    throw new Error('Doctor already has a scheduled appointment at this time');
  }

  // Check patient availability
  const existingPatientAppointment = await Appointment.findOne({
    patientId,
    date: { $gte: startOfDay, $lte: endOfDay },
    time,
    status: 'Scheduled'
  });

  if (existingPatientAppointment) {
    res.status(409);
    throw new Error('Patient already has a scheduled appointment at this time');
  }

  const appointmentData = {
    patientId,
    doctorId,
    date: appointmentDate,
    time,
    reason,
    notes,
    nursingNotes,
    preparationStatus: preparationStatus || 'Not Started',
    lastUpdatedBy: {
      role: req.user.role || 'ADMIN',
      userId: req.user._id,
      name: req.user.name,
      updatedAt: new Date()
    }
  };

  const appointment = await Appointment.create(appointmentData);

  const populatedAppointment = await Appointment.findById(appointment._id)
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
        select: 'name email'
      }
    })
    .lean();

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: populatedAppointment
  });
});

// Update appointment
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }

  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check for time conflicts if time or date is being updated
  if (updateData.time || updateData.date) {
    const date = updateData.date ? new Date(updateData.date) : appointment.date;
    const time = updateData.time || appointment.time;
    const doctorId = updateData.doctorId || appointment.doctorId;
    const patientId = updateData.patientId || appointment.patientId;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check doctor availability
    const conflictingDoctorAppointment = await Appointment.findOne({
      _id: { $ne: id },
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: 'Scheduled'
    });

    if (conflictingDoctorAppointment) {
      res.status(409);
      throw new Error('Doctor already has a scheduled appointment at this time');
    }

    // Check patient availability
    const conflictingPatientAppointment = await Appointment.findOne({
      _id: { $ne: id },
      patientId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: 'Scheduled'
    });

    if (conflictingPatientAppointment) {
      res.status(409);
      throw new Error('Patient already has a scheduled appointment at this time');
    }
  }

  // Update lastUpdatedBy
  updateData.lastUpdatedBy = {
    role: req.user.role || 'ADMIN',
    userId: req.user._id,
    name: req.user.name,
    updatedAt: new Date()
  };

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
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
        select: 'name email'
      }
    })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: updatedAppointment
  });
});

// Delete appointment
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }

  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if appointment can be deleted
  if (appointment.status === 'Completed') {
    // Check if there's associated billing
    const billing = await Billing.findOne({ appointmentId: id });
    if (billing) {
      res.status(400);
      throw new Error('Cannot delete completed appointment with associated billing');
    }
  }

  // Check if there's associated prescription
  const prescription = await Prescription.findOne({ appointmentId: id });
  if (prescription) {
    res.status(400);
    throw new Error('Cannot delete appointment with associated prescription');
  }

  await Appointment.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

// Cancel appointment (FIXED - No transactions)
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }

  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.status === 'Cancelled') {
    res.status(400);
    throw new Error('Appointment is already cancelled');
  }

  if (appointment.status === 'Completed') {
    res.status(400);
    throw new Error('Cannot cancel completed appointment');
  }

  const updateData = {
    status: 'Cancelled',
    cancellationReason: cancellationReason || 'Cancelled by admin',
    notes: notes ? `${appointment.notes || ''}\nCancelled: ${notes}` : appointment.notes,
    lastUpdatedBy: {
      role: req.user.role || 'ADMIN',
      userId: req.user._id,
      name: req.user.name,
      updatedAt: new Date()
    }
  };

  const cancelledAppointment = await Appointment.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
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
        select: 'name email'
      }
    })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: cancelledAppointment
  });
});

// Complete appointment (FIXED - Without transaction)
exports.completeAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, outcome, amount = 100 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid appointment ID');
  }

  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.status === 'Completed') {
    res.status(400);
    throw new Error('Appointment is already completed');
  }

  if (appointment.status === 'Cancelled') {
    res.status(400);
    throw new Error('Cannot complete cancelled appointment');
  }

  // Update appointment without transaction
  const updateData = {
    status: 'Completed',
    completionNotes: notes,
    outcome,
    actualEndTime: new Date(),
    lastUpdatedBy: {
      role: req.user.role || 'ADMIN',
      userId: req.user._id,
      name: req.user.name,
      updatedAt: new Date()
    }
  };

  const completedAppointment = await Appointment.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  // Create billing record for completed appointment (without transaction)
  const billingData = {
    patientId: appointment.patientId,
    appointmentId: appointment._id,
    amount: amount,
    description: `Appointment fee - ${appointment.reason || 'Consultation'}`,
    paymentStatus: 'Pending'
  };

  await Billing.create(billingData);

  const populatedAppointment = await Appointment.findById(id)
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
        select: 'name email'
      }
    })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Appointment completed and billing record created',
    data: populatedAppointment
  });
});

/* =====================
   APPOINTMENT ANALYTICS & REPORTS (No changes needed)
===================== */

// Get appointment statistics (no changes needed)
exports.getAppointmentStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  let groupStage = {};
  
  switch (groupBy) {
    case 'day':
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        }
      };
      break;
    case 'month':
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          month: { $month: '$date' }
        }
      };
      break;
    case 'week':
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          week: { $week: '$date' }
        }
      };
      break;
    case 'doctor':
      groupStage = {
        _id: '$doctorId'
      };
      break;
    default:
      groupStage = { _id: null };
  }

  const statistics = await Appointment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctorId',
        foreignField: 'userId',
        as: 'doctor'
      }
    },
    { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor.userId',
        foreignField: '_id',
        as: 'doctorUser'
      }
    },
    { $unwind: { path: '$doctorUser', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        ...groupStage,
        totalAppointments: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Completed'] },
              100,
              0
            ]
          }
        },
        uniqueDoctors: { $addToSet: '$doctorId' },
        uniquePatients: { $addToSet: '$patientId' }
      }
    },
    {
      $project: {
        group: '$_id',
        totalAppointments: 1,
        scheduled: 1,
        completed: 1,
        cancelled: 1,
        revenue: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completed', '$totalAppointments'] },
            100
          ]
        },
        cancellationRate: {
          $multiply: [
            { $divide: ['$cancelled', '$totalAppointments'] },
            100
          ]
        },
        doctorCount: { $size: '$uniqueDoctors' },
        patientCount: { $size: '$uniquePatients' }
      }
    },
    { $sort: { 'group': 1 } }
  ]);

  // Calculate overall summary
  const overallSummary = statistics.reduce((acc, stat) => ({
    totalAppointments: acc.totalAppointments + stat.totalAppointments,
    totalScheduled: acc.totalScheduled + stat.scheduled,
    totalCompleted: acc.totalCompleted + stat.completed,
    totalCancelled: acc.totalCancelled + stat.cancelled,
    totalRevenue: acc.totalRevenue + stat.revenue
  }), {
    totalAppointments: 0,
    totalScheduled: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    totalRevenue: 0
  });

  overallSummary.overallCompletionRate = overallSummary.totalAppointments > 0 ?
    (overallSummary.totalCompleted / overallSummary.totalAppointments) * 100 : 0;
  overallSummary.overallCancellationRate = overallSummary.totalAppointments > 0 ?
    (overallSummary.totalCancelled / overallSummary.totalAppointments) * 100 : 0;

  res.status(200).json({
    success: true,
    groupBy,
    period: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    overallSummary,
    statistics
  });
});

// Get doctor appointment performance (no changes needed)
exports.getDoctorAppointmentPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate, minAppointments = 5 } = req.query;

  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const performance = await Appointment.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctorId',
        foreignField: 'userId',
        as: 'doctor'
      }
    },
    { $unwind: '$doctor' },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor.userId',
        foreignField: '_id',
        as: 'doctorUser'
      }
    },
    { $unwind: '$doctorUser' },
    {
      $group: {
        _id: '$doctorId',
        doctorName: { $first: '$doctorUser.name' },
        department: { $first: '$doctor.department' },
        specialization: { $first: '$doctor.specialization' },
        totalAppointments: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        averageWaitTime: { $avg: '$waitTime' },
        onTimeRate: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'Completed'] },
                { $lte: ['$waitTime', 15] }
              ]},
              100,
              0
            ]
          }
        }
      }
    },
    {
      $match: {
        totalAppointments: { $gte: parseInt(minAppointments) }
      }
    },
    {
      $project: {
        doctorId: '$_id',
        doctorName: 1,
        department: 1,
        specialization: 1,
        totalAppointments: 1,
        scheduled: 1,
        completed: 1,
        cancelled: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completed', '$totalAppointments'] },
            100
          ]
        },
        cancellationRate: {
          $multiply: [
            { $divide: ['$cancelled', '$totalAppointments'] },
            100
          ]
        },
        utilizationRate: {
          $multiply: [
            { $divide: ['$completed', { $add: ['$scheduled', '$completed'] }] },
            100
          ]
        },
        averageWaitTime: { $round: ['$averageWaitTime', 2] },
        onTimeRate: { $round: ['$onTimeRate', 2] }
      }
    },
    {
      $addFields: {
        performanceRating: {
          $switch: {
            branches: [
              { case: { $gte: ['$completionRate', 90] }, then: 'Excellent' },
              { case: { $gte: ['$completionRate', 80] }, then: 'Very Good' },
              { case: { $gte: ['$completionRate', 70] }, then: 'Good' },
              { case: { $gte: ['$completionRate', 60] }, then: 'Satisfactory' }
            ],
            default: 'Needs Improvement'
          }
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  res.status(200).json({
    success: true,
    count: performance.length,
    period: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    minimumAppointments: minAppointments,
    data: performance
  });
});

// Get appointment trends (no changes needed)
exports.getAppointmentTrends = asyncHandler(async (req, res) => {
  const { period = 'month', months = 6 } = req.query;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  let groupStage = {};

  switch (period) {
    case 'day':
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        }
      };
      break;
    case 'week':
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          week: { $week: '$date' }
        }
      };
      break;
    case 'month':
    default:
      groupStage = {
        _id: { 
          year: { $year: '$date' },
          month: { $month: '$date' }
        }
      };
      break;
  }

  const trends = await Appointment.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        ...groupStage,
        total: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Completed'] },
              100,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        period: '$_id',
        total: 1,
        scheduled: 1,
        completed: 1,
        cancelled: 1,
        revenue: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completed', '$total'] },
            100
          ]
        },
        cancellationRate: {
          $multiply: [
            { $divide: ['$cancelled', '$total'] },
            100
          ]
        }
      }
    },
    { $sort: { 'period': 1 } }
  ]);

  // Calculate growth metrics
  const growthMetrics = trends.map((period, index) => {
    if (index === 0) return { ...period, growth: 0 };
    
    const prevPeriod = trends[index - 1];
    const growth = prevPeriod.total > 0 ?
      ((period.total - prevPeriod.total) / prevPeriod.total) * 100 : 0;
    
    return {
      ...period,
      growth: Math.round(growth * 100) / 100
    };
  });

  res.status(200).json({
    success: true,
    period,
    months: parseInt(months),
    startDate,
    endDate,
    totalPeriods: trends.length,
    data: growthMetrics,
    summary: {
      totalAppointments: trends.reduce((sum, period) => sum + period.total, 0),
      averagePerPeriod: Math.round(trends.reduce((sum, period) => sum + period.total, 0) / trends.length),
      totalRevenue: trends.reduce((sum, period) => sum + period.revenue, 0),
      averageCompletionRate: Math.round(trends.reduce((sum, period) => sum + period.completionRate, 0) / trends.length)
    }
  });
});

// Get appointment dashboard metrics (no changes needed)
exports.getAppointmentDashboardMetrics = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayMetrics,
    weekMetrics,
    monthMetrics,
    upcomingAppointments,
    doctorPerformance,
    departmentMetrics,
    timeSlotMetrics
  ] = await Promise.all([
    // Today's metrics
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
        }
      }
    ]),

    // This week's metrics
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
        }
      }
    ]),

    // This month's metrics
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
        }
      }
    ]),

    // Upcoming appointments (next 7 days)
    Appointment.find({
      date: { $gte: startOfToday, $lte: new Date(today.setDate(today.getDate() + 7)) },
      status: 'Scheduled'
    })
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
          select: 'name'
        }
      })
      .sort({ date: 1, time: 1 })
      .limit(10)
      .lean(),

    // Top performing doctors
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: '$doctorId',
          completed: { $sum: 1 }
        }
      },
      { $sort: { completed: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: 'userId',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'doctorUser'
        }
      },
      { $unwind: '$doctorUser' },
      {
        $project: {
          doctorId: '$_id',
          doctorName: '$doctorUser.name',
          department: '$doctor.department',
          completed: 1
        }
      }
    ]),

    // Department metrics
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: 'userId',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $group: {
          _id: '$doctor.department',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
        }
      },
      {
        $project: {
          department: '$_id',
          total: 1,
          completed: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]),

    // Time slot utilization
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
          status: { $in: ['Scheduled', 'Completed'] }
        }
      },
      {
        $group: {
          _id: '$time',
          total: { $sum: 1 },
          utilization: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Completed'] },
                100,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          timeSlot: '$_id',
          total: 1,
          utilization: { $round: ['$utilization', 2] },
          busyLevel: {
            $switch: {
              branches: [
                { case: { $gte: ['$total', 20] }, then: 'Very High' },
                { case: { $gte: ['$total', 15] }, then: 'High' },
                { case: { $gte: ['$total', 10] }, then: 'Medium' },
                { case: { $gte: ['$total', 5] }, then: 'Low' }
              ],
              default: 'Very Low'
            }
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 8 }
    ])
  ]);

  res.status(200).json({
    success: true,
    generatedAt: new Date(),
    metrics: {
      today: todayMetrics[0] || { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
      thisWeek: weekMetrics[0] || { total: 0, scheduled: 0, completed: 0, cancelled: 0 },
      thisMonth: monthMetrics[0] || { total: 0, scheduled: 0, completed: 0, cancelled: 0 }
    },
    upcomingAppointments: {
      count: upcomingAppointments.length,
      appointments: upcomingAppointments
    },
    performance: {
      topDoctors: doctorPerformance,
      departments: departmentMetrics,
      timeSlots: timeSlotMetrics
    }
  });
});

// Bulk operations for appointments (FIXED - Without transaction)
exports.bulkUpdateAppointments = asyncHandler(async (req, res) => {
  const { appointmentIds, action, data } = req.body;

  if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
    res.status(400);
    throw new Error('Appointment IDs array is required');
  }

  if (!action || !['cancel', 'reschedule', 'complete', 'updateStatus'].includes(action)) {
    res.status(400);
    throw new Error('Valid action is required');
  }

  // Validate appointment IDs
  const invalidIds = appointmentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    res.status(400);
    throw new Error(`Invalid appointment IDs: ${invalidIds.join(', ')}`);
  }

  let updateData = {};
  let message = '';

  switch (action) {
    case 'cancel':
      updateData = {
        status: 'Cancelled',
        cancellationReason: data.reason || 'Bulk cancelled by admin',
        lastUpdatedBy: {
          role: req.user.role || 'ADMIN',
          userId: req.user._id,
          name: req.user.name,
          updatedAt: new Date()
        }
      };
      message = 'cancelled';
      break;

    case 'complete':
      updateData = {
        status: 'Completed',
        completionNotes: data.notes || 'Completed in bulk',
        actualEndTime: new Date(),
        lastUpdatedBy: {
          role: req.user.role || 'ADMIN',
          userId: req.user._id,
          name: req.user.name,
          updatedAt: new Date()
        }
      };
      message = 'completed';
      
      // Get appointments to create billing records
      const appointments = await Appointment.find({
        _id: { $in: appointmentIds },
        status: 'Scheduled'
      });
      
      // Create billing records for completed appointments
      const billingPromises = appointments.map(appt => 
        Billing.create({
          patientId: appt.patientId,
          appointmentId: appt._id,
          amount: data.amount || 100,
          description: `Appointment fee - ${appt.reason || 'Consultation'}`,
          paymentStatus: 'Pending'
        })
      );
      
      await Promise.all(billingPromises);
      break;

    case 'reschedule':
      if (!data.newDate || !data.newTime) {
        throw new Error('New date and time are required for rescheduling');
      }
      updateData = {
        date: data.newDate,
        time: data.newTime,
        notes: data.notes ? `${data.notes} (Rescheduled)` : 'Rescheduled by admin',
        lastUpdatedBy: {
          role: req.user.role || 'ADMIN',
          userId: req.user._id,
          name: req.user.name,
          updatedAt: new Date()
        }
      };
      message = 'rescheduled';
      break;

    case 'updateStatus':
      if (!data.status || !['Scheduled', 'Completed', 'Cancelled'].includes(data.status)) {
        throw new Error('Valid status is required');
      }
      updateData = {
        status: data.status,
        lastUpdatedBy: {
          role: req.user.role || 'ADMIN',
          userId: req.user._id,
          name: req.user.name,
          updatedAt: new Date()
        }
      };
      message = 'updated';
      break;
  }

  const result = await Appointment.updateMany(
    { _id: { $in: appointmentIds } },
    { $set: updateData }
  );

  // Get updated appointments
  const updatedAppointments = await Appointment.find({
    _id: { $in: appointmentIds }
  })
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
        select: 'name'
      }
    })
    .lean();

  res.status(200).json({
    success: true,
    message: `Successfully ${message} ${result.modifiedCount} appointments`,
    action,
    updatedCount: result.modifiedCount,
    data: updatedAppointments
  });
});

// Export appointments data (no changes needed)
exports.exportAppointments = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    format = 'json'
  } = req.query;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(matchStage)
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
        select: 'name email'
      }
    })
    .sort({ date: 1, time: 1 })
    .lean();

  if (appointments.length === 0) {
    res.status(404);
    throw new Error('No appointments found for the specified period');
  }

  // Transform data for export
  const exportData = appointments.map(appt => ({
    id: appt._id,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
    status: appt.status,
    patient: {
      id: appt.patientId?.userId?._id,
      name: appt.patientId?.userId?.name,
      email: appt.patientId?.userId?.email,
      phone: appt.patientId?.userId?.phone
    },
    doctor: {
      id: appt.doctorId?.userId?._id,
      name: appt.doctorId?.userId?.name,
      email: appt.doctorId?.userId?.email
    },
    reason: appt.reason,
    notes: appt.notes,
    nursingNotes: appt.nursingNotes,
    preparationStatus: appt.preparationStatus,
    createdAt: appt.createdAt,
    updatedAt: appt.updatedAt
  }));

  if (format === 'csv') {
    // Convert to CSV
    const fields = [
      'id', 'appointmentDate', 'appointmentTime', 'status',
      'patient.id', 'patient.name', 'patient.email', 'patient.phone',
      'doctor.id', 'doctor.name', 'doctor.email',
      'reason', 'notes', 'nursingNotes', 'preparationStatus',
      'createdAt', 'updatedAt'
    ];

    const csvData = [
      fields.join(','),
      ...exportData.map(row => fields.map(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], row);
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
    return res.send(csvData);
  }

  // Default to JSON
  res.status(200).json({
    success: true,
    count: exportData.length,
    format: 'json',
    data: exportData
  });
});