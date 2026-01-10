const mongoose = require('mongoose');
const { 
  User, 
  Patient, 
  Doctor, 
  Nurse, 
  Appointment, 
  Medicine,
  Prescription,
  LabTest,
  LabReport,
  Billing,
  Ward,
  Vitals,
  NursingCare
} = require('../models/schema');
const { asyncHandler } = require('../middleware/errorMiddleware');

/* =====================
   USER MANAGEMENT (CRUD)
===================== */

// Get all users with pagination and filtering
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, role, search, isActive } = req.query;
  
  const query = {};
  
  // Filter by role
  if (role) {
    query.role = role;
  }
  
  // Filter by active status
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await User.countDocuments(query);

  // Get role-specific data
  const enhancedUsers = await Promise.all(users.map(async (user) => {
    let profile = {};
    
    switch (user.role) {
      case 'PATIENT':
        profile = await Patient.findOne({ userId: user._id }).lean();
        break;
      case 'DOCTOR':
        profile = await Doctor.findOne({ userId: user._id }).lean();
        break;
      case 'NURSE':
        profile = await Nurse.findOne({ userId: user._id }).lean();
        break;
      case 'PHARMACIST':
      case 'LAB_TECH':
        profile = { role: user.role };
        break;
    }
    
    return {
      ...user,
      profile
    };
  }));

  res.status(200).json({
    success: true,
    count: enhancedUsers.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: enhancedUsers
  });
});

// Get single user with full details
exports.getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const user = await User.findById(id).select('-password');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let profile = null;
  
  // Get role-specific profile
  switch (user.role) {
    case 'PATIENT':
      profile = await Patient.findOne({ userId: user._id }).lean();
      break;
    case 'DOCTOR':
      profile = await Doctor.findOne({ userId: user._id }).lean();
      break;
    case 'NURSE':
      profile = await Nurse.findOne({ userId: user._id }).lean();
      break;
    case 'PHARMACIST':
    case 'LAB_TECH':
      profile = { role: user.role };
      break;
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      profile
    }
  });
});

// Create new user with role
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password, and role are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error('User with this email already exists');
  }

  // Validate role
  const validRoles = ['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST', 'LAB_TECH', 'NURSE'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone
  });

  // Create role-specific profile if needed
  if (role === 'DOCTOR') {
    await Doctor.create({
      userId: user._id,
      specialization: req.body.specialization || 'General',
      department: req.body.department || 'General Medicine'
    });
  } else if (role === 'NURSE') {
    await Nurse.create({
      userId: user._id,
      employeeId: req.body.employeeId || `NUR${Date.now()}`,
      specialization: req.body.specialization || 'General',
      licenseNumber: req.body.licenseNumber || `LIC${Date.now()}`,
      wardId: req.body.wardId || null
    });
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userResponse
  });
});

// Update user role and status
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role, isActive, phone, name, email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  // Prevent admin from modifying other admins
  const targetUser = await User.findById(id);
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser.role === 'ADMIN' && req.user._id.toString() !== id) {
    res.status(403);
    throw new Error('Cannot modify another admin');
  }

  const updateData = {};
  if (role && role !== 'ADMIN' && role !== targetUser.role) {
    // Role change requires special handling
    updateData.role = role;
  }
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }
  if (phone !== undefined) {
    updateData.phone = phone;
  }
  if (name !== undefined) {
    updateData.name = name;
  }
  if (email !== undefined && email !== targetUser.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error('Email already in use');
    }
    updateData.email = email;
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
});

// Deactivate/Activate user
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deactivating self
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error('Cannot deactivate your own account');
  }

  // Prevent modifying other admins
  if (user.role === 'ADMIN' && req.user._id.toString() !== id) {
    res.status(403);
    throw new Error('Cannot modify another admin');
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      id: user._id,
      email: user.email,
      isActive: user.isActive
    }
  });
});

