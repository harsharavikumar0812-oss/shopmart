// src/components/shared/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore, useNotificationStore } from '../../store';
import {
  FiShoppingCart, FiSearch, FiUser, FiHeart, FiMenu, FiX,
  FiBell, FiLogOut, FiPackage, FiSettings, FiChevronDown, FiHome,
  FiGrid, FiTag
} from 'react-icons/fi';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { items, summary, isOpen, setOpen, fetchCart } = useCartStore();
  const { notifications, unreadCount, fetch: fetchNotifs } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifMenu, setNotifMenu] = useState(false);
  const [categoryMenu, setCategoryMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) { fetchCart(); fetchNotifs(); }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false); setNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '💻' },
    { name: 'Fashion', slug: 'fashion', icon: '👗' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠' },
    { name: 'Books', slug: 'books', icon: '📚' },
    { name: 'Sports', slug: 'sports', icon: '⚽' },
    { name: 'Beauty', slug: 'beauty', icon: '💄' },
    { name: 'Toys', slug: 'toys', icon: '🧸' },
    { name: 'Grocery', slug: 'grocery', icon: '🛒' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-300 text-xs py-1 px-4 flex justify-between items-center">
        <span>🚚 Free delivery on orders above ₹499</span>
        <div className="flex gap-4">
          {!user && <Link to="/vendor/register" className="hover:text-yellow-400 transition">Sell on ShopMart</Link>}
          <Link to="/track-order" className="hover:text-yellow-400 transition">Track Order</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-blue-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-yellow-400 text-blue-900 font-black px-2 py-1 rounded text-lg leading-none">SM</div>
              <span className="text-white font-bold text-xl hidden sm:block">ShopMart</span>
            </Link>

            {/* Category Dropdown */}
            <div className="relative hidden md:block shrink-0">
              <button
                onClick={() => setCategoryMenu(!categoryMenu)}
                className="flex items-center gap-1 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition"
              >
                <FiMenu size={16} /> All <FiChevronDown size={14} />
              </button>
              {categoryMenu && (
                <div className="absolute top-full left-0 w-56 bg-white shadow-2xl rounded-lg py-2 z-50">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/products?category=${c.slug}`}
                      onClick={() => setCategoryMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span>{c.icon}</span> {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  className="flex-1 px-4 py-2 text-sm rounded-l-full border-0 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-r-full text-gray-900 transition"
                >
                  <FiSearch size={18} />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-auto" ref={userMenuRef}>
              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => { setNotifMenu(!notifMenu); setUserMenu(false); }}
                    className="relative p-2 text-white hover:bg-blue-600 rounded-full transition"
                  >
                    <FiBell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifMenu && (
                    <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-2xl rounded-xl overflow-hidden z-50">
                      <div className="bg-blue-700 text-white px-4 py-3 font-semibold flex justify-between">
                        <span>Notifications</span>
                        <span className="text-xs opacity-70 cursor-pointer hover:opacity-100" onClick={() => useNotificationStore.getState().markRead()}>Mark all read</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
                        ) : notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                            <p className="text-sm font-medium text-gray-800">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist */}
              {user && user.role === 'user' && (
                <Link to="/wishlist" className="p-2 text-white hover:bg-blue-600 rounded-full transition hidden sm:block">
                  <FiHeart size={22} />
                </Link>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => { setUserMenu(!userMenu); setNotifMenu(false); }}
                  className="flex items-center gap-1 text-white hover:bg-blue-600 px-3 py-2 rounded-lg transition"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <FiUser size={20} />
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-[10px] opacity-80">Hello, {user ? user.name.split(' ')[0] : 'Sign In'}</div>
                    <div className="text-xs font-semibold">{user ? 'My Account' : 'Sign in'}</div>
                  </div>
                  <FiChevronDown size={14} />
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white shadow-2xl rounded-xl overflow-hidden z-50">
                    {!user ? (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <p className="font-semibold">Welcome to ShopMart</p>
                          <p className="text-xs opacity-80">Sign in for a personalized experience</p>
                        </div>
                        <Link to="/login" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b">
                          <FiUser size={16} /> Sign In
                        </Link>
                        <Link to="/register" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50">
                          New Customer? Register
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs opacity-80 truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' && (
                          <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 font-semibold border-b">
                            <FiSettings size={16} /> Admin Panel
                          </Link>
                        )}
                        {user.role === 'vendor' && (
                          <Link to="/vendor" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-green-700 hover:bg-green-50 font-semibold border-b">
                            <FiGrid size={16} /> Vendor Dashboard
                          </Link>
                        )}
                        {user.role === 'user' && (
                          <>
                            <Link to="/orders" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                              <FiPackage size={16} /> My Orders
                            </Link>
                            <Link to="/profile" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                              <FiUser size={16} /> My Profile
                            </Link>
                            <Link to="/wishlist" onClick={() => setUserMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b">
                              <FiHeart size={16} /> Wishlist
                            </Link>
                          </>
                        )}
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                          <FiLogOut size={16} /> Logout
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              {user?.role !== 'admin' && user?.role !== 'vendor' && (
                <button
                  onClick={() => setOpen(true)}
                  className="relative flex items-center gap-1 text-white hover:bg-blue-600 px-3 py-2 rounded-lg transition"
                >
                  <FiShoppingCart size={22} />
                  <div className="hidden sm:block text-left">
                    <div className="text-[10px] opacity-80">Cart</div>
                    <div className="text-xs font-semibold">{summary.itemCount || 0} items</div>
                  </div>
                  {summary.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {summary.itemCount > 9 ? '9+' : summary.itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="text-white md:hidden ml-2">
              {mobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Category Bar */}
          <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className="text-blue-100 hover:text-white text-xs whitespace-nowrap px-3 py-1 rounded-full hover:bg-blue-600 transition"
              >
                {c.icon} {c.name}
              </Link>
            ))}
            <Link to="/products?sort=popular" className="text-yellow-300 hover:text-yellow-200 text-xs whitespace-nowrap px-3 py-1 rounded-full hover:bg-blue-600 transition font-semibold">
              🔥 Best Sellers
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t shadow-lg px-4 py-4">
            <form onSubmit={handleSearch} className="flex mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-yellow-400 px-4 rounded-r-lg">
                <FiSearch />
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/products?category=${c.slug}`}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-2 text-sm text-gray-700 py-2 px-3 rounded-lg hover:bg-blue-50"
                >
                  {c.icon} {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
