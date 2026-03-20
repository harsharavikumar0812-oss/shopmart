import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { productAPI, cartAPI, wishlistAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rating' },
];

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-orange-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart, onWishlist, wishlisted }) {
  const img = product.images?.[0] || `https://via.placeholder.com/300?text=${encodeURIComponent(product.name.slice(0,10))}`;
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-gray-50 aspect-square">
        <img src={img} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" onError={e => { e.target.src = 'https://via.placeholder.com/300?text=Product'; }} />
        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow">{product.discount_percent}% OFF</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-bold text-sm px-3 py-1 rounded">Out of Stock</span>
          </div>
        )}
        <button onClick={(e) => { e.preventDefault(); onWishlist(product.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
          <span className={wishlisted ? 'text-red-500' : 'text-gray-400'}>♥</span>
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/products/${product.id}`} className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug mb-1 hover:text-orange-600">{product.name}</Link>
        {product.brand && <p className="text-xs text-gray-500 mb-1">{product.brand}</p>}
        <div className="flex items-center gap-1.5 mb-2">
          <RatingStars rating={product.rating || 0} />
          {product.review_count > 0 && <span className="text-xs text-gray-400">({Number(product.review_count).toLocaleString()})</span>}
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
          {Number(product.original_price) > Number(product.price) && (
            <span className="text-sm text-gray-400 line-through">₹{Number(product.original_price).toLocaleString()}</span>
          )}
        </div>
        {product.stock > 0 && product.stock <= 10 && (
          <p className="text-xs text-red-500 mb-2">Only {product.stock} left in stock!</p>
        )}
        <button onClick={() => onAddToCart(product.id)} disabled={product.stock === 0} className="mt-auto w-full bg-orange-400 hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900 font-semibold text-sm py-2 rounded-lg transition-colors">
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const category = searchParams.get('category') || slug || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => { productAPI.getCategories().then(({ data }) => setCategories(data.categories || [])).catch(() => {}); }, []);

  useEffect(() => {
    if (user?.role === 'user') {
      wishlistAPI.get().then(({ data }) => {
        setWishlistIds(new Set(data.items?.map(i => i.product_id)));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    productAPI.getAll({ page, search, sort, category, minPrice, maxPrice, limit: 20 })
      .then(({ data }) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [page, search, sort, category, minPrice, maxPrice]);

  const updateParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleAddToCart = async (productId) => {
    if (!user) { toast.error('Please login to add items to cart'); return; }
    if (user.role !== 'user') { toast.error('Only customers can add to cart'); return; }
    try {
      await addToCart(productId);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleWishlist = async (productId) => {
    if (!user) { toast.error('Please login'); return; }
    try {
      const { data } = await wishlistAPI.toggle({ productId });
      setWishlistIds(prev => {
        const next = new Set(prev);
        data.wishlisted ? next.add(productId) : next.delete(productId);
        return next;
      });
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  const handlePriceFilter = () => {
    const p = new URLSearchParams(searchParams);
    if (priceRange.min) p.set('minPrice', priceRange.min); else p.delete('minPrice');
    if (priceRange.max) p.set('maxPrice', priceRange.max); else p.delete('maxPrice');
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-orange-500">Home</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{search ? `Search: "${search}"` : category ? categories.find(c=>c.slug===category)?.name || 'Products' : 'All Products'}</span>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h3 className="font-bold text-gray-800 mb-3">Categories</h3>
            <div className="space-y-1">
              <button onClick={() => updateParam('category', '')} className={`block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-orange-50 ${!category ? 'text-orange-600 font-semibold bg-orange-50' : 'text-gray-700'}`}>All Categories</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => updateParam('category', c.slug)} className={`block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-orange-50 ${category === c.slug ? 'text-orange-600 font-semibold bg-orange-50' : 'text-gray-700'}`}>
                  {c.name} <span className="text-gray-400 text-xs">({c.product_count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h3 className="font-bold text-gray-800 mb-3">Price Range</h3>
            <div className="flex gap-2 mb-2">
              <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange(p => ({...p, min: e.target.value}))} className="w-full border rounded px-2 py-1.5 text-sm" />
              <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange(p => ({...p, max: e.target.value}))} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <button onClick={handlePriceFilter} className="w-full bg-orange-400 text-gray-900 text-sm font-semibold py-1.5 rounded hover:bg-orange-500 transition">Apply</button>
            {[['Under ₹500', '', '500'], ['₹500 - ₹2000', '500', '2000'], ['₹2000 - ₹10000', '2000', '10000'], ['Above ₹10000', '10000', '']].map(([label, min, max]) => (
              <button key={label} onClick={() => { const p = new URLSearchParams(searchParams); if(min) p.set('minPrice',min); else p.delete('minPrice'); if(max) p.set('maxPrice',max); else p.delete('maxPrice'); p.delete('page'); setSearchParams(p); }} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-orange-50 text-gray-700 mt-1">{label}</button>
            ))}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">Customer Rating</h3>
            {[4, 3, 2].map(r => (
              <button key={r} onClick={() => updateParam('rating', r)} className="flex items-center gap-1 w-full text-left text-sm py-1 hover:text-orange-600">
                <RatingStars rating={r} />
                <span className="text-gray-600">& above</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Sort Bar */}
          <div className="bg-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
            <p className="text-sm text-gray-600">Showing {total.toLocaleString()} results {search && `for "${search}"`}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <select value={sort} onChange={e => updateParam('sort', e.target.value)} className="text-sm border rounded px-2 py-1 bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center shadow-sm">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try different keywords or filters</p>
              <button onClick={() => setSearchParams({})} className="bg-orange-400 text-gray-900 font-semibold px-6 py-2 rounded-lg">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onWishlist={handleWishlist} wishlisted={wishlistIds.has(p.id)} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button disabled={page <= 1} onClick={() => updateParam('page', page - 1)} className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-40 text-sm">← Prev</button>
                  {Array.from({length: Math.min(pages, 7)}).map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => updateParam('page', p)} className={`w-9 h-9 rounded text-sm font-medium ${p === page ? 'bg-orange-400 text-gray-900' : 'border hover:bg-gray-50'}`}>{p}</button>;
                  })}
                  <button disabled={page >= pages} onClick={() => updateParam('page', page + 1)} className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-40 text-sm">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
