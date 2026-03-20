import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

// =================== LOGIN ===================
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') navigate('/vendor');
      else navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const setDemo = (role) => {
    const demos = {
      admin: { email: 'admin@shopmart.com', password: 'Admin@123' },
      vendor: { email: 'vendor@shopmart.com', password: 'Vendor@123' },
      user: { email: 'user@shopmart.com', password: 'User@123' },
    };
    setForm(demos[role]);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-black"><span className="text-orange-400">Shop</span><span className="text-gray-800">Mart</span></Link>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In</h2>

          {/* Demo login buttons */}
          <div className="flex gap-2 mb-6">
            {[['admin','purple'], ['vendor','emerald'], ['user','orange']].map(([role, color]) => (
              <button key={role} onClick={() => setDemo(role)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 capitalize border-${color}-400 text-${color}-600 hover:bg-${color}-50 transition`}>
                {role}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mb-4">↑ Quick demo login</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="you@example.com" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="••••••••" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPw ? '🙈' : '👁'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold py-3 rounded-xl transition shadow disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            New to ShopMart? <Link to="/register" className="text-orange-600 font-semibold hover:underline">Create Account</Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            Want to sell? <Link to="/register/vendor" className="text-blue-600 font-semibold hover:underline">Register as Vendor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== REGISTER ===================
export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-black"><span className="text-orange-400">Shop</span><span className="text-gray-800">Mart</span></Link>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[['name', 'Full Name', 'text', 'John Doe'], ['email', 'Email', 'email', 'you@example.com'], ['phone', 'Phone (optional)', 'tel', '+91 XXXXX XXXXX']].map(([key, label, type, ph]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} required={key !== 'phone'} value={form[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))} placeholder={ph} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="At least 6 characters" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{showPw ? '🙈' : '👁'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold py-3 rounded-xl transition shadow disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-orange-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// =================== VENDOR REGISTER ===================
export function VendorRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', storeName:'', storeDescription:'', category:'Electronics', gstin:'', city:'', state:'' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.registerVendor(form);
      toast.success('Registration submitted! Awaiting admin approval.');
      navigate('/login');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-black"><span className="text-orange-400">Shop</span><span className="text-gray-800">Mart</span></Link>
          <p className="text-gray-500 mt-1">Start selling on ShopMart</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            {[1,2].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${step >= s ? 'bg-orange-400' : 'bg-gray-200'}`} />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {step === 1 ? '👤 Account Details' : '🏪 Store Details'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">Step {step} of 2</p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {[['name','Full Name','text','John Doe'], ['email','Email','email','you@store.com'], ['phone','Phone','tel','+91 XXXXX XXXXX']].map(([k,l,t,p]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                    <input type={t} required value={form[k]} onChange={e => setForm(p2 => ({...p2, [k]:e.target.value}))} placeholder={p} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" required value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="At least 6 characters" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
                </div>
                <button type="submit" className="w-full bg-orange-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-orange-500 transition">Continue →</button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                  <input required value={form.storeName} onChange={e => setForm(p => ({...p, storeName:e.target.value}))} placeholder="My Awesome Store" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category:e.target.value}))} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none">
                    {['Electronics','Fashion','Home & Kitchen','Books','Sports','Beauty','Toys','Grocery'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                  <textarea value={form.storeDescription} onChange={e => setForm(p => ({...p, storeDescription:e.target.value}))} placeholder="Tell customers about your store..." rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-300 outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={e => setForm(p => ({...p, city:e.target.value}))} placeholder="Mumbai" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={e => setForm(p => ({...p, state:e.target.value}))} placeholder="Maharashtra" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (optional)</label>
                  <input value={form.gstin} onChange={e => setForm(p => ({...p, gstin:e.target.value}))} placeholder="22AAAAA0000A1Z5" className="w-full border rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-semibold text-sm hover:bg-gray-50">← Back</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-orange-400 text-gray-900 font-bold py-3 rounded-xl hover:bg-orange-500 transition disabled:opacity-60">
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already registered? <Link to="/login" className="text-orange-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
