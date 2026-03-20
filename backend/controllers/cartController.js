const { query } = require('../config/db');

// Get cart
const getCart = async (req, res) => {
  try {
    const result = await query(`
      SELECT ci.id, ci.quantity, ci.updated_at,
             p.id as product_id, p.name, p.price, p.original_price, p.discount_percent,
             p.images, p.stock, p.is_active, p.brand,
             vp.store_name as vendor_name, vp.id as vendor_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN vendor_profiles vp ON p.vendor_id = vp.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [req.user.id]);

    const subtotal = result.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = result.rows.reduce((sum, item) => sum + item.quantity, 0);
    const freeShippingThreshold = 499;
    const shippingAmount = subtotal >= freeShippingThreshold ? 0 : 49;

    res.json({
      success: true,
      items: result.rows,
      summary: {
        itemCount,
        subtotal,
        shippingAmount,
        taxAmount: parseFloat((subtotal * 0.18).toFixed(2)),
        total: subtotal + shippingAmount + parseFloat((subtotal * 0.18).toFixed(2)),
        freeShippingThreshold,
        amountToFreeShipping: Math.max(0, freeShippingThreshold - subtotal)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get cart' });
  }
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Check product
    const product = await query(
      'SELECT id, stock, price FROM products WHERE id=$1 AND is_active=true',
      [productId]
    );
    if (!product.rows[0]) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.rows[0].stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Upsert cart item
    await query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()
    `, [req.user.id, productId, quantity]);

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      await query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [itemId, req.user.id]);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    // Check stock
    const item = await query(
      'SELECT p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id=$1',
      [itemId]
    );
    if (item.rows[0] && item.rows[0].stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    await query(
      'UPDATE cart_items SET quantity=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
      [quantity, itemId, req.user.id]
    );
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.itemId, req.user.id]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

// Wishlist
const getWishlist = async (req, res) => {
  try {
    const result = await query(`
      SELECT w.id, p.id as product_id, p.name, p.price, p.original_price,
             p.discount_percent, p.images, p.rating, p.stock
      FROM wishlists w JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, items: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get wishlist' });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const existing = await query('SELECT id FROM wishlists WHERE user_id=$1 AND product_id=$2', [req.user.id, productId]);

    if (existing.rows[0]) {
      await query('DELETE FROM wishlists WHERE user_id=$1 AND product_id=$2', [req.user.id, productId]);
      res.json({ success: true, wishlisted: false, message: 'Removed from wishlist' });
    } else {
      await query('INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2)', [req.user.id, productId]);
      res.json({ success: true, wishlisted: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle wishlist' });
  }
};

// Get user addresses
const getAddresses = async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json({ success: true, addresses: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get addresses' });
  }
};

const addAddress = async (req, res) => {
  try {
    const { name, phone, addressLine1, addressLine2, city, state, pincode, landmark, addressType, isDefault } = req.body;

    if (isDefault) {
      await query('UPDATE user_addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    }

    const result = await query(`
      INSERT INTO user_addresses (user_id, name, phone, address_line1, address_line2, city, state, pincode, landmark, address_type, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [req.user.id, name, phone, addressLine1, addressLine2, city, state, pincode, landmark, addressType, isDefault || false]);

    res.status(201).json({ success: true, address: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await query('DELETE FROM user_addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

// Apply coupon
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await query(
      `SELECT * FROM coupons WHERE code=$1 AND is_active=true 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code]
    );

    if (!result.rows[0]) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });

    const coupon = result.rows[0];
    if (orderAmount < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount ₹${coupon.min_order_amount} required`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.min((orderAmount * coupon.discount_value / 100), coupon.max_discount || Infinity);
    } else {
      discount = Math.min(coupon.discount_value, orderAmount);
    }

    res.json({ success: true, coupon: { code, discount: parseFloat(discount.toFixed(2)), description: coupon.description } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
};

// Get notifications
const getNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    const unread = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [req.user.id]);
    res.json({ success: true, notifications: result.rows, unreadCount: parseInt(unread.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
};

module.exports = {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, toggleWishlist, getAddresses, addAddress, deleteAddress,
  applyCoupon, getNotifications, markNotificationsRead
};
