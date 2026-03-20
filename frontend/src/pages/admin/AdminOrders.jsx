import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  refunded:   'bg-gray-100 text-gray-600',
};
const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await adminAPI.getOrders(params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const pages = Math.ceil(total / 12);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${statusFilter === s ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search order # or customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📦</div>
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Order #', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <>
                      <tr key={order.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-blue-700 text-sm">{order.order_number}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-sm text-gray-900">{order.customer_name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{order.customer_email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 text-center">{order.item_count}</td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900">₹{Number(order.total_amount).toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : order.payment_status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {order.created_at ? format(new Date(order.created_at), 'dd MMM yy') : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            {expanded === order.id ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </td>
                      </tr>
                      {expanded === order.id && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={8} className="px-5 py-4 bg-blue-50/40">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Subtotal</p>
                                <p>₹{Number(order.subtotal).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Shipping</p>
                                <p>{Number(order.shipping_amount) === 0 ? 'FREE' : `₹${order.shipping_amount}`}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Discount</p>
                                <p className="text-green-600">−₹{Number(order.discount_amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Payment Method</p>
                                <p className="uppercase font-semibold">{order.payment_method || '—'}</p>
                              </div>
                              {order.shipping_address && (
                                <div className="col-span-2">
                                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Shipping Address</p>
                                  {(() => {
                                    try {
                                      const addr = typeof order.shipping_address === 'string'
                                        ? JSON.parse(order.shipping_address) : order.shipping_address;
                                      return <p className="text-gray-700">{addr.name} — {addr.address}, {addr.city}, {addr.state} {addr.pincode}</p>;
                                    } catch { return <p className="text-gray-700">—</p>; }
                                  })()}
                                </div>
                              )}
                              {order.notes && (
                                <div className="col-span-2">
                                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">Notes</p>
                                  <p className="text-gray-600 italic">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-sm text-gray-500">Showing {((page-1)*12)+1}–{Math.min(page*12,total)} of {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  {Array.from({length:Math.min(5,pages)},(_,i)=>{
                    const pg = page<=3 ? i+1 : page-2+i;
                    if(pg>pages) return null;
                    return <button key={pg} onClick={()=>setPage(pg)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${pg===page?'bg-blue-600 text-white':'border hover:bg-gray-50'}`}>{pg}</button>;
                  })}
                  <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
