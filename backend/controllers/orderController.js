const { query, getClient } = require('../config/db');

const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'SM';
  const timestamp = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2,'0') +
    String(date.getDate()).padStart(2,'0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${timestamp}${random}`;
};

// Create order
const createOrder = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { addressId, paymentMethod, couponCode, notes } = req.body;

    // Get cart items
    const cartResult = await client.query(`
      SELECT ci.quantity, p.id as product_id, p.name, p.price, p.images, p.stock,
             p.vendor_id, vp.store_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN vendor_profiles vp ON p.vendor_id = vp.id
      WHERE ci.user_id = $1 AND p.is_active = true
    `, [req.user.id]);

    if (!cartResult.rows.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check stock
    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`
        });
      }
    }

    // Get address
    const addressResult = await client.query(
      'SELECT * FROM user_addresses WHERE id=$1 AND user_id=$2',
      [addressId, req.user.id]
    );
    if (!addressResult.rows[0]) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }
    const address = addressResult.rows[0];

    // Calculate totals
    let subtotal = 0;
    cartResult.rows.forEach(item => { subtotal += item.price * item.quantity; });

    const freeShippingThreshold = 499;
    const shippingAmount = subtotal >= freeShippingThreshold ? 0 : 49;
    const taxAmount = parseFloat((subtotal * 0.18).toFixed(2));

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await client.query(
        'SELECT * FROM coupons WHERE code=$1 AND is_active=true AND (expires_at IS NULL OR expires_at > NOW())',
        [couponCode]
      );
      if (coupon.rows[0]) {
        const c = coupon.rows[0];
        if (subtotal >= c.min_order_amount) {
          if (c.discount_type === 'percentage') {
            discountAmount = Math.min((subtotal * c.discount_value / 100), c.max_discount || Infinity);
          } else {
            discountAmount = Math.min(c.discount_value, subtotal);
          }
          await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [c.id]);
        }
      }
    }

    const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, order_number, subtotal, shipping_amount, tax_amount,
        discount_amount, total_amount, payment_method, shipping_address, coupon_code, notes,
        estimated_delivery, payment_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      req.user.id, generateOrderNumber(), subtotal, shippingAmount, taxAmount,
      discountAmount, totalAmount, paymentMethod,
      JSON.stringify({
        name: address.name, phone: address.phone,
        address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
        city: address.city, state: address.state, pincode: address.pincode
      }),
      couponCode, notes,
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
      paymentMethod === 'cod' ? 'pending' : 'pending'
    ]);

    const order = orderResult.rows[0];

    // Create order items & update stock
    for (const item of cartResult.rows) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, vendor_id, product_name, product_image,
          quantity, unit_price, total_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
        order.id, item.product_id, item.vendor_id, item.name,
        item.images?.[0] || null, item.quantity, item.price,
        item.price * item.quantity
      ]);

      // Reduce stock
      await client.query(
        'UPDATE products SET stock = stock - $1, sold_count = sold_count + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Log status history
    await client.query(
      'INSERT INTO order_status_history (order_id, status, note, updated_by) VALUES ($1,$2,$3,$4)',
      [order.id, 'pending', 'Order placed successfully', req.user.id]
    );

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // Create transaction record
    await client.query(
      'INSERT INTO transactions (order_id, user_id, type, amount, status) VALUES ($1,$2,$3,$4,$5)',
      [order.id, req.user.id, 'payment', totalAmount, 'pending']
    );

    await client.query('COMMIT');

    // Notify vendors
    const vendorIds = [...new Set(cartResult.rows.map(i => i.vendor_id))];
    for (const vendorId of vendorIds) {
      const vendorUser = await query(
        'SELECT user_id FROM vendor_profiles WHERE id=$1', [vendorId]
      );
      if (vendorUser.rows[0]) {
        await query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4)',
          [vendorUser.rows[0].user_id, 'new_order', 'New Order Received',
           `Order #${order.order_number} has been placed`]
        );
      }
    }

    res.status(201).json({
      success: true, message: 'Order placed successfully',
      order: { id: order.id, orderNumber: order.order_number, totalAmount }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  } finally {
    client.release();
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let where = 'WHERE o.user_id = $1';

    if (status) { params.push(status); where += ` AND o.status = $${params.length}`; }

    params.push(limit, offset);
    const result = await query(`
      SELECT o.*, COUNT(oi.id) as item_count,
             JSON_AGG(JSON_BUILD_OBJECT(
               'id', oi.id, 'product_name', oi.product_name,
               'quantity', oi.quantity, 'unit_price', oi.unit_price,
               'product_image', oi.product_image, 'status', oi.status
             )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${where}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);

    const count = await query(`SELECT COUNT(*) FROM orders o ${where}`, params.slice(0,-2));

    res.json({ success: true, orders: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await query(`
      SELECT o.*, u.name as customer_name, u.email, u.phone
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'admin')
    `, [req.params.orderId, req.user.id, req.user.role]);

    if (!order.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });

    const items = await query(`
      SELECT oi.*, vp.store_name
      FROM order_items oi JOIN vendor_profiles vp ON oi.vendor_id = vp.id
      WHERE oi.order_id = $1
    `, [req.params.orderId]);

    const history = await query(
      'SELECT * FROM order_status_history WHERE order_id=$1 ORDER BY created_at ASC',
      [req.params.orderId]
    );

    res.json({ success: true, order: order.rows[0], items: items.rows, history: history.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

// Cancel order (user)
const cancelOrder = async (req, res) => {
  try {
    const order = await query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.orderId, req.user.id]);
    if (!order.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.rows[0].status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    await query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', ['cancelled', req.params.orderId]);
    await query(
      'INSERT INTO order_status_history (order_id, status, note, updated_by) VALUES ($1,$2,$3,$4)',
      [req.params.orderId, 'cancelled', req.body.reason || 'Cancelled by customer', req.user.id]
    );

    // Restore stock
    const items = await query('SELECT product_id, quantity FROM order_items WHERE order_id=$1', [req.params.orderId]);
    for (const item of items.rows) {
      await query('UPDATE products SET stock=stock+$1, sold_count=sold_count-$1 WHERE id=$2', [item.quantity, item.product_id]);
    }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// Vendor: Get own orders
const getVendorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id=$1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;

    const params = [vendorId];
    let where = 'WHERE oi.vendor_id = $1';
    if (status) { params.push(status); where += ` AND oi.status = $${params.length}`; }

    params.push(limit, offset);
    const result = await query(`
      SELECT oi.*, o.order_number, o.created_at as order_date, o.shipping_address,
             u.name as customer_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);

    const count = await query(
      `SELECT COUNT(*) FROM order_items oi ${where}`,
      params.slice(0,-2)
    );

    res.json({ success: true, orders: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Vendor: Update order item status
const updateOrderItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, trackingNumber } = req.body;
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id=$1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;

    const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const item = await query('SELECT status FROM order_items WHERE id=$1 AND vendor_id=$2', [itemId, vendorId]);
    if (!item.rows[0]) return res.status(404).json({ success: false, message: 'Order item not found' });

    const currentIdx = statusFlow.indexOf(item.rows[0].status);
    const newIdx = statusFlow.indexOf(status);
    if (newIdx <= currentIdx) {
      return res.status(400).json({ success: false, message: 'Cannot revert order status' });
    }

    await query(
      `UPDATE order_items SET status=$1, tracking_number=COALESCE($2, tracking_number),
       shipped_at=${status === 'shipped' ? 'NOW()' : 'shipped_at'},
       delivered_at=${status === 'delivered' ? 'NOW()' : 'delivered_at'}
       WHERE id=$3`,
      [status, trackingNumber, itemId]
    );

    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// Vendor analytics
const getVendorAnalytics = async (req, res) => {
  try {
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id=$1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;
    const { period = '30d' } = req.query;
    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
    const interval = intervalMap[period] || '30 days';

    const [stats, dailyRevenue, topProducts, ordersByStatus] = await Promise.all([
      query(`
        SELECT
          COUNT(DISTINCT oi.order_id) as total_orders,
          COALESCE(SUM(oi.total_price), 0) as total_revenue,
          COALESCE(SUM(oi.quantity), 0) as items_sold,
          (SELECT COUNT(*) FROM products WHERE vendor_id=$1 AND is_active=true) as total_products,
          (SELECT COUNT(*) FROM products WHERE vendor_id=$1 AND stock <= low_stock_threshold) as low_stock_count
        FROM order_items oi WHERE oi.vendor_id=$1
      `, [vendorId]),
      query(`
        SELECT DATE(o.created_at) as date, SUM(oi.total_price) as revenue, COUNT(oi.id) as orders
        FROM order_items oi JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id=$1 AND o.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(o.created_at) ORDER BY date
      `, [vendorId]),
      query(`
        SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.total_price) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE oi.vendor_id=$1 GROUP BY p.name ORDER BY sold DESC LIMIT 5
      `, [vendorId]),
      query(`SELECT status, COUNT(*) FROM order_items WHERE vendor_id=$1 GROUP BY status`, [vendorId])
    ]);

    res.json({
      success: true,
      stats: stats.rows[0],
      dailyRevenue: dailyRevenue.rows,
      topProducts: topProducts.rows,
      ordersByStatus: ordersByStatus.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

module.exports = {
  createOrder, getUserOrders, getOrderDetails, cancelOrder,
  getVendorOrders, updateOrderItemStatus, getVendorAnalytics
};
