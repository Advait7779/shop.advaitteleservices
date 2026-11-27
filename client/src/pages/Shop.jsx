import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { shopCategoryLink } from '../data/productCategories';
import { useProductCategories } from '../context/CategoryContext';
import { Grid2X2, MapPin, Radio, Fuel, UserRound, Camera, Tag } from 'lucide-react';
import ThemeSelect from '../components/common/ThemeSelect';

const categoryIcons = {
  'vehicle-gps': MapPin,
  'magnetic-trackers': Radio,
  'fuel-sensors': Fuel,
  'personal-gps': UserRound,
  'solar-cctv': Camera,
};

const Shop = () => {
  const { categories } = useProductCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim();
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const activeCategory = categories.find((item) => item.id === category);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const loadMoreRef = useRef(null);
  const loadRequestedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        setLoadError(false);
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        const res = await api.get('/products', { params: {
          page, limit: 24,
          ...(category ? { category } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          ...(sort ? { sort } : {}),
        }, signal: controller.signal });
        if (res.data.success) {
          setTotalCount(res.data.totalCount);
          setProducts((previous) => {
            if (page === 1) return res.data.products;
            const seen = new Set(previous.map((product) => product.id));
            return [...previous, ...res.data.products.filter((product) => !seen.has(product.id))];
          });
          setHasNextPage(res.data.hasNextPage);
        }
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          console.error('Failed to load shop products:', err);
          setHasNextPage(false);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
          loadRequestedRef.current = false;
        }
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [page, retryKey, searchQuery, category, sort]);

  const updateSort = (event) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set('sort', event.target.value);
    else next.delete('sort');
    setSearchParams(next);
  };

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

  return (
    <div className="mx-auto grid w-full max-w-[1536px] min-w-0 grid-cols-[minmax(0,1fr)] gap-6 px-4 pb-20 pt-36 sm:px-6 md:pt-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:pt-36">
      <aside aria-label="Product categories" className="min-w-0 self-start rounded-xl border border-[#dce5ee] bg-white p-4 lg:sticky lg:top-36">
        <h1 className="mb-4 text-lg font-semibold text-[#172536]">Product Categories</h1>
        <nav className="flex w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          <Link to="/shop" className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors lg:w-full ${!category ? 'bg-[#eaf0f6] text-[#385775]' : 'text-gray-600 hover:bg-[#f6f8fb]'}`}>
            <Grid2X2 className="h-4 w-4" aria-hidden="true" />All Products
          </Link>
          {categories.map((item) => {
            const Icon = categoryIcons[item.id] || Tag;
            return <Link key={item.id} to={shopCategoryLink(item.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full ${category === item.id ? 'bg-[#eaf0f6] text-[#385775]' : 'text-gray-600 hover:bg-[#f6f8fb]'}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />{item.label}
            </Link>;
          })}
        </nav>
      </aside>

      <section aria-label="Products" className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce5ee] bg-white px-5 py-3">
          <div>
            <p className="text-sm text-gray-600">{loading ? 'Loading products...' : `Showing ${totalCount} ${totalCount === 1 ? 'product' : 'products'}`}{activeCategory ? ` in ${activeCategory.label}` : ''}</p>
            {searchQuery && <p className="mt-1 text-xs text-[#385775]">Search: {searchQuery}</p>}
          </div>
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-gray-600">
            <span>Sort:</span>
            <ThemeSelect
              value={sort}
              onChange={updateSort}
              options={[
                { value: '', label: 'Default' },
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
                { value: 'name-asc', label: 'Name: A to Z' },
              ]}
              className="w-44 max-w-[calc(100vw-8rem)]"
            />
          </div>
        </div>
        {loading ? (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[360px] bg-brand-100/30 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : loadError && products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
            <p className="text-sm text-gray-700">Products could not be loaded.</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-brand-700 underline">Try again</button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 reveal">
            <p className="text-base font-semibold text-gray-700">{searchQuery || activeCategory ? 'No products match this selection.' : 'No products available currently.'}</p>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="product-card-enter"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
        <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
        {loadError && products.length > 0 && (
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mx-auto mt-6 block text-sm font-semibold text-brand-700 underline">Load more products</button>
        )}
      </section>
    </div>
  );
};

export default Shop;
