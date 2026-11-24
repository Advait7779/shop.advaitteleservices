import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Edit3, 
  Check, 
  Truck,
  RotateCcw
} from 'lucide-react';

let razorpayScriptPromise;
const loadRazorpay = () => {
  if (typeof window.Razorpay === 'function') return Promise.resolve();
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => typeof window.Razorpay === 'function'
        ? resolve()
        : reject(new Error('Razorpay is unavailable. Please try again later.'));
      script.onerror = () => reject(new Error('Razorpay is unavailable. Please try again later.'));
      document.head.appendChild(script);
    }).catch((error) => {
      document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')?.remove();
      razorpayScriptPromise = undefined;
      throw error;
    });
  }
  return razorpayScriptPromise;
};

const Cart = () => {
  const { user, isAuthenticated, openAuthModal, updateProfile } = useAuth();
  const { cartItems, itemCount, subtotal, updateQuantity, removeItem, clearCart, refreshCart, showToast } = useCart();
  const navigate = useNavigate();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const checkoutKeyRef = useRef(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.fullName || '',
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
  });

  useEffect(() => {
    if (user && !isEditingAddress) {
      setAddressForm({ fullName: user.fullName || '', addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '', city: user.city || '', pincode: user.pincode || '' });
    }
  }, [user, isEditingAddress]);

  const handleAddressSave = async (e) => {
    e.preventDefault();
    const result = await updateProfile(addressForm);
    if (result.success) {
      setIsEditingAddress(false);
      showToast('Delivery address updated successfully');
    } else {
      showToast(result.message || 'Failed to update address', 'error');
    }
  };

  const handleProceedToRazorpay = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    try {
      setIsProcessingPayment(true);
      await loadRazorpay();
      checkoutKeyRef.current ||= crypto.randomUUID();

      // Step 1: Create Order on backend
      const res = await api.post('/orders/create', {
        customAddress: addressForm,
        checkoutKey: checkoutKeyRef.current,
      });

      if (!res.data.success) {
        showToast(res.data.message || 'Failed to initialize payment', 'error');
        checkoutKeyRef.current = null;
        setIsProcessingPayment(false);
        return;
      }

      const { orderId, orderNumber, amount, currency, razorpayOrderId, keyId } = res.data;

      // Step 2: Open Razorpay Modal
      {
        const options = {
          key: keyId,
          amount: Math.round(amount * 100),
          currency: currency || 'INR',
          name: 'Advait Teleservices Private Limited',
          description: `Order #${orderNumber}`,
          image: '/logo.png',
          order_id: razorpayOrderId,
          prefill: {
            name: user.fullName,
            contact: user.mobileNumber,
          },
          theme: {
            color: '#385775', // Forest Green theme color in Razorpay
          },
          handler: async function (paymentResponse) {
            try {
              // Step 3: Verify payment on backend
              const verifyRes = await api.post('/orders/verify', {
                orderId,
                razorpayOrderId: paymentResponse.razorpay_order_id || razorpayOrderId,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });

              if (verifyRes.data.success) {
                showToast('Payment successful! Your order has been placed.');
                checkoutKeyRef.current = null;
                await refreshCart();
                navigate(`/order-success/${orderId}`);
              } else if (verifyRes.data.pending) {
                showToast('Payment is awaiting confirmation. Check your order status.');
                checkoutKeyRef.current = null;
                navigate(`/order-success/${orderId}`);
              }
            } catch (err) {
              showToast('Payment confirmation is pending. Check your order status shortly.', 'error');
              navigate(`/order-success/${orderId}`);
            } finally {
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              checkoutKeyRef.current = null;
              showToast('Payment cancelled by user', 'error');
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (failRes) {
          showToast(`Payment failed: ${failRes.error.description}`, 'error');
          setIsProcessingPayment(false);
          checkoutKeyRef.current = null;
        });

        razorpayInstance.open();
      }
    } catch (err) {
      console.error('Razorpay Checkout error:', err);
      showToast(err.response?.data?.message || err.message || 'Checkout error', 'error');
      checkoutKeyRef.current = null;
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      
      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] pb-12 pt-36 text-white md:pt-24 lg:pt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-brand-300 mt-2">
            <Link to="/" className="hover:underline text-brand-200">Home</Link> &gt; My Cart
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          /* Guest Screen */
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4 reveal-scale">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-[#385775] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Sign in to Access Your Cart</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Please log in with your mobile number to view saved products, select delivery address, and proceed with Razorpay checkout.
            </p>
            <button
              onClick={() => openAuthModal()}
              className="w-full py-3 bg-[#385775] hover:bg-[#293d54] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 btn-press"
            >
              Login with Mobile OTP
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart Screen */
          <div className="max-w-md mx-auto text-center bg-white p-10 rounded-3xl border border-gray-200/80 shadow-sm space-y-4 reveal-scale">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-[#385775] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Cart is Empty</h2>
            <p className="text-xs text-gray-600">
              Browse our GPS devices and fuel monitoring sensors to add items to your cart.
            </p>
            <Link
              to="/shop"
              className="inline-block px-6 py-3 bg-[#385775] hover:bg-[#293d54] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 btn-press"
            >
              Explore GPS Trackers
            </Link>
          </div>
        ) : (
          /* Cart with Items & Delivery Address */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Items Table + Customer Delivery Address */}
            <div className="min-w-0 lg:col-span-8 space-y-6">
              
              {/* Delivery Address Box */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs reveal">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-700" />
                    <h3 className="text-sm font-bold text-gray-900">Delivery & Shipping Address</h3>
                  </div>
                  <button
                    onClick={() => {
                      setAddressForm({
                        fullName: user?.fullName || '',
                        addressLine1: user?.addressLine1 || '',
                        addressLine2: user?.addressLine2 || '',
                        city: user?.city || '',
                        pincode: user?.pincode || '',
                      });
                      setIsEditingAddress(!isEditingAddress);
                    }}
                    className="text-xs font-bold text-[#385775] hover:underline flex items-center gap-1 transition-colors duration-150"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingAddress ? 'Cancel' : 'Change Address'}</span>
                  </button>
                </div>

                {!isEditingAddress ? (
                  <div className="pt-3 text-xs text-gray-700 space-y-1">
                    <p className="font-bold text-sm text-gray-900">{user.fullName}</p>
                    <p className="text-gray-600">{user.addressLine1}</p>
                    {user.addressLine2 && <p className="text-gray-600">{user.addressLine2}</p>}
                    <p className="text-gray-800 font-semibold">{user.city} - {user.pincode}</p>
                    <p className="text-brand-700 font-medium">Contact: +91 {user.mobileNumber}</p>
                  </div>
                ) : (
                  <form onSubmit={handleAddressSave} className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          required
                          className="w-full text-xs p-2 bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          className="w-full text-xs p-2 bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        required
                        className="w-full text-xs p-2 bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={addressForm.addressLine2}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                          className="w-full text-xs p-2 bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Pincode</label>
                        <input
                          type="text"
                          maxLength="6"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          required
                          className="w-full text-xs p-2 bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#385775] text-white text-xs font-bold rounded-lg shadow-xs btn-press"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden reveal">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    Order Items ({itemCount})
                  </h3>
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 transition-colors duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                      {/* Product Image */}
                      <img
                        src={item.product?.primaryImage}
                        alt={item.product?.title}
                        className="w-20 h-20 object-contain p-1 rounded-xl bg-brand-50/50 border border-brand-100 shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <Link
                          to={`/product/${item.product?.slug}`}
                          className="text-sm font-bold text-gray-900 hover:text-brand-700 transition-colors duration-150"
                        >
                          {item.product?.title}
                        </Link>
                        <div className="text-xs text-gray-500">
                          Subscription Plan: <span className="font-semibold text-brand-800">{item.planDuration}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          ₹{formatMoney(item.product?.sellingPrice)}
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center border border-gray-300 rounded-lg bg-brand-50/60 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-gray-700 hover:bg-brand-200 transition-colors duration-150"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-gray-700 hover:bg-brand-200 transition-colors duration-150"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right min-w-[100px] flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                        <span className="text-sm font-extrabold text-[#293d54]">
                          ₹{formatMoney(item.product?.sellingPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-150 mt-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Razorpay Trigger */}
            <div className="min-w-0 lg:col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-5 reveal">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
                  Payment Summary
                </h3>

                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% Included)</span>
                    <span className="text-brand-700 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pan-India Courier</span>
                    <span className="text-brand-700 font-bold uppercase">FREE</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Total Payable</span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-[#293d54]">
                      ₹{formatMoney(subtotal)}
                    </span>
                    <p className="text-[10px] text-gray-400">All taxes included</p>
                  </div>
                </div>

                {/* Razorpay Proceed Button */}
                <button
                  type="button"
                  onClick={handleProceedToRazorpay}
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 bg-[#385775] hover:bg-[#293d54] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isProcessingPayment ? 'Connecting Razorpay...' : 'PAY WITH RAZORPAY'}</span>
                </button>

                <div className="space-y-2 pt-2 text-[11px] text-gray-500 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0" />
                    <span>Instant UPI, Cards & Netbanking via Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-700 shrink-0" />
                    <span>Dispatched within 24 hours from Pune warehouse</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>

    </div>
  );
};

export default Cart;
