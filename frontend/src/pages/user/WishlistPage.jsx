// WishlistPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const wishlistAPI = {
  get: () => cartAPI.getWishlist(),
  toggle: (data) => cartAPI.toggleWishlist(data),
};

export function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    wishlistAPI.get().then(({ data }) => setItems(data.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const removeFromWishlist = async (productId) => {
    await wishlistAPI.toggle({ productId });
    setItems(prev => prev.filter(i => i.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  const moveToCart = async (productId) => {
    try {
      await addToCart(productId);
      await removeFromWishlist(productId);
      toast.success('Moved to cart!');
    } catch { toast.error('Failed to add to cart'); }
  };

  if (loading) return <div className="max-w-screen-xl mx-auto px-4 py-8 animate-pulse"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="bg-white rounded-xl h-64"/>)}</div></div>;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist ({items.length})</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">♡</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-4">Save items you love</p>
          <Link to="/products" className="bg-orange-400 text-gray-900 font-bold px-6 py-2.5 rounded-full hover:bg-orange-500">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="relative">
                <Link to={`/products/${item.product_id}`} className="block aspect-square bg-gray-50 overflow-hidden">
                  <img src={item.images?.[0] || 'https://via.placeholder.com/300?text=P'} alt={item.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform" onError={e => { e.target.src = 'https://via.placeholder.com/300?text=P'; }} />
                </Link>
                <button onClick={() => removeFromWishlist(item.product_id)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow text-red-500 hover:text-red-700 flex items-center justify-center">✕</button>
                {item.discount_percent > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">{item.discount_percent}% off</span>}
              </div>
              <div className="p-3">
                <Link to={`/products/${item.product_id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-orange-600">{item.name}</Link>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="font-bold text-gray-900">₹{Number(item.price).toLocaleString()}</span>
                  {Number(item.original_price) > Number(item.price) && <span className="text-xs text-gray-400 line-through">₹{Number(item.original_price).toLocaleString()}</span>}
                </div>
                <button onClick={() => moveToCart(item.product_id)} disabled={item.stock === 0} className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-gray-200 text-gray-900 font-semibold text-sm py-2 rounded-lg transition">
                  {item.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
