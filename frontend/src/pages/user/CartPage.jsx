// CartPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cartAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function CartPage() {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null);

  const applyCoupon = async () => {
    try {
      const { data } = await cartAPI.applyCoupon({ code: coupon, orderAmount: cart.summary?.subtotal });
      setCouponData(data.coupon);
      toast.success(`Coupon applied! Saved ₹${data.coupon.discount}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid coupon');
    }
  };

  const total = (cart.summary?.total || 0) - (couponData?.discount || 0);

  if (!cart.items?.length) return (
    <div className="max-w-screen-xl mx-auto px-4 py-16 text-center">
      <div className="text-8xl mb-6">🛒</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
      <Link to="/products" className="bg-orange-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-orange-500 transition">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({cart.summary?.itemCount || 0} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items?.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4">
              <Link to={`/products/${item.product_id}`}>
                <img src={item.images?.[0] || 'https://via.placeholder.com/100?text=P'} alt={item.name} className="w-24 h-24 object-contain rounded-lg bg-gray-50 p-2" onError={e => { e.target.src = 'https://via.placeholder.com/100?text=P'; }} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_id}`} className="font-semibold text-gray-800 text-sm hover:text-orange-600 line-clamp-2">{item.product_name || item.name}</Link>
                <p className="text-xs text-gray-500 mt-0.5">{item.vendor_name}</p>
                {item.stock <= 10 && item.stock > 0 && <p className="text-xs text-red-500 mt-0.5">Only {item.stock} left</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">−</button>
                    <span className="px-3 py-1 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold">+</button>
                  </div>
                  <span className="font-bold text-gray-900">₹{(Number(item.price) * item.quantity).toLocaleString()}</span>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">Clear Cart</button>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{(cart.summary?.subtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={cart.summary?.shippingAmount === 0 ? 'text-green-600' : ''}>{cart.summary?.shippingAmount === 0 ? 'FREE' : `₹${cart.summary?.shippingAmount}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>₹{(cart.summary?.taxAmount || 0).toLocaleString()}</span></div>
              {couponData && <div className="flex justify-between text-green-600"><span>Coupon ({couponData.code})</span><span>− ₹{couponData.discount}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            </div>

            <div className="flex gap-2 mb-3">
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase" />
              <button onClick={applyCoupon} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-semibold">Apply</button>
            </div>

            {cart.summary?.amountToFreeShipping > 0 && (
              <p className="text-xs text-teal-600 mb-3">Add ₹{cart.summary.amountToFreeShipping} more for FREE delivery!</p>
            )}

            <button onClick={() => navigate('/checkout', { state: { coupon: couponData } })} className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold py-3 rounded-full transition shadow">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
