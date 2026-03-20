import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery'];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (user) {
      notificationAPI.getAll().then(({ data }) => {
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }).catch(() => {});
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleNotifOpen = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      await notificationAPI.markRead();
      setUnreadCount(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-gray-800 text-gray-300 text-xs py-1 px-4 hidden md:flex justify-between items-center">
        <span>🇮🇳 Free delivery on orders above ₹499 | COD Available</span>
        <div className="flex gap-4">
          <Link to="/register/vendor" className="hover:text-white">Become a Seller</Link>
          <span>|</span>
          <span>Customer Support: 1800-XXX-XXXX</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-[#131921] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-2xl font-black tracking-tight">
              <span className="text-orange-400">Shop</span>
              <span className="text-white">Mart</span>
              <span className="text-orange-400 text-xs align-super">.in</span>
            </div>
          </Link>

          {/* Delivery location (desktop) */}
          <div className="hidden lg:flex flex-col text-xs cursor-pointer hover:border hover:border-white rounded px-1 py-0.5">
            <span className="text-gray-400">Deliver to</span>
            <span className="font-bold text-white flex items-center gap-1">📍 India</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 flex">
            <select className="bg-gray-200 text-gray-700 text-sm px-2 rounded-l-md border-r border-gray-300 hidden md:block">
              <option>All</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands and more..."
              className="flex-1 px-4 py-2 text-gray-900 text-sm outline-none"
            />
            <button type="submit" className="bg-orange-400 hover:bg-orange-500 px-4 rounded-r-md transition-colors">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Header Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Account */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenu(!userMenu)} className="flex flex-col items-start text-xs hover:border hover:border-white rounded px-2 py-1 transition">
                <span className="text-gray-300">{user ? `Hello, ${user.name?.split(' ')[0]}` : 'Hello, Sign in'}</span>
                <span className="font-bold flex items-center gap-1">Account ▾</span>
              </button>
              {userMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white text-gray-800 rounded-lg shadow-2xl py-2 z-50">
                  {!user ? (
                    <>
                      <div className="px-4 pb-2 border-b">
                        <Link to="/login" className="block bg-orange-400 text-gray-900 text-center py-2 rounded font-semibold text-sm hover:bg-orange-500 mb-2">Sign In</Link>
                        <p className="text-xs text-center">New customer? <Link to="/register" className="text-blue-600 font-semibold">Start here</Link></p>
                      </div>
                      <Link to="/register/vendor" className="block px-4 py-2 text-sm hover:bg-gray-100">Sell on ShopMart</Link>
                    </>
                  ) : (
                    <>
                      {user.role === 'admin' && <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-purple-700">🛡️ Admin Panel</Link>}
                      {user.role === 'vendor' && <Link to="/vendor" className="block px-4 py-2 text-sm hover:bg-gray-100 font-semibold text-blue-700">🏪 Vendor Dashboard</Link>}
                      {user.role === 'user' && (
                        <>
                          <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">My Profile</Link>
                          <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-100">My Orders</Link>
                          <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-100">My Wishlist</Link>
                        </>
                      )}
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">Sign Out</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={handleNotifOpen} className="relative p-1 hover:border hover:border-white rounded px-2 py-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-1 w-80 bg-white text-gray-800 rounded-lg shadow-2xl py-2 z-50 max-h-96 overflow-y-auto">
                    <p className="px-4 py-2 font-bold text-sm border-b">Notifications</p>
                    {notifs.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-500 text-center">No notifications</p>
                    ) : notifs.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 border-b text-sm ${!n.is_read ? 'bg-blue-50' : ''}`}>
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{n.message}</p>
                        <p className="text-gray-400 text-xs mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            {(!user || user.role === 'user') && (
              <Link to="/cart" className="relative flex flex-col items-center text-xs hover:border hover:border-white rounded px-2 py-1 transition">
                <div className="relative">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </div>
                <span className="font-bold hidden md:block">Cart</span>
              </Link>
            )}
          </div>
        </div>

        {/* Categories Nav */}
        <div className="bg-[#232f3e] hidden md:block">
          <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1">
            <Link to="/products" className="text-white text-sm px-3 py-1 rounded hover:bg-[#37475A] whitespace-nowrap font-semibold border border-transparent hover:border-white transition">☰ All</Link>
            {categories.map(cat => (
              <Link key={cat} to={`/category/${cat.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-')}`} className="text-white text-sm px-3 py-1 rounded hover:bg-[#37475A] whitespace-nowrap transition">
                {cat}
              </Link>
            ))}
            <Link to="/products?sort=popular" className="text-orange-400 text-sm px-3 py-1 rounded hover:bg-[#37475A] whitespace-nowrap font-semibold">🔥 Today's Deals</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#131921] text-gray-300 mt-8">
        <div className="bg-[#232f3e] py-4 text-center">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white text-sm hover:text-orange-400 transition">Back to top</button>
        </div>
        <div className="max-w-screen-xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { title: 'Get to Know Us', links: ['About ShopMart', 'Careers', 'Press Releases', 'ShopMart Cares'] },
            { title: 'Make Money with Us', links: ['Sell on ShopMart', 'Become an Affiliate', 'Advertise Your Products'] },
            { title: 'Let Us Help You', links: ['COVID-19 Updates', 'Your Account', 'Returns Centre', 'Help'] },
            { title: 'Connect with Us', links: ['Facebook', 'Twitter', 'Instagram', 'YouTube'] },
          ].map(section => (
            <div key={section.title}>
              <h4 className="text-white font-semibold mb-3">{section.title}</h4>
              {section.links.map(link => (
                <p key={link} className="text-sm text-gray-400 mb-1.5 hover:text-orange-400 cursor-pointer transition">{link}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 py-6 text-center text-sm text-gray-500">
          <div className="flex justify-center gap-2 mb-2">
            <span className="text-2xl font-black"><span className="text-orange-400">Shop</span><span className="text-white">Mart</span><span className="text-orange-400 text-xs align-super">.in</span></span>
          </div>
          <p>© 2025 ShopMart.in — All rights reserved. | <span className="hover:text-white cursor-pointer">Privacy Policy</span> | <span className="hover:text-white cursor-pointer">Terms of Service</span></p>
        </div>
      </footer>
    </div>
  );
}
