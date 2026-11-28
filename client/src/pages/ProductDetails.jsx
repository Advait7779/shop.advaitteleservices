import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { companyName } from '../utils/branding';
import { useCart } from '../context/CartContext';
import {
  ShoppingCart, ShieldCheck, Check, Truck, PhoneCall,
  Plus, Minus, Star, BatteryCharging, Wifi, Shield, CarFront
} from 'lucide-react';
import ThemeSelect from '../components/common/ThemeSelect';
import SimOptionSelector from '../components/common/SimOptionSelector';
import ProductReviewsSection from '../components/common/ProductReviewsSection';
import {
  isGpsProduct,
  SIM_OPTIONS,
  formatPlanSelection,
  formatSpecLabel,
} from '../utils/productOptions';

const CATEGORY_BADGES = {
  'vehicle-gps': 'Vehicle GPS Tracker',
  'magnetic-trackers': 'Magnetic GPS Tracker',
  'personal-gps': 'Personal GPS Tracker',
  'fuel-sensors': 'Fuel Telemetry Sensor',
  'solar-cctv': 'Solar 4G Security Camera',
};

const buildQuickHighlights = (product) => {
  const specs = product?.specs || {};
  return [
    { icon: BatteryCharging, label: 'Power / Battery', value: specs.battery || specs.powerSupply },
    { icon: Wifi, label: 'Connectivity', value: specs.connectivity },
    { icon: Shield, label: 'Build & Rating', value: specs.waterproof || specs.warranty },
    { icon: CarFront, label: 'Compatibility', value: specs.compatibility },
  ].filter((item) => Boolean(item.value && String(item.value).trim()));
};

