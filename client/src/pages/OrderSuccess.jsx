import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { companyName } from '../utils/branding';
import { CheckCircle2, Package, Printer, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingExpired, setPollingExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const paymentConfirmed = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order?.status);
  const paymentPending = order?.status === 'PENDING';

  const refreshOrder = useCallback(async (signal) => {
    const res = await api.get(`/orders/${orderId}`, { signal });
    if (res.data.success) setOrder(res.data.order);
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOrder = async () => {
      try {
        await refreshOrder(controller.signal);
      } catch (err) {
        if (!controller.signal.aborted) console.error('Failed to load order receipt:', err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    setOrder(null);
    setLoading(true);
    setPollingExpired(false);
    setRefreshError(false);
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
    return () => controller.abort();
  }, [orderId, refreshOrder]);

  useEffect(() => {
    if (!paymentPending) return undefined;
    const controller = new AbortController();
    const createdAt = new Date(order.createdAt).getTime();
    const deadline = (Number.isFinite(createdAt) ? createdAt : Date.now()) + 2 * 60 * 1000;
    let timer;
    const poll = async () => {
      if (Date.now() >= deadline) {
        setPollingExpired(true);
        return;
      }
      try {
        if (!document.hidden) await refreshOrder(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) console.error('Could not refresh order status:', error);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 5000);
      }
    };
    timer = setTimeout(poll, 5000);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [paymentPending, order?.createdAt, refreshOrder]);

  const checkStatus = async () => {
    setRefreshing(true);
    setRefreshError(false);
    try {
      await refreshOrder();
    } catch (error) {
      console.error('Could not refresh order status:', error);
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-500 mt-3 font-semibold">Generating order receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-lg font-bold text-gray-800">Order Record Not Found</h2>
        <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-[#385775] text-white text-xs font-bold rounded-xl btn-press">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-36 reveal sm:px-6 md:pt-24 lg:pt-36">
      {/* Success Banner */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm text-center space-y-3">
        <div className="w-16 h-16 bg-brand-100 text-[#385775] rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-xs font-bold text-brand-700 bg-brand-100/70 px-3 py-1 rounded-full uppercase tracking-wider">
          {paymentConfirmed ? 'Payment Confirmed via Razorpay' : paymentPending ? 'Payment Confirmation Pending' : 'Order Not Completed'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {paymentConfirmed ? 'Thank You For Your Order!' : paymentPending ? 'Awaiting Payment Confirmation' : 'Order Not Completed'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
          {paymentConfirmed
            ? 'Your payment has been confirmed. You can save your order receipt below.'
            : paymentPending
              ? pollingExpired
                ? 'Payment is still pending. Check the status below or view it in My Orders. Please do not pay again yet.'
                : 'Your payment is still being confirmed. This page checks for updates for two minutes. Please do not pay again yet.'
              : 'This order was not completed. Please contact support if money was deducted.'}
        </p>
        {paymentPending && pollingExpired && (
          <div>
            <button type="button" onClick={checkStatus} disabled={refreshing} className="rounded-xl border border-brand-300 px-4 py-2 text-xs font-bold text-brand-800 disabled:opacity-50">
              {refreshing ? 'Checking...' : 'Check Payment Status'}
            </button>
            {refreshError && <p className="mt-2 text-xs text-red-700">Status could not be checked. Please try again.</p>}
          </div>
        )}
      </div>

        {/* Receipt Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Advait Logo" className="w-10 h-10 object-contain rounded-xl p-0.5 border border-brand-200" />
            <div>
              <h3 className="text-base font-bold text-gray-900">{companyName}</h3>
              <p className="text-xs text-gray-500">Order receipt</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500">Order Number</p>
            <p className="text-sm font-extrabold text-[#293d54] font-sans">{order.orderNumber}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Shipping & Payment Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
          <div>
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-700" />
              <span>Shipping Address</span>
            </h4>
            <p className="font-semibold text-gray-800">{order.shippingAddress?.fullName}</p>
            <p className="text-gray-600">{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && (
              <p className="text-gray-600">{order.shippingAddress?.addressLine2}</p>
            )}
            <p className="text-gray-800">{order.shippingAddress?.city} - {order.shippingAddress?.pincode}</p>
            <p className="text-brand-700 font-medium mt-1">Phone: +91 {order.shippingAddress?.mobileNumber}</p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-700" />
              <span>Payment Details</span>
            </h4>
            <p><strong>Status:</strong> <span className="text-brand-700 font-bold uppercase">{order.status}</span></p>
            <p><strong>Method:</strong> Razorpay Gateway</p>
            {order.razorpayPaymentId && (
            <p className="font-sans text-[11px] text-gray-600 break-all">
                <strong>Payment ID:</strong> {order.razorpayPaymentId}
              </p>
            )}
            <p className="text-gray-500 mt-1">Dispatched from Pune Central Hub</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Purchased Items</h4>
          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div key={item.id} className="p-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
                <div className="min-w-0 break-words">
                  <p className="font-bold text-gray-900">{item.productTitle}</p>
                  <p className="text-[11px] text-gray-500">Subscription Plan: {item.planDuration}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-bold text-gray-900">
                    ₹{formatMoney(item.unitPrice)} x {item.quantity}
                  </p>
                  <p className="text-[11px] font-semibold text-brand-800">
                    ₹{formatMoney(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Row */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900">{paymentConfirmed ? 'Total Paid Amount' : 'Order Total'}</span>
          <span className="text-xl font-extrabold text-[#293d54]">
            ₹{formatMoney(order.totalAmount)}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap gap-3 justify-between print:hidden">
          {paymentConfirmed && <button
            onClick={handlePrint}
            className="px-4 py-2.5 border border-brand-300 hover:bg-brand-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors duration-150 btn-press"
          >
            <Printer className="w-4 h-4 text-brand-700" />
            <span>Print Receipt</span>
          </button>}

          <Link to="/account" className="px-4 py-2.5 border border-brand-300 hover:bg-brand-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors duration-150 btn-press">My Orders</Link>

          <Link
            to="/shop"
            className="px-6 py-2.5 bg-[#385775] hover:bg-[#293d54] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all duration-200 btn-press"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