// Delete user (soft delete)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deleting self
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }

  // Prevent deleting other admins
  if (user.role === 'ADMIN') {
    res.status(403);
    throw new Error('Cannot delete admin accounts');
  }

  // Start transaction for cascading delete
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete role-specific profile
    switch (user.role) {
      case 'PATIENT':
        await Patient.deleteOne({ userId: user._id }).session(session);
        // Also delete related data
        await Appointment.deleteMany({ patientId: user._id }).session(session);
        await Prescription.deleteMany({ patientId: user._id }).session(session);
        await Vitals.deleteMany({ patientId: user._id }).session(session);
        await NursingCare.deleteMany({ patientId: user._id }).session(session);
        await Billing.deleteMany({ patientId: user._id }).session(session);
        await LabTest.deleteMany({ patientId: user._id }).session(session);
        break;
      case 'DOCTOR':
        await Doctor.deleteOne({ userId: user._id }).session(session);
        // Update appointments to remove doctor
        await Appointment.updateMany(
          { doctorId: user._id },
          { doctorId: null }
        ).session(session);
        break;
      case 'NURSE':
        await Nurse.deleteOne({ userId: user._id }).session(session);
        // Update nursing care records
        await NursingCare.updateMany(
          { nurseId: user._id },
          { nurseId: null }
        ).session(session);
        await Vitals.updateMany(
          { nurseId: user._id },
          { nurseId: null }
        ).session(session);
        break;
    }

    // Delete user
    await User.deleteOne({ _id: user._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Assign role to user
exports.assignRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  if (!role || !['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH'].includes(role)) {
    res.status(400);
    throw new Error('Valid role is required');
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'ADMIN') {
    res.status(403);
    throw new Error('Cannot change role of admin user');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove old role profile
    switch (user.role) {
      case 'DOCTOR':
        await Doctor.deleteOne({ userId: user._id }).session(session);
        break;
      case 'NURSE':
        await Nurse.deleteOne({ userId: user._id }).session(session);
        break;
    }

    // Update user role
    user.role = role;
    await user.save({ session });

    // Create new role profile
    if (role === 'DOCTOR') {
      await Doctor.create([{
        userId: user._id,
        specialization: req.body.specialization || 'General',
        department: req.body.department || 'General Medicine'
      }], { session });
    } else if (role === 'NURSE') {
      await Nurse.create([{
        userId: user._id,
        employeeId: req.body.employeeId || `NUR${Date.now()}`,
        specialization: req.body.specialization || 'General',
        licenseNumber: req.body.licenseNumber || `LIC${Date.now()}`,
        wardId: req.body.wardId || null
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role} successfully`,
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/* =====================
   PATIENT MANAGEMENT (CRUD)
===================== */

// Get all patients with filters
exports.getAllPatients = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    isAdmitted,
    bloodGroup,
    admissionStatus,
    search
  } = req.query;

  const userQuery = { role: 'PATIENT' };
  const patientQuery = {};

  // Search across patient and user fields
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    
    patientQuery.$or = [
      { address: { $regex: search, $options: 'i' } },
      { bedNumber: { $regex: search, $options: 'i' } }
    ];
  }

  if (isAdmitted !== undefined) {
    patientQuery.isAdmitted = isAdmitted === 'true';
  }

  if (bloodGroup) {
    patientQuery.bloodGroup = bloodGroup;
  }

  if (admissionStatus) {
    patientQuery.admissionStatus = admissionStatus;
  }

  // Get user IDs for patients matching patient query
  const patients = await Patient.find(patientQuery).select('userId').lean();
  const patientUserIds = patients.map(p => p.userId);

  // Add patient user IDs to user query
  userQuery._id = { $in: patientUserIds };

  const users = await User.find(userQuery)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Get detailed patient info
  const detailedPatients = await Promise.all(
    users.map(async (user) => {
      const patient = await Patient.findOne({ userId: user._id })
        .populate('wardId', 'wardNumber name floor')
        .lean();
      
      // Get latest vitals
      const latestVitals = await Vitals.findOne({ patientId: user._id })
        .sort({ recordedAt: -1 })
        .lean();

      // Get admission info
      const admissionInfo = patient ? {
        isAdmitted: patient.isAdmitted,
        admissionStatus: patient.admissionStatus,
        ward: patient.wardId,
        bedNumber: patient.bedNumber,
        admissionDate: patient.admissionDate
      } : null;

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        patient: patient || {},
        admissionInfo,
        latestVitals
      };
    })
  );

  const total = await User.countDocuments(userQuery);

  res.status(200).json({
    success: true,
    count: detailedPatients.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: detailedPatients
  });
});

// Get single patient details
exports.getPatientById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid patient ID');
  }

  const user = await User.findById(id).select('-password');
  
  if (!user || user.role !== 'PATIENT') {
    res.status(404);
    throw new Error('Patient not found');
  }

  const patient = await Patient.findOne({ userId: id })
    .populate('wardId', 'wardNumber name floor specialty')
    .lean();

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Get related data
  const [appointments, prescriptions, vitals, labTests, billing] = await Promise.all([
    Appointment.find({ patientId: id })
      .populate('doctorId', 'userId')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ date: -1 })
      .limit(10)
      .lean(),
    Prescription.find({ patientId: id })
      .populate('doctorId', 'userId')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Vitals.find({ patientId: id })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean(),
    LabTest.find({ patientId: id })
      .populate('doctorId', 'userId')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Billing.find({ patientId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      patient,
      statistics: {
        totalAppointments: await Appointment.countDocuments({ patientId: id }),
        totalPrescriptions: await Prescription.countDocuments({ patientId: id }),
        totalLabTests: await LabTest.countDocuments({ patientId: id }),
        totalBilling: await Billing.countDocuments({ patientId: id })
      },
      recentActivity: {
        appointments,
        prescriptions,
        vitals,
        labTests,
        billing
      }
    }
  });
});

// Update patient profile
exports.updatePatient = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid patient ID');
  }

  const user = await User.findById(id);
  
  if (!user || user.role !== 'PATIENT') {
    res.status(404);
    throw new Error('Patient not found');
  }

  const patient = await Patient.findOne({ userId: id });
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Update user info if provided
  if (updateData.name || updateData.phone) {
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.phone) userUpdate.phone = updateData.phone;
    await User.findByIdAndUpdate(id, userUpdate);
  }

  // Remove user fields from patient update
  delete updateData.name;
  delete updateData.phone;
  delete updateData.email;

  // Handle admission status change
  if (updateData.admissionStatus && updateData.admissionStatus === 'Discharged') {
    updateData.isAdmitted = false;
    updateData.dischargeDate = new Date();
  } else if (updateData.admissionStatus && updateData.admissionStatus === 'Admitted') {
    updateData.isAdmitted = true;
    if (!patient.admissionDate) {
      updateData.admissionDate = new Date();
    }
  }

  const updatedPatient = await Patient.findOneAndUpdate(
    { userId: id },
    updateData,
    { new: true, runValidators: true }
  ).populate('wardId', 'wardNumber name');

  res.status(200).json({
    success: true,
    message: 'Patient updated successfully',
    data: updatedPatient
  });
});

/* =====================
   DOCTOR MANAGEMENT (CRUD)
===================== */

// Get all doctors
exports.getAllDoctors = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    specialization,
    department,
    search
  } = req.query;

  const query = { role: 'DOCTOR' };
  const doctorQuery = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (specialization) {
    doctorQuery.specialization = specialization;
  }

  if (department) {
    doctorQuery.department = department;
  }

  // Get doctor profiles first
  const doctors = await Doctor.find(doctorQuery).select('userId').lean();
  const doctorUserIds = doctors.map(d => d.userId);

  query._id = { $in: doctorUserIds };

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const detailedDoctors = await Promise.all(
    users.map(async (user) => {
      const doctor = await Doctor.findOne({ userId: user._id }).lean();
      
      // Get appointment stats
      const appointmentStats = await Appointment.aggregate([
        { $match: { doctorId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        user,
        doctor,
        statistics: {
          totalAppointments: await Appointment.countDocuments({ doctorId: user._id }),
          appointmentStats
        }
      };
    })
  );

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: detailedDoctors.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: detailedDoctors
  });
});

// Get doctor details
exports.getDoctorById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const user = await User.findById(id).select('-password');
  
  if (!user || user.role !== 'DOCTOR') {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const doctor = await Doctor.findOne({ userId: id }).lean();
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get upcoming appointments
  const upcomingAppointments = await Appointment.find({
    doctorId: id,
    status: 'Scheduled',
    date: { $gte: new Date() }
  })
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name phone'
      }
    })
    .sort({ date: 1, time: 1 })
    .limit(10)
    .lean();

  // Get statistics
  const [appointmentStats, prescriptionStats, labTestStats] = await Promise.all([
    Appointment.aggregate([
      { $match: { doctorId: id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Prescription.countDocuments({ doctorId: id }),
    LabTest.countDocuments({ doctorId: id })
  ]);

  res.status(200).json({
    success: true,
    data: {
      user,
      doctor,
      statistics: {
        appointments: appointmentStats,
        totalPrescriptions: prescriptionStats,
        totalLabTests: labTestStats
      },
      upcomingAppointments
    }
  });
});
/* =====================
   DOCTOR MANAGEMENT (FULL CRUD)
===================== */

// Create doctor profile (when doctor user is created)
exports.createDoctorProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { specialization, department } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  // Check if user exists and is a doctor
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'DOCTOR') {
    res.status(400);
    throw new Error('User is not a doctor');
  }

  // Check if doctor profile already exists
  const existingDoctor = await Doctor.findOne({ userId });
  if (existingDoctor) {
    res.status(409);
    throw new Error('Doctor profile already exists');
  }

  // Validate required fields
  if (!specialization || !department) {
    res.status(400);
    throw new Error('Specialization and department are required');
  }

  const doctor = await Doctor.create({
    userId,
    specialization,
    department
  });

  res.status(201).json({
    success: true,
    message: 'Doctor profile created successfully',
    data: doctor
  });
});

// Update doctor profile
exports.updateDoctorProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Validate user exists and is a doctor
  const user = await User.findById(doctor.userId);
  if (!user || user.role !== 'DOCTOR') {
    res.status(404);
    throw new Error('Associated user not found or not a doctor');
  }

  // Update user info if provided
  if (updateData.name || updateData.phone || updateData.email) {
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.phone) userUpdate.phone = updateData.phone;
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        res.status(409);
        throw new Error('Email already in use');
      }
      userUpdate.email = updateData.email;
    }
    await User.findByIdAndUpdate(doctor.userId, userUpdate);
  }

  // Remove user fields from doctor update
  delete updateData.name;
  delete updateData.phone;
  delete updateData.email;

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Doctor profile updated successfully',
    data: updatedDoctor
  });
});

// Delete doctor profile
exports.deleteDoctorProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const user = await User.findById(doctor.userId);
  
  if (!user) {
    res.status(404);
    throw new Error('Associated user not found');
  }

  // Start transaction for cascading operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete doctor profile
    await Doctor.deleteOne({ _id: id }).session(session);
    
    // Update user role to PATIENT or keep as DOCTOR but without profile?
    // Option 1: Delete user completely (if doctor user should be removed)
    // Option 2: Change user role to PATIENT
    // Option 3: Keep user as DOCTOR but without profile (not recommended)
    
    // Here we'll change user role to PATIENT and update patient profile
    user.role = 'PATIENT';
    await user.save({ session });

    // Create minimal patient profile
    await Patient.create([{
      userId: user._id,
      admissionStatus: 'Observation',
      isAdmitted: false
    }], { session });

    // Update appointments to remove doctor reference
    await Appointment.updateMany(
      { doctorId: user._id },
      { doctorId: null }
    ).session(session);

    // Update prescriptions to remove doctor reference
    await Prescription.updateMany(
      { doctorId: user._id },
      { doctorId: null }
    ).session(session);

    // Update lab tests to remove doctor reference
    await LabTest.updateMany(
      { doctorId: user._id },
      { doctorId: null }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Doctor profile deleted and user role changed to patient'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Get doctor statistics
exports.getDoctorStatistics = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Get all statistics in parallel
  const [
    totalAppointments,
    todayAppointments,
    weekAppointments,
    monthAppointments,
    appointmentStatusStats,
    totalPrescriptions,
    monthPrescriptions,
    totalLabTests,
    completedLabTests,
    patientCount,
    revenueGenerated,
    topPrescribedMedicines,
    averageAppointmentDuration,
    patientSatisfactionStats,
    upcomingAppointments
  ] = await Promise.all([
    // Appointment counts
    Appointment.countDocuments({ doctorId: doctor.userId }),
    Appointment.countDocuments({ 
      doctorId: doctor.userId,
      date: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    Appointment.countDocuments({ 
      doctorId: doctor.userId,
      createdAt: { $gte: startOfWeek }
    }),
    Appointment.countDocuments({ 
      doctorId: doctor.userId,
      createdAt: { $gte: startOfMonth }
    }),

    // Appointment status distribution
    Appointment.aggregate([
      { $match: { doctorId: doctor.userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Prescription counts
    Prescription.countDocuments({ doctorId: doctor.userId }),
    Prescription.countDocuments({ 
      doctorId: doctor.userId,
      createdAt: { $gte: startOfMonth }
    }),

    // Lab test counts
    LabTest.countDocuments({ doctorId: doctor.userId }),
    LabTest.countDocuments({ 
      doctorId: doctor.userId,
      status: 'Completed'
    }),

    // Patient count
    Appointment.distinct('patientId', { doctorId: doctor.userId }).then(ids => ids.length),

    // Revenue generated
    Billing.aggregate([
      { 
        $match: { 
          paymentStatus: 'Paid',
          appointmentId: { $exists: true }
        } 
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      { $unwind: '$appointment' },
      { $match: { 'appointment.doctorId': doctor.userId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]),

    // Top prescribed medicines
    Prescription.aggregate([
      { $match: { doctorId: doctor.userId } },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),

    // Average appointment duration (if you have duration field)
    Appointment.aggregate([
      { $match: { doctorId: doctor.userId, status: 'Completed' } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' } // Assuming you have duration field
        }
      }
    ]),

    // Patient satisfaction (if you have ratings)
    Appointment.aggregate([
      { 
        $match: { 
          doctorId: doctor.userId,
          rating: { $exists: true } // Assuming you have rating field
        } 
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]),

    // Upcoming appointments (next 7 days)
    Appointment.find({
      doctorId: doctor.userId,
      status: 'Scheduled',
      date: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'name phone'
        }
      })
      .sort({ date: 1, time: 1 })
      .limit(10)
      .lean()
  ]);

  // Get appointment trend (last 30 days)
  const appointmentTrend = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor.userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalAppointments,
        todayAppointments,
        weekAppointments,
        monthAppointments,
        totalPrescriptions,
        monthPrescriptions,
        totalLabTests,
        completedLabTests,
        uniquePatients: patientCount,
        totalRevenue: revenueGenerated[0]?.totalRevenue || 0,
        avgRating: patientSatisfactionStats[0]?.avgRating || 0,
        totalRatings: patientSatisfactionStats[0]?.totalRatings || 0,
        avgAppointmentDuration: averageAppointmentDuration[0]?.avgDuration || 0
      },
      appointmentStats: {
        statusDistribution: appointmentStatusStats,
        trend: appointmentTrend
      },
      prescriptions: {
        topMedicines: topPrescribedMedicines
      },
      upcomingAppointments
    }
  });
});

// Get doctor's patients
exports.getDoctorPatients = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, search } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get unique patient IDs from appointments
  const patientIds = await Appointment.distinct('patientId', { 
    doctorId: doctor.userId 
  });

  if (patientIds.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      total: 0,
      totalPages: 0,
      currentPage: parseInt(page),
      data: []
    });
  }

  // Build query for patients
  const patientQuery = { userId: { $in: patientIds } };
  
  if (search) {
    // Get users matching search
    const matchingUsers = await User.find({
      _id: { $in: patientIds },
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    patientQuery.userId = { $in: matchingUsers.map(u => u._id) };
  }

  const patients = await Patient.find(patientQuery)
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Enhance with appointment stats
  const enhancedPatients = await Promise.all(
    patients.map(async (patient) => {
      const appointmentStats = await Appointment.aggregate([
        {
          $match: {
            doctorId: doctor.userId,
            patientId: patient.userId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            lastAppointment: { $max: '$createdAt' }
          }
        }
      ]);

      const lastPrescription = await Prescription.findOne({
        doctorId: doctor.userId,
        patientId: patient.userId
      }).sort({ createdAt: -1 }).lean();

      const lastLabTest = await LabTest.findOne({
        doctorId: doctor.userId,
        patientId: patient.userId
      }).sort({ createdAt: -1 }).lean();

      return {
        patient,
        statistics: {
          totalAppointments: appointmentStats.reduce((sum, stat) => sum + stat.count, 0),
          appointmentStats,
          lastAppointment: appointmentStats.length > 0 
            ? appointmentStats[0].lastAppointment 
            : null
        },
        lastInteraction: {
          prescription: lastPrescription,
          labTest: lastLabTest
        }
      };
    })
  );

  const total = await Patient.countDocuments(patientQuery);

  res.status(200).json({
    success: true,
    count: enhancedPatients.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: enhancedPatients
  });
});

// Get doctor's appointments with filters
exports.getDoctorAppointments = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { 
    status, 
    date, 
    startDate, 
    endDate,
    patientId,
    page = 1, 
    limit = 10 
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const query = { doctorId: doctor.userId };

  if (status) query.status = status;
  if (date) query.date = new Date(date);
  if (patientId) query.patientId = patientId;
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(query)
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
        select: 'name'
      }
    })
    .sort({ date: -1, time: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Appointment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: appointments
  });
});

// Get doctor's prescriptions
exports.getDoctorPrescriptions = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { 
    patientId,
    startDate,
    endDate,
    page = 1, 
    limit = 10 
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const query = { doctorId: doctor.userId };

  if (patientId) query.patientId = patientId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const prescriptions = await Prescription.find(query)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('appointmentId')
    .populate('medicines.medicineId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Prescription.countDocuments(query);

  // Get prescription statistics
  const prescriptionStats = await Prescription.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        totalMedicines: { $sum: { $size: '$medicines' } },
        avgMedicinesPerPrescription: { $avg: { $size: '$medicines' } }
      }
    }
  ]);

  // Get most prescribed medicines
  const topMedicines = await Prescription.aggregate([
    { $match: query },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    statistics: prescriptionStats[0] || {},
    topMedicines,
    data: prescriptions
  });
});

// Get doctor's lab tests
exports.getDoctorLabTests = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { 
    status, 
    patientId,
    startDate,
    endDate,
    page = 1, 
    limit = 10 
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const query = { doctorId: doctor.userId };

  if (status) query.status = status;
  if (patientId) query.patientId = patientId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const labTests = await LabTest.find(query)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .populate('labReportId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await LabTest.countDocuments(query);

  // Get lab test statistics
  const labStats = await LabTest.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: labTests.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    statistics: labStats,
    data: labTests
  });
});

// Update doctor's specialization and department
exports.updateDoctorSpecialization = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { specialization, department } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  if (!specialization && !department) {
    res.status(400);
    throw new Error('At least one field (specialization or department) is required');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const updateData = {};
  if (specialization) updateData.specialization = specialization;
  if (department) updateData.department = department;

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Doctor specialization/department updated successfully',
    data: updatedDoctor
  });
});

// Get doctor availability
exports.getDoctorAvailability = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const queryDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

  // Get appointments for the day
  const appointments = await Appointment.find({
    doctorId: doctor.userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'Scheduled'
  }).select('time').lean();

  // Define working hours (9 AM to 5 PM)
  const workingHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Get booked slots
  const bookedSlots = appointments.map(appointment => appointment.time);
  
  // Calculate available slots
  const availableSlots = workingHours.filter(slot => !bookedSlots.includes(slot));

  res.status(200).json({
    success: true,
    data: {
      date: startOfDay,
      doctor: {
        id: doctor._id,
        specialization: doctor.specialization,
        department: doctor.department
      },
      workingHours,
      bookedSlots,
      availableSlots,
      statistics: {
        totalSlots: workingHours.length,
        bookedSlotsCount: bookedSlots.length,
        availableSlotsCount: availableSlots.length,
        availabilityPercentage: ((availableSlots.length / workingHours.length) * 100).toFixed(2)
      }
    }
  });
});

// Bulk update doctors (for department changes, etc.)
exports.bulkUpdateDoctors = asyncHandler(async (req, res, next) => {
  const { doctorIds, updateData } = req.body;

  if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
    res.status(400);
    throw new Error('Doctor IDs array is required');
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error('Update data is required');
  }

  // Validate doctor IDs
  const invalidIds = doctorIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    res.status(400);
    throw new Error(`Invalid doctor IDs: ${invalidIds.join(', ')}`);
  }

  // Validate update data (only allow certain fields)
  const allowedFields = ['specialization', 'department'];
  const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    res.status(400);
    throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update doctors
    const result = await Doctor.updateMany(
      { _id: { $in: doctorIds } },
      updateData,
      { session }
    );

    // Also update associated user information if needed
    if (updateData.department) {
      // You might want to update something in user model if needed
      // For example, if you have a department field in user model
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} doctor(s) successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Get doctor performance report
exports.getDoctorPerformanceReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid doctor ID');
  }

  const doctor = await Doctor.findById(id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { doctorId: doctor.userId };
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  }

  // Get comprehensive performance data
  const [
    appointmentPerformance,
    prescriptionPerformance,
    labTestPerformance,
    patientSatisfaction,
    revenuePerformance,
    comparisonData
  ] = await Promise.all([
    // Appointment performance
    Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Prescription performance
    Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalPrescriptions: { $sum: 1 },
          totalMedicines: { $sum: { $size: '$medicines' } },
          avgMedicinesPerPrescription: { $avg: { $size: '$medicines' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Lab test performance
    LabTest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalTests: { $sum: 1 },
          completedTests: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          completionRate: {
            $avg: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Patient satisfaction (if you have rating system)
    Appointment.aggregate([
      { 
        $match: { 
          doctorId: doctor.userId,
          rating: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]),

    // Revenue performance
    Billing.aggregate([
      { 
        $match: { 
          paymentStatus: 'Paid',
          appointmentId: { $exists: true }
        } 
      },
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      { $unwind: '$appointment' },
      { $match: { 'appointment.doctorId': doctor.userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Comparison with department average
    Doctor.aggregate([
      { $match: { department: doctor.department } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'appointments',
          localField: 'userId',
          foreignField: 'doctorId',
          as: 'appointments'
        }
      },
      {
        $project: {
          name: '$user.name',
          specialization: 1,
          department: 1,
          totalAppointments: { $size: '$appointments' },
          completedAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                as: 'appointment',
                cond: { $eq: ['$$appointment.status', 'Completed'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$department',
          avgAppointments: { $avg: '$totalAppointments' },
          avgCompletionRate: {
            $avg: {
              $cond: [
                { $eq: ['$totalAppointments', 0] },
                0,
                { $divide: ['$completedAppointments', '$totalAppointments'] }
              ]
            }
          },
          doctorCount: { $sum: 1 }
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      doctor: {
        name: doctor.userId.name, // You might need to populate this
        specialization: doctor.specialization,
        department: doctor.department
      },
      dateRange: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now'
      },
      performanceMetrics: {
        appointments: appointmentPerformance,
        prescriptions: prescriptionPerformance,
        labTests: labTestPerformance,
        patientSatisfaction: patientSatisfaction[0] || {},
        revenue: revenuePerformance
      },
      comparison: comparisonData[0] || {},
      summary: {
        totalAppointments: appointmentPerformance.reduce((sum, item) => sum + item.totalAppointments, 0),
        completionRate: appointmentPerformance.length > 0 
          ? (appointmentPerformance.reduce((sum, item) => sum + item.completedAppointments, 0) / 
             appointmentPerformance.reduce((sum, item) => sum + item.totalAppointments, 0) * 100).toFixed(2)
          : 0,
        totalRevenue: revenuePerformance.reduce((sum, item) => sum + item.totalRevenue, 0),
        patientSatisfactionScore: patientSatisfaction[0]?.avgRating || 'N/A'
      }
    }
  });
});
/* =====================
   NURSE MANAGEMENT (CRUD)
===================== */

// Get all nurses
exports.getAllNurses = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    specialization,
    shift,
    wardId,
    search
  } = req.query;

  const query = { role: 'NURSE' };
  const nurseQuery = {};

  if (search) {
    query.$or = [
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

  // Get nurse profiles first
  const nurses = await Nurse.find(nurseQuery).select('userId').lean();
  const nurseUserIds = nurses.map(n => n.userId);

  query._id = { $in: nurseUserIds };

  const users = await User.find(query)
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
      const careStats = await NursingCare.aggregate([
        { $match: { nurseId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        user,
        nurse,
        statistics: {
          totalCareTasks: await NursingCare.countDocuments({ nurseId: user._id }),
          totalVitalsRecorded: await Vitals.countDocuments({ nurseId: user._id }),
          careStats
        }
      };
    })
  );

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: detailedNurses.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: detailedNurses
  });
});

/* =====================
   APPOINTMENT MANAGEMENT (CRUD)
===================== */

// Create appointment
exports.createAppointment = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, date, time, reason, notes } = req.body;

  if (!patientId || !doctorId || !date || !time) {
    res.status(400);
    throw new Error('Patient ID, Doctor ID, date, and time are required');
  }

  // Validate patient exists
  const patient = await Patient.findOne({ userId: patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate doctor exists
  const doctor = await Doctor.findOne({ userId: doctorId });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Check for conflicting appointments
  const existingAppointment = await Appointment.findOne({
    doctorId,
    date: new Date(date),
    time,
    status: 'Scheduled'
  });

  if (existingAppointment) {
    res.status(409);
    throw new Error('Doctor already has an appointment at this time');
  }

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    date,
    time,
    reason,
    notes
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
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

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: populatedAppointment
  });
});

// Update appointment
exports.updateAppointment = asyncHandler(async (req, res, next) => {
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

  // Check for time conflicts if time is being updated
  if (updateData.time || updateData.date) {
    const date = updateData.date ? new Date(updateData.date) : appointment.date;
    const time = updateData.time || appointment.time;
    const doctorId = updateData.doctorId || appointment.doctorId;

    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: id },
      doctorId,
      date,
      time,
      status: 'Scheduled'
    });

    if (conflictingAppointment) {
      res.status(409);
      throw new Error('Doctor already has an appointment at this time');
    }
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
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
    message: 'Appointment updated successfully',
    data: updatedAppointment
  });
});

// Delete appointment
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
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

  // Check if appointment can be deleted (only scheduled appointments can be deleted)
  if (appointment.status !== 'Scheduled') {
    res.status(400);
    throw new Error('Only scheduled appointments can be deleted');
  }

  await Appointment.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

/* =====================
   PRESCRIPTION MANAGEMENT (CRUD)
===================== */

// Get all prescriptions
exports.getAllPrescriptions = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    patientId,
    doctorId,
    date,
    search
  } = req.query;

  const query = {};

  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const prescriptions = await Prescription.find(query)
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
    .populate('appointmentId')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Prescription.countDocuments(query);

  res.status(200).json({
    success: true,
    count: prescriptions.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: prescriptions
  });
});

/* =====================
   VITALS MANAGEMENT (CRUD)
===================== */

// Get all vitals records
exports.getAllVitals = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    patientId,
    nurseId,
    startDate,
    endDate
  } = req.query;

  const query = {};

  if (patientId) query.patientId = patientId;
  if (nurseId) query.nurseId = nurseId;
  
  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const vitals = await Vitals.find(query)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'nurseId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ recordedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Vitals.countDocuments(query);

  res.status(200).json({
    success: true,
    count: vitals.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: vitals
  });
});

/* =====================
   NURSING CARE MANAGEMENT (CRUD)
===================== */

// Get all nursing care records
exports.getAllNursingCare = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10,
    patientId,
    nurseId,
    careType,
    status,
    startDate,
    endDate
  } = req.query;

  const query = {};

  if (patientId) query.patientId = patientId;
  if (nurseId) query.nurseId = nurseId;
  if (careType) query.careType = careType;
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const nursingCare = await NursingCare.find(query)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .populate({
      path: 'nurseId',
      populate: {
        path: 'userId',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await NursingCare.countDocuments(query);

  res.status(200).json({
    success: true,
    count: nursingCare.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: nursingCare
  });
});

/* =====================
   SYSTEM ANALYTICS DASHBOARD
===================== */

exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Execute all queries in parallel
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalNurses,
    totalAppointments,
    activeAppointments,
    totalPrescriptions,
    totalMedicineStock,
    lowStockMedicines,
    totalLabTests,
    pendingLabTests,
    totalRevenue,
    monthlyRevenue,
    patientRegistrations,
    appointmentStats,
    roleDistribution,
    todayAppointments,
    todayAdmissions,
    todayVitals,
    todayPrescriptions
  ] = await Promise.all([
    // User counts
    User.countDocuments(),
    User.countDocuments({ role: 'PATIENT' }),
    User.countDocuments({ role: 'DOCTOR' }),
    User.countDocuments({ role: 'NURSE' }),

    // Appointment stats
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'Scheduled' }),

    // Prescription stats
    Prescription.countDocuments(),

    // Pharmacy stats
    Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }
        }
      }
    ]),
    Medicine.countDocuments({ stockQuantity: { $lt: 10 } }),

    // Lab stats
    LabTest.countDocuments(),
    LabTest.countDocuments({ status: 'Requested' }),

    // Revenue stats
    Billing.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]),
    Billing.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$amount' }
        }
      }
    ]),

    // Patient registration trend (last 7 days)
    User.aggregate([
      {
        $match: {
          role: 'PATIENT',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Appointment status distribution
    Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // User role distribution
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),

    // Today's statistics
    Appointment.countDocuments({ 
      date: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    Patient.countDocuments({ 
      admissionDate: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    Vitals.countDocuments({ 
      recordedAt: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    Prescription.countDocuments({ 
      createdAt: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalNurses,
        totalAppointments,
        activeAppointments,
        totalPrescriptions,
        totalMedicineStock: totalMedicineStock[0]?.totalStock || 0,
        totalInventoryValue: totalMedicineStock[0]?.totalValue || 0,
        lowStockAlert: lowStockMedicines,
        totalLabTests,
        pendingLabTests,
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        monthlyRevenue: monthlyRevenue[0]?.monthlyRevenue || 0
      },
      todayStats: {
        appointments: todayAppointments,
        admissions: todayAdmissions,
        vitals: todayVitals,
        prescriptions: todayPrescriptions
      },
      trends: {
        patientRegistrations,
        appointmentStats,
        roleDistribution
      },
      alerts: {
        lowStock: lowStockMedicines > 0 ? `${lowStockMedicines} medicines low in stock` : null,
        pendingTests: pendingLabTests > 0 ? `${pendingLabTests} lab tests pending` : null,
        activeAppointments: activeAppointments > 0 ? `${activeAppointments} active appointments` : null
      }
    }
  });
});

/* =====================
   PATIENT REGISTRATIONS & APPOINTMENTS
===================== */

// Get patient registrations with filters
exports.getPatientRegistrations = asyncHandler(async (req, res, next) => {
  const { 
    startDate, 
    endDate, 
    page = 1, 
    limit = 10,
    isAdmitted 
  } = req.query;

  const query = {};
  
  // Date filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const users = await User.find({ 
    ...query, 
    role: 'PATIENT' 
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const patients = await Promise.all(
    users.map(async (user) => {
      const patient = await Patient.findOne({ userId: user._id });
      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt
        },
        patient: patient || {}
      };
    })
  );

  const total = await User.countDocuments({ ...query, role: 'PATIENT' });

  res.status(200).json({
    success: true,
    count: patients.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: patients
  });
});

// Get all appointments with filters
exports.getAllAppointments = asyncHandler(async (req, res, next) => {
  const { 
    status, 
    date, 
    doctorId, 
    patientId,
    page = 1, 
    limit = 10 
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (date) query.date = new Date(date);
  if (doctorId) query.doctorId = doctorId;
  if (patientId) query.patientId = patientId;

  const appointments = await Appointment.find(query)
    .populate('patientId', 'userId')
    .populate('doctorId', 'userId')
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
    .sort({ date: -1, time: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Appointment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: appointments
  });
});

/* =====================
   PHARMACY INVENTORY MANAGEMENT
===================== */

// Get all medicines with stock alerts
exports.getPharmacyInventory = asyncHandler(async (req, res, next) => {
  const { 
    lowStock = false, 
    category, 
    search,
    page = 1, 
    limit = 20 
  } = req.query;

  const query = {};

  if (lowStock === 'true') {
    query.stockQuantity = { $lt: 20 }; // Threshold for low stock
  }
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const medicines = await Medicine.find(query)
    .sort({ stockQuantity: 1, name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Medicine.countDocuments(query);

  // Stock summary
  const stockSummary = await Medicine.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { 
          $sum: { $multiply: ['$stockQuantity', '$price'] } 
        },
        lowStockCount: {
          $sum: { $cond: [{ $lt: ['$stockQuantity', 20] }, 1, 0] }
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: medicines.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    summary: stockSummary[0] || {},
    data: medicines
  });
});

// Update medicine stock
exports.updateMedicineStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { stockQuantity, price } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  const updateData = {};
  if (stockQuantity !== undefined) {
    updateData.stockQuantity = Math.max(0, stockQuantity);
  }
  if (price !== undefined) {
    if (price < 0) {
      res.status(400);
      throw new Error('Price cannot be negative');
    }
    updateData.price = price;
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

// Add new medicine
exports.addMedicine = asyncHandler(async (req, res, next) => {
  const { name, category, price, stockQuantity, unit } = req.body;

  if (!name || !price) {
    res.status(400);
    throw new Error('Name and price are required');
  }

  // Check if medicine already exists
  const existingMedicine = await Medicine.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });

  if (existingMedicine) {
    res.status(409);
    throw new Error('Medicine with this name already exists');
  }

  const medicine = await Medicine.create({
    name,
    category,
    price,
    stockQuantity: stockQuantity || 0,
    unit
  });

  res.status(201).json({
    success: true,
    message: 'Medicine added successfully',
    data: medicine
  });
});

// Delete medicine
exports.deleteMedicine = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid medicine ID');
  }

  // Check if medicine is used in any prescription
  const usedInPrescription = await Prescription.findOne({
    'medicines.medicineId': id
  });

  if (usedInPrescription) {
    res.status(400);
    throw new Error('Cannot delete medicine that is used in prescriptions');
  }

  const medicine = await Medicine.findByIdAndDelete(id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully'
  });
});

/* =====================
   LABORATORY MANAGEMENT
===================== */

// Get all lab tests with filters
exports.getAllLabTests = asyncHandler(async (req, res, next) => {
  const { 
    status, 
    startDate, 
    endDate, 
    patientId,
    page = 1, 
    limit = 10 
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (patientId) query.patientId = patientId;
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const labTests = await LabTest.find(query)
    .populate('patientId', 'userId')
    .populate('doctorId', 'userId')
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email'
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

  const total = await LabTest.countDocuments(query);

  // Status summary
  const statusSummary = await LabTest.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: labTests.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    statusSummary,
    data: labTests
  });
});

// Update lab test status
exports.updateLabTestStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, result } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid lab test ID');
  }

  const labTest = await LabTest.findById(id);
  
  if (!labTest) {
    res.status(404);
    throw new Error('Lab test not found');
  }

  // Update status
  if (status) {
    labTest.status = status;
  }

  await labTest.save();

  // If status is completed and result is provided, create/update lab report
  if (status === 'Completed' && result) {
    await LabReport.findOneAndUpdate(
      { labTestId: labTest._id },
      { result, reportDate: new Date() },
      { upsert: true, new: true }
    );
  }

  const updatedTest = await LabTest.findById(id)
    .populate('patientId', 'userId')
    .populate('doctorId', 'userId');

  res.status(200).json({
    success: true,
    message: 'Lab test updated successfully',
    data: updatedTest
  });
});

// Create lab test
exports.createLabTest = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, testName } = req.body;

  if (!patientId || !doctorId || !testName) {
    res.status(400);
    throw new Error('Patient ID, Doctor ID, and test name are required');
  }

  // Validate patient exists
  const patient = await Patient.findOne({ userId: patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate doctor exists
  const doctor = await Doctor.findOne({ userId: doctorId });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const labTest = await LabTest.create({
    patientId,
    doctorId,
    testName
  });

  const populatedLabTest = await LabTest.findById(labTest._id)
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
    .lean();

  res.status(201).json({
    success: true,
    message: 'Lab test created successfully',
    data: populatedLabTest
  });
});

/* =====================
   BILLING & REVENUE MANAGEMENT
===================== */

// Get all billing records
exports.getAllBilling = asyncHandler(async (req, res, next) => {
  const { 
    paymentStatus, 
    startDate, 
    endDate, 
    patientId,
    page = 1, 
    limit = 10 
  } = req.query;

  const query = {};

  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (patientId) query.patientId = patientId;
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const billingRecords = await Billing.find(query)
    .populate('patientId', 'userId')
    .populate('prescriptionId')
    .populate('appointmentId')
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email phone'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Billing.countDocuments(query);

  // Revenue summary
  const revenueSummary = await Billing.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Monthly revenue
  const monthlyRevenue = await Billing.aggregate([
    {
      $match: {
        createdAt: { 
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) 
        }
      }
    },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    success: true,
    count: billingRecords.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    revenueSummary,
    monthlyRevenue,
    data: billingRecords
  });
});

// Update billing status
exports.updateBillingStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid billing ID');
  }

  if (!paymentStatus || !['Paid', 'Pending'].includes(paymentStatus)) {
    res.status(400);
    throw new Error('Valid payment status is required');
  }

  const billing = await Billing.findByIdAndUpdate(
    id,
    { paymentStatus },
    { new: true, runValidators: true }
  ).populate('patientId', 'userId');

  if (!billing) {
    res.status(404);
    throw new Error('Billing record not found');
  }

  res.status(200).json({
    success: true,
    message: 'Billing status updated successfully',
    data: billing
  });
});

// Create billing record
exports.createBilling = asyncHandler(async (req, res, next) => {
  const { patientId, prescriptionId, appointmentId, amount, paymentStatus } = req.body;

  if (!patientId || !amount) {
    res.status(400);
    throw new Error('Patient ID and amount are required');
  }

  // Validate patient exists
  const patient = await Patient.findOne({ userId: patientId });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Validate prescription if provided
  if (prescriptionId) {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      res.status(404);
      throw new Error('Prescription not found');
    }
  }

  // Validate appointment if provided
  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }
  }

  const billing = await Billing.create({
    patientId,
    prescriptionId,
    appointmentId,
    amount,
    paymentStatus: paymentStatus || 'Pending'
  });

  const populatedBilling = await Billing.findById(billing._id)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    })
    .populate('prescriptionId')
    .populate('appointmentId')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Billing record created successfully',
    data: populatedBilling
  });
});

// Generate revenue report
exports.generateRevenueReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

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
    case 'month':
      groupStage = {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
      };
      break;
    case 'year':
      groupStage = {
        _id: { 
          year: { $year: '$createdAt' }
        }
      };
      break;
    default:
      groupStage = { _id: null };
  }

  const revenueReport = await Billing.aggregate([
    { $match: matchStage },
    {
      $group: {
        ...groupStage,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        paidRevenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$amount', 0] }
        },
        pendingRevenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Calculate summary
  const summary = revenueReport.reduce((acc, curr) => ({
    totalRevenue: acc.totalRevenue + curr.totalRevenue,
    totalTransactions: acc.totalTransactions + curr.totalTransactions,
    paidRevenue: acc.paidRevenue + curr.paidRevenue,
    pendingRevenue: acc.pendingRevenue + curr.pendingRevenue
  }), {
    totalRevenue: 0,
    totalTransactions: 0,
    paidRevenue: 0,
    pendingRevenue: 0
  });

  res.status(200).json({
    success: true,
    summary,
    data: revenueReport
  });
});

/* =====================
   SYSTEM-WIDE REPORTS
===================== */

// Generate comprehensive system report
exports.generateSystemReport = asyncHandler(async (req, res, next) => {
  const { reportType = 'monthly', startDate, endDate } = req.query;

  const dateFilter = {};
  const now = new Date();
  
  switch (reportType) {
    case 'daily':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter.$gte = today;
      break;
    case 'weekly':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.$gte = weekAgo;
      break;
    case 'monthly':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter.$gte = monthAgo;
      break;
    case 'custom':
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      break;
  }

  const matchStage = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  // Execute all aggregations in parallel
  const [
    userStats,
    appointmentStats,
    prescriptionStats,
    billingStats,
    labStats,
    medicineStats,
    admissionStats,
    vitalStats
  ] = await Promise.all([
    // User Statistics
    User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
        }
      }
    ]),

    // Appointment Statistics
    Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Prescription Statistics
    Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          totalMedicines: { $sum: { $size: '$medicines' } }
        }
      }
    ]),

    // Billing Statistics
    Billing.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]),

    // Lab Test Statistics
    LabTest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Medicine Statistics
    Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          lowStockCount: {
            $sum: { $cond: [{ $lt: ['$stockQuantity', 20] }, 1, 0] }
          }
        }
      }
    ]),

    // Admission Statistics
    Patient.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 }
        }
      }
    ]),

    // Vitals Statistics
    Vitals.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 }
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    reportType,
    dateRange: dateFilter,
    generatedAt: new Date(),
    data: {
      userStatistics: userStats,
      appointmentStatistics: appointmentStats,
      prescriptionStatistics: prescriptionStats[0] || {},
      billingStatistics: billingStats,
      laboratoryStatistics: labStats,
      pharmacyStatistics: medicineStats[0] || {},
      admissionStatistics: admissionStats,
      vitalStatistics: vitalStats[0] || {}
    }
  });
});