import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import ProductEditorModal from './ProductEditorModal';
import { 
  Package, Plus, Search, Edit2, Trash2, Check, X, 
  RefreshCw, AlertCircle, Eye, Tag
} from 'lucide-react';

const AdminProducts = () => {
  const { authHeaders } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const loadMoreRef = useRef(null);
  const loadRequestedRef = useRef(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refreshProducts = () => {
    setPage(1);
    setHasNextPage(false);
    loadRequestedRef.current = false;
    setRefreshKey((current) => current + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    const params = { page, limit: 25 };
    if (appliedSearch) params.search = appliedSearch;
    if (stockFilter === 'IN_STOCK') params.stock = 'in_stock';
    if (stockFilter === 'OUT_OF_STOCK') params.stock = 'out_of_stock';

    api
      .get('/admin/products', { headers: authHeaders, params, signal: controller.signal })
      .then((res) => {
        if (res.data.success) {
          setProducts((previous) => {
            if (page === 1) return res.data.products;
            const seen = new Set(previous.map((product) => product.id));
            return [...previous, ...res.data.products.filter((product) => !seen.has(product.id))];
          });
          setTotalCount(res.data.totalCount);
          setHasNextPage(res.data.hasNextPage);
        }
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          console.error(error);
          if (page === 1) {
            setProducts([]);
            setTotalCount(0);
          }
          setHasNextPage(false);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
          loadRequestedRef.current = false;
        }
      });
    return () => controller.abort();
  }, [stockFilter, appliedSearch, page, refreshKey]);

  useEffect(() => {
    if (!hasNextPage || loading || loadingMore || !loadMoreRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadRequestedRef.current) {
        loadRequestedRef.current = true;
        setPage((current) => current + 1);
      }
    }, { rootMargin: '400px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, loadingMore, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextSearch = search.trim();
    setPage(1);
    setHasNextPage(false);
    if (nextSearch === appliedSearch && page === 1) refreshProducts();
    else setAppliedSearch(nextSearch);
  };

  const handleToggleStock = async (product) => {
    try {
      const res = await api.patch(`/admin/products/${product.id}/stock`, {}, { headers: authHeaders });
      if (res.data.success) {
        const matchesFilter = stockFilter === 'ALL' ||
          (stockFilter === 'IN_STOCK' && res.data.product.inStock) ||
          (stockFilter === 'OUT_OF_STOCK' && !res.data.product.inStock);
        setProducts((prev) => matchesFilter
          ? prev.map((p) => (p.id === product.id ? res.data.product : p))
          : prev.filter((p) => p.id !== product.id));
        if (!matchesFilter) setTotalCount((count) => Math.max(0, count - 1));
        setNotice({ type: 'success', text: res.data.message });
        setTimeout(() => setNotice({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to update stock status.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await api.delete(`/admin/products/${deleteId}`, { headers: authHeaders });
      if (res.data.success) {
        setNotice({ type: 'success', text: res.data.message });
        setDeleteId(null);
        refreshProducts();
      } else {
        setNotice({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setNotice({ type: 'error', text: 'Error deleting product.' });
    } finally {
      setDeleting(false);
      setTimeout(() => setNotice({ type: '', text: '' }), 4000);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = async (product) => {
    if (editingId) return;
    setEditingId(product.id);
    try {
      const res = await api.get(`/admin/products/${product.id}`, { headers: authHeaders });
      if (res.data.success) {
        setEditingProduct(res.data.product);
        setModalOpen(true);
      }
    } catch (error) {
      setNotice({ type: 'error', text: 'Could not load product details. Please try again.' });
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="bg-white p-6 rounded-lg border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">GPS Product Catalog</h2>
          <p className="text-xs text-gray-500">Manage device specifications, prices, discounts, and images.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-4 py-2 bg-brand-50/50 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </form>

          <button
            onClick={refreshProducts}
            className="p-2.5 rounded-md border border-gray-200 hover:bg-brand-50 text-gray-600 transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-md bg-[#385775] hover:bg-[#293d54] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice.text && (
        <div
          className={`p-3.5 rounded-md text-xs font-semibold flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <Check className="w-4 h-4 text-brand-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice({ type: '', text: '' })} className="text-gray-400 hover:text-gray-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stock Filter Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'ALL', label: `All Devices (${totalCount})` },
          { key: 'IN_STOCK', label: 'In Stock' },
          { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setPage(1); setHasNextPage(false); setStockFilter(tab.key); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              stockFilter === tab.key
                ? 'bg-[#385775] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs animate-pulse">
            Loading products...
          </div>
        ) : loadError && products.length === 0 ? (
          <div className="p-12 text-center text-sm text-red-700">Could not load products. Use Retry loading products below.</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-md bg-brand-50 text-[#385775] flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No products found in catalog.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-md bg-[#385775] text-white font-bold text-xs"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-responsive-table w-full text-left text-xs">
              <thead className="bg-brand-50/60 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200/80">
                <tr>
                  <th className="px-6 py-4">Thumbnail</th>
                  <th className="px-6 py-4">Product Name & Slug</th>
                  <th className="px-6 py-4">Price / MRP</th>
                  <th className="px-6 py-4">Warranty Plans</th>
                  <th className="px-6 py-4">Stock Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/30 transition-colors">
                    
                    {/* Thumbnail */}
                    <td data-label="Image" className="px-6 py-4">
                      <div className="w-14 h-14 rounded-md border border-gray-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        <img
                          src={p.primaryImage}
                          alt={p.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>

                    {/* Title & Slug */}
                    <td data-label="Product" className="px-6 py-4 max-w-xs">
                      <div className="font-extrabold text-gray-900 text-sm">{p.title}</div>
                      <div className="text-[11px] font-sans text-gray-400 truncate">/{p.slug}</div>
                      {p.subtitle && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{p.subtitle}</p>
                      )}
                    </td>

                    {/* Price & Discount */}
                    <td data-label="Price" className="px-6 py-4">
                      <div className="font-black text-gray-900 text-sm">
                        ₹{p.sellingPrice?.toLocaleString('en-IN')}
                      </div>
                      {p.originalPrice > p.sellingPrice && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="line-through text-gray-400">₹{p.originalPrice?.toLocaleString('en-IN')}</span>
                          <span className="text-brand-700 font-bold bg-brand-50 px-1.5 py-0.2 rounded-xs">
                            {p.discountPercent}% OFF
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Plans */}
                    <td data-label="Plans" className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.planOptions?.map((plan) => (
                          <span
                            key={plan}
                            className="px-2 py-0.5 rounded-sm bg-brand-50 text-[#385775] border border-brand-200 text-[10px] font-semibold"
                          >
                            {plan}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* In-Stock Switch */}
                    <td data-label="Stock" className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                          p.inStock
                            ? 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100'
                            : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                        }`}
                        title="Click to toggle in-stock / out-of-stock"
                      >
                        <span className={`w-2 h-2 rounded-full ${p.inStock ? 'bg-brand-500' : 'bg-red-500'}`}></span>
                        <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td data-label="Actions" className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          disabled={!!editingId}
                          className="p-2 rounded-md bg-brand-50 hover:bg-brand-100 text-[#385775] transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
      </div>
      {loadError && (
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="text-xs font-semibold text-brand-700 underline">Retry loading products</button>
      )}
      {/* Product Form Modal */}
      <ProductEditorModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={() => setModalOpen(false)}
        onSaved={refreshProducts}
      />

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fadeInScale">
            <div className="w-12 h-12 rounded-md bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Delete GPS Product?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove this product? If it has linked past orders, it will be marked as inactive to protect order records.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-md border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-md bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
