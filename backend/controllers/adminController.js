const { query } = require('../config/db');

// Platform Stats
const getStats = async (req, res) => {
  try {
    const [users, vendors, orders, revenue, products, pendingVendors] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
      query("SELECT COUNT(*) FROM vendor_profiles WHERE approval_status = 'approved'"),
      query("SELECT COUNT(*) FROM orders"),
      query("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE payment_status = 'paid'"),
      query("SELECT COUNT(*) FROM products WHERE is_active = true"),
      query("SELECT COUNT(*) FROM vendor_profiles WHERE approval_status = 'pending'")
    ]);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await query(`
      SELECT DATE_TRUNC('month', created_at) as month,
             COALESCE(SUM(total_amount),0) as revenue,
             COUNT(*) as orders
      FROM orders WHERE payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Top categories
    const topCategories = await query(`
      SELECT c.name, COUNT(oi.id) as order_count, SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.name ORDER BY revenue DESC LIMIT 5
    `);

    // Recent orders
    const recentOrders = await query(`
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
             u.name as customer_name, u.email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalVendors: parseInt(vendors.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        totalProducts: parseInt(products.rows[0].count),
        pendingVendors: parseInt(pendingVendors.rows[0].count)
      },
      monthlyRevenue: monthlyRevenue.rows,
      topCategories: topCategories.rows,
      recentOrders: recentOrders.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Get all vendors
const getVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      whereClause += ` AND vp.approval_status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.name ILIKE $${params.length} OR vp.store_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    params.push(limit, offset);
    const result = await query(`
      SELECT vp.*, u.name, u.email, u.phone, u.created_at as user_created,
             (SELECT COUNT(*) FROM products WHERE vendor_id = vp.id) as product_count
      FROM vendor_profiles vp
      JOIN users u ON vp.user_id = u.id
      ${whereClause}
      ORDER BY vp.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) FROM vendor_profiles vp JOIN users u ON vp.user_id = u.id ${whereClause}
    `, params.slice(0, -2));

    res.json({
      success: true,
      vendors: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendors' });
  }
};

// Approve/Reject vendor
const updateVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await query(
      `UPDATE vendor_profiles SET approval_status=$1, rejection_reason=$2, 
       approved_at=${status === 'approved' ? 'NOW()' : 'NULL'}, updated_at=NOW() 
       WHERE id=$3`,
      [status, reason || null, vendorId]
    );

    // Notify vendor
    const vendor = await query(
      'SELECT user_id, store_name FROM vendor_profiles WHERE id = $1',
      [vendorId]
    );
    if (vendor.rows[0]) {
      await query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4)',
        [
          vendor.rows[0].user_id,
          'vendor_status',
          `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          status === 'approved'
            ? `Congratulations! Your store "${vendor.rows[0].store_name}" has been approved.`
            : `Your store "${vendor.rows[0].store_name}" was ${status}. ${reason || ''}`
        ]
      );
    }

    res.json({ success: true, message: `Vendor ${status} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update vendor status' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "WHERE 1=1";

    if (role) { params.push(role); where += ` AND role = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    params.push(limit, offset);
    const result = await query(
      `SELECT id, name, email, role, is_active, phone, created_at FROM users ${where} 
       ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    const count = await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0,-2));

    res.json({ success: true, users: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
      [req.params.userId]
    );
    res.json({ success: true, isActive: result.rows[0].is_active });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status' });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { params.push(status); where += ` AND o.status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (o.order_number ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    params.push(limit, offset);
    const result = await query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${where}
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);

    const count = await query(
      `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${where}`,
      params.slice(0,-2)
    );

    res.json({ success: true, orders: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// Revenue analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' };
    const interval = intervalMap[period] || '30 days';

    const [dailyRevenue, topVendors, topProducts, ordersByStatus] = await Promise.all([
      query(`
        SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
        FROM orders WHERE payment_status='paid' AND created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at) ORDER BY date
      `),
      query(`
        SELECT vp.store_name, SUM(oi.total_price) as revenue, COUNT(oi.id) as orders
        FROM order_items oi JOIN vendor_profiles vp ON oi.vendor_id = vp.id
        WHERE oi.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY vp.store_name ORDER BY revenue DESC LIMIT 10
      `),
      query(`
        SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.total_price) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE oi.created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY p.name ORDER BY sold DESC LIMIT 10
      `),
      query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`)
    ]);

    res.json({
      success: true,
      dailyRevenue: dailyRevenue.rows,
      topVendors: topVendors.rows,
      topProducts: topProducts.rows,
      ordersByStatus: ordersByStatus.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

module.exports = { getStats, getVendors, updateVendorStatus, getUsers, toggleUserStatus, getOrders, getAnalytics };
