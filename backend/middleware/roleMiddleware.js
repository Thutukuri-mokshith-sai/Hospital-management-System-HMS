const { asyncHandler } = require('./errorMiddleware');
const mongoose = require('mongoose');

/* =====================
   Check if user is ADMIN
===================== */
exports.isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Access denied. Admin privileges required');
  }
  next();
});

/* =====================
   Check if user exists
===================== */
exports.userExists = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid user ID format');
  }
  
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  req.targetUser = user;
  next();
});