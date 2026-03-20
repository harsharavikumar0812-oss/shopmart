import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import Navbar from './components/shared/Navbar';
import CartDrawer from './components/shared/CartDrawer';
import HomePage from './pages/user/HomePage';
import ProductsPage from './pages/user/ProductsPage';
import { LoginPage, RegisterPage } from './pages/user/AuthPages';
import { VendorRegisterPage, AddProductPage } from './pages/vendor/VendorPages';
import VendorProfile from './pages/vendor/VendorProfile';
import { AdminLayout } from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import { VendorLayout } from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import { VendorOrders, VendorProducts } from './pages/vendor/VendorOrdersProducts';
import { lazy, Suspense } from 'react';

const ProductDetailPage = lazy(() => import('./pages/user/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/user/CartPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/user/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/user/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/user/WishlistPage'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));

const ProtectedRoute = ({ roles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

const GuestRoute = () => {
  const { user } = useAuthStore();
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const UserLayout = () => (
  <>
    <Navbar />
    <CartDrawer />
    <Outlet />
  </>
);

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      <p className="text-gray-400 mt-2">Coming Soon</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontWeight: '600', fontSize: '13px' },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route element={<ProtectedRoute roles={['user']} />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<PlaceholderPage title="My Profile" />} />
            </Route>
          </Route>

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="/vendor/register" element={<VendorRegisterPage />} />

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={['vendor']} />}>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorDashboard />} />
              <Route path="products" element={<VendorProducts />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="analytics" element={<VendorDashboard />} />
              <Route path="profile" element={<VendorProfile />} />
            </Route>
          </Route>

          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-8xl font-black text-gray-200 mb-4">404</div>
                <h2 className="text-2xl font-bold text-gray-700">Page Not Found</h2>
                <a href="/" className="mt-6 inline-block bg-blue-700 text-white px-6 py-3 rounded-full font-semibold">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
