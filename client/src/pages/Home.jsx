import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/common/ProductCard';
import TrackingMapHero from '../components/common/TrackingMapHero';
import { MapPin, Camera, ArrowRight } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products', { params: { page: 1, limit: 6 } }).then((res) => {
      if (res.data.success) setProducts(res.data.products);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-20 pb-20">
      
      {/* ============ GPS MAP HERO ============ */}
      <div className="home-campaign">
        <section className="tracking-hero" aria-labelledby="tracking-hero-title">
          <TrackingMapHero />
          <div className="tracking-hero__veil" aria-hidden="true" />

          <div className="tracking-hero__content">
            <h1 id="tracking-hero-title">Live tracking.<br /><span>Made simple.</span></h1>
            <p className="tracking-hero__description">Follow every vehicle in real time.</p>
            <div className="tracking-hero__actions">
              <Link to="/shop?category=vehicle-gps" className="tracking-hero__primary">Explore GPS trackers</Link>
            </div>
          </div>
        </section>
      </div>

      {/* ============ PRODUCTS GRID ============ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 reveal">
          <span className="text-xs font-bold uppercase tracking-widest text-[#385775]">
            OUR CATALOG
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-4 tracking-tight">
            GPS & Telematics Hardware For Vehicles & Fleets.
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[360px] bg-brand-100/30 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

        <div className="mt-10 text-center reveal">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#385775] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-[#293d54] hover:shadow-xl btn-press"
          >
            <span>View All Products in Shop</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
              <h2 id="connected-views-title" className="max-w-[440px] text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-[3.5rem]">
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
