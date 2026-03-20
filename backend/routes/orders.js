// routes/orders.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovedVendor } = require('../middleware/auth');
const {
  createOrder, getUserOrders, getOrderDetails, cancelOrder,
  getVendorOrders, updateOrderItemStatus, getVendorAnalytics
} = require('../controllers/orderController');

router.post('/', authenticate, authorize('user'), createOrder);
router.get('/', authenticate, getUserOrders);
router.get('/vendor', authenticate, authorize('vendor'), getVendorOrders);
router.get('/vendor/analytics', authenticate, authorize('vendor'), getVendorAnalytics);
router.get('/:orderId', authenticate, getOrderDetails);
router.put('/:orderId/cancel', authenticate, cancelOrder);
router.put('/vendor/items/:itemId/status', authenticate, authorize('vendor'), requireApprovedVendor, updateOrderItemStatus);

module.exports = router;
