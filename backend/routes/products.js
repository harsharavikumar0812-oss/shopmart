const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireApprovedVendor, optionalAuth } = require('../middleware/auth');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getVendorProducts, addReview, getCategories, getFeaturedProducts
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', optionalAuth, getProduct);

// Vendor routes
router.post('/', authenticate, authorize('vendor'), requireApprovedVendor, createProduct);
router.put('/:id', authenticate, authorize('vendor'), requireApprovedVendor, updateProduct);
router.delete('/:id', authenticate, authorize('vendor'), deleteProduct);
router.get('/vendor/list', authenticate, authorize('vendor'), getVendorProducts);

// Review
router.post('/:productId/reviews', authenticate, addReview);

module.exports = router;
