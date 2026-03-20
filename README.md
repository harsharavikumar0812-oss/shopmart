# 🛒 ShopMart — Multi-Vendor E-Commerce Platform

> Amazon / Flipkart-style platform with Role-Based Access, Real-Time Analytics, Multi-Vendor Management, Cart, Orders, Wishlist, Coupons, and more.

---

## 📁 Project Structure

```
ecommerce-platform/
├── backend/                    ← Node.js + Express API
│   ├── config/
│   │   └── db.js               ← PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js   ← Register, login, JWT, refresh tokens
│   │   ├── adminController.js  ← Stats, vendor approval, user mgmt
│   │   ├── productController.js← CRUD products, reviews, categories
│   │   ├── orderController.js  ← Place orders, vendor order mgmt, analytics
│   │   └── cartController.js   ← Cart, wishlist, addresses, notifications
│   ├── middleware/
│   │   └── auth.js             ← JWT auth, role guards, vendor approval check
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── cart.js
│   ├── server.js               ← Express app, rate limiting, CORS, Helmet
│   ├── .env.example            ← All environment variables
│   └── package.json
│
├── frontend/                   ← React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── main.jsx            ← Entry point
│   │   ├── App.jsx             ← Routes (protected + public)
│   │   ├── index.css           ← Global styles + Tailwind directives
│   │   ├── context/
│   │   │   ├── AuthContext.jsx ← Bridge to Zustand auth store
│   │   │   └── CartContext.jsx ← Bridge to Zustand cart store
│   │   ├── store/
│   │   │   └── index.js        ← Zustand: auth, cart, wishlist, notifications
│   │   ├── services/
│   │   │   └── api.js          ← Axios instance + all API helpers
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Navbar.jsx      ← Full navbar with search, cart, notifications
│   │   │   │   ├── CartDrawer.jsx  ← Slide-over cart panel
│   │   │   │   └── ProductCard.jsx ← Reusable product card
│   │   │   ├── admin/
│   │   │   │   └── AdminLayout.jsx
│   │   │   └── vendor/
│   │   │       └── VendorLayout.jsx
│   │   └── pages/
│   │       ├── user/
│   │       │   ├── HomePage.jsx         ← Banner carousel, categories, featured
│   │       │   ├── ProductsPage.jsx     ← Filters, sort, search, pagination
│   │       │   ├── ProductDetailPage.jsx← Images, specs, reviews, related
│   │       │   ├── CartPage.jsx         ← Cart with coupon, summary
│   │       │   ├── CheckoutPage.jsx     ← 3-step: Address → Payment → Review
│   │       │   ├── OrdersPage.jsx       ← Order list + tracking timeline
│   │       │   ├── OrderDetailPage.jsx  ← Re-export from OrdersPage
│   │       │   ├── WishlistPage.jsx     ← Wishlist with move-to-cart
│   │       │   ├── ProfilePage.jsx      ← User profile
│   │       │   └── AuthPages.jsx        ← Login + Register
│   │       ├── admin/
│   │       │   ├── AdminDashboard.jsx   ← Stats, charts (Bar, Line, Doughnut)
│   │       │   ├── AdminVendors.jsx     ← Approve/Reject vendors
│   │       │   ├── AdminUsers.jsx       ← User management + activate/deactivate
│   │       │   └── AdminOrders.jsx      ← All orders with expand-to-detail
│   │       └── vendor/
│   │           ├── VendorDashboard.jsx  ← Revenue charts, low-stock alerts
│   │           ├── VendorPages.jsx      ← Register + Add Product
│   │           ├── VendorOrdersProducts.jsx ← Orders + Products management
│   │           └── VendorProfile.jsx    ← Store settings, password, notifications
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── database/
    └── schema.sql              ← Full PostgreSQL schema + seed data
```

---

## ✅ Feature Checklist

### 🔐 Authentication & Security
- [x] JWT access tokens (15 min) + Refresh tokens (7 days)
- [x] Auto token refresh on expiry
- [x] Role-based access: Admin / Vendor / User
- [x] Protected routes (frontend + backend)
- [x] Rate limiting (100 req/15 min; 10 auth/15 min)
- [x] Helmet security headers
- [x] bcrypt password hashing

### 👨‍💼 Admin Panel
- [x] Platform stats dashboard (users, vendors, orders, revenue)
- [x] Revenue charts — Bar, Line, Doughnut (Chart.js)
- [x] Top vendors & top products analytics
- [x] Vendor approval / rejection / suspension workflow
- [x] User management — activate / deactivate accounts
- [x] All orders view with status breakdown
- [x] Period selector: 7d / 30d / 90d / 1y

### 🏪 Vendor Panel
- [x] Vendor registration with admin approval flow
- [x] Dashboard with revenue, orders, products, low-stock alerts
- [x] Add / Edit / Delete products (with image URLs, specs, tags)
- [x] Product stock management with low-stock threshold alerts
- [x] View and update order item statuses (Pending → Confirmed → Shipped → Delivered)
- [x] Vendor analytics with charts
- [x] Store settings & account profile management
- [x] Notification centre