const SpecsTable = ({ entries }) => (
  <div className="border border-gray-200 rounded-xl overflow-x-auto max-w-2xl">
    <table className="w-full text-sm text-left">
      <tbody>
        {entries.map(([key, val], idx) => (
          <tr key={key} className={idx % 2 === 0 ? 'bg-brand-50/30' : 'bg-white'}>
            <td className="py-3 px-4 font-semibold text-gray-700 w-2/5">{formatSpecLabel(key)}</td>
            <td className="py-3 px-4 text-gray-600 break-words">{String(val)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('1 Year');
  const [selectedSim, setSelectedSim] = useState('Without SIM');
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [cartStatus, setCartStatus] = useState('idle');

  useEffect(() => {
    const controller = new AbortController();
    setProduct(null);
    setLoading(true);
    setLoadError('');
    setCartStatus('idle');
    setQuantity(1);
    setSelectedSim('Without SIM');
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`, { signal: controller.signal });
        if (!controller.signal.aborted && res.data.success) {
          const item = res.data.product;
          setProduct(item);
          setSelectedPlan(item.planOptions?.[0] || '1 Year');
          setActiveImage(item.primaryImage || '');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(err.response?.status === 404 ? 'Product Not Found' : 'Could not load this product. Please try again.');
          console.error('Failed to load product details:', err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchProduct();
    return () => controller.abort();
  }, [slug, retryKey]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20 text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-gray-500 mt-4">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20 text-center">
        <h2 className="text-xl font-bold text-gray-800">{loadError || 'Product Not Found'}</h2>
        {loadError && loadError !== 'Product Not Found' && <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-4 mr-3 rounded-xl border border-brand-300 px-5 py-2.5 text-xs font-bold text-[#385775]">Try Again</button>}
        <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-[#385775] text-white text-xs font-bold rounded-xl btn-press">Back to Shop</Link>
      </div>
    );
  }

  const showSimSelector = product.supportsSimOptions ?? isGpsProduct(product);
  const effectivePlan = showSimSelector
    ? formatPlanSelection(selectedPlan, selectedSim)
    : selectedPlan;

  const gallery = Array.from(
    new Set([product.primaryImage, ...(product.galleryImages || [])].filter(Boolean))
  );
  const specEntries = product.specs
    ? Object.entries(product.specs).filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
    : [];
  const highlights = buildQuickHighlights(product);

  const handleAddToCart = async () => {
    if (cartStatus !== 'idle') return;
    setCartStatus('adding');
    const added = await addToCart(product, effectivePlan, quantity);
    if (!added) {
      setCartStatus('idle');
    } else {
      setCartStatus('added');
      setTimeout(() => setCartStatus('idle'), 1200);
    }
  };

  const handleReviewSubmitted = (payload) => {
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rating: payload.rating,
        reviewCount: payload.reviewCount,
        ratingBreakdown: payload.ratingBreakdown || prev.ratingBreakdown,
        reviews: [payload.review, ...(prev.reviews || [])],
      };
    });
  };

  const tabs = [
    { key: 'description', label: 'Description & Features' },
    { key: 'specs', label: 'Technical Specifications' },
    { key: 'manufacturer', label: 'Manufacturer & Warranty' },
    { key: 'whatsInBox', label: "What's in the Box" },
  ];

  const manufacturer = product.manufacturerInfo || {};

  return (
    <div className="min-w-0 space-y-12 pb-20">
      {/* Slim breadcrumb bar */}
      <div className="bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] pb-4 pt-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium">
          <Link to="/" className="text-brand-400 hover:text-white transition-colors duration-200">Home</Link>
          <span className="text-brand-700">&gt;</span>
          <Link to="/shop" className="text-brand-400 hover:text-white transition-colors duration-200">Shop</Link>
          <span className="text-brand-700">&gt;</span>
          <span className="text-white font-semibold truncate max-w-[240px]">{product.title}</span>
        </div>
      </div>

      {/* ========== MAIN PRODUCT LAYOUT ========== */}
      <section className="max-w-7xl min-w-0 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-10 lg:gap-16">
          {/* LEFT: Gallery */}
          <div className="min-w-0 lg:col-span-5 reveal-left">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center justify-center rounded-2xl border border-[#d7e2ec] bg-[#eaf1f7] p-8">
                <img
                  src={activeImage || product.primaryImage}
                  alt={product.title}
                  className="max-h-[340px] w-auto max-w-full object-contain mix-blend-multiply"
                />
              </div>
              {gallery.length > 0 && (
                <div className="flex gap-3 mt-4 justify-center flex-wrap">
                  {gallery.map((img) => {
                    const selected = (activeImage || product.primaryImage) === img;
                    return (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        aria-label="Preview product angle"
                        className={`h-16 w-16 rounded-xl bg-[#eaf1f7] p-1 transition-all duration-200 ${
                          selected ? 'border-2 border-[#385775] shadow-xs' : 'border border-[#d7e2ec] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info & Buying Controls */}
          <div className="min-w-0 lg:col-span-7 space-y-6 reveal-right">
            {/* Status & Rating Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full">
                  {product.slug?.includes('dashcam') ? '4G GPS Dashcam' : (CATEGORY_BADGES[product.category] || companyName)}
                </span>
                <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> In Stock &amp; Ready to Dispatch
                </span>
              </div>

              {Number(product.rating) > 0 && (
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-800 hover:border-[#385775] transition-colors"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(product.rating).toFixed(1)}</span>
                  <span className="font-medium text-[#385775]">
                    ({product.reviewCount || product.reviews?.length || 0} reviews)
                  </span>
                </a>
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {product.title}
              </h1>
              <p className="mt-2.5 text-sm text-gray-600 leading-relaxed max-w-2xl">
                {product.subtitle || product.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-4 border-y border-gray-100">
              <span className="text-3xl font-extrabold text-[#293d54] tracking-tight">
                ₹{formatMoney(product.sellingPrice)}
              </span>
              <span className="text-sm text-gray-500">/-</span>
              {product.originalPrice > product.sellingPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">₹{formatMoney(product.originalPrice)}/-</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#385775] text-white text-[11px] font-bold">{product.discountPercent}% OFF</span>
                </>
              )}
              <span className="text-[11px] font-medium text-gray-500 ml-auto">
                {product.specs?.taxCode || 'Inclusive of all taxes'}
              </span>
            </div>

            {/* At-a-Glance Highlights */}
            {highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {highlights.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-2.5 rounded-xl border border-[#dce5ee] bg-[#f8fbfd] px-3.5 py-2.5"
                  >
                    <Icon className="h-4 w-4 text-[#385775] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                      <p className="text-xs font-semibold text-gray-800 leading-snug mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Subscription Plan:
              </label>
              <ThemeSelect
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                options={(product.planOptions || []).map((opt) => ({
                  value: opt,
                  label: opt,
                }))}
                className="w-full sm:w-72"
              />
            </div>

            {/* GPS SIM Selector — Shown Strictly for GPS Tracking Devices */}
            {showSimSelector && (
              <SimOptionSelector
                selectedSim={selectedSim}
                onChange={setSelectedSim}
                options={product.simOptions?.length ? product.simOptions : SIM_OPTIONS}
              />
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="px-4 py-3 text-gray-600 hover:bg-brand-50 transition-colors duration-150"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center text-sm font-bold text-gray-800 border-x border-gray-200">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="px-4 py-3 text-gray-600 hover:bg-brand-50 transition-colors duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartStatus !== 'idle'}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-300 btn-press ${
                  cartStatus !== 'idle'
                    ? 'bg-brand-600 text-white shadow-lg'
                    : 'bg-[#385775] hover:bg-[#293d54] text-white shadow-sm hover:shadow-lg'
                }`}
              >
                {cartStatus === 'adding' ? (
                  <><ShoppingCart className="w-4 h-4" /><span>Adding to Cart...</span></>
                ) : cartStatus === 'added' ? (
                  <><Check className="w-4 h-4" /><span>Added to Cart!</span></>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /><span>ADD TO CART</span></>
                )}
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="flex flex-wrap gap-6 pt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-700" />
                <span>{manufacturer.warranty || '1 Year Warranty'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-700" />
                <span>Free Pan-India Courier Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-brand-700" />
                <span>Support: 082829 82829</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRODUCT DETAILS & SPECS TABS ========== */}
      <section className="max-w-7xl min-w-0 mx-auto px-4 sm:px-6 lg:px-8 reveal">
        <div className="flex w-full min-w-0 flex-wrap gap-1 border-b border-gray-200 mb-8 pb-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 px-3 sm:py-3 sm:px-5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                activeTab === tab.key
                  ? 'border-[#385775] text-[#385775]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-4xl" key={activeTab} style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
          {activeTab === 'description' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-3">Product Overview</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {product.features?.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4">Key Features &amp; Capabilities</h2>
                  <ul className="space-y-3">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-brand-700" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {specEntries.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4">Key Specifications</h2>
                  <SpecsTable entries={specEntries} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Complete Technical Specifications</h2>
              {specEntries.length > 0 ? (
                <SpecsTable entries={specEntries} />
              ) : (
                <p className="text-sm text-gray-500">Detailed hardware specifications are provided in the box manual.</p>
              )}
            </div>
          )}

          {activeTab === 'manufacturer' && (
            <div className="space-y-3 text-sm text-gray-700 max-w-lg">
              <p><strong>Brand:</strong> {manufacturer.brand || companyName}</p>
              <p><strong>Country of Origin:</strong> {manufacturer.countryOfOrigin || 'India'}</p>
              <p><strong>Warranty:</strong> {manufacturer.warranty || '1 Year Full Replacement Guarantee'}</p>
              <p><strong>Support Helpline:</strong> {manufacturer.supportContact || '082829 82829 / sales@advaitteleservices.com'}</p>
              <p><strong>Head Office:</strong> Office No.522, 5th Floor, Amanora Chambers, Amanora Town Centre East Block, Pune 411028</p>
            </div>
          )}

          {activeTab === 'whatsInBox' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Package Contents</h2>
              {product.whatsInBox?.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-gray-700 max-w-lg">
                  {product.whatsInBox.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-brand-700" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Standard Advait device unit, accessories, and warranty card.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========== HUMANIZED RATINGS & CUSTOMER REVIEWS ========== */}
      <ProductReviewsSection
        key={product.slug}
        productSlug={product.slug}
        rating={product.rating}
        reviewCount={product.reviewCount}
        ratingBreakdown={product.ratingBreakdown}
        reviews={product.reviews || []}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default ProductDetails;
