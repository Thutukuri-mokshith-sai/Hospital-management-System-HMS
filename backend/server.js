require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/crudadmin');
const wardRoutes=require('./routes/wardRoutes');
// Create Express app
const app = express();

// 1. Connect to MongoDB
connectDB();

// 2. Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hospital Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin'
    }
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wards', wardRoutes);
// 4. 404 Handler - FIXED: Remove the asterisk or use proper pattern
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// 5. Global Error Handler
app.use(errorHandler);

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});