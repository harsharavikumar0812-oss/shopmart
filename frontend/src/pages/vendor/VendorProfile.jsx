import { useState, useEffect } from 'react';
import { authAPI, cartAPI } from '../../services/api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import { FiSave, FiUser, FiShoppingBag, FiMapPin, FiLock, FiBell } from 'react-icons/fi';

const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <span className="text-blue-600">{icon}</span>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export default function VendorProfile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({ name: '', phone: '' });
  // Store form
  const [store, setStore] = useState({
    store_name: '', store_description: '', category: '', gstin: '',
    city: '', state: '', address: '', pincode: ''
  });
  // Password form
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  // Notifications
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', phone: user.phone || '' });
      if (user.vendor) {
        setStore({
          store_name: user.vendor.store_name || '',
          store_description: user.vendor.store_description || '',
          category: user.vendor.category || '',
          gstin: user.vendor.gstin || '',
          city: user.vendor.city || '',
          state: user.vendor.state || '',
          address: user.vendor.address || '',
          pincode: user.vendor.pincode || ''
        });
      }
    }
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data } = await cartAPI.getNotifications();
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {}
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profile);
      updateUser(profile);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Passwords do not match'); return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to change password'); }
    setSaving(false);
  };

  const markAllRead = async () => {
    await cartAPI.markRead();
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery', 'Other'];
  const INDIA_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'
  ];

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'store', label: 'Store', icon: <FiShoppingBag /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell />, badge: unread },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile, store and preferences</p>
      </div>

      {/* Store Status Banner */}
      {user?.vendor && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          user.vendor.approval_status === 'approved'
            ? 'bg-green-50 border border-green-200'
            : user.vendor.approval_status === 'pending'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            user.vendor.approval_status === 'approved' ? 'bg-green-500' :
            user.vendor.approval_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <div>
            <p className="font-semibold text-sm text-gray-800">
              Store Status: <span className="capitalize">{user.vendor.approval_status}</span>
            </p>
            {user.vendor.approval_status === 'pending' && (
              <p className="text-xs text-gray-500">Your store is under review. You'll be notified once approved.</p>
            )}
            {user.vendor.approval_status === 'rejected' && user.vendor.rejection_reason && (
              <p className="text-xs text-red-600">Reason: {user.vendor.rejection_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-2xl p-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition relative ${
              tab === t.id ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <Section icon={<FiUser />} title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name">
              <input
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="Phone Number">
              <input
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="+91 9XXXXXXXXX"
              />
            </Field>
            <Field label="Email Address" hint="Contact support to change email">
              <input
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </Field>
            <Field label="Role">
              <input
                value={user?.role || ''}
                disabled
                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
              />
            </Field>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-6 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            <FiSave size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </Section>
      )}

      {/* Store Tab */}
      {tab === 'store' && (
        <Section icon={<FiShoppingBag />} title="Store Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Store Name" hint="This is shown to customers">
              <input
                value={store.store_name}
                onChange={e => setStore(p => ({ ...p, store_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="Category">
              <select
                value={store.category}
                onChange={e => setStore(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Store Description" >
              <textarea
                value={store.store_description}
                onChange={e => setStore(p => ({ ...p, store_description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none col-span-2"
                placeholder="Tell customers about your store…"
              />
            </Field>
            <Field label="GSTIN" hint="15-digit GST Identification Number">
              <input
                value={store.gstin}
                onChange={e => setStore(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 font-mono"
                maxLength={15}
              />
            </Field>
            <Field label="City">
              <input
                value={store.city}
                onChange={e => setStore(p => ({ ...p, city: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="State">
              <select
                value={store.state}
                onChange={e => setStore(p => ({ ...p, state: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select state</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pincode">
              <input
                value={store.pincode}
                onChange={e => setStore(p => ({ ...p, pincode: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={6}
              />
            </Field>
          </div>
          <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
            ⚠️ Store details are reviewed by admin. Significant changes may require re-approval.
          </p>
          <button
            disabled
            className="mt-4 flex items-center gap-2 bg-gray-200 text-gray-500 font-semibold px-6 py-2.5 rounded-xl cursor-not-allowed text-sm"
          >
            <FiSave size={15} /> Save Store Info (coming soon — contact admin)
          </button>
        </Section>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <Section icon={<FiLock />} title="Change Password">
          <div className="max-w-md space-y-4">
            <Field label="Current Password">
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="New Password" hint="Minimum 6 characters">
              <input
                type="password"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  passwords.confirm && passwords.confirm !== passwords.newPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200'
                }`}
              />
              {passwords.confirm && passwords.confirm !== passwords.newPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </Field>
            <button
              onClick={changePassword}
              disabled={saving || !passwords.currentPassword || !passwords.newPassword}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50 text-sm"
            >
              <FiLock size={14} /> {saving ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </Section>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <Section icon={<FiBell />} title="Notifications">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiBell size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifs.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                    !n.is_read ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
