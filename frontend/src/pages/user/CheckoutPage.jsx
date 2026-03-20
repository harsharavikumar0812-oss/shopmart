import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addressAPI, orderAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
  { value: 'upi', label: 'UPI', icon: '📱', desc: 'GPay, PhonePe, Paytm' },
  { value: 'card', label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, Rupay' },
  { value: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { cart, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ name:'', phone:'', addressLine1:'', addressLine2:'', city:'', state:'', pincode:'', addressType:'home', isDefault:false });

  useEffect(() => {
    addressAPI.getAll().then(({ data }) => {
      setAddresses(data.addresses || []);
      const def = data.addresses?.find(a => a.is_default) || data.addresses?.[0];
      if (def) setSelectedAddress(def.id);
    }).catch(() => {});
  }, []);

  const addAddress = async () => {
    if (!newAddr.name || !newAddr.phone || !newAddr.addressLine1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      const { data } = await addressAPI.add(newAddr);
      setAddresses(prev => [...prev, data.address]);
      setSelectedAddress(data.address.id);
      setShowAddForm(false);
      setNewAddr({ name:'', phone:'', addressLine1:'', addressLine2:'', city:'', state:'', pincode:'', addressType:'home', isDefault:false });
      toast.success('Address added');
    } catch { toast.error('Failed to add address'); }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await orderAPI.create({
        addressId: selectedAddress,
        paymentMethod,
        couponCode: state?.coupon?.code || null,
        notes: ''
      });
      await clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${data.order.id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const subtotal = cart.summary?.subtotal || 0;
  const shipping = cart.summary?.shippingAmount || 0;
  const tax = cart.summary?.taxAmount || 0;
  const discount = state?.coupon?.discount || 0;
  const total = subtotal + shipping + tax - discount;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[['1', 'Address'], ['2', 'Payment'], ['3', 'Review']].map(([n, label], i) => (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-2 cursor-pointer ${step >= i+1 ? 'text-orange-600' : 'text-gray-400'}`} onClick={() => step > i+1 && setStep(i+1)}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i+1 ? 'bg-orange-400 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>{n}</div>
              <span className="font-semibold text-sm hidden sm:block">{label}</span>
            </div>
            {i < 2 && <div className={`w-12 h-0.5 mx-2 ${step > i+1 ? 'bg-orange-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Delivery Address</h2>
              <div className="space-y-3 mb-4">
                {addresses.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${selectedAddress === addr.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{addr.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{addr.address_type}</span>
                        {addr.is_default && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{addr.address_line1}{addr.address_line2 ? ', ' + addr.address_line2 : ''}</p>
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button onClick={() => setShowAddForm(!showAddForm)} className="text-orange-600 font-semibold text-sm hover:underline">+ Add New Address</button>

              {showAddForm && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border">
                  <h3 className="font-semibold mb-3">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[['name', 'Full Name *'], ['phone', 'Phone *'], ['addressLine1', 'Address Line 1 *', 'col-span-2'], ['addressLine2', 'Address Line 2', 'col-span-2'], ['city', 'City *'], ['state', 'State *'], ['pincode', 'Pincode *'], ['landmark', 'Landmark']].map(([key, label, cls]) => (
                      <input key={key} placeholder={label} value={newAddr[key] || ''} onChange={e => setNewAddr(p => ({...p, [key]: e.target.value}))} className={`border rounded-lg px-3 py-2 text-sm ${cls || ''}`} />
                    ))}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {['home', 'work', 'other'].map(t => (
                      <label key={t} className="flex items-center gap-1 text-sm capitalize cursor-pointer">
                        <input type="radio" name="type" checked={newAddr.addressType === t} onChange={() => setNewAddr(p => ({...p, addressType: t}))} />
                        {t}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addAddress} className="bg-orange-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-orange-500">Save Address</button>
                    <button onClick={() => setShowAddForm(false)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <button onClick={() => { if(!selectedAddress) { toast.error('Select address'); return; } setStep(2); }} className="mt-4 bg-orange-400 text-gray-900 font-bold px-8 py-2.5 rounded-full hover:bg-orange-500 transition">Continue to Payment →</button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Payment Method</h2>
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === pm.value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} />
                    <span className="text-2xl">{pm.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{pm.label}</p>
                      <p className="text-xs text-gray-500">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="border px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep(3)} className="bg-orange-400 text-gray-900 font-bold px-8 py-2.5 rounded-full hover:bg-orange-500 transition">Review Order →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 text-lg mb-4">Order Review</h2>
              <div className="space-y-3 mb-6">
                {cart.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <img src={item.images?.[0] || 'https://via.placeholder.com/60?text=P'} alt="" className="w-12 h-12 object-contain rounded bg-gray-50" onError={e => { e.target.src = 'https://via.placeholder.com/60?text=P'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product_name || item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">₹{(Number(item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1">
                <p className="font-bold text-gray-800 mb-2">Delivery Address</p>
                {(() => {
                  const addr = addresses.find(a => a.id === selectedAddress);
                  return addr ? <p className="text-gray-600">{addr.name} • {addr.phone}<br/>{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}</p> : null;
                })()}
                <p className="font-bold text-gray-800 mt-2 mb-1">Payment</p>
                <p className="text-gray-600">{PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="border px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50">← Back</button>
                <button onClick={placeOrder} disabled={placing} className="bg-orange-500 text-white font-bold px-8 py-2.5 rounded-full hover:bg-orange-600 transition disabled:opacity-60">
                  {placing ? 'Placing Order...' : '✓ Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-4">Price Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Price ({cart.summary?.itemCount} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>₹{tax.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>−₹{discount}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Total Amount</span><span>₹{total.toLocaleString()}</span></div>
          </div>
          {discount > 0 && <p className="text-green-600 text-sm mt-2">🎉 You save ₹{discount} on this order!</p>}
        </div>
      </div>
    </div>
  );
}
