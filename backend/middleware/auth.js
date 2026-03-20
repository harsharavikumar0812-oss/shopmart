const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Verify access token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, name, email, role, is_active, avatar FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0] || !result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', expired: true });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// Check vendor approval
const requireApprovedVendor = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT approval_status FROM vendor_profiles WHERE user_id = $1',
      [req.user.id]
    );
    if (!result.rows[0] || result.rows[0].approval_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your vendor account is not approved yet'
      });
    }
    req.vendor = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth (for public routes that show different data for logged-in users)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
      if (result.rows[0]) req.user = result.rows[0];
    }
  } catch {}
  next();
};

module.exports = { authenticate, authorize, requireApprovedVendor, optionalAuth };
