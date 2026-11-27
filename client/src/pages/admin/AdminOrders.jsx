import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Search, Filter, ShoppingBag, Eye, Truck, Check, X, 
  MapPin, Phone, CreditCard, Calendar, RefreshCw, AlertCircle, FileText
} from 'lucide-react';
import ThemeSelect from '../../components/common/ThemeSelect';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [openingId, setOpeningId] = useState(null);
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  // Status edit state for selected order
  const [newStatus, setNewStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  const refreshOrders = () => setRefreshKey((current) => current + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    const params = { page, limit: 25 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (appliedSearch) params.search = appliedSearch;

    api
      .get('/admin/orders', { params, signal: controller.signal })
      .then((res) => {
        if (res.data.success) {
          setOrders(res.data.orders);
          setTotalPages(res.data.totalPages || 1);
          if (page > (res.data.totalPages || 1)) setPage(res.data.totalPages || 1);
        }
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setOrders([]);
          setListError('Could not load orders. Please refresh.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [statusFilter, page, appliedSearch, refreshKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextSearch = search.trim();
    if (page === 1 && nextSearch === appliedSearch) refreshOrders();
    else { setPage(1); setAppliedSearch(nextSearch); }
  };

  const handleOpenDetail = async (order) => {
    if (openingId) return;
    setOpeningId(order.id);
    setDetailError('');
    try {
      const res = await api.get(`/admin/orders/${order.id}`);
      if (!res.data.success) throw new Error('Order details unavailable');
      const detail = res.data.order;
      setSelectedOrder(detail);
      setNewStatus(detail.status);
      setCourierName(detail.courierName || '');
      setTrackingNumber(detail.trackingNumber || '');
      setNotes(detail.notes || '');
      setUpdateMessage({ type: '', text: '' });
    } catch (error) {
      setDetailError('Could not open order details. Please try again.');
    } finally {
      setOpeningId(null);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateMessage({ type: '', text: '' });

    try {
      const res = await api.patch(
        `/admin/orders/${selectedOrder.id}/status`,
        {
          status: newStatus,
          courierName,
          trackingNumber,
          notes,
        }
      );

      if (res.data.success) {
        setUpdateMessage({ type: 'success', text: res.data.message });
        setSelectedOrder(res.data.order);
        if (statusFilter === 'ALL' && !appliedSearch) {
          setOrders((current) => current.map((order) =>
            order.id === res.data.order.id ? {
              ...order,
              status: res.data.order.status,
              courierName: res.data.order.courierName,
              trackingNumber: res.data.order.trackingNumber,
            } : order));
        } else {
          // The updated order may no longer match the active filter or search.
          refreshOrders();
        }
      } else {
        setUpdateMessage({ type: 'error', text: res.data.message || 'Update failed.' });
      }
    } catch (err) {
      setUpdateMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update order status.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">PAID</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">PROCESSING</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const tabs = ['ALL', 'PENDING', 'FAILED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const nextStatuses = {
    PENDING: ['PENDING', 'CANCELLED'], FAILED: ['FAILED', 'CANCELLED'],
    PAID: ['PAID', 'PROCESSING'], PROCESSING: ['PROCESSING', 'SHIPPED'],
    SHIPPED: ['SHIPPED', 'DELIVERED'], DELIVERED: ['DELIVERED'], CANCELLED: ['CANCELLED'],
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Orders & Dispatch</h2>
            <p className="text-xs text-gray-500">Track and fulfill GPS shipments with tracking IDs.</p>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={refreshOrders}
              className="p-2.5 rounded-md border border-gray-200 hover:bg-brand-50 text-gray-600 hover:text-[#385775] transition-colors btn-press"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order # or Mobile..."
                className="w-full pl-9 pr-4 py-2 bg-brand-50/50 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </form>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-gray-100 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setPage(1); setStatusFilter(tab); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                statusFilter === tab
                  ? 'bg-[#385775] text-white shadow-xs'
                  : 'bg-brand-50/70 text-gray-600 hover:bg-brand-100 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

      </div>

      {detailError && <p role="alert" className="text-xs text-red-700">{detailError}</p>}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs animate-pulse">
            Loading orders list...
          </div>
        ) : listError ? (
          <div role="alert" className="p-12 text-center text-xs text-red-700">{listError}</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-md bg-brand-50 text-[#385775] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No orders found.</p>
            <p className="text-xs text-gray-500">There are no orders matching your selected status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-responsive-table w-full text-left text-xs">
              <thead className="bg-brand-50/60 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Ordered Devices</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Courier / Tracking</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-50/30 transition-colors">
                    
                    {/* Order # and Date */}
                    <td data-label="Order" className="px-6 py-4 font-sans">
                      <div className="font-bold text-gray-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td data-label="Customer" className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{order.user?.fullName}</div>
                      <div className="text-[11px] text-gray-500 font-sans">{order.user?.mobileNumber}</div>
                      <div className="text-[11px] text-gray-400">{order.user?.city}, {order.user?.pincode}</div>
                    </td>

                    {/* Items */}
                    <td data-label="Devices" className="px-6 py-4">
                      <div className="space-y-1">
                        {order.items?.map((item) => (
                          <div key={item.id} className="text-gray-800">
                            <span className="font-semibold">{item.productTitle}</span>
                            <span className="text-gray-500 text-[11px]"> ({item.planDuration} &bull; Qty {item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td data-label="Amount" className="px-6 py-4 font-black text-gray-900 text-sm">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td data-label="Status" className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Tracking */}
                    <td data-label="Tracking" className="px-6 py-4 text-[11px]">
                      {order.trackingNumber ? (
                        <div>
                          <div className="font-semibold text-gray-900">{order.courierName || 'Courier'}</div>
                          <div className="font-sans text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block mt-0.5">
                            {order.trackingNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </td>

                    {/* Action */}
                    <td data-label="Action" className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        disabled={!!openingId}
                        className="px-3 py-1.5 rounded-md bg-[#385775] hover:bg-[#293d54] text-white font-bold text-xs transition-colors btn-press flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 text-xs font-semibold text-gray-600">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 bg-white border rounded-md disabled:opacity-40">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 bg-white border rounded-md disabled:opacity-40">Next</button>
      </div>

      {/* ================= ORDER DETAIL SLIDE-OVER DRAWER ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeInRight">
            
            {/* Drawer Header */}
            <div className="p-6 bg-[#172536] text-white flex items-center justify-between border-b border-brand-900 sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">Order Inspection</span>
                <h3 className="text-lg font-black tracking-tight text-white">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="min-w-0 p-4 sm:p-6 space-y-6 flex-1 text-xs break-words">
              
              {updateMessage.text && (
                <div
                  className={`p-3.5 rounded-md text-xs font-semibold flex items-center gap-2 ${
                    updateMessage.type === 'success'
                      ? 'bg-brand-50 text-brand-800 border border-brand-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {updateMessage.type === 'success' ? (
                    <Check className="w-4 h-4 text-brand-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{updateMessage.text}</span>
                </div>
              )}

              {/* Status & Courier Update Form */}
              <div className="bg-brand-50/70 p-5 rounded-lg border border-brand-200 space-y-4">
                <h4 className="text-xs font-extrabold text-[#293d54] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#385775]" />
                  <span>Update Order Status & Dispatch</span>
                </h4>

                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Fulfillment Status</label>
                    <ThemeSelect
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      options={(nextStatuses[selectedOrder.status] || [selectedOrder.status]).map((value) => ({
                        value,
                        label: value,
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Courier Partner</label>
                      <input
                        type="text"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="DTDC / BlueDart / Delhivery"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Tracking Number / AWB</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. D12345678"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Internal Notes</label>
                    <textarea
                      rows="2"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add dispatch notes or serial numbers..."
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-2.5 rounded-md bg-[#385775] hover:bg-[#293d54] text-white font-bold text-xs shadow-sm hover:shadow-md transition-all btn-press disabled:opacity-50"
                  >
                    {updating ? 'Saving Status...' : 'Save & Update Order'}
                  </button>
                </form>
              </div>

              {/* Customer Shipping Address */}
              <div className="bg-white p-5 rounded-lg border border-gray-200/80 space-y-2">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-700" />
                  <span>Customer Delivery Address</span>
                </h4>
                <div className="text-gray-700 space-y-1 pt-1">
                  <div className="font-bold text-sm text-gray-900">{selectedOrder.shippingAddress?.fullName || selectedOrder.user?.fullName}</div>
                  <div className="flex items-center gap-1.5 text-gray-600 font-sans">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedOrder.shippingAddress?.mobileNumber || selectedOrder.user?.mobileNumber}</span>
                  </div>
                  <div className="text-gray-600">
                    {selectedOrder.shippingAddress?.addressLine1}
                    {selectedOrder.shippingAddress?.addressLine2 ? `, ${selectedOrder.shippingAddress?.addressLine2}` : ''}
                  </div>
                  <div className="text-gray-600 font-semibold">
                    {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.pincode}
                  </div>
                </div>
              </div>

              {/* Items Ordered List */}
              <div className="bg-white p-5 rounded-lg border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-700" />
                  <span>Ordered Items</span>
                </h4>

                <div className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{item.productTitle}</p>
                        <p className="text-[11px] text-gray-500">Plan: {item.planDuration} &bull; Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{item.subtotal?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400">₹{item.unitPrice} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm font-black text-gray-900">
                  <span>Grand Total Paid:</span>
                  <span className="text-[#293d54] text-base">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Razorpay Payment Information */}
              <div className="bg-white p-5 rounded-lg border border-gray-200/80 space-y-2">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-700" />
                  <span>Payment Gateway Meta</span>
                </h4>
                <div className="font-sans text-[11px] space-y-1 text-gray-600 break-all">
                  <div>Razorpay Payment ID: <span className="font-bold text-gray-900">{selectedOrder.razorpayPaymentId || 'N/A'}</span></div>
                  <div>Razorpay Order ID: <span className="font-bold text-gray-900">{selectedOrder.razorpayOrderId || 'N/A'}</span></div>
                  <div>Currency: <span className="font-bold text-gray-900">{selectedOrder.currency}</span></div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
