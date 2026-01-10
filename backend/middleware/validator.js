const { asyncHandler } = require('./errorMiddleware');

exports.validateSignup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please provide all required fields: name, email, password, role');
  }

  // Basic email regex
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  const allowedRoles = ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']; // Added ADMIN
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  next();
});

exports.validateLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  next();
});