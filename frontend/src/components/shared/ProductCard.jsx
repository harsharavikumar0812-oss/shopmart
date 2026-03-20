import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar, FiZap } from 'react-icons/fi';
import { useCartStore, useWishlistStore, useAuthStore } from '../../store';
import toast from 'react-hot-toast';

const ProductCard = ({ product, view = 'grid' }) => {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCartStore();
  const { toggle: toggleWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    if (user.role !== 'user') { toast.error('Only customers can add to cart'); return; }
    setLoading(true);
    const result = await addItem(product.id);
    setLoading(false);
    if (result.success) toast.success('Added to cart!');
    else toast.error(result.message);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login'); return; }
    const result = await toggleWishlist(product.id);
    if (result?.wishlisted) toast.success('Added to wishlist');
    else toast.success('Removed from wishlist');
  };

  const image = product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image';
  const discount = product.discount_percent;

  if (view === 'list') {
    return (
      <Link to={`/product/${product.id}`} className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition group">
        <div className="relative shrink-0 w-36 h-36">
          <img src={image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-600 font-medium">{product.brand || product.vendor_name}</p>
          <h3 className="font-semibold text-gray-800 mt-1 text-base line-clamp-2 group-hover:text-blue-700">{product.name}</h3>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} size={12} className={i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-xs text-gray-400">({product.review_count || 0})</span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xl font-bold text-gray-900">Rs.{product.price?.toLocaleString()}</span>
            {product.original_price > product.price && (
              <>
                <span className="text-gray-400 line-through text-sm">Rs.{product.original_price?.toLocaleString()}</span>
                <span className="text-green-600 text-sm font-semibold">{discount}% off</span>
              </>
            )}
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-orange-600 text-xs mt-2 font-medium">Only {product.stock} left!</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={loading || product.stock === 0}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-full text-sm transition disabled:opacity-50"
            >
              <FiShoppingCart size={15} />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlist}
              className={"p-2 rounded-full border transition " + (wishlisted ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500')}
            >
              <FiHeart size={16} className={wishlisted ? 'fill-red-500' : ''} />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product.id}`} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}% OFF</span>
          )}
          {product.is_featured && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Featured</span>
          )}
          {product.sold_count > 100 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <FiZap size={8} /> Bestseller
            </span>
          )}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-sm font-bold px-4 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleWishlist}
            className={"p-2 rounded-full shadow-md transition " + (wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500')}
          >
            <FiHeart size={14} className={wishlisted ? 'fill-white' : ''} />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[11px] text-blue-600 font-medium truncate">{product.brand || product.vendor_name}</p>
        <h3 className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-2 flex-1 group-hover:text-blue-700 transition">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mt-1">
          <div className="flex bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded items-center gap-0.5">
            {(product.rating || 0).toFixed(1)} <FiStar size={8} className="fill-white" />
          </div>
          <span className="text-[11px] text-gray-400">({product.review_count || 0})</span>
          {product.sold_count > 0 && (
            <span className="text-[11px] text-gray-400 ml-1">{product.sold_count}+ sold</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900">Rs.{product.price?.toLocaleString()}</span>
          {product.original_price > product.price && (
            <span className="text-gray-400 text-xs line-through">Rs.{product.original_price?.toLocaleString()}</span>
          )}
          {discount > 0 && <span className="text-green-600 text-[11px] font-semibold">{discount}% off</span>}
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-orange-500 text-[11px] mt-1 font-medium">Only {product.stock} left!</p>
        )}

        <button
          onClick={handleAddToCart}
          disabled={loading || product.stock === 0}
          className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded-lg text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <FiShoppingCart size={13} />
          {product.stock === 0 ? 'Out of Stock' : loading ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
