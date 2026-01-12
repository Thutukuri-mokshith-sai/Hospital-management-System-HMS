const jwt = require('jsonwebtoken');
const { User } = require('../models/schema');
const { asyncHandler } = require('./errorMiddleware');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    // Check if user is active
    if (!user.isActive) {
      res.status(401);
      throw new Error('User account is deactivated');
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    res.status(401);
    throw new Error('Token failed, authorization denied');
  }
});

// Role-Based Authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('User not authenticated');
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};
// Add these to your existing authMiddleware

// LabTech only middleware
exports.labTechOnly = (req, res, next) => {
  if (req.user.role !== 'LAB_TECH') {
    res.status(403);
    throw new Error('Access denied. LabTech only.');
  }
  next();
};

// Get LabTech profile
exports.getLabTechProfile = asyncHandler(async (req, res, next) => {
  const labTech = await LabTech.findOne({ userId: req.user._id })
    .populate('userId', 'name email phone')
    .populate('wardId', 'wardNumber name');

  if (!labTech) {
    res.status(404);
    throw new Error('LabTech profile not found');
  }

  req.labTech = labTech;
  next();
});