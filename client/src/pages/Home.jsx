import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import { 
  ShieldCheck, MapPin, ArrowRight,
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

      {/* ============ STATS COUNTER ============ */}
      <section className="bg-[#172536] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 reveal">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">PROVEN TRACK RECORD</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Trusted by Fleet Owners & Vehicle Drivers Across India
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center reveal-stagger">
            {[
              { value: '5,000+', label: 'Active Trackers' },
              { value: '200+', label: 'CCTV Installations' },
              { value: '150+', label: 'Commercial Fleets' },
              { value: '1 Year', label: 'Doorstep Warranty' },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm card-hover">
                <div className="text-3xl sm:text-4xl font-extrabold text-brand-400">{stat.value}</div>
                <p className="text-xs text-brand-200 font-semibold mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
