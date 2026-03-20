import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending','confirmed','processing','shipped','delivered'];
const STATUS_COLORS = { pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800', processing:'bg-indigo-100 text-indigo-800', shipped:'bg-purple-100 text-purple-800', delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800', refunded:'bg-gray-100 text-gray-800' };
const STATUS_ICONS = { pending:'⏳', confirmed:'✅', processing:'⚙️', shipped:'🚚', delivered:'📦', cancelled:'❌', refunded:'↩️' };

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    orderAPI.getAll({ status: filter || undefined })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {Array.from({length:3}).map((_,i) => <div key={i} className="bg-white rounded-xl p-6 mb-4 animate-pulse h-32" />)}
    </div>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === s ? 'bg-orange-400 text-gray-900' : 'bg-white border hover:bg-gray-50 text-gray-700'}`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Orders'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
          <Link to="/products" className="bg-orange-400 text-gray-900 font-bold px-6 py-2.5 rounded-full hover:bg-orange-500">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
              <div className="bg-gray-50 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Order #{order.order_number}</span>
                  <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || ''}`}>{STATUS_ICONS[order.status]} {order.status?.toUpperCase()}</span>
                  <span className="font-bold text-gray-900">₹{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex gap-3 overflow-x-auto">
                  {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items)?.slice(0,3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 flex-shrink-0">
                      <img src={item.product_image || 'https://via.placeholder.com/50?text=P'} alt="" className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1" onError={e => { e.target.src = 'https://via.placeholder.com/50?text=P'; }} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 max-w-[150px] truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.item_count > 3 && <span className="text-sm text-gray-500 self-center">+{order.item_count - 3} more</span>}
                </div>
                <Link to={`/orders/${order.id}`} className="bg-white border border-orange-400 text-orange-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-orange-50 flex-shrink-0 transition">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderAPI.getOne(id)
      .then(({ data }) => { setOrder(data.order); setItems(data.items || []); setHistory(data.history || []); })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderAPI.cancel(id, { reason: 'Cancelled by customer' });
      toast.success('Order cancelled');
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot cancel order'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="max-w-screen-xl mx-auto px-4 py-16 text-center"><div className="animate-spin w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full mx-auto" /></div>;
  if (!order) return <div className="max-w-screen-xl mx-auto px-4 py-16 text-center text-gray-500">Order not found</div>;

  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm text-orange-500 hover:underline">← Back to Orders</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        {['pending','confirmed'].includes(order.status) && (
          <button onClick={cancelOrder} disabled={cancelling} className="border border-red-400 text-red-500 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 text-sm transition">
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Status tracker */}
      {!['cancelled','refunded'].includes(order.status) && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="font-bold text-gray-800 mb-6">Order Status</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${i <= currentStep ? 'bg-orange-400 shadow-lg' : 'bg-gray-200'}`}>
                    {i < currentStep ? '✓' : STATUS_ICONS[s]}
                  </div>
                  <p className={`text-xs mt-1.5 font-medium capitalize ${i <= currentStep ? 'text-orange-600' : 'text-gray-400'}`}>{s}</p>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${i < currentStep ? 'bg-orange-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          {order.estimated_delivery && order.status !== 'delivered' && (
            <p className="text-sm text-teal-600 mt-4 text-center">📅 Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day:'numeric', month:'long' })}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <img src={item.product_image || 'https://via.placeholder.com/70?text=P'} alt="" className="w-16 h-16 rounded-lg object-contain bg-gray-50 p-1" onError={e => { e.target.src = 'https://via.placeholder.com/70?text=P'; }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.store_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                      <span className="font-bold text-sm">₹{Number(item.unit_price).toLocaleString()}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}`}>{STATUS_ICONS[item.status]} {item.status}</span>
                    {item.tracking_number && <p className="text-xs text-blue-600 mt-1">Tracking: {item.tracking_number}</p>}
                  </div>
                  <span className="font-bold text-gray-900">₹{Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4">Order Activity</h2>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0 mt-1" />
                      {i < history.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-0.5" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-semibold capitalize">{h.status}</p>
                      {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                      <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Delivery Address</h3>
            <p className="text-sm font-semibold">{addr?.name}</p>
            <p className="text-sm text-gray-600">{addr?.phone}</p>
            <p className="text-sm text-gray-600">{addr?.address}</p>
            <p className="text-sm text-gray-600">{addr?.city}, {addr?.state} - {addr?.pincode}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Payment</h3>
            <p className="text-sm text-gray-700 capitalize">{order.payment_method?.replace(/_/g, ' ')}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.payment_status}</span>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Price Breakdown</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{Number(order.subtotal).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{Number(order.shipping_amount) === 0 ? 'FREE' : `₹${order.shipping_amount}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">GST</span><span>₹{Number(order.tax_amount).toLocaleString()}</span></div>
              {Number(order.discount_amount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₹{Number(order.discount_amount).toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>₹{Number(order.total_amount).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
