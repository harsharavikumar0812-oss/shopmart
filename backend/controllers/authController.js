const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
  return { accessToken, refreshToken };
};

// Register User
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [name, email, passwordHash, phone, 'user']
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// Register Vendor
const registerVendor = async (req, res) => {
  try {
    const { name, email, password, phone, storeName, storeDescription, category, gstin, city, state } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with vendor role
    const userResult = await query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, passwordHash, phone, 'vendor']
    );

    const userId = userResult.rows[0].id;

    // Create vendor profile
    await query(
      `INSERT INTO vendor_profiles (user_id, store_name, store_description, category, gstin, city, state) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, storeName, storeDescription, category, gstin, city, state]
    );

    // Notify admin (create notification)
    await query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT id, 'vendor_registration', 'New Vendor Registration', $1 FROM users WHERE role = 'admin'`,
      [`${storeName} has requested vendor approval`]
    );

    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted. Awaiting admin approval.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Vendor registration failed' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active, avatar FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    // Get vendor status if vendor
    let vendorStatus = null;
    if (user.role === 'vendor') {
      const vResult = await query(
        'SELECT id, store_name, approval_status FROM vendor_profiles WHERE user_id = $1',
        [user.id]
      );
      vendorStatus = vResult.rows[0] || null;
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, vendorStatus
      },
      accessToken, refreshToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const result = await query('SELECT id, role FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, token]);

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, avatar, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    let profile = result.rows[0];

    if (req.user.role === 'vendor') {
      const vResult = await query(
        'SELECT * FROM vendor_profiles WHERE user_id = $1',
        [req.user.id]
      );
      profile.vendor = vResult.rows[0] || null;
    }

    res.json({ success: true, user: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await query('UPDATE users SET name=$1, phone=$2, updated_at=NOW() WHERE id=$3', [name, phone, req.user.id]);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
};

module.exports = { register, registerVendor, login, refreshToken, logout, getProfile, updateProfile, changePassword };
