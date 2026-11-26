import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { 
  ShieldCheck, MapPin, Camera, ArrowRight,
  CheckCircle, Sparkles
} from 'lucide-react';

/* Editorial hero: photography carries the product, HTML carries every control and word. */
const heroSlides = [
  {
    title: ['VEHICLE', 'GPS TRACKERS'],
    description: 'Anti-theft GPS tracking with remote engine cut-off, instant ignition alerts, and route history on Android & iOS.',
    cta: { text: 'Shop GPS devices', to: '/shop?category=vehicle-gps' },
    image: '/banners/hero-gps-product-small.webp',
    label: 'GPS TRACKERS',
    detail: 'Protection in motion',
  },
  {
    title: ['COMMERCIAL', 'FLEET TRACKING'],
    description: 'Monitor commercial trucks, taxis, and staff cabs with live speed, route replay, and daily mileage reports.',
    cta: { text: 'Shop GPS Trackers', to: '/shop?category=vehicle-gps' },
    image: '/banners/hero-fleet-product-small.webp',
    label: 'FLEET SOLUTIONS',
    detail: 'Every route in view',
  },
  {
    title: ['PRECISION FUEL', 'SENSORS'],
    description: 'Monitor fuel levels and spot unusual usage.',
    cta: { text: 'Browse Fuel Sensors', to: '/shop?category=fuel-sensors' },
    image: '/banners/hero-fuel-monitoring.webp',
    label: 'FUEL SENSORS',
    detail: 'Clarity in every litre',
  },
  {
    title: ['4G SOLAR', 'CCTV CAMERAS'],
    description: '100% wire-free outdoor cameras powered by monocrystalline solar panels and built-in 4G SIM connectivity.',
    cta: { text: 'View Security Cameras', to: '/shop?category=solar-cctv' },
    image: '/banners/hero-cctv-product-small.webp',
    label: 'SOLAR CCTV',
    detail: 'Watch from anywhere',
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState(() => new Set([0]));

  const selectSlide = (index) => {
    setLoadedSlides((previous) => new Set(previous).add(index));
    setCurrentSlide(index);
  };

  useEffect(() => {
    api.get('/products', { params: { page: 1, limit: 6 } }).then((res) => {
      if (res.data.success) setProducts(res.data.products);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const timer = setInterval(() => {
      selectSlide((currentSlide + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="space-y-20 pb-20">
      
      {/* ============ EDITORIAL HERO CAROUSEL ============ */}
      <div className="home-campaign">
        <div className="campaign-strip campaign-strip--intro">
          <span className="campaign-strip__icon"><ShieldCheck size={22} strokeWidth={1.8} aria-hidden="true" /></span>
          <div className="campaign-strip__headline">
            <span className="campaign-strip__eyebrow">ADVAIT TRACK / SECURITY SYSTEMS</span>
            <strong>Connected. Protected. In control.</strong>
          </div>
          <div className="campaign-strip__scope" aria-label="GPS Tracking and Solar CCTV">
            <span>GPS TRACKING</span>
            <span>SOLAR CCTV</span>
          </div>
        </div>

        <section
          className="editorial-hero text-white"
          aria-label="Featured Advait products"
        >
          {heroSlides.map((item, index) => loadedSlides.has(index) && (
            <img
              key={item.image}
              className={`editorial-hero__image ${index === currentSlide ? 'is-active' : ''}`}
              src={item.image}
              alt=""
              aria-hidden={index !== currentSlide}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          ))}
          <div className="editorial-hero__shade" aria-hidden="true" />

          <div className="editorial-hero__content" key={`content-${currentSlide}`}>
            <p className="editorial-hero__eyebrow">ADVAIT TRACK / FEATURED COLLECTION</p>
            <h1 className="editorial-hero__title">
              {slide.title.map((line) => <span key={line}>{line}</span>)}
            </h1>
            <p className="editorial-hero__description">{slide.description}</p>
            <Link to={slide.cta.to} className="editorial-hero__cta">
              <span>{slide.cta.text}</span>
              <span className="editorial-hero__cta-icon"><ArrowRight size={17} strokeWidth={1.8} /></span>
            </Link>
          </div>

          <div className="editorial-hero__rail" role="tablist" aria-label="Featured collections">
            {heroSlides.map((item, index) => (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Show ${item.label}`}
                onClick={() => selectSlide(index)}
                className={`editorial-hero__slide ${index === currentSlide ? 'is-active' : ''}`}
              >
                <span className="editorial-hero__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="editorial-hero__slide-label">{item.label}</span>
                <span className="editorial-hero__slide-detail">{item.detail}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="campaign-strip campaign-strip--outro">
          <span className="campaign-strip__icon"><MapPin size={22} strokeWidth={1.8} aria-hidden="true" /></span>
          <div className="campaign-strip__headline">
            <span className="campaign-strip__eyebrow">BUILT FOR THE WAY YOU MOVE</span>
            <strong>Find the right device for every vehicle and journey.</strong>
          </div>
          <Link to="/shop" className="campaign-strip__link">Explore all products <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>

      {/* ============ PRODUCTS GRID ============ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 reveal">
          <span className="text-xs font-bold uppercase tracking-widest text-[#385775] bg-brand-100 px-3 py-1 rounded-full">
            OUR CATALOG
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">
            GPS & Telematics Hardware For Vehicles & Fleets.
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Explore our vehicle trackers, portable magnetic beacons, and high-precision fuel monitoring sensors.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[420px] bg-brand-100/30 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
            {products.slice(0, 6).map((product, idx) => (
              <div
                key={product.id}
                className="product-card-enter"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center reveal">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#385775] hover:bg-[#293d54] text-white font-bold text-sm shadow-md hover:shadow-xl transition-all duration-300 btn-press"
          >
            <span>View All Products in Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============ CONNECTED MOBILE VIEWS ============ */}
      <section className="w-full border-y border-[#d4e0eb] bg-[#e8eff6]" aria-labelledby="connected-views-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center lg:grid-cols-[1.12fr_0.88fr]">
            <div className="order-2 px-4 pb-5 pt-1 sm:px-8 lg:order-1 lg:py-10 lg:pl-10 lg:pr-0">
              <img
                src="/banners/connected-mobile-views.webp"
                alt="Illustrative mobile views of fleet activity, live GPS tracking, and CCTV, shown with a GPS tracker and solar camera"
                loading="lazy"
                decoding="async"
                className="mx-auto block h-auto w-full max-w-[720px]"
              />
            </div>

            <div className="order-1 px-7 pt-10 text-[#172536] sm:px-12 sm:pt-14 lg:order-2 lg:px-10 lg:py-12 xl:pr-16">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#58738e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3f83b5]" aria-hidden="true" />
                Advait Track / Connected view
              </span>
              <h2 id="connected-views-title" className="mt-5 max-w-[440px] text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-[3.5rem]">
                Every route.<br />Every view.
              </h2>
              <p className="mt-5 max-w-[425px] text-sm leading-7 text-[#52677c] sm:text-base">
                Follow vehicle movement and keep an eye on your spaces with GPS tracking and solar CCTV.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/shop?category=vehicle-gps"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#293d54] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#172536] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385775]"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  GPS trackers
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/shop?category=solar-cctv"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#a9bed1] bg-white/75 px-4 py-2.5 text-sm font-semibold text-[#293d54] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385775]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Solar CCTV
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
