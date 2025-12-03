const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('🔍 Decoded token:', JSON.stringify(decoded, null, 2));
      console.log('🔍 Token keys:', Object.keys(decoded));
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if userId exists in token (could be userId or id)
    const userIdFromToken = decoded.userId || decoded.id || decoded.user_id;
    
    if (!userIdFromToken) {
      console.error('❌ No userId found in token. Full token payload:', JSON.stringify(decoded, null, 2));
      console.error('❌ Available keys in token:', Object.keys(decoded));
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID in token'
      });
    }

    // Ensure userId is a number (PostgreSQL expects integer)
    const userId = typeof userIdFromToken === 'string' ? parseInt(userIdFromToken, 10) : userIdFromToken;
    
    if (isNaN(userId)) {
      console.error('❌ Invalid userId in token:', userIdFromToken);
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID in token'
      });
    }

    console.log('🔍 Authenticating user - UserId from token:', userId, 'Type:', typeof userId);

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found - ID:', userId);
      console.error('🔍 Checking if any users exist in database...');
      // Debug: Check if any users exist
      try {
        const allUsers = await User.findAll();
        console.error('📊 Total users in database:', allUsers.length);
        if (allUsers.length > 0) {
          console.error('📋 User IDs in database:', allUsers.map(u => ({ id: u.id, email: u.email })));
        } else {
          console.error('⚠️ No users found in database at all!');
        }
      } catch (err) {
        console.error('Error checking users:', err);
      }
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User found - ID:', user.id, 'Email:', user.email);
    
    // Check if user is active (null defaults to true since default in DB is TRUE)
    if (user.is_active === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

module.exports = {
  authenticate
};

