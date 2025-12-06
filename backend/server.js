require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/database');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware - but skip for multipart/form-data (handled by multer)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next(); // Skip JSON parsing for multipart/form-data
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/auth', require('./src/routes/auth/authRoutes'));
app.use('/api/admin', require('./src/routes/admin/adminRoutes'));
app.use('/api/admin/email-templates', require('./src/routes/admin/emailTemplateRoutes'));
app.use('/api/admin/blogs', require('./src/routes/admin/blogRoutes'));
app.use('/api/career-goals', require('./src/routes/public/careerGoalsRoutes'));
app.use('/api/exams', require('./src/routes/public/examsRoutes'));
app.use('/api/subjects', require('./src/routes/public/subjectsRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5001;

// Initialize database and start server
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

module.exports = app;

