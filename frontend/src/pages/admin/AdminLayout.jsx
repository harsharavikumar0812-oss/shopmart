// AdminLayout.jsx
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import {
  FiHome, FiUsers, FiShoppingBag, FiPackage, FiGrid,
  FiSettings, FiLogOut, FiMenu, FiX, FiBarChart2, FiTag,
  FiBell, FiChevronRight
} from 'react-icons/fi';

const navItems = [
  { path: '/admin', icon: <FiHome size={18} />, label: 'Dashboard', exact: true },
  { path: '/admin/vendors', icon: <FiGrid size={18} />, label: 'Vendors' },
  { path: '/admin/users', icon: <FiUsers size={18} />, label: 'Users' },
  { path: '/admin/orders', icon: <FiShoppingBag size={18} />, label: 'Orders' },
  { path: '/admin/products', icon: <FiPackage size={18} />, label: 'Products' },
  { path: '/admin/analytics', icon: <FiBarChart2 size={18} />, label: 'Analytics' },
  { path: '/admin/coupons', icon: <FiTag size={18} />, label: 'Coupons' },
];

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={"flex flex-col bg-gray-900 transition-all duration-300 " + (collapsed ? 'w-16' : 'w-60')}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 text-blue-900 font-black px-2 py-1 rounded text-sm">SM</div>
              <span className="text-white font-bold">Admin Panel</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white transition">
            {collapsed ? <FiMenu size={20} /> : <FiX size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg transition group " +
                (isActive(item.path, item.exact)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white')}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {!collapsed && isActive(item.path, item.exact) && <FiChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-800 p-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-gray-500 text-[10px]">Administrator</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 transition"
          >
            <FiLogOut size={16} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
