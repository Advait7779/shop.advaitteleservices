import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Mail, MapPin, Package, Phone, ShoppingCart, UserRound } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/money';

const profileFields = ['fullName', 'addressLine1', 'addressLine2', 'city', 'pincode'];
const formFromUser = (user) => Object.fromEntries(profileFields.map((key) => [key, user?.[key] || '']));
const statusClass = (status) => ({
  PAID: 'bg-brand-100 text-brand-800', PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-blue-100 text-blue-800', DELIVERED: 'bg-brand-100 text-brand-800',
  PENDING: 'bg-amber-100 text-amber-800', FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
}[status] || 'bg-gray-100 text-gray-700');

export default function Account() {
  const { user, isAuthenticated, loading: authLoading, openAuthModal, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => formFromUser(user));
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (user && !editing) setForm(formFromUser(user)); }, [user, editing]);
  useEffect(() => { setPage(1); setTotalPages(1); setOrders([]); }, [user?.id]);
  useEffect(() => {
    if (!isAuthenticated) { setOrders([]); return undefined; }
    const controller = new AbortController();
    setOrderLoading(true);
    setOrderError('');
    api.get('/orders/my-orders', { params: { page, limit: 10 }, signal: controller.signal })
      .then((response) => {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        if (page > (response.data.totalPages || 1)) setPage(response.data.totalPages || 1);
      })
      .catch((error) => { if (error.code !== 'ERR_CANCELED') { setOrders([]); setOrderError('Could not load your orders. Please try again.'); } })
      .finally(() => { if (!controller.signal.aborted) setOrderLoading(false); });
    return () => controller.abort();
  }, [isAuthenticated, user?.id, page, refreshKey]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setProfileNotice('');
    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      setEditing(false);
      setProfileNotice('Your details were updated.');
    } else setProfileNotice(result.message || 'Could not update your details.');
  };

  if (authLoading) return <div className="mx-auto max-w-6xl px-4 pb-16 pt-40 text-center text-sm text-gray-600 md:pt-28 lg:pt-40">Loading your account…</div>;
  if (!isAuthenticated) return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-40 text-center md:pt-28 lg:pt-40">
      <div className="rounded-2xl border border-brand-200 bg-white p-8 shadow-sm">
        <UserRound className="mx-auto h-10 w-10 text-[#385775]" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Your Account</h1>
        <p className="mt-2 text-sm text-gray-600">Sign in with your mobile number to see your profile and orders.</p>
        <button type="button" onClick={() => openAuthModal()} className="mt-6 rounded-lg bg-[#385775] px-6 py-3 text-sm font-bold text-white hover:bg-[#2a435d]">Sign In</button>
      </div>
    </div>
  );

  const inputClass = 'mt-1 w-full rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2.5 text-sm outline-none focus:border-[#385775] focus:ring-2 focus:ring-[#385775]/20';
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 pb-20 pt-40 sm:px-6 md:pt-28 lg:pt-40 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#385775]">Advait Track</p><h1 className="mt-1 text-3xl font-bold tracking-tight">My Account</h1><p className="mt-1 text-sm text-gray-600">Your details and orders in one place.</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/shop" className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-xs font-bold text-[#385775] hover:bg-brand-50">Shop Products</Link><Link to="/cart" className="rounded-lg bg-[#385775] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2a435d]">My Cart</Link></div>
      </div>

      <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]" aria-label="Profile details">
        <div className="min-w-0 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-6 break-words">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Personal Details</h2>{!editing && <button type="button" onClick={() => { setProfileNotice(''); setEditing(true); }} className="text-xs font-bold text-[#385775] hover:underline">Edit Details</button>}</div>
          {profileNotice && <p role="status" className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-[#385775]">{profileNotice}</p>}
          {editing ? (
            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-gray-700">Full Name<input name="fullName" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className={inputClass} maxLength={100} required /></label>
              <label className="block text-xs font-bold text-gray-700">Address Line 1<input name="addressLine1" value={form.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))} className={inputClass} maxLength={200} required /></label>
              <label className="block text-xs font-bold text-gray-700">Address Line 2<input name="addressLine2" value={form.addressLine2} onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))} className={inputClass} maxLength={200} /></label>
              <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-bold text-gray-700">City<input name="city" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className={inputClass} maxLength={100} required /></label><label className="block text-xs font-bold text-gray-700">PIN Code<input name="pincode" value={form.pincode} onChange={(event) => setForm((current) => ({ ...current, pincode: event.target.value }))} className={inputClass} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label></div>
              <div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-lg bg-[#385775] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2a435d] disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button><button type="button" onClick={() => { setEditing(false); setForm(formFromUser(user)); setProfileNotice(''); }} className="rounded-lg border border-brand-200 px-4 py-2.5 text-xs font-bold text-[#385775]">Cancel</button></div>
            </form>
          ) : (
            <div className="mt-5 space-y-4 text-sm"><div className="flex items-start gap-3"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#385775]" /><div><p className="text-xs text-gray-500">Name</p><p className="font-semibold">{user.fullName}</p></div></div><div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#385775]" /><div><p className="text-xs text-gray-500">Verified Mobile</p><p className="font-semibold">+91 {user.mobileNumber}</p></div></div>{user.email && <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#385775]" /><div><p className="text-xs text-gray-500">Email</p><p className="font-semibold">{user.email}</p></div></div>}<div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#385775]" /><div><p className="text-xs text-gray-500">Delivery Address</p><p className="font-semibold">{user.addressLine1}{user.addressLine2 && `, ${user.addressLine2}`}</p><p>{user.city} - {user.pincode}</p></div></div></div>
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-brand-200 bg-[#172536] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Your Store</p><h2 className="mt-2 text-2xl font-bold">Everything connected.</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">View your purchases, check shipment status, and keep your delivery address ready for checkout.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link to="/cart" className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 text-sm font-semibold hover:bg-white/20"><span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />My Cart</span><ArrowRight className="h-4 w-4" /></Link><Link to="/quote" className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 text-sm font-semibold hover:bg-white/20"><span className="flex items-center gap-2"><FileText className="h-4 w-4" />Get a Quote</span><ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section aria-label="Order history" className="min-w-0 break-words rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">My Orders</h2><p className="mt-1 text-xs text-gray-500">Recent purchases and their current status.</p></div><button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-[#385775] hover:bg-brand-50">Refresh Orders</button></div>
        {orderError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{orderError}</p>}
        {orderLoading ? <p className="py-10 text-center text-sm text-gray-500">Loading orders…</p> : orders.length === 0 && !orderError ? <div className="py-12 text-center"><Package className="mx-auto h-9 w-9 text-[#385775]" /><p className="mt-3 text-sm font-semibold">No orders yet</p><Link to="/shop" className="mt-3 inline-block text-xs font-bold text-[#385775] hover:underline">Browse products</Link></div> : (
          <div className="mt-5 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">{order.orderNumber}</p><p className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>{order.status}</span></div><p className="mt-3 text-xs text-gray-600">{order.items.map((item) => `${item.productTitle} × ${item.quantity}`).join(', ')}</p>{order.trackingNumber && <p className="mt-2 text-xs text-gray-600">{order.courierName || 'Courier'}: {order.trackingNumber}</p>}<div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-3"><p className="text-sm font-bold">₹{formatMoney(order.totalAmount)}</p><Link to={`/order-success/${order.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-[#385775] hover:underline">View Order <ArrowRight className="h-3.5 w-3.5" /></Link></div></article>)}</div>
        )}
        {totalPages > 1 && <div className="mt-5 flex items-center justify-end gap-3 text-xs font-semibold"><button type="button" disabled={page <= 1 || orderLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-brand-200 px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || orderLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-brand-200 px-3 py-2 disabled:opacity-40">Next</button></div>}
      </section>
    </div>
  );
}
