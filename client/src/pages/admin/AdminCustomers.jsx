import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Phone, MapPin, Calendar, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [listError, setListError] = useState('');

  const refreshCustomers = () => setRefreshKey((current) => current + 1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    const params = { page };
    if (appliedSearch) params.search = appliedSearch;

    api
      .get('/admin/customers', { params, signal: controller.signal })
      .then((res) => {
        if (res.data.success) {
          setCustomers(res.data.customers);
          setTotalPages(res.data.totalPages || 1);
          if (page > (res.data.totalPages || 1)) setPage(res.data.totalPages || 1);
        }
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setCustomers([]);
          setListError('Could not load customers. Please refresh.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, appliedSearch, refreshKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    const nextSearch = search.trim();
    if (page === 1 && nextSearch === appliedSearch) refreshCustomers();
    else { setPage(1); setAppliedSearch(nextSearch); }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-gray-500">Registered vehicle owners and fleet enterprise accounts.</p>
        </div>

        <div className="flex w-full md:w-auto min-w-0 items-center gap-3">
          <form onSubmit={handleSearch} className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, last 4 digits or city"
              className="w-full pl-9 pr-4 py-2 bg-brand-50/50 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </form>

          <button
            onClick={refreshCustomers}
            className="p-2.5 shrink-0 rounded-md border border-gray-200 hover:bg-brand-50 text-gray-600 transition-colors"
            title="Refresh Customers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs animate-pulse">
            Loading customers...
          </div>
        ) : listError ? (
          <div role="alert" className="p-12 text-center text-xs text-red-700">{listError}</div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-md bg-brand-50 text-[#385775] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No customers registered yet.</p>
            <p className="text-xs text-gray-500">Customer profiles will appear here when users sign in or place orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-responsive-table w-full text-left text-xs">
              <thead className="bg-brand-50/60 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Customer</th>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Phone</th>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">City</th>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Orders Placed</th>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Lifetime Spend</th>
                  <th className="px-3.5 py-3 xl:px-5 xl:py-3.5">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-50/30 transition-colors">
                    
                    {/* Customer Name */}
                    <td data-label="Customer" className="px-3.5 py-3 xl:px-5 xl:py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-md bg-brand-100 text-[#385775] font-bold text-xs flex items-center justify-center">
                          {c.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm break-words">{c.fullName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td data-label="Phone" className="px-3.5 py-3 xl:px-5 xl:py-3.5">
                      <div className="flex items-center gap-1.5 font-sans font-semibold text-gray-800 whitespace-nowrap">
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        <span>{c.mobileNumber}</span>
                      </div>
                    </td>

                    <td data-label="City" className="px-3.5 py-3 xl:px-5 xl:py-3.5 text-gray-700">
                      {c.city || '—'}
                    </td>

                    {/* Orders count */}
                    <td data-label="Orders" className="px-3.5 py-3 xl:px-5 xl:py-3.5 font-bold text-gray-900">
                      <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold whitespace-nowrap">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    {/* Spend */}
                    <td data-label="Spend" className="px-3.5 py-3 xl:px-5 xl:py-3.5 font-black text-gray-900 text-sm whitespace-nowrap">
                      ₹{c.totalSpent?.toLocaleString('en-IN')}
                    </td>

                    {/* Registered Date */}
                    <td data-label="Registered" className="px-3.5 py-3 xl:px-5 xl:py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                      {new Date(c.registeredAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 text-xs font-semibold text-gray-600">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 bg-white border border-gray-200 rounded-md disabled:opacity-40">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 bg-white border border-gray-200 rounded-md disabled:opacity-40">Next</button>
      </div>

    </div>
  );
};

export default AdminCustomers;
