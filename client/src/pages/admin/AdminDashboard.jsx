import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { companyName } from '../../utils/branding';
import { 
  DollarSign, ShoppingBag, Package, Users, ArrowUpRight, 
  Clock, CheckCircle, Truck, AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api
      .get('/admin/analytics/overview')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-100 text-brand-800 border border-brand-200">PAID</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">PROCESSING</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">SHIPPED</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-lg border border-gray-200"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-lg border border-gray-200"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] text-white rounded-lg p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-300 bg-white/10 px-3 py-1 rounded-md border border-white/15">
            Store Command Dashboard
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
            {companyName}
          </h2>
          <p className="text-xs sm:text-sm text-brand-200 max-w-2xl">
            Live telemetry of customer orders, payments via Razorpay, device catalog availability, and shipping fulfillment.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs flex items-center justify-between card-hover">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Revenue</span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-brand-600 font-semibold flex items-center gap-1">
              <span>Paid Orders Total</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-brand-100 text-[#385775] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs flex items-center justify-between card-hover">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalOrders || 0}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {stats?.statusCounts?.PAID || 0} Paid &bull; {stats?.statusCounts?.SHIPPED || 0} Shipped
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Products in Catalog */}
        <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs flex items-center justify-between card-hover">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">GPS Devices</span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalProducts || 0}
            </h3>
            <p className="text-[11px] text-brand-700 font-medium">
              {stats?.inStockProducts || 0} In Stock &bull; {stats?.outOfStockProducts || 0} Out
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs flex items-center justify-between card-hover">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customers</span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {stats?.totalCustomers || 0}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Verified mobile users
            </p>
          </div>
          <div className="w-12 h-12 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200/80 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-gray-900">Recent Customer Orders</h3>
              <span className="px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200 text-[#385775] text-[10px] font-bold">
                Last 5 Orders
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Showing the latest 5 orders ready for dispatch and tracking update.</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-[#385775] hover:text-[#293d54] flex items-center gap-1 hover:underline"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-responsive-table w-full text-left text-xs">
            <thead className="bg-brand-50/50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Total (₹)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-brand-50/30 transition-colors">
                    <td data-label="Order" className="px-6 py-4 font-sans font-bold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td data-label="Customer" className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{order.user?.fullName || 'Customer'}</div>
                      <div className="text-[11px] text-gray-500 font-sans">{order.user?.mobileNumber}</div>
                    </td>
                    <td data-label="Items" className="px-6 py-4 font-medium text-gray-700">
                      {order.items?.[0]?.productTitle || 'GPS Item'}
                    </td>
                    <td data-label="Total" className="px-6 py-4 font-black text-gray-900">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td data-label="Status" className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td data-label="Date" className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td data-label="Action" className="px-6 py-4 text-right">
                      <Link
                        to="/admin/orders"
                        className="px-3 py-1.5 rounded-md bg-brand-100 hover:bg-brand-200 text-[#385775] font-bold text-[11px] transition-colors btn-press inline-block"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
