import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '3 Months' },
  { value: '1y', label: '1 Year' },
];

const STATUS_COLORS = {
  pending:    '#f59e0b',
  confirmed:  '#3b82f6',
  processing: '#6366f1',
  shipped:    '#8b5cf6',
  delivered:  '#10b981',
  cancelled:  '#ef4444',
  refunded:   '#6b7280',
};

const MetricCard = ({ label, value, prefix = '', suffix = '', change, icon, color }) => {
  const positive = change >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className={`text-3xl font-black mt-1 ${color}`}>
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-700','-100').replace('-600','-100')}`}>
          <span className={`text-xl ${color}`}>{icon}</span>
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1.5 mt-3 text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
          <span>{positive ? '+' : ''}{change}% vs previous period</span>
        </div>
      )}
    </div>
  );
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        adminAPI.getAnalytics({ period }),
        adminAPI.getStats(),
      ]);
      setAnalytics(a.data);
      setStats(s.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fmtDate = (d) => {
    try { return format(parseISO(d), period === '1y' ? 'MMM yyyy' : 'dd MMM'); }
    catch { return d; }
  };

  const revenueChartData = {
    labels: analytics?.dailyRevenue?.map(r => fmtDate(r.date)) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: analytics?.dailyRevenue?.map(r => parseFloat(r.revenue)) || [],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.08)',
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6,
    }, {
      label: 'Orders',
      data: analytics?.dailyRevenue?.map(r => parseInt(r.orders)) || [],
      borderColor: '#f97316',
      backgroundColor: 'transparent',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      yAxisID: 'orders',
    }],
  };

  const vendorChartData = {
    labels: analytics?.topVendors?.map(v => v.store_name) || [],
    datasets: [{
      label: 'Revenue (₹)',
      data: analytics?.topVendors?.map(v => parseFloat(v.revenue)) || [],
      backgroundColor: [
        '#2563eb','#7c3aed','#db2777','#dc2626','#ea580c',
        '#ca8a04','#16a34a','#0891b2','#4f46e5','#be123c',
      ],
      borderRadius: 6,
      borderWidth: 0,
    }],
  };

  const productChartData = {
    labels: analytics?.topProducts?.map(p => p.name?.length > 20 ? p.name.slice(0,20)+'…' : p.name) || [],
    datasets: [{
      label: 'Units Sold',
      data: analytics?.topProducts?.map(p => parseInt(p.sold)) || [],
      backgroundColor: '#2563eb',
      borderRadius: 6,
      borderWidth: 0,
    }],
  };

  const statusChartData = {
    labels: analytics?.ordersByStatus?.map(s => s.status) || [],
    datasets: [{
      data: analytics?.ordersByStatus?.map(s => parseInt(s.count)) || [],
      backgroundColor: analytics?.ordersByStatus?.map(s => STATUS_COLORS[s.status] || '#94a3b8') || [],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed.y?.toLocaleString('en-IN') || ctx.parsed}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}K` } } },
  };

  const barOpts = {
    ...chartOpts,
    plugins: { ...chartOpts.plugins, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y?.toLocaleString('en-IN')}` } } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 30 } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } } },
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14, padding: 12 } } },
    cutout: '68%',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Detailed platform performance insights</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${period === p.value ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={parseFloat(stats?.stats?.totalRevenue || 0).toFixed(0)} prefix="₹" color="text-blue-700" icon={<FiDollarSign />} change={12.4} />
        <MetricCard label="Total Orders" value={stats?.stats?.totalOrders || 0} color="text-purple-700" icon={<FiShoppingBag />} change={8.1} />
        <MetricCard label="Active Vendors" value={stats?.stats?.totalVendors || 0} color="text-emerald-700" icon="🏪" change={5.3} />
        <MetricCard label="Total Users" value={stats?.stats?.totalUsers || 0} color="text-orange-700" icon="👤" change={18.7} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Line - spans 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Revenue & Orders Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">Blue = revenue, Orange = order count</p>
            </div>
          </div>
          <div className="h-64">
            {analytics?.dailyRevenue?.length > 0 ? (
              <Line
                data={revenueChartData}
                options={{
                  ...chartOpts,
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 10 } },
                    y: { position: 'left', grid: { color: '#f1f5f9' }, ticks: { callback: v => `₹${(v/1000).toFixed(0)}K`, font: { size: 10 } } },
                    orders: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } },
                  },
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
            )}
          </div>
        </div>

        {/* Orders by Status Doughnut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Orders by Status</h2>
          <div className="h-64">
            {analytics?.ordersByStatus?.length > 0 ? (
              <Doughnut data={statusChartData} options={doughnutOpts} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Vendors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-1">Top Vendors by Revenue</h2>
          <p className="text-xs text-gray-400 mb-4">Best performing stores in selected period</p>
          <div className="h-64">
            {analytics?.topVendors?.length > 0 ? (
              <Bar data={vendorChartData} options={barOpts} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">No vendor data</div>
            )}
          </div>
          {/* Vendor table */}
          {analytics?.topVendors?.length > 0 && (
            <div className="mt-4 space-y-2">
              {analytics.topVendors.slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <span className="font-medium text-gray-800 truncate max-w-[160px]">{v.store_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{parseFloat(v.revenue).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">{v.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-1">Top Products by Units Sold</h2>
          <p className="text-xs text-gray-400 mb-4">Best-selling products in selected period</p>
          <div className="h-64">
            {analytics?.topProducts?.length > 0 ? (
              <Bar data={productChartData} options={{ ...barOpts, indexAxis: 'y', scales: { x: { grid: { color: '#f1f5f9' } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">No product data</div>
            )}
          </div>
          {analytics?.topProducts?.length > 0 && (
            <div className="mt-4 space-y-2">
              {analytics.topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <span className="font-medium text-gray-800 truncate max-w-[160px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{parseInt(p.sold).toLocaleString()} sold</p>
                    <p className="text-xs text-gray-400">₹{parseFloat(p.revenue).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue Summary */}
      {stats?.monthlyRevenue?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">6-Month Revenue Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-3">Month</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-3">Revenue</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-3">Orders</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-3">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.monthlyRevenue.map((m, i) => {
                  const rev = parseFloat(m.revenue);
                  const orders = parseInt(m.orders);
                  return (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="py-3 font-medium text-gray-800">
                        {format(new Date(m.month), 'MMMM yyyy')}
                      </td>
                      <td className="py-3 text-right font-bold text-blue-700">
                        ₹{rev.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right text-gray-600">{orders.toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-600">
                        ₹{orders > 0 ? (rev / orders).toFixed(0) : '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
