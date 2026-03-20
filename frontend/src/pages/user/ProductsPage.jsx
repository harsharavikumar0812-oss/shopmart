import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/shared/ProductCard';
import { FiGrid, FiList, FiFilter, FiX, FiChevronDown, FiSearch } from 'react-icons/fi';

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

const ProductsPage = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [showFilter, setShowFilter] = useState(false);

  const page = parseInt(params.get('page') || '1');
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') || '';

  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [params.toString()]);

  const loadCategories = async () => {
    try {
      const { data } = await productAPI.getCategories();
      setCategories(data.categories || []);
    } catch {}
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({
        page, limit: 20, search, category, sort, minPrice, maxPrice, inStock
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setLoading(false);
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    setParams(p);
  };

  const applyPriceFilter = () => {
    const p = new URLSearchParams(params);
    if (priceRange.min) p.set('minPrice', priceRange.min); else p.delete('minPrice');
    if (priceRange.max) p.set('maxPrice', priceRange.max); else p.delete('maxPrice');
    p.set('page', '1');
    setParams(p);
    setShowFilter(false);
  };

  const clearFilters = () => {
    setParams({ page: '1' });
    setPriceRange({ min: '', max: '' });
  };

  const activeFilters = [search, category, minPrice, maxPrice, inStock].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">
              {search ? `Results for "${search}"` : category ? categories.find(c => c.slug === category)?.name || 'Products' : 'All Products'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} products found</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilter(true)}
              className={"flex items-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium transition " +
                (activeFilters > 0 ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50')}
            >
              <FiFilter size={15} /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')} className={"p-2 " + (view === 'grid' ? 'bg-blue-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                <FiGrid size={16} />
              </button>
              <button onClick={() => setView('list')} className={"p-2 " + (view === 'list' ? 'bg-blue-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                <FiList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Active filters:</span>
            {search && <FilterTag label={`Search: ${search}`} onRemove={() => updateParam('search', '')} />}
            {category && <FilterTag label={`Category: ${categories.find(c => c.slug === category)?.name || category}`} onRemove={() => updateParam('category', '')} />}
            {minPrice && <FilterTag label={`Min: Rs.${minPrice}`} onRemove={() => updateParam('minPrice', '')} />}
            {maxPrice && <FilterTag label={`Max: Rs.${maxPrice}`} onRemove={() => updateParam('maxPrice', '')} />}
            {inStock && <FilterTag label="In Stock Only" onRemove={() => updateParam('inStock', '')} />}
            <button onClick={clearFilters} className="text-red-600 text-sm font-semibold hover:underline">Clear all</button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-xl border p-5 sticky top-24 space-y-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={"w-full text-left text-sm px-2 py-1.5 rounded-lg transition " + (!category ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => updateParam('category', c.slug)}
                      className={"w-full text-left text-sm px-2 py-1.5 rounded-lg transition " + (category === c.slug ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}
                    >
                      {c.name}
                      <span className="float-right text-gray-400 text-xs">{c.product_count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Price Range</h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button onClick={applyPriceFilter} className="w-full mt-2 bg-blue-700 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">
                  Apply
                </button>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Availability</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock === 'true'}
                    onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-600">In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className={"grid gap-4 " + (view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <FiSearch size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500">No products found</h3>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="mt-6 bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={"grid gap-4 " + (view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
                  {products.map((p) => <ProductCard key={p.id} product={p} view={view} />)}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                      <button onClick={() => updateParam('page', page - 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">
                        Previous
                      </button>
                    )}
                    {[...Array(Math.min(5, pages))].map((_, i) => {
                      const p = i + Math.max(1, page - 2);
                      if (p > pages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => updateParam('page', p)}
                          className={"px-4 py-2 border rounded-lg text-sm transition " + (p === page ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-50')}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {page < pages && (
                      <button onClick={() => updateParam('page', page + 1)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">
                        Next
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilter(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl">Filters</h2>
              <button onClick={() => setShowFilter(false)}><FiX size={22} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-3">Categories</h3>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => { updateParam('category', c.slug); setShowFilter(false); }}
                    className={"w-full text-left text-sm px-3 py-2 rounded-lg transition mb-1 " + (category === c.slug ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50')}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div>
                <h3 className="font-bold mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" placeholder="Max" value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <button onClick={applyPriceFilter} className="w-full mt-2 bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterTag = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
    {label}
    <button onClick={onRemove} className="ml-1 hover:text-red-500"><FiX size={12} /></button>
  </span>
);

export default ProductsPage;
