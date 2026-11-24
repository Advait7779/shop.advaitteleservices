import React, { useEffect, useState } from 'react';
import { FileText, Mail, Phone, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import ThemeSelect from '../../components/common/ThemeSelect';

export default function AdminQuotes() {
  const { authHeaders } = useAdminAuth();
  const [quotes, setQuotes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/admin/quotes', { headers: authHeaders, params: { page, ...(filter ? { status: filter } : {}) }, signal: controller.signal })
      .then((response) => {
        setQuotes(response.data.quotes || []);
        setTotalPages(response.data.totalPages || 1);
        if (page > (response.data.totalPages || 1)) setPage(response.data.totalPages || 1);
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setQuotes([]);
          setError('Could not load quote requests. Please try again.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, filter, refreshKey]);

  const updateStatus = async (quote) => {
    const status = quote.status === 'NEW' ? 'CONTACTED' : 'NEW';
    setUpdatingId(quote.id);
    setError('');
    try {
      await api.patch(`/admin/quotes/${quote.id}/status`, { status }, { headers: authHeaders });
      setQuotes((current) => current.map((item) => item.id === quote.id ? { ...item, status } : item));
      if (filter) setRefreshKey((current) => current + 1);
    } catch {
      setError('Could not update the request status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div><h2 className="text-xl font-bold">Quote Requests</h2><p className="mt-1 text-xs text-gray-500">Enquiries submitted through the storefront quote form.</p></div>
        <div className="flex items-center gap-2">
          <label htmlFor="quote-status" className="text-xs font-semibold text-gray-700">Status</label>
          <ThemeSelect
            id="quote-status"
            value={filter}
            onChange={(event) => { setPage(1); setFilter(event.target.value); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'NEW', label: 'New' },
              { value: 'CONTACTED', label: 'Contacted' },
            ]}
            className="w-36"
          />
          <button type="button" onClick={() => setRefreshKey((current) => current + 1)} aria-label="Refresh quote requests" className="rounded-md border border-gray-300 p-2 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="rounded-lg bg-white p-10 text-center text-sm text-gray-500">Loading quote requests…</p> : quotes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center"><FileText className="mx-auto h-9 w-9 text-[#385775]" /><p className="mt-3 font-semibold">No quote requests found</p></div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-bold text-gray-900">{quote.subject}</p><p className="mt-1 text-sm text-gray-600">{quote.name} · {new Date(quote.createdAt).toLocaleString('en-IN')}</p></div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${quote.status === 'NEW' ? 'bg-amber-100 text-amber-900' : 'bg-brand-100 text-brand-900'}`}>{quote.status === 'NEW' ? 'New' : 'Contacted'}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{quote.message}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs">
                <a href={`mailto:${quote.email}`} className="flex min-w-0 items-center gap-1.5 break-all font-semibold text-[#385775] hover:underline"><Mail className="h-4 w-4 shrink-0" />{quote.email}</a>
                {quote.phone && <a href={`tel:${quote.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 font-semibold text-[#385775] hover:underline"><Phone className="h-4 w-4" />{quote.phone}</a>}
                <button type="button" disabled={updatingId === quote.id} onClick={() => updateStatus(quote)} className="rounded-md border border-[#385775] px-3 py-1.5 font-bold text-[#385775] hover:bg-brand-50 disabled:opacity-50 sm:ml-auto">Mark as {quote.status === 'NEW' ? 'Contacted' : 'New'}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 text-xs font-semibold text-gray-600"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-gray-200 bg-white px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-gray-200 bg-white px-3 py-2 disabled:opacity-40">Next</button></div>
    </div>
  );
}
