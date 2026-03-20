import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl font-black shadow">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold capitalize mt-1 inline-block">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {['profile', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 -mb-px transition ${tab === t ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-600'}`}>{t}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 mb-2">Personal Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user?.email} disabled className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 XXXXX XXXXX" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 mb-2">Change Password</h3>
          {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input type="password" value={pwForm[field]} onChange={e => setPwForm(p => ({...p, [field]: e.target.value}))} className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
            </div>
          ))}
          <button onClick={changePassword} disabled={saving} className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-6 py-2.5 rounded-full transition disabled:opacity-60">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  );
}
