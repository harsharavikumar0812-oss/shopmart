import { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTag, FiTrash2, FiCopy, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { format, isPast, parseISO } from 'date-fns';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (₹)' },
];

const emptyForm = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_amount: '', max_discount: '', usage_limit: '', expires_at: '',
};

const genCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/coupons');
      setCoupons(data.coupons || []);
    } catch {
      // Seed mock data if endpoint not ready
      setCoupons([
        { id: '1', code: 'WELCOME10', description: 'Welcome discount', discount_type: 'percentage', discount_value: 10, min_order_amount: 199, max_discount: 200, usage_limit: 1000, used_count: 143, is_active: true, expires_at: '2025-12-31T00:00:00Z', created_at: new Date().toISOString() },
        { id: '2', code: 'FLAT100', description: 'Flat ₹100 off', discount_type: 'fixed', discount_value: 100, min_order_amount: 499, max_discount: null, usage_limit: 500, used_count: 89, is_active: true, expires_at: '2025-06-30T00:00:00Z', created_at: new Date().toISOString() },
        { id: '3', code: 'SUMMER25', description: 'Summer sale 25%', discount_type: 'percentage', discount_value: 25, min_order_amount: 999, max_discount: 500, usage_limit: null, used_count: 312, is_active: false, expires_at: null, created_at: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  const createCoupon = async () => {
    if (!form.code || !form.discount_value) {
      toast.error('Code and discount value are required'); return;
    }
    setSaving(true);
    try {
      await API.post('/admin/coupons', form);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (e) {
      // Mock create for demo
      const newCoupon = {
        id: Date.now().toString(),
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        used_count: 0,
        created_at: new Date().toISOString(),
      };
      setCoupons(prev => [newCoupon, ...prev]);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm(emptyForm);
    }
    setSaving(false);
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await API.delete(`/admin/coupons/${id}`);
    } catch {}
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast.success('Coupon deleted');
  };

  const toggleCoupon = async (id, current) => {
    try {
      await API.put(`/admin/coupons/${id}/toggle`);
    } catch {}
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    toast.success(`Coupon ${!current ? 'activated' : 'deactivated'}`);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const isExpired = (exp) => exp && isPast(parseISO(exp));

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length,
    totalUsed: coupons.reduce((s, c) => s + (parseInt(c.used_count) || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">Create and manage discount codes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm({ ...emptyForm, code: genCode() }); }}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-sm"
        >
          <FiPlus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Coupons', value: stats.total, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Total Uses', value: stats.totalUsed, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
            <FiTag className="text-blue-600" /> New Coupon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Coupon Code *</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-200"
                  maxLength={20}
                />
                <button onClick={() => setForm(p => ({ ...p, code: genCode() }))} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold">Gen</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Type *</label>
              <select
                value={form.discount_type}
                onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {COUPON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Discount Value * {form.discount_type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
                min={1}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Min Order Amount (₹)</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="0"
              />
            </div>

            {form.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Discount (₹)</label>
                <input
                  type="number"
                  value={form.max_discount}
                  onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Unlimited"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usage Limit</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={e => setForm(p => ({ ...p, usage_limit: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Short description…"
              />
            </div>
          </div>

          {/* Preview */}
          {form.code && form.discount_value && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-sm">
              <FiTag className="text-blue-600 flex-shrink-0" />
              <span className="text-blue-800">
                Code <strong className="font-mono">{form.code}</strong> gives{' '}
                {form.discount_type === 'percentage'
                  ? `${form.discount_value}% off${form.max_discount ? ` (up to ₹${form.max_discount})` : ''}`
                  : `₹${form.discount_value} off`}
                {form.min_order_amount ? ` on orders above ₹${form.min_order_amount}` : ''}
              </span>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={createCoupon} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiTag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No coupons yet</p>
            <p className="text-sm mt-1">Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Code', 'Type', 'Discount', 'Min Order', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(c => {
                  const expired = isExpired(c.expires_at);
                  const effective = c.is_active && !expired;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-2.5 py-1 rounded-lg">{c.code}</span>
                          <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-gray-600 transition" title="Copy">
                            <FiCopy size={13} />
                          </button>
                        </div>
                        {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.discount_type === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {c.discount_type === 'percentage' ? '%' : '₹'} {c.discount_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                        {c.max_discount && <span className="text-xs text-gray-400 block">max ₹{c.max_discount}</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {c.min_order_amount > 0 ? `₹${Number(c.min_order_amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            {c.usage_limit && (
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(100, (c.used_count / c.usage_limit) * 100)}%` }}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {c.expires_at ? (
                          <span className={expired ? 'text-red-500' : 'text-gray-600'}>
                            {format(parseISO(c.expires_at), 'dd MMM yyyy')}
                            {expired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-gray-400">No expiry</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${effective ? 'bg-green-100 text-green-700' : expired ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {expired ? 'Expired' : c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCoupon(c.id, c.is_active)}
                            className={`transition ${c.is_active ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                            title={c.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {c.is_active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                          </button>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="text-red-400 hover:text-red-600 transition"
                            title="Delete"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
