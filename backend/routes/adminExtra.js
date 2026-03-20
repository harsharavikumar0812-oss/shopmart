const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/db');

router.use(authenticate, authorize('admin'));

// Get all coupons
router.get('/coupons', async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, coupons: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

// Create coupon
router.post('/coupons', async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at } = req.body;
    const existing = await query('SELECT id FROM coupons WHERE code = $1', [code]);
    if (existing.rows[0]) return res.status(400).json({ success: false, message: 'Coupon code already exists' });

    const result = await query(`
      INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [code, description, discount_type, discount_value, min_order_amount || 0, max_discount || null, usage_limit || null, expires_at || null]);

    res.status(201).json({ success: true, coupon: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

// Toggle coupon active
router.put('/coupons/:id/toggle', async (req, res) => {
  try {
    const result = await query('UPDATE coupons SET is_active = NOT is_active WHERE id=$1 RETURNING is_active', [req.params.id]);
    res.json({ success: true, isActive: result.rows[0]?.is_active });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle coupon' });
  }
});

// Delete coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

// Toggle product featured
router.put('/products/:id/featured', async (req, res) => {
  try {
    const { isFeatured } = req.body;
    await query('UPDATE products SET is_featured=$1, updated_at=NOW() WHERE id=$2', [isFeatured, req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Toggle product active
router.put('/products/:id/toggle', async (req, res) => {
  try {
    const result = await query('UPDATE products SET is_active = NOT is_active WHERE id=$1 RETURNING is_active', [req.params.id]);
    res.json({ success: true, isActive: result.rows[0]?.is_active });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle product' });
  }
});

module.exports = router;
