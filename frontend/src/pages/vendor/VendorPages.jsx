// VendorRegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, productAPI } from '../../services/api';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export const VendorRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    storeName: '', storeDescription: '', category: '', gstin: '', city: '', state: ''
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.registerVendor(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <FiCheckCircle size={56} className="mx-auto text-green-500 mb-5" />
          <h2 className="text-2xl font-black text-gray-900">Application Submitted!</h2>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Your vendor application for <strong>{form.storeName}</strong> has been submitted.
            Our team will review and approve it within 24-48 hours. You'll receive a notification once approved.
          </p>
          <div className="flex gap-3 mt-8">
            <Link to="/login" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition text-sm">
              Login to Dashboard
            </Link>
            <Link to="/" className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-yellow-400 text-blue-900 font-black px-3 py-1.5 rounded-lg text-xl">SM</div>
            <span className="text-white font-bold text-2xl">ShopMart</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Start Selling on ShopMart</h1>
          <p className="text-green-200 mt-2">Join 10,000+ vendors. Zero setup fees. Start selling today.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition " +
                (step >= s ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white')}>
                {s}
              </div>
              <span className={"text-sm font-medium " + (step >= s ? 'text-yellow-300' : 'text-white/50')}>
                {s === 1 ? 'Account Info' : 'Store Details'}
              </span>
              {s < 2 && <div className={"w-12 h-0.5 " + (step > s ? 'bg-yellow-400' : 'bg-white/20')} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <FiAlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 mb-5">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Phone Number *', key: 'phone', type: 'tel', placeholder: '9876543210' },
                    { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'john@store.com', full: true },
                    { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 6 characters', full: true },
                  ].map(f => (
                    <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        value={form[f.key]}
                        onChange={(e) => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.email || !form.password || !form.phone) { setError('Please fill all fields'); return; }
                    setError(''); setStep(2);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                >
                  Continue →
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800 mb-5">Store Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name *</label>
                    <input type="text" value={form.storeName} onChange={(e) => update('storeName', e.target.value)}
                      placeholder="My Awesome Store" className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                    <select value={form.category} onChange={(e) => update('category', e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white">
                      <option value="">Select Category</option>
                      {['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">GSTIN</label>
                    <input type="text" value={form.gstin} onChange={(e) => update('gstin', e.target.value)}
                      placeholder="22AAAAA0000A1Z5" className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                    <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)}
                      placeholder="Mumbai" className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                    <select value={form.state} onChange={(e) => update('state', e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white">
                      <option value="">Select State</option>
                      {['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Pune'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Description</label>
                    <textarea value={form.storeDescription} onChange={(e) => update('storeDescription', e.target.value)}
                      rows={3} placeholder="Describe your store and what you sell..."
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// AddProductPage.jsx
export const AddProductPage = ({ editProduct = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(editProduct || {
    name: '', description: '', shortDescription: '', price: '',
    originalPrice: '', categoryId: '', stock: '', brand: '',
    sku: '', weight: '', images: [], specifications: {}, tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  useState(() => {
    productAPI.getCategories().then(({ data }) => setCategories(data.categories || []));
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addImage = () => {
    if (imageInput.trim()) {
      update('images', [...(form.images || []), imageInput.trim()]);
      setImageInput('');
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      update('tags', [...(form.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId || !form.stock) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      if (editProduct?.id) await productAPI.update(editProduct.id, form);
      else await productAPI.create(form);
      navigate('/vendor/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-gray-400 text-sm">Fill in the product details below</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Basic Information</h3>
          <div>
            <label className="label">Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
              placeholder="Product name" className="input" />
          </div>
          <div>
            <label className="label">Short Description</label>
            <input type="text" value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)}
              placeholder="Brief description (shown in listing)" className="input" />
          </div>
          <div>
            <label className="label">Full Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)}
              placeholder="Detailed product description..." className="input resize-none" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Pricing & Stock</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Selling Price (Rs.) *</label>
              <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)}
                placeholder="0.00" className="input" />
            </div>
            <div>
              <label className="label">Original/MRP Price (Rs.)</label>
              <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)}
                placeholder="0.00" className="input" />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)}
                placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)}
                placeholder="PROD-001" className="input" />
            </div>
          </div>
          {form.price && form.originalPrice && parseFloat(form.originalPrice) > parseFloat(form.price) && (
            <div className="bg-green-50 rounded-lg px-4 py-2 text-sm text-green-700 font-semibold">
              Discount: {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% off
            </div>
          )}
        </div>

        {/* Category & Brand */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Category & Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} className="input bg-white">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Brand</label>
              <input type="text" value={form.brand} onChange={(e) => update('brand', e.target.value)}
                placeholder="Brand name" className="input" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.01" value={form.weight} onChange={(e) => update('weight', e.target.value)}
                placeholder="0.500" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="Press Enter to add tags" className="input" />
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.tags || []).map((t, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => update('tags', form.tags.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Product Images</h3>
          <div className="flex gap-2">
            <input type="url" value={imageInput} onChange={(e) => setImageInput(e.target.value)}
              placeholder="Paste image URL here..." className="input flex-1" />
            <button type="button" onClick={addImage} className="bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
              Add
            </button>
          </div>
          {(form.images || []).length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-full aspect-square object-cover rounded-xl border" />
                  <button type="button" onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60 shadow-lg">
            {loading ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
          </button>
          <button type="button" onClick={() => navigate('/vendor/products')}
            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
        .input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
        .input:focus { ring: 2px; ring-color: #3b82f6; border-color: transparent; box-shadow: 0 0 0 2px #3b82f6; }
      `}</style>
    </div>
  );
};