### 👤 Customer / User
- [x] Product browsing with search, filters (category, price, brand, rating, stock)
- [x] Sort by price, rating, popularity, newest
- [x] Product detail page with images, specs, reviews, related products
- [x] Star ratings + verified-purchase badge
- [x] Cart with quantity controls, coupon codes, GST calculation
- [x] Free shipping threshold (₹499+) with progress indicator
- [x] 3-step checkout: Address → Payment → Review
- [x] Multiple saved addresses (Home / Work / Other)
- [x] Payment methods: COD, UPI, Card, Net Banking
- [x] Order history with status timeline
- [x] Order detail with tracking
- [x] Cancel order (allowed on pending/confirmed)
- [x] Wishlist with move-to-cart
- [x] Notification centre

### 🛒 Order Management
- [x] Multi-vendor order splitting (per vendor)
- [x] Order number generation (SMYYMMDDxxxx)
- [x] Sequential status flow with validation
- [x] Stock auto-decrement on order, auto-restore on cancel
- [x] Status history log
- [x] Commission tracking per transaction

### 💾 Database (PostgreSQL)
- [x] 15 tables: users, vendor_profiles, categories, products, product_reviews, user_addresses, cart_items, wishlists, orders, order_items, order_status_history, coupons, notifications, platform_settings, transactions
- [x] UUID primary keys
- [x] Indexed for performance
- [x] Seed data (admin user, 8 categories, platform settings)

---

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### 1️⃣ Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE shopmart_db;
\q

# Run schema
psql -U postgres -d shopmart_db -f database/schema.sql
```

---

### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# → Edit .env with your DB credentials, JWT secrets, etc.

# Start development server
npm run dev
# API runs on http://localhost:5000
```

#### Key .env values to set:
| Variable | Example |
|---|---|
| `DB_PASSWORD` | your postgres password |
| `JWT_SECRET` | long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | different long random string |
| `FRONTEND_URL` | `http://localhost:3000` |

---

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs on http://localhost:3000
```

---

### 4️⃣ Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopmart.com` | Set manually after running schema |

> To set admin password:
> ```sql
> -- Generate hash for "Admin@123" using bcryptjs then:
> UPDATE users SET password_hash = '$2b$10$YOUR_HASH' WHERE email = 'admin@shopmart.com';
> ```
> Or use the register endpoint, then update role to 'admin' in DB.

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/register/vendor` | Register vendor |
| POST | `/api/auth/login` | Login (all roles) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Get current user |

### Products (Public)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List all (search, filter, paginate) |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/categories` | All categories |
| GET | `/api/products/:id` | Single product + reviews |

### Cart (User)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cart` | Get cart with summary |
| POST | `/api/cart/add` | Add item |
| PUT | `/api/cart/items/:id` | Update quantity |
| DELETE | `/api/cart/items/:id` | Remove item |
| POST | `/api/cart/apply-coupon` | Validate coupon |
| GET/POST | `/api/cart/wishlist` | Wishlist |
| GET/POST | `/api/cart/addresses` | Addresses |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | User's orders |
| GET | `/api/orders/:id` | Order detail |
| PUT | `/api/orders/:id/cancel` | Cancel order |
| GET | `/api/orders/vendor` | Vendor's orders |
| PUT | `/api/orders/vendor/items/:id/status` | Update item status |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/analytics` | Revenue analytics |
| GET | `/api/admin/vendors` | All vendors |
| PUT | `/api/admin/vendors/:id/status` | Approve/reject |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/toggle` | Toggle active |
| GET | `/api/admin/orders` | All orders |

---

## 🔮 Future Enhancements (Roadmap)

| Feature | Status |
|---|---|
| Razorpay / Stripe payment integration | 🔜 Ready to plug in |
| Cloudinary image upload for products | 🔜 Config exists in .env |
| Email notifications (Nodemailer) | 🔜 SMTP config in .env |
| Real-time updates (Socket.io) | 📋 Planned |
| AI product recommendations | 📋 Planned |
| React Native mobile app | 📋 Planned |
| Docker + CI/CD deployment | 📋 Planned |
| Admin coupon management UI | 📋 Planned |
| Vendor payout system | 📋 Planned |
| Product image gallery (multi-upload) | 📋 Planned |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, Axios, Chart.js, React Router v6 |
| Backend | Node.js, Express.js, JWT, bcryptjs, Helmet, Morgan |
| Database | PostgreSQL, node-postgres (pg) |
| Icons | React Icons (Feather) |
| Notifications | react-hot-toast |
| Fonts | Plus Jakarta Sans, Space Grotesk |

---

## 📸 Key Pages

| Page | Route | Access |
|---|---|---|
| Home | `/` | Public |
| Products | `/products` | Public |
| Product Detail | `/product/:id` | Public |
| Cart | `/cart` | User |
| Checkout | `/checkout` | User |
| Orders | `/orders` | User |
| Wishlist | `/wishlist` | User |
| Admin Dashboard | `/admin` | Admin |
| Admin Vendors | `/admin/vendors` | Admin |
| Admin Users | `/admin/users` | Admin |
| Admin Orders | `/admin/orders` | Admin |
| Vendor Dashboard | `/vendor` | Vendor |
| Vendor Products | `/vendor/products` | Vendor |
| Vendor Orders | `/vendor/orders` | Vendor |
| Store Settings | `/vendor/profile` | Vendor |

---

*Built with ❤️ — ShopMart Platform v1.0*
