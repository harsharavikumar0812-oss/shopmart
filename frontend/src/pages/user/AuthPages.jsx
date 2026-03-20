// LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    const result = await login(form);
    setLoading(false);
    if (result.success) {
      const redirect = params.get('redirect');
      if (redirect) navigate(redirect);
      else if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'vendor') navigate('/vendor');
      else navigate('/');
    } else {
      setError(result.message);
    }
  };

  const demoLogin = async (role) => {
    const demos = {
      admin: { email: 'admin@shopmart.com', password: 'Admin@123' },
      vendor: { email: 'vendor@shopmart.com', password: 'Vendor@123' },
      user: { email: 'user@shopmart.com', password: 'User@123' },
    };
    setForm(demos[role]);
    setLoading(true);
    const result = await login(demos[role]);
    setLoading(false);
    if (result.success) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'vendor') navigate('/vendor');
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-yellow-400 text-blue-900 font-black px-3 py-1.5 rounded-lg text-xl">SM</div>
            <span className="text-white font-bold text-2xl">ShopMart</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="text-blue-200 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition text-sm shadow-md disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'admin', label: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { role: 'vendor', label: 'Vendor', color: 'bg-green-50 text-green-700 border-green-200' },
                { role: 'user', label: 'Customer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              ].map((d) => (
                <button key={d.role} onClick={() => demoLogin(d.role)} disabled={loading}
                  className={"border text-xs font-semibold py-2 rounded-lg transition hover:opacity-80 disabled:opacity-50 " + d.color}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-700 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// RegisterPage.jsx
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { authAPI } = await import('../../services/api');
      await authAPI.register(form);
      const result = await login({ email: form.email, password: form.password });
      if (result.success) navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-yellow-400 text-blue-900 font-black px-3 py-1.5 rounded-lg text-xl">SM</div>
            <span className="text-white font-bold text-2xl">ShopMart</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Create Account</h1>
          <p className="text-blue-200 mt-2">Join millions of happy shoppers</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'john@example.com' },
              { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '9876543210' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition text-sm shadow-md disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-700 font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Want to sell?{' '}
            <Link to="/vendor/register" className="text-green-600 font-semibold hover:underline">Register as Vendor</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
