require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const Admin = require('./models/Admin');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/email-templates', require('./routes/emailTemplateRoutes'));

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

// Hardcoded default admin credentials
const DEFAULT_ADMIN_EMAIL = 'admin@collegefinder.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

/**
 * Initialize default admin account if it doesn't exist
 */
async function initializeDefaultAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await Admin.findByEmail(DEFAULT_ADMIN_EMAIL);
    
    if (!existingAdmin) {
      // Check if any super admin exists
      const result = await db.query(
        "SELECT * FROM admin_users WHERE type = 'super_admin'"
      );
      
      if (result.rows.length === 0) {
        // Create default super admin
        await Admin.create(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, 'super_admin', null);
        console.log('\n✅ Default admin account created!');
        console.log('📝 Login credentials:');
        console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
        console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
        console.log('⚠️  Please change the password after first login!\n');
      } else {
        console.log('ℹ️  Super admin already exists, skipping default admin creation');
      }
    } else {
      console.log('ℹ️  Default admin account already exists');
    }
  } catch (error) {
    console.error('⚠️  Error initializing default admin:', error.message);
    // Don't exit - allow server to start even if admin creation fails
  }
}

// Initialize database and start server
db.init()
  .then(async () => {
    // Initialize default admin
    await initializeDefaultAdmin();
    
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

