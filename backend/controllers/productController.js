const { query } = require('../config/db');
const slugify = require('slugify');

// Get all products (public)
const getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, category, search, minPrice, maxPrice,
      sort = 'created_at', order = 'DESC', brand, rating, inStock
    } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "WHERE p.is_active = true";

    if (category) {
      params.push(category);
      where += ` AND (c.slug = $${params.length} OR c.id::text = $${params.length})`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.brand ILIKE $${params.length})`;
    }
    if (minPrice) { params.push(minPrice); where += ` AND p.price >= $${params.length}`; }
    if (maxPrice) { params.push(maxPrice); where += ` AND p.price <= $${params.length}`; }
    if (brand) { params.push(brand); where += ` AND p.brand ILIKE $${params.length}`; }
    if (rating) { params.push(rating); where += ` AND p.rating >= $${params.length}`; }
    if (inStock === 'true') where += ` AND p.stock > 0`;

    const sortMap = {
      'price_asc': 'p.price ASC',
      'price_desc': 'p.price DESC',
      'rating': 'p.rating DESC',
      'popular': 'p.sold_count DESC',
      'newest': 'p.created_at DESC'
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    params.push(limit, offset);
    const result = await query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.discount_percent,
             p.images, p.rating, p.review_count, p.sold_count, p.stock, p.brand,
             p.is_featured, c.name as category_name, c.slug as category_slug,
             vp.store_name as vendor_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN vendor_profiles vp ON p.vendor_id = vp.id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);

    const count = await query(
      `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id ${where}`,
      params.slice(0,-2)
    );

    res.json({
      success: true,
      products: result.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(count.rows[0].count) / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             vp.store_name, vp.rating as vendor_rating, vp.id as vendor_profile_id
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN vendor_profiles vp ON p.vendor_id = vp.id
      WHERE (p.id = $1 OR p.slug = $1) AND p.is_active = true
    `, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = result.rows[0];

    // Get reviews
    const reviews = await query(`
      SELECT pr.*, u.name as reviewer_name, u.avatar
      FROM product_reviews pr JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = $1
      ORDER BY pr.created_at DESC LIMIT 10
    `, [product.id]);

    // Get related products
    const related = await query(`
      SELECT id, name, price, original_price, images, rating, discount_percent
      FROM products
      WHERE category_id = $1 AND id != $2 AND is_active = true
      LIMIT 6
    `, [product.category_id, product.id]);

    res.json({ success: true, product, reviews: reviews.rows, related: related.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// Vendor: Create product
const createProduct = async (req, res) => {
  try {
    const {
      name, description, shortDescription, price, originalPrice,
      categoryId, stock, sku, brand, images, specifications, tags, weight
    } = req.body;

    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id = $1', [req.user.id]);
    if (!vendorResult.rows[0]) return res.status(403).json({ success: false, message: 'Vendor profile not found' });
    const vendorId = vendorResult.rows[0].id;

    let slug = slugify(name, { lower: true, strict: true });
    // Ensure unique slug
    const existing = await query('SELECT id FROM products WHERE slug = $1', [slug]);
    if (existing.rows[0]) slug = `${slug}-${Date.now()}`;

    const discountPercent = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

    const result = await query(`
      INSERT INTO products (vendor_id, category_id, name, slug, description, short_description,
        price, original_price, discount_percent, sku, stock, brand, images, specifications, tags, weight)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [vendorId, categoryId, name, slug, description, shortDescription,
        price, originalPrice || price, discountPercent, sku, stock, brand,
        JSON.stringify(images || []), JSON.stringify(specifications || {}),
        tags || [], weight]);

    res.status(201).json({ success: true, message: 'Product created', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// Vendor: Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id = $1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;

    const product = await query('SELECT id FROM products WHERE id = $1 AND vendor_id = $2', [id, vendorId]);
    if (!product.rows[0]) return res.status(404).json({ success: false, message: 'Product not found' });

    const {
      name, description, shortDescription, price, originalPrice,
      categoryId, stock, brand, images, specifications, tags, isActive
    } = req.body;

    const discountPercent = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    await query(`
      UPDATE products SET name=$1, description=$2, short_description=$3, price=$4,
        original_price=$5, discount_percent=$6, category_id=$7, stock=$8, brand=$9,
        images=$10, specifications=$11, tags=$12, is_active=$13, updated_at=NOW()
      WHERE id=$14
    `, [name, description, shortDescription, price, originalPrice || price, discountPercent,
        categoryId, stock, brand, JSON.stringify(images || []), JSON.stringify(specifications || {}),
        tags, isActive ?? true, id]);

    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Vendor: Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id = $1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;

    await query('UPDATE products SET is_active = false WHERE id = $1 AND vendor_id = $2', [id, vendorId]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

// Vendor: Get own products
const getVendorProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    const vendorResult = await query('SELECT id FROM vendor_profiles WHERE user_id = $1', [req.user.id]);
    const vendorId = vendorResult.rows[0]?.id;

    const params = [vendorId];
    let where = `WHERE p.vendor_id = $1`;

    if (search) { params.push(`%${search}%`); where += ` AND p.name ILIKE $${params.length}`; }
    if (category) { params.push(category); where += ` AND c.slug = $${params.length}`; }

    params.push(limit, offset);
    const result = await query(`
      SELECT p.*, c.name as category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);

    const count = await query(`SELECT COUNT(*) FROM products p ${where}`, params.slice(0,-2));

    // Low stock products
    const lowStock = await query(
      'SELECT id, name, stock, low_stock_threshold FROM products WHERE vendor_id=$1 AND stock <= low_stock_threshold AND is_active=true',
      [vendorId]
    );

    res.json({
      success: true,
      products: result.rows,
      total: parseInt(count.rows[0].count),
      lowStockProducts: lowStock.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Add review
const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, review } = req.body;

    // Check if purchased
    const purchased = await query(`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id=$1 AND o.user_id=$2 AND o.status='delivered'
    `, [productId, req.user.id]);

    await query(
      'INSERT INTO product_reviews (product_id, user_id, rating, title, review, is_verified_purchase) VALUES ($1,$2,$3,$4,$5,$6)',
      [productId, req.user.id, rating, title, review, !!purchased.rows[0]]
    );

    // Update product rating
    const avgResult = await query('SELECT AVG(rating) as avg, COUNT(*) as count FROM product_reviews WHERE product_id=$1', [productId]);
    await query('UPDATE products SET rating=$1, review_count=$2 WHERE id=$3',
      [parseFloat(avgResult.rows[0].avg).toFixed(2), avgResult.rows[0].count, productId]);

    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active=true
      WHERE c.is_active = true
      GROUP BY c.id ORDER BY c.name
    `);
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.discount_percent,
             p.images, p.rating, p.review_count, p.sold_count, p.brand,
             c.name as category_name
      FROM products p JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = true AND p.is_active = true
      LIMIT 12
    `);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured products' });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getVendorProducts, addReview, getCategories, getFeaturedProducts
};
