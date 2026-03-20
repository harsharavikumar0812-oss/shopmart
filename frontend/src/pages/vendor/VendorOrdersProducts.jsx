// VendorOrders.jsx
import { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { StatusBadge } from '../admin/AdminDashboard';
import { FiTruck, FiPackage, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [trackingNum, setTrackingNum] = useState('');

  useEffect(() => { load(); }, [page, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getVendorOrders({ page, limit: 10, status: statusFilter });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  const nextStatus = { pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered' };
  const statusLabels = { pending: 'Confirm', confirmed: 'Mark Processing', processing: 'Ship', shipped: 'Mark Delivered' };

  const handleStatusUpdate = async (itemId, currentStatus) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    if (next === 'shipped') {
      setModal({ itemId, currentStatus });
      return;
    }
    try {
      await orderAPI.updateItemStatus(itemId, { status: next });
      toast.success(`Order ${next}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const confirmShip = async () => {
    try {
      await orderAPI.updateItemStatus(modal.itemId, { status: 'shipped', trackingNumber: trackingNum });
      toast.success('Order shipped!');
      setModal(null);
      setTrackingNum('');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const statusTabs = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <p className="text-gray-400 text-sm">{total} total orders</p>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {statusTabs.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={"whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition " +
              (statusFilter === s ? 'bg-green-600 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50')}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <FiPackage size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 font-medium">No orders found</p>
          </div>
        ) : orders.map((o) => (
          <div key={o.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-sm font-bold text-blue-700">{o.order_number}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-semibold text-gray-800">{o.product_name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Customer: {o.customer_name} | Qty: {o.quantity} | Rs.{parseFloat(o.total_price).toLocaleString()}
                </p>
                {o.tracking_number && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <FiTruck size={12} /> Tracking: <span className="font-mono">{o.tracking_number}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{new Date(o.order_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
              </div>
              <div className="shrink-0">
                {nextStatus[o.status] && (
                  <button
                    onClick={() => handleStatusUpdate(o.id, o.status)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    {o.status === 'processing' ? <FiTruck size={14} /> : <FiCheck size={14} />}
                    {statusLabels[o.status]}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ship Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTruck className="text-blue-600" /> Mark as Shipped
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tracking Number (optional)</label>
              <input type="text" value={trackingNum} onChange={(e) => setTrackingNum(e.target.value)}
                placeholder="e.g. INDPOST123456" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={confirmShip} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Confirm Shipped
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// VendorProducts.jsx
export const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = typeof window !== 'undefined' ? require('react-router-dom').useNavigate() : null;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const { productAPI } = await import('../../services/api');
      const { data } = await productAPI.getVendorProducts({ page, limit: 10, search });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      const { productAPI } = await import('../../services/api');
      await productAPI.delete(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-gray-400 text-sm">{total} products in your store</p>
        </div>
        <button onClick={() => navigate('/vendor/products/add')}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition">
          + Add Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search products..." className="w-full pl-4 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              {['Product', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products yet. Add your first product!</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                    <div>
                      <p className="font-semibold text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-800">Rs.{parseFloat(p.price).toLocaleString()}</p>
                  {p.original_price > p.price && (
                    <p className="text-xs text-gray-400 line-through">Rs.{parseFloat(p.original_price).toLocaleString()}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={"font-semibold text-sm " + (p.stock <= 10 ? 'text-red-600' : p.stock <= 20 ? 'text-orange-500' : 'text-green-600')}>
                    {p.stock}
                  </span>
                  {p.stock <= 10 && <p className="text-xs text-red-500">Low stock!</p>}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold">{(parseFloat(p.rating) || 0).toFixed(1)} ⭐</span>
                  <p className="text-xs text-gray-400">{p.review_count || 0} reviews</p>
                </td>
                <td className="px-5 py-4">
                  <span className={"px-2.5 py-0.5 rounded-full text-xs font-semibold " + (p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/vendor/products/edit/${p.id}`)}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                      Edit
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
