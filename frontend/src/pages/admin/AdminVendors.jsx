import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { StatusBadge } from './AdminDashboard';
import { FiSearch, FiCheck, FiX, FiEye, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => { loadVendors(); }, [page, status]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getVendors({ page, limit: 10, status, search });
      setVendors(data.vendors);
      setTotal(data.total);
    } catch {}
    setLoading(false);
  };

  const handleAction = async (vendorId, newStatus) => {
    if (newStatus === 'rejected' && !reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await adminAPI.updateVendorStatus(vendorId, { status: newStatus, reason });
      toast.success(`Vendor ${newStatus} successfully`);
      setActionModal(null);
      setReason('');
      loadVendors();
    } catch {
      toast.error('Action failed');
    }
  };

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Suspended', value: 'suspended' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Vendor Management</h1>
          <p className="text-gray-400 text-sm">{total} vendors total</p>
        </div>
        <button onClick={loadVendors} className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {statusTabs.map((t) => (
          <button key={t.value} onClick={() => { setStatus(t.value); setPage(1); }}
            className={"px-4 py-1.5 rounded-lg text-sm font-semibold transition " + (status === t.value ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadVendors()}
            placeholder="Search vendors..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Store', 'Owner', 'Category', 'Products', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No vendors found
                  </td>
                </tr>
              ) : vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {v.store_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{v.store_name}</p>
                        <p className="text-xs text-gray-400">{v.city}, {v.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-700">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {v.category || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-gray-700">{v.product_count}</td>
                  <td className="px-5 py-4"><StatusBadge status={v.approval_status} /></td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {v.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => setActionModal({ vendor: v, action: 'approved' })}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            <FiCheck size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ vendor: v, action: 'rejected' })}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            <FiX size={12} /> Reject
                          </button>
                        </>
                      )}
                      {v.approval_status === 'approved' && (
                        <button
                          onClick={() => setActionModal({ vendor: v, action: 'suspended' })}
                          className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          <FiAlertTriangle size={12} /> Suspend
                        </button>
                      )}
                      {(v.approval_status === 'rejected' || v.approval_status === 'suspended') && (
                        <button
                          onClick={() => handleAction(v.id, 'approved')}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          <FiCheck size={12} /> Re-approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {page > 1 && (
          <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Previous</button>
        )}
        <span className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold">{page}</span>
        {vendors.length === 10 && (
          <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Next</button>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionModal.action === 'approved' ? '✅ Approve Vendor' :
               actionModal.action === 'rejected' ? '❌ Reject Vendor' : '⚠️ Suspend Vendor'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Store: <strong>{actionModal.vendor.store_name}</strong> ({actionModal.vendor.name})
            </p>
            {(actionModal.action === 'rejected' || actionModal.action === 'suspended') && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason {actionModal.action === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the reason..."
                  rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(actionModal.vendor.id, actionModal.action)}
                className={"flex-1 py-2.5 rounded-xl font-semibold text-sm transition " +
                  (actionModal.action === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' :
                   actionModal.action === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' :
                   'bg-orange-600 hover:bg-orange-700 text-white')}
              >
                Confirm
              </button>
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendors;
