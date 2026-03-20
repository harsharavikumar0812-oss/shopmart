-- =============================================
-- MULTI-VENDOR E-COMMERCE PLATFORM - SCHEMA
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'vendor', 'user')),
  avatar TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- VENDOR PROFILES TABLE
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_name VARCHAR(150) NOT NULL,
  store_description TEXT,
  store_logo TEXT,
  store_banner TEXT,
  category VARCHAR(100),
  gstin VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  bank_account VARCHAR(20),
  ifsc_code VARCHAR(20),
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','suspended')),
  rejection_reason TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES TABLE
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percent INT DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  images JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  tags TEXT[],
  brand VARCHAR(100),
  weight DECIMAL(8,2),
  dimensions JSONB,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  sold_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PRODUCT REVIEWS TABLE
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  review TEXT,
  images JSONB DEFAULT '[]',
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER ADDRESSES TABLE
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  landmark TEXT,
  address_type VARCHAR(20) DEFAULT 'home' CHECK (address_type IN ('home','work','other')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CART TABLE
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- WISHLISTS TABLE
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(30),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_id VARCHAR(100),
  coupon_code VARCHAR(50),
  shipping_address JSONB NOT NULL,
  notes TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ORDER ITEMS TABLE
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  vendor_id UUID REFERENCES vendor_profiles(id),
  product_name VARCHAR(200) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ORDER STATUS HISTORY
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  note TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- COUPONS TABLE
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage','fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PLATFORM SETTINGS TABLE
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendor_profiles(id),
  type VARCHAR(30) CHECK (type IN ('payment','refund','payout','commission')),
  amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  commission_amount DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending',
  payment_gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =============================================
-- SEED DATA
-- =============================================

-- Admin user (password: Admin@123)
INSERT INTO users (id, name, email, password_hash, role, email_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'Super Admin', 'admin@shopmart.com', '$2b$10$rQZ5K3xq7P8mN2vL9wX1eOkJhF4gT6iA0bC8dE2fG1hI3jK5lM7nO', 'admin', true);

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Electronics', 'electronics', 'Phones, Laptops, TVs and more'),
('Fashion', 'fashion', 'Clothing, Shoes & Accessories'),
('Home & Kitchen', 'home-kitchen', 'Furniture, Appliances & Decor'),
('Books', 'books', 'Academic, Fiction, Non-Fiction'),
('Sports', 'sports', 'Equipment, Fitness & Outdoors'),
('Beauty', 'beauty', 'Skincare, Makeup & Personal Care'),
('Toys', 'toys', 'Kids Toys, Games & More'),
('Grocery', 'grocery', 'Fresh, Packaged Foods & Beverages');

-- Platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('platform_name', 'ShopMart', 'Name of the platform'),
('commission_rate', '5', 'Platform commission percentage'),
('min_withdrawal', '500', 'Minimum vendor withdrawal amount'),
('free_shipping_above', '499', 'Free shipping threshold'),
('currency', 'INR', 'Platform currency');
