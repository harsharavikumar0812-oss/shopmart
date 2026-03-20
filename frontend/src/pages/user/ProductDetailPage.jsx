import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI, wishlistAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

function RatingStars({ rating, size = 'md' }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${sizes[size]} ${s <= Math.round(rating) ? 'text-orange-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryMsg, setDeliveryMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(id)
      .then(({ data }) => {
        setProduct(data.product);
        setReviews(data.reviews || []);
        setRelated(data.related || []);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login'); navigate('/login'); return; }
    if (user.role !== 'user') { toast.error('Only customers can shop'); return; }
    setAddingCart(true);
    try {
      await addToCart(product.id, qty);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add to cart'); }
    finally { setAddingCart(false); }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); return; }
    const { data } = await wishlistAPI.toggle({ productId: product.id });
    setWishlisted(data.wishlisted);
    toast.success(data.message);
  };

  const checkDelivery = () => {
    if (pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return; }
    setDeliveryMsg(`✅ Delivery available in 3-5 days to ${pincode}`);
  };

  const submitReview = async () => {
    if (!user) { toast.error('Please login'); return; }
    try {
      await productAPI.addReview(product.id, reviewForm);
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', review: '' });
      productAPI.getOne(id).then(({ data }) => setReviews(data.reviews || []));
    } catch { toast.error('Failed to submit review'); }
  };

  if (loading) return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-12 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
      <p className="text-2xl text-gray-500">Product not found</p>
      <Link to="/products" className="text-orange-500 mt-4 inline-block">← Back to products</Link>
    </div>
  );

  const images = product.images?.length ? product.images : ['https://via.placeholder.com/600?text=Product'];
  const specs = typeof product.specifications === 'string' ? JSON.parse(product.specifications || '{}') : product.specifications || {};

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-orange-500">Home</Link><span>/</span>
          <Link to="/products" className="hover:text-orange-500">Products</Link><span>/</span>
          {product.category_name && <><Link to={`/category/${product.category_slug}`} className="hover:text-orange-500">{product.category_name}</Link><span>/</span></>}
          <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Image Gallery */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
              <div className="aspect-square overflow-hidden rounded-lg mb-3 bg-gray-50 flex items-center justify-center">
                <img src={images[activeImg]} alt={product.name} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300" onError={e => { e.target.src = 'https://via.placeholder.com/600?text=Product'; }} />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 bg-gray-50 ${i === activeImg ? 'border-orange-400' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-contain" onError={e => { e.target.src = 'https://via.placeholder.com/60?text=img'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              {product.brand && <p className="text-sm text-blue-600 font-semibold mb-1">Visit {product.brand} Store</p>}
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">
                  {Number(product.rating || 0).toFixed(1)} <RatingStars rating={product.rating} size="sm" />
                </div>
                <span className="text-sm text-gray-500">{Number(product.review_count || 0).toLocaleString()} Ratings</span>
                <span className="text-sm text-gray-500">{Number(product.sold_count || 0).toLocaleString()} Sold</span>
              </div>

              <div className="border-t border-b py-3 mb-3">
                <div className="flex items-end gap-3">
                  {product.discount_percent > 0 && (
                    <span className="text-green-600 font-semibold">{product.discount_percent}% off</span>
                  )}
                  <span className="text-3xl font-black text-gray-900">₹{Number(product.price).toLocaleString()}</span>
                  {Number(product.original_price) > Number(product.price) && (
                    <span className="text-gray-400 line-through text-lg">₹{Number(product.original_price).toLocaleString()}</span>
                  )}
                </div>
                {product.discount_percent > 0 && (
                  <p className="text-green-600 text-sm mt-1">You save: ₹{(Number(product.original_price) - Number(product.price)).toLocaleString()}</p>
                )}
              </div>

              {/* Availability */}
              <div className="mb-3">
                {product.stock > 0 ? (
                  <span className="text-green-600 font-semibold">✓ In Stock</span>
                ) : (
                  <span className="text-red-500 font-semibold">✗ Out of Stock</span>
                )}
                {product.stock > 0 && product.stock <= 10 && (
                  <span className="text-orange-500 text-sm ml-2">(Only {product.stock} left!)</span>
                )}
              </div>

              {/* Qty */}
              {product.stock > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-gray-600 font-medium">Qty:</span>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q-1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 font-bold">−</button>
                    <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q+1))} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 font-bold">+</button>
                  </div>
                </div>
              )}

              {/* Sold by */}
              <p className="text-sm text-gray-600 mb-4">
                Sold by: <Link to="#" className="text-blue-600 hover:underline">{product.store_name}</Link>
              </p>

              {/* Delivery check */}
              <div className="flex gap-2 mb-4">
                <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Enter pincode" maxLength={6} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button onClick={checkDelivery} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition">Check</button>
              </div>
              {deliveryMsg && <p className="text-sm text-green-600 mb-3">{deliveryMsg}</p>}
            </div>

            {/* Key Features */}
            {product.short_description && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2">About this item</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
              </div>
            )}
          </div>

          {/* Buy Box */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-24 space-y-3">
              <div className="text-2xl font-black text-gray-900">₹{Number(product.price).toLocaleString()}</div>
              {product.price >= 499 ? (
                <p className="text-sm text-teal-600">✓ FREE Delivery</p>
              ) : (
                <p className="text-sm text-gray-600">+ ₹49 delivery</p>
              )}
              <p className="text-sm text-gray-600">📦 Delivery in 3-5 days</p>
              <p className="text-sm text-gray-600">🔄 7-day return policy</p>

              {product.stock > 0 ? (
                <>
                  <button onClick={handleAddToCart} disabled={addingCart} className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold py-2.5 rounded-full transition shadow">
                    {addingCart ? 'Adding...' : '🛒 Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-full transition shadow">
                    ⚡ Buy Now
                  </button>
                </>
              ) : (
                <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-2.5 rounded-full">Out of Stock</button>
              )}

              <button onClick={handleWishlist} className={`w-full border font-semibold py-2 rounded-full text-sm transition ${wishlisted ? 'border-red-400 text-red-500 hover:bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {wishlisted ? '♥ Wishlisted' : '♡ Add to Wishlist'}
              </button>

              <div className="pt-2 space-y-1.5 border-t">
                {[['🔒', 'Secure transaction'], ['🏪', `Ships from ${product.store_name}`], ['🛡️', '100% Authentic']].map(([icon, text]) => (
                  <p key={text} className="text-xs text-gray-600 flex items-center gap-1.5">{icon} {text}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            {['overview', 'specifications', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-semibold capitalize transition border-b-2 -mb-px ${activeTab === tab ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {product.description || <p className="text-gray-400">No description available.</p>}
              </div>
            )}
            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(specs).length > 0 ? (
                  Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="flex border-b pb-2 gap-3">
                      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{k}</span>
                      <span className="text-sm text-gray-800 font-medium">{v}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No specifications available.</p>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Customer Reviews</h3>
                  {user?.role === 'user' && (
                    <button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-orange-400 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg">Write a Review</button>
                  )}
                </div>

                {showReviewForm && (
                  <div className="bg-yellow-50 rounded-xl p-5 mb-4 border border-yellow-200">
                    <h4 className="font-bold mb-3">Your Review</h4>
                    <div className="flex gap-2 mb-3">
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => setReviewForm(f => ({...f, rating: r}))} className={`text-2xl ${r <= reviewForm.rating ? 'text-orange-400' : 'text-gray-300'}`}>★</button>
                      ))}
                    </div>
                    <input placeholder="Review title" value={reviewForm.title} onChange={e => setReviewForm(f => ({...f, title: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                    <textarea placeholder="Write your review..." value={reviewForm.review} onChange={e => setReviewForm(f => ({...f, review: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm h-24 resize-none mb-3" />
                    <div className="flex gap-2">
                      <button onClick={submitReview} className="bg-orange-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm">Submit</button>
                      <button onClick={() => setShowReviewForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border-b pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold flex-shrink-0">
                            {r.reviewer_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{r.reviewer_name}</span>
                              <RatingStars rating={r.rating} size="sm" />
                              {r.is_verified_purchase && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Verified Purchase</span>}
                            </div>
                            {r.title && <p className="font-semibold text-sm mb-0.5">{r.title}</p>}
                            <p className="text-sm text-gray-600 leading-relaxed">{r.review}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 text-xl mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="group">
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                    <img src={p.images?.[0] || 'https://via.placeholder.com/200?text=P'} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" onError={e => { e.target.src = 'https://via.placeholder.com/200?text=P'; }} />
                  </div>
                  <p className="text-xs text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-sm font-bold mt-1">₹{Number(p.price).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
