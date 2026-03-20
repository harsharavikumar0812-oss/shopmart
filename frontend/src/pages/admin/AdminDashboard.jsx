import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiPackage, FiAlertCircle,
  FiTrendingUp, FiActivity, FiCheckCircle, FiClock, FiXCircle, FiGrid
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const StatCard = ({ title, value, icon, color, sub, change }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className={"text-3xl font-black mt-1 " + color}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={"p-3 rounded-xl " + color.replace('text-', 'bg-').replace('600', '100').replace('700', '100').replace('800', '100')}>
        <span className={color + " text-xl"}>{icon}</span>
      </div>
    </div>
    {change !== undefined && (
      <div className={"flex items-center gap-1 mt-3 text-xs font-semibold " + (change >= 0 ? 'text-green-600' : 'text-red-500')}>
        <FiTrendingUp size={12} />
        <span>{change >= 0 ? '+' : ''}{change}% vs last month</span>
      </div>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAnalytics({ period })
      ]);
      setStats(s.data);
      setAnalytics(a.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-28 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const monthlyLabels = stats?.monthlyRevenue?.map(r => {
    const d = new Date(r.month);
    return d.toLocaleString('default', { month: 'short' });
  }) || [];

  const revenueData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Revenue (Rs.)',
      data: stats?.monthlyRevenue?.map(r => parseFloat(r.revenue)) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderRadius: 8,
    }]
  };

  const dailyData = {
    labels: analytics?.dailyRevenue?.map(r => new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Daily Revenue',
      data: analytics?.dailyRevenue?.map(r => parseFloat(r.revenue)) || [],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }]
  };

  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444' };
  const orderStatusData = {
    labels: analytics?.ordersByStatus?.map(s => s.status) || [],
    datasets: [{
      data: analytics?.ordersByStatus?.map(s => parseInt(s.count)) || [],
      backgroundColor: analytics?.ordersByStatus?.map(s => statusColors[s.status] || '#6b7280') || [],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' } } }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform overview and analytics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={"px-3 py-1.5 rounded-lg text-sm font-semibold transition " + (period === p ? 'bg-blue-700 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={stats.stats.totalUsers.toLocaleString()} icon={<FiUsers />} color="text-blue-600" change={12} />
          <StatCard title="Active Vendors" value={stats.stats.totalVendors.toLocaleString()} icon={<FiGrid />} color="text-green-600" change={8} />
          <StatCard title="Total Orders" value={stats.stats.totalOrders.toLocaleString()} icon={<FiShoppingBag />} color="text-purple-600" change={15} />
          <StatCard title="Revenue" value={"Rs." + (stats.stats.totalRevenue / 1000).toFixed(0) + "K"} icon={<FiDollarSign />} color="text-emerald-600" change={22} />
          <StatCard title="Products" value={stats.stats.totalProducts.toLocaleString()} icon={<FiPackage />} color="text-orange-600" />
          <StatCard title="Pending" value={stats.stats.pendingVendors.toLocaleString()} icon={<FiAlertCircle />} color="text-red-600" sub="Vendor approvals" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue</h3>
          <div style={{ height: 220 }}>
            <Bar data={revenueData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Daily Revenue Trend</h3>
          <div style={{ height: 220 }}>
            <Line data={dailyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 + Tables */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Status Donut */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Orders by Status</h3>
          <div style={{ height: 180 }}>
            <Doughnut data={orderStatusData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } }, scales: {} }} />
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Top Vendors</h3>
            <Link to="/admin/vendors" className="text-blue-600 text-xs font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {(analytics?.topVendors || []).slice(0, 5).map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{v.store_name}</p>
                  <p className="text-xs text-gray-400">{v.orders} orders</p>
                </div>
                <span className="text-sm font-bold text-green-600">Rs.{parseFloat(v.revenue).toLocaleString()}</span>
              </div>
            ))}
            {(!analytics?.topVendors || analytics.topVendors.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Top Products</h3>
            <Link to="/admin/orders" className="text-blue-600 text-xs font-semibold">View all</Link>
          </div>
          <div className="space-y-3">
            {(analytics?.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold} sold</p>
                </div>
                <span className="text-sm font-bold text-blue-600">Rs.{parseFloat(p.revenue).toLocaleString()}</span>
              </div>
            ))}
            {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {stats?.recentOrders?.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b">
            <h3 className="font-bold text-gray-800">Recent Orders</h3>
            <Link to="/admin/orders" className="text-blue-600 text-sm font-semibold hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono text-blue-700 font-semibold">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-700">{o.customer_name}</p>
                      <p className="text-gray-400 text-xs">{o.email}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-800">Rs.{parseFloat(o.total_amount).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={"inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize " + (map[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
};

export default AdminDashboard;
