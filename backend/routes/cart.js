const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, toggleWishlist, getAddresses, addAddress, deleteAddress,
  applyCoupon, getNotifications, markNotificationsRead
} = require('../controllers/cartController');

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/clear', clearCart);

router.get('/wishlist', getWishlist);
router.post('/wishlist/toggle', toggleWishlist);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);

router.post('/apply-coupon', applyCoupon);

router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);

module.exports = router;
