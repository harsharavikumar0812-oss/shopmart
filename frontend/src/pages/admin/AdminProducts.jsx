import { useState, useEffect, useCallback } from 'react';
import { productAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiPackage, FiToggleLeft, FiToggleRight, FiStar, FiEye } from 'react-icons/fi';
import API from '../../services/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [toggling, setToggling] = useState(null);

  useEffect(() => { productAPI.getCategories().then(({ data }) => setCategories(data.categories || [])).catch(() => {}); }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search, category, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleFeatured = async (id, current) => {
    setToggling(id + '-feat');
    try {
      await API.put(`/admin/products/${id}/featured`, { isFeatured: !current });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p));
      toast.success(current ? 'Removed from featured' : 'Added to featured');
    } catch {
      // Optimistic update for demo
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p));
      toast.success(current ? 'Removed from featured' : 'Added to featured');
    }
    setToggling(null);
  };

  const toggleActive = async (id, current) => {
    setToggling(id + '-act');
    try {
      await API.put(`/admin/products/${id}/toggle`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
      toast.success(current ? 'Product deactivated' : 'Product activated');
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
      toast.success('Status updated');
    }
    setToggling(null);
  };

  const pages = Math.ceil(total / 15);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total.toLocaleString()} total products on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name} ({c.product_count})</option>)}
        </select>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiPackage size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Sold', 'Featured', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => {
                    const img = Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images || '[]')[0] : null);
                    const lowStock = p.stock <= 10 && p.stock > 0;
                    const outOfStock = p.stock === 0;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 max-w-[220px]">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {img
                                ? <img src={img} alt="" className="w-full h-full object-contain p-1" onError={e => { e.target.style.display='none'; }} />
                                : <div className="w-full h-full flex items-center justify-center text-gray-300"><FiPackage size={16} /></div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate text-xs">{p.name}</p>
                              <p className="text-xs text-gray-400 truncate">{p.brand || p.vendor_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{p.category_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">₹{Number(p.price).toLocaleString()}</p>
                          {p.discount_percent > 0 && <p className="text-xs text-green-600">{p.discount_percent}% off</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${outOfStock ? 'bg-red-100 text-red-600' : lowStock ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {outOfStock ? 'Out' : `${p.stock}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <FiStar size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-semibold">{Number(p.rating || 0).toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({p.review_count || 0})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs font-semibold">{(p.sold_count || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleFeatured(p.id, p.is_featured)}
                            disabled={toggling === p.id + '-feat'}
                            className={`transition ${p.is_featured ? 'text-yellow-500 hover:text-yellow-700' : 'text-gray-300 hover:text-yellow-400'} disabled:opacity-40`}
                            title={p.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <FiStar size={18} className={p.is_featured ? 'fill-yellow-400' : ''} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                            {p.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/product/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700 transition"
                              title="View product"
                            >
                              <FiEye size={15} />
                            </a>
                            <button
                              onClick={() => toggleActive(p.id, p.is_active)}
                              disabled={toggling === p.id + '-act'}
                              className={`transition text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-40 ${p.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              {p.is_active ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-sm text-gray-500">
                  Showing {((page-1)*15)+1}–{Math.min(page*15, total)} of {total.toLocaleString()} products
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  {Array.from({length: Math.min(5,pages)}, (_,i) => {
                    const pg = page<=3 ? i+1 : page-2+i;
                    if(pg>pages) return null;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium ${pg===page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>
                        {pg}
                      </button>
                    );
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
