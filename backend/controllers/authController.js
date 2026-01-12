const mongoose = require('mongoose');
const { User, Patient, Doctor, Nurse,LabTech } = require('../models/schema');
const { asyncHandler } = require('../middleware/errorMiddleware');
const jwt = require('jsonwebtoken');

/* =====================
   Token Helper
===================== */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

/* =====================
   SIGNUP (No Transactions)
===================== */
/* =====================
   SIGNUP (No Transactions)
===================== */
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, ...profileData } = req.body;

  // 1️⃣ Validate Role (Hard Stop) - Add LAB_TECH
  const allowedRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'LAB_TECH'];
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  // 2️⃣ Check for existing user
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error('User with this email already exists');
  }

  // For ADMIN role
  if (role === 'ADMIN') {
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  }

  try {
    // 3️⃣ Create Base User
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    // 4️⃣ Role-Specific Profile
    if (role === 'PATIENT') {
      await Patient.create({
        userId: newUser._id,
        ...profileData
      });
    }

    if (role === 'DOCTOR') {
      await Doctor.create({
        userId: newUser._id,
        specialization: profileData.specialization,
        department: profileData.department
      });
    }

    if (role === 'NURSE') {
      await Nurse.create({
        userId: newUser._id,
        employeeId: profileData.employeeId,
        licenseNumber: profileData.licenseNumber,
        wardId: profileData.wardId,
        specialization: profileData.specialization || 'General',
        experience: profileData.experience || 0,
        shift: profileData.shift || 'Rotating'
      });
    }

    // Add LAB_TECH profile creation
    if (role === 'LAB_TECH') {
      await LabTech.create({
        userId: newUser._id,
        employeeId: profileData.employeeId,
        department: profileData.department,
        licenseNumber: profileData.licenseNumber,
        specialization: profileData.specialization || 'General',
        experience: profileData.experience || 0,
        shift: profileData.shift || 'Rotating',
        equipmentPermissions: profileData.equipmentPermissions || [],
        certifiedTests: profileData.certifiedTests || [],
        isActive: true,
        joinDate: new Date(),
        testsConducted: 0,
        accuracyRate: 0
      });
    }

    // 5️⃣ Respond
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });

  } catch (error) {
    // 6️⃣ Clean up on error - delete user if profile creation failed
    if (error.name !== 'ValidationError') {
      // Find and delete the user if it was created
      const createdUser = await User.findOne({ email });
      if (createdUser) {
        await User.deleteOne({ _id: createdUser._id });
      }
    }
    return next(error);
  }
});
/* =====================
   LOGIN
===================== */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    }
  });
});

/* =====================
   GET LOGGED-IN USER
===================== */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = req.user.toObject();
  delete user.password;

  // Get role-specific profile
  let profile = null;
  
  switch (user.role) {
    case 'PATIENT':
      profile = await Patient.findOne({ userId: user._id });
      break;
    case 'DOCTOR':
      profile = await Doctor.findOne({ userId: user._id });
      break;
    case 'NURSE':
      profile = await Nurse.findOne({ userId: user._id });
      break;
    case 'ADMIN':
      // Admin has no additional profile
      break;
  }

  res.status(200).json({
    success: true,
    data: {
      ...user,
      profile
    }
  });
});