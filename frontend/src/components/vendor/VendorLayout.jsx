import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/vendor', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/vendor/products', label: 'Products', icon: '🛍️' },
  { path: '/vendor/orders', label: 'Orders', icon: '📦' },
  { path: '/vendor/analytics', label: 'Analytics', icon: '📈' },
  { path: '/vendor/profile', label: 'Store Profile', icon: '🏪' },
];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isActive = (item) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-[#0f2027] text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="text-xl font-black"><span className="text-emerald-400">Shop</span>Mart</div>
              <div className="text-xs text-emerald-300 font-semibold">Vendor Panel</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded hover:bg-white/10 transition ml-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive(item) ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-300 hover:bg-white/10'}`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">Vendor</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition text-sm ${collapsed ? 'justify-center' : ''}`}>
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-800">{navItems.find(n => isActive(n))?.label || 'Vendor'}</h1>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← View Store</Link>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-semibold">Vendor</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
