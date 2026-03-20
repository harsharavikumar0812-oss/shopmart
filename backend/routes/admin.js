const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getStats, getVendors, updateVendorStatus, getUsers, toggleUserStatus, getOrders, getAnalytics } = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/vendors', getVendors);
router.put('/vendors/:vendorId/status', updateVendorStatus);
router.get('/users', getUsers);
router.put('/users/:userId/toggle', toggleUserStatus);
router.get('/orders', getOrders);

module.exports = router;
