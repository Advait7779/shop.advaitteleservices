import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatMoney } from '../utils/money';
import { companyName } from '../utils/branding';
import { useCart } from '../context/CartContext';
import { 
  ShoppingCart, ShieldCheck, Check, Truck, PhoneCall,
  Plus, Minus, ArrowLeft
} from 'lucide-react';
import ThemeSelect from '../components/common/ThemeSelect';

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('1 Year');
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
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`, { signal: controller.signal });
        if (!controller.signal.aborted && res.data.success) {
          setProduct(res.data.product);
          setSelectedPlan(res.data.product.planOptions?.[0] || '1 Year');
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-gray-500 mt-4">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-800">{loadError || 'Product Not Found'}</h2>
        {loadError && loadError !== 'Product Not Found' && <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-4 mr-3 rounded-xl border border-brand-300 px-5 py-2.5 text-xs font-bold text-[#385775]">Try Again</button>}
        <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-[#385775] text-white text-xs font-bold rounded-xl btn-press">Back to Shop</Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (cartStatus !== 'idle') return;
    setCartStatus('adding');
    const added = await addToCart(product, selectedPlan, quantity);
    if (!added) {
      setCartStatus('idle');
    } else {
      setCartStatus('added');
      setTimeout(() => setCartStatus('idle'), 1200);
    }
  };

  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'manufacturer', label: 'Manufacturer Details' },
    { key: 'whatsInBox', label: "What's in the Box" },
  ];

  return (
    <div className="min-w-0 space-y-12 pb-20">
      
      {/* Slim breadcrumb bar */}
      <div className="bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] pb-4 pt-36 text-white md:pt-24 lg:pt-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium">
          <Link to="/" className="text-brand-400 hover:text-white transition-colors duration-200">Home</Link>
          <span className="text-brand-700">&gt;</span>
          <Link to="/shop" className="text-brand-400 hover:text-white transition-colors duration-200">Shop</Link>
          <span className="text-brand-700">&gt;</span>
          <span className="text-white font-semibold truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      {/* ========== MAIN PRODUCT LAYOUT — Open / Minimal ========== */}
      <section className="max-w-7xl min-w-0 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT: Image */}
          <div className="min-w-0 lg:col-span-5 reveal-left">
            <div className="lg:sticky lg:top-36">
              <div className="flex items-center justify-center rounded-2xl border border-[#d7e2ec] bg-[#eaf1f7] p-8">
                <img
                  src={product.primaryImage}
                  alt={product.title}
                  className="max-h-[340px] w-auto max-w-full object-contain mix-blend-multiply"
                />
              </div>
              {/* Thumbnail strip */}
              <div className="flex gap-3 mt-4 justify-center">
                <div className="h-16 w-16 cursor-pointer rounded-xl border-2 border-[#385775] bg-[#eaf1f7] p-1 shadow-xs transition-all duration-200 hover:shadow-md">
                  <img src={product.primaryImage} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Info — clean, open, no box border */}
          <div className="min-w-0 lg:col-span-7 space-y-6 reveal-right">
            
            {/* Inline status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full">{companyName}</span>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> In Stock & Ready to Dispatch
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
              {product.subtitle || product.description}
            </p>

            {/* Price — clean inline, no card wrapper */}
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
            </div>

            {/* Plan selector */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                SUBSCRIPTION PLAN:
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

            {/* Quantity + Add to Cart — inline row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-gray-600 hover:bg-brand-50 transition-colors duration-150"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center text-sm font-bold text-gray-800 border-x border-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-3 text-gray-600 hover:bg-brand-50 transition-colors duration-150"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
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

            {/* Trust micro-badges — flat, inline */}
            <div className="flex flex-wrap gap-6 pt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-700" />
                <span>1 Year Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-700" />
                <span>Free Courier Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-brand-700" />
                <span>Installation Helpline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TABS — clean, no outer card wrapper ========== */}
      <section className="max-w-7xl min-w-0 mx-auto px-4 sm:px-6 lg:px-8 reveal">
        {/* Tab row */}
        <div className="flex w-full min-w-0 gap-1 border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                activeTab === tab.key
                  ? 'border-[#385775] text-[#385775]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — no wrapping card */}
        <div className="max-w-4xl" key={activeTab} style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          {activeTab === 'description' && (
            <div className="space-y-8">
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-3">Product Overview</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {product.features?.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-4">Key Features</h4>
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

              {product.specs && (
                <div>
                  <h4 className="text-base font-bold text-gray-900 mb-4">Technical Specifications</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-w-lg">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {Object.entries(product.specs).map(([key, val], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? 'bg-brand-50/30' : 'bg-white'}>
                            <td className="py-3 px-4 font-semibold text-gray-700 capitalize w-1/3">{key}</td>
                            <td className="py-3 px-4 text-gray-600">{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manufacturer' && (
            <div className="space-y-3 text-sm text-gray-700 max-w-lg">
              <p><strong>Brand:</strong> {companyName}</p>
              <p><strong>Country of Origin:</strong> India</p>
              <p><strong>Warranty:</strong> 1 Year Full Replacement Guarantee</p>
              <p><strong>Support Helpline:</strong> 082829 82829 / sales@advaitteleservices.com</p>
              <p><strong>Head Office:</strong> Office No.522, 5th Floor, Amanora Chambers, Amanora Town Centre East Block, Pune 411028</p>
            </div>
          )}

          {activeTab === 'whatsInBox' && (
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-4">Package Contents</h4>
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
                <p className="text-sm text-gray-500">Standard Advait GPS tracker unit, connection wiring, and warranty card.</p>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default ProductDetails;
