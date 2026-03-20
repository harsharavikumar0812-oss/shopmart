import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { StatusBadge } from '../admin/AdminDashboard';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle,
  FiTrendingUp, FiPlusCircle, FiArrowRight
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const VendorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: d } = await orderAPI.getVendorAnalytics({ period });
      setData(d);
    } catch {}
    setLoading(false);
  };

  const stats = data?.stats || {};

  const revenueChartData = {
    labels: data?.dailyRevenue?.map(r => new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Revenue',
      data: data?.dailyRevenue?.map(r => parseFloat(r.revenue)) || [],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const topProductsData = {
    labels: data?.topProducts?.map(p => p.name.slice(0, 15) + '...') || [],
    datasets: [{
      label: 'Units Sold',
      data: data?.topProducts?.map(p => parseInt(p.sold)) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-400 text-sm">Your store performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['7d', '30d', '90d'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={"px-3 py-1 rounded text-sm font-semibold transition " + (period === p ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600')}
              >
                {p}
              </button>
            ))}
          </div>
          <Link to="/vendor/products/add"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow"
          >
            <FiPlusCircle size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total_orders || 0, icon: <FiShoppingBag />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Revenue', value: 'Rs.' + parseFloat(stats.total_revenue || 0).toLocaleString(), icon: <FiDollarSign />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Items Sold', value: stats.items_sold || 0, icon: <FiTrendingUp />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Products', value: stats.total_products || 0, icon: <FiPackage />, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition">
            <div className={"p-3 rounded-xl " + s.bg}>
              <span className={s.color + " text-xl"}>{s.icon}</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className={"text-2xl font-black " + s.color}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats.low_stock_count > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-orange-500" size={20} />
            <div>
              <p className="font-semibold text-orange-800">{stats.low_stock_count} product{stats.low_stock_count > 1 ? 's' : ''} running low on stock</p>
              <p className="text-sm text-orange-600">Please restock to avoid losing sales</p>
            </div>
          </div>
          <Link to="/vendor/products" className="flex items-center gap-1 text-orange-700 font-semibold text-sm hover:underline">
            View Products <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-800 mb-4">Revenue Trend</h3>
          <div style={{ height: 200 }}>
            {data?.dailyRevenue?.length > 0
              ? <Line data={revenueChartData} options={chartOptions} />
              : <div className="flex items-center justify-center h-full text-gray-300 text-sm">No data yet</div>
            }
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-bold text-gray-800 mb-4">Top Selling Products</h3>
          <div style={{ height: 200 }}>
            {data?.topProducts?.length > 0
              ? <Bar data={topProductsData} options={chartOptions} />
              : <div className="flex items-center justify-center h-full text-gray-300 text-sm">No data yet</div>
            }
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h3 className="font-bold text-gray-800">Recent Orders</h3>
          <Link to="/vendor/orders" className="text-green-600 text-sm font-semibold hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <VendorRecentOrders />
        )}
      </div>
    </div>
  );
};

const VendorRecentOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    orderAPI.getVendorOrders({ limit: 5 })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {});
  }, []);

  if (!orders.length) {
    return <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>;
  }

  return (
    <div className="divide-y">
      {orders.map((o) => (
        <div key={o.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 font-mono">{o.order_number}</p>
            <p className="text-xs text-gray-400">{o.customer_name} • {o.product_name}</p>
          </div>
          <span className="font-bold text-gray-700">Rs.{parseFloat(o.total_price).toLocaleString()}</span>
          <StatusBadge status={o.status} />
        </div>
      ))}
    </div>
  );
};

export default VendorDashboard;
