import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../../store';
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTruck } from 'react-icons/fi';

const CartDrawer = () => {
  const { items, summary, isOpen, setOpen, updateItem, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setOpen(false);
    if (!user) navigate('/login?redirect=/checkout');
    else navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-700 text-white">
          <div className="flex items-center gap-2">
            <FiShoppingBag size={20} />
            <span className="font-bold text-lg">Your Cart</span>
            <span className="bg-yellow-400 text-blue-900 text-xs font-black px-2 py-0.5 rounded-full">
              {summary.itemCount}
            </span>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-blue-600 rounded-full transition">
            <FiX size={20} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {summary.amountToFreeShipping > 0 && (
          <div className="px-5 py-3 bg-orange-50 border-b">
            <div className="flex items-center gap-2 text-sm text-orange-700 mb-2">
              <FiTruck size={14} />
              <span>Add <strong>₹{summary.amountToFreeShipping.toFixed(0)}</strong> more for FREE delivery!</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (summary.subtotal / 499) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <FiShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add items to get started</p>
              <button
                onClick={() => { setOpen(false); navigate('/products'); }}
                className="mt-6 bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <Link to={`/product/${item.product_id}`} onClick={() => setOpen(false)}>
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/80x80?text=Product'}
                    alt={item.name}
                    className="w-18 h-18 w-[72px] h-[72px] object-cover rounded-lg border bg-white"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product_id}`} onClick={() => setOpen(false)}>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-blue-700">{item.name}</p>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.vendor_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-blue-700 font-bold">₹{item.price?.toLocaleString()}</span>
                    {item.original_price > item.price && (
                      <span className="text-gray-400 text-xs line-through">₹{item.original_price?.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition text-gray-600"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="px-3 py-1 text-sm font-semibold border-x border-gray-200">{item.quantity}</span>
                      <button
                        onClick={() => {
                          if (item.quantity < item.stock) updateItem(item.id, item.quantity + 1);
                        }}
                        className="px-2 py-1 hover:bg-gray-100 transition text-gray-600"
                        disabled={item.quantity >= item.stock}
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 transition"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white px-5 py-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({summary.itemCount} items)</span>
                <span>₹{summary.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={summary.shippingAmount === 0 ? 'text-green-600 font-semibold' : ''}>
                  {summary.shippingAmount === 0 ? 'FREE' : `₹${summary.shippingAmount}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (18%)</span>
                <span>₹{summary.taxAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-700">₹{summary.total?.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition text-base shadow-md"
            >
              Proceed to Checkout →
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/cart'); }}
              className="w-full border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
