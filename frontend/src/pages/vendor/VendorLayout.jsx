// VendorLayout.jsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import {
  FiHome, FiPackage, FiShoppingBag, FiBarChart2, FiSettings,
  FiLogOut, FiPlusCircle, FiAlertTriangle, FiChevronRight
} from 'react-icons/fi';

const navItems = [
  { path: '/vendor', icon: <FiHome size={18} />, label: 'Dashboard', exact: true },
  { path: '/vendor/products', icon: <FiPackage size={18} />, label: 'Products' },
  { path: '/vendor/products/add', icon: <FiPlusCircle size={18} />, label: 'Add Product' },
  { path: '/vendor/orders', icon: <FiShoppingBag size={18} />, label: 'Orders' },
  { path: '/vendor/analytics', icon: <FiBarChart2 size={18} />, label: 'Analytics' },
  { path: '/vendor/profile', icon: <FiSettings size={18} />, label: 'Store Settings' },
];

export const VendorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);
  const handleLogout = async () => { await logout(); navigate('/'); };

  // Check vendor approval
  const vendorStatus = user?.vendorStatus?.approval_status;
  if (vendorStatus && vendorStatus !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl border p-8 max-w-md text-center shadow-xl">
          <FiAlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-black text-gray-900">Account {vendorStatus === 'pending' ? 'Under Review' : vendorStatus}</h2>
          <p className="text-gray-500 mt-2 text-sm">
            {vendorStatus === 'pending'
              ? 'Your vendor application is being reviewed. You\'ll be notified once approved.'
              : vendorStatus === 'rejected'
              ? 'Your application was rejected. Please contact support.'
              : 'Your account has been suspended. Please contact support.'}
          </p>
          <Link to="/" className="mt-6 inline-block bg-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="flex flex-col w-60 bg-white border-r shrink-0">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {user?.vendorStatus?.store_name?.[0] || user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-800 truncate">{user?.vendorStatus?.store_name || 'My Store'}</p>
              <p className="text-xs text-green-600 font-medium">Vendor Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-xl transition " +
                (isActive(item.path, item.exact) ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800')}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {isActive(item.path, item.exact) && <FiChevronRight size={14} className="ml-auto text-green-600" />}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition text-sm">
            <FiLogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
