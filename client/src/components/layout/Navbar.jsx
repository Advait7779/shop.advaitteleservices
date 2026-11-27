import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { shopCategoryLink } from '../../data/productCategories';
import { useProductCategories } from '../../context/CategoryContext';
import { 
  ShoppingCart, User, LogOut, Menu, X, ChevronDown, MapPin, Search
} from 'lucide-react';

const accountInitials = (fullName) => {
  const names = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!names.length) return 'U';
  return `${names[0][0]}${names.length > 1 ? names[names.length - 1][0] : ''}`.toLocaleUpperCase();
};

const Navbar = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { categories } = useProductCategories();
  const mainCategories = categories.slice(0, 5);
  const moreCategories = categories.slice(5);
  const { itemCount, showToast } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const signOutDialogRef = useRef(null);
  const initials = accountInitials(user?.fullName);

  const requestSignOut = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    try {
      await logout();
      setShowSignOutConfirm(false);
    } catch {
      showToast('Could not sign out. Please try again.', 'error');
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setOpenCategory(null);
    setSearchTerm(location.pathname === '/shop' ? new URLSearchParams(location.search).get('search') || '' : '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setOpenCategory(null);
        setShowSignOutConfirm(false);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  useEffect(() => {
    if (!showSignOutConfirm) return undefined;
    const buttons = signOutDialogRef.current?.querySelectorAll('button');
    const first = buttons?.[0];
    const last = buttons?.[buttons.length - 1];
    first?.focus();
    const keepFocusInside = (event) => {
      if (event.key !== 'Tab' || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keepFocusInside);
    return () => document.removeEventListener('keydown', keepFocusInside);
  }, [showSignOutConfirm]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(shopCategoryLink(null, query));
    setMobileMenuOpen(false);
  };

  const searchForm = (mobile = false) => (
    <form onSubmit={submitSearch} role="search" className={`flex items-center rounded-md border border-white/20 bg-white ${mobile ? 'w-full' : 'w-full max-w-[590px]'}`}>
      <Search className="ml-3 h-4 w-4 shrink-0 text-[#385775]" aria-hidden="true" />
      <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search GPS devices, sensors and cameras" aria-label="Search products" className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#172536] outline-none placeholder:text-gray-500" />
      <button type="submit" aria-label="Submit product search" className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#385775] text-white hover:bg-[#2a435d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"><Search className="h-4 w-4" aria-hidden="true" /></button>
    </form>
  );

  return (
    <>
    <header className={`fixed inset-x-0 top-0 z-40 w-full text-white ${scrolled ? 'shadow-xl' : ''}`}>
      <div className="bg-[#293d54]">
        <div className="grid h-[70px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6 md:grid-cols-[minmax(210px,1fr)_minmax(0,590px)_minmax(210px,1fr)] lg:h-[76px] lg:gap-8 lg:px-9">
          {/* Brand at the left of the main header */}
          <Link to="/" className="group flex min-w-0 items-center gap-2 lg:gap-2.5">
            <img 
              src="/logo.png" 
              alt=""
              className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10 xl:h-11 xl:w-11"
            />
            <div>
              <span className="block whitespace-nowrap text-[clamp(10px,3.2vw,13px)] font-extrabold uppercase leading-tight tracking-tight text-white drop-shadow-sm sm:text-base xl:text-lg">Advait Teleservices</span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-brand-200 sm:text-[9px]">Pvt. Ltd.</span>
            </div>
          </Link>

          <div className="hidden min-w-0 justify-center md:flex">{searchForm()}</div>

          {/* Account and cart */}
          <div className="col-start-3 flex items-center justify-self-end gap-1 sm:gap-3">
            
            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="Account menu"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-white/90 hover:text-white transition-colors"
                >
                  <div className="flex h-8 min-w-8 items-center justify-center rounded-full border border-white/20 bg-[#385775] px-1 text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-brand-300 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#385775] bg-white text-[#172536] shadow-2xl">
                    <div className="bg-[#2a435d] px-4 py-4 text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-[#385775]">{initials}</span>
                        <p className="text-sm font-bold">Your account</p>
                      </div>
                      <p className="mt-2 text-xs font-medium text-brand-200">+91 {user.mobileNumber}</p>
                      {user.city && user.pincode && <div className="mt-1 flex items-start gap-1 text-[11px] text-white/75">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-brand-300" />
                        <span className="truncate">{user.city}, {user.pincode}</span>
                      </div>}
                    </div>
                    <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#2a435d] transition-colors duration-150 hover:bg-[#eaf0f6]">
                      <User className="h-4 w-4 text-[#385775]" />
                      <span>My Profile & Orders</span>
                    </Link>
                    <Link to="/cart" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#2a435d] transition-colors duration-150 hover:bg-[#eaf0f6]">
                      <ShoppingCart className="h-4 w-4 text-[#385775]" />
                      <span>My Cart ({itemCount})</span>
                    </Link>
                    <button onClick={requestSignOut} className="flex w-full items-center gap-2 border-t border-[#e7eef5] px-4 py-3 text-left text-xs font-semibold text-[#2a435d] transition-colors duration-150 hover:bg-[#eaf0f6]">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1 whitespace-nowrap text-xs font-medium text-white/90 lg:flex sm:text-[13px]">
                <User className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                <button type="button" onClick={() => openAuthModal()} className="rounded px-1 py-1.5 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-300">Account</button>
              </div>
            )}

            {/* Cart Button — Icon Only, Transparent BG */}
            <Link
              to="/cart"
              aria-label="View shopping cart"
              className="relative p-2 text-white/90 hover:text-white transition-colors flex items-center justify-center group"
            >
              <ShoppingCart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-[#172536]">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-white hover:text-brand-400 rounded-lg transition-colors duration-150" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">{searchForm(true)}</div>
      </div>

      {/* Product types in a separate bar, matching the reference header structure. */}
      <nav aria-label="Product categories" className="hidden h-11 items-center justify-center border-t border-white/10 bg-[#22354a] px-4 lg:flex">
        <div className={`grid h-full w-full max-w-[1130px] items-center ${moreCategories.length ? 'grid-cols-7' : 'grid-cols-6'}`}>
        <Link to="/shop" className={`flex h-full items-center justify-center whitespace-nowrap px-2 text-[11px] font-semibold uppercase hover:bg-white/10 xl:text-xs xl:tracking-wide ${location.pathname === '/shop' && !new URLSearchParams(location.search).has('category') ? 'text-brand-200' : 'text-white'}`}>All Products</Link>
        {mainCategories.map((menu, index) => (
          <div key={menu.id} className="relative flex h-full justify-center" onMouseEnter={() => menu.items.length && setOpenCategory(index)} onMouseLeave={() => setOpenCategory(null)}>
            <div className={`flex h-full items-center whitespace-nowrap rounded transition-colors hover:bg-white/10 ${openCategory === index ? 'bg-white/10' : ''}`}>
              <Link to={shopCategoryLink(menu.id)} onClick={() => setOpenCategory(null)} className={`flex h-full items-center pl-3 text-[11px] font-semibold uppercase xl:text-xs xl:tracking-wide ${menu.items.length ? 'pr-1' : 'pr-3'}`}>{menu.label}</Link>
              {menu.items.length > 0 && <button type="button" onClick={() => setOpenCategory(openCategory === index ? null : index)} aria-label={`Show ${menu.label} products`} aria-expanded={openCategory === index} aria-haspopup="true" className="flex h-full items-center pl-1 pr-3"><ChevronDown className={`h-3 w-3 transition-transform ${openCategory === index ? 'rotate-180' : ''}`} aria-hidden="true" /></button>}
            </div>
            {menu.items.length > 0 && openCategory === index && (
              <div className="absolute left-1/2 top-full z-50 min-w-[220px] -translate-x-1/2 rounded-b-lg border border-gray-200 bg-white py-2 text-[#2f455d] shadow-xl">
                {menu.items.map((item) => (
                  <Link key={item.search} to={shopCategoryLink(menu.id, item.search)} onClick={() => setOpenCategory(null)} className="block px-4 py-2.5 text-sm hover:bg-[#eaf0f6] focus:bg-[#eaf0f6]">{item.label}</Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {moreCategories.length > 0 && (
          <div className="relative flex h-full justify-center" onMouseEnter={() => setOpenCategory('more')} onMouseLeave={() => setOpenCategory(null)}>
            <button type="button" onClick={() => setOpenCategory(openCategory === 'more' ? null : 'more')} aria-expanded={openCategory === 'more'} aria-haspopup="true" className="flex h-full items-center gap-1 px-3 text-[11px] font-semibold uppercase hover:bg-white/10 xl:text-xs xl:tracking-wide">More <ChevronDown className="h-3 w-3" aria-hidden="true" /></button>
            {openCategory === 'more' && <div className="absolute right-0 top-full z-50 max-h-80 min-w-[200px] overflow-y-auto rounded-b-lg border border-gray-200 bg-white py-2 text-[#2f455d] shadow-xl">
              {moreCategories.map((menu) => <Link key={menu.id} to={shopCategoryLink(menu.id)} onClick={() => setOpenCategory(null)} className="block px-4 py-2.5 text-sm hover:bg-[#eaf0f6]">{menu.label}</Link>)}
            </div>}
          </div>
        )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div inert={!mobileMenuOpen} aria-hidden={!mobileMenuOpen} className={`lg:hidden bg-[#293d54] transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[calc(100dvh-124px)] overflow-y-auto opacity-100 md:max-h-[calc(100dvh-70px)]' : 'max-h-0 overflow-hidden opacity-0'}`}>
        <div className="border-t border-white/15 px-4 pt-3 pb-5 space-y-1 shadow-2xl">
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block rounded px-3 py-2.5 text-sm font-semibold text-brand-100 hover:bg-white/10">All Products</Link>

          <div className="border-t border-white/10 pt-2">
            {categories.map((menu, index) => (
              <div key={menu.id}>
                <div className="flex items-center rounded hover:bg-white/10">
                  <Link to={shopCategoryLink(menu.id)} onClick={() => setMobileMenuOpen(false)} className="flex-1 px-3 py-2.5 text-sm font-semibold text-white">{menu.label}</Link>
                  {menu.items.length > 0 && <button type="button" onClick={() => setOpenCategory(openCategory === index ? null : index)} aria-label={`Show ${menu.label} products`} aria-expanded={openCategory === index} className="px-3 py-2.5"><ChevronDown className={`h-4 w-4 transition-transform ${openCategory === index ? 'rotate-180' : ''}`} aria-hidden="true" /></button>}
                </div>
                {menu.items.length > 0 && openCategory === index && (
                  <div className="mb-2 border-l border-brand-400/50 pl-3">
                    {menu.items.map((item) => <Link key={item.search} to={shopCategoryLink(menu.id, item.search)} onClick={() => setMobileMenuOpen(false)} className="block rounded px-3 py-2 text-sm text-brand-100 hover:bg-white/10">{item.label}</Link>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Profile / Login inside Mobile Drawer */}
          <div className="pt-2 border-t border-white/10">
            {isAuthenticated ? (
              <div className="px-3 py-2 flex items-center justify-between">
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-brand-200">
                  <p className="text-xs font-bold">Account {initials}</p>
                  <p className="text-[11px] text-brand-400">My Profile & Orders</p>
                </Link>
                <button
                  onClick={requestSignOut}
                  className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#2a435d] hover:bg-[#eaf0f6]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand-300">
                <User className="h-4 w-4 text-brand-400" aria-hidden="true" />
                <button type="button" onClick={() => { openAuthModal(); setMobileMenuOpen(false); }} className="rounded py-1 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-300">Account</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
    {showSignOutConfirm && createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSignOutConfirm(false); }}>
        <div ref={signOutDialogRef} role="dialog" aria-modal="true" aria-labelledby="sign-out-title" aria-describedby="sign-out-description" className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#c3d2e0] bg-white text-[#172536] shadow-2xl">
          <div className="bg-[#2a435d] px-6 py-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-brand-200"><LogOut className="h-5 w-5" aria-hidden="true" /></span>
            <h2 id="sign-out-title" className="mt-3 text-xl font-bold">Sign out of your account?</h2>
          </div>
          <div className="px-6 py-5">
            <p id="sign-out-description" className="text-sm text-gray-600">You can sign in again at any time.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" autoFocus onClick={() => setShowSignOutConfirm(false)} className="rounded-lg border border-[#c3d2e0] px-4 py-2.5 text-sm font-bold text-[#2a435d] transition hover:bg-[#f5f8fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385775]">Cancel</button>
              <button type="button" onClick={confirmSignOut} className="rounded-lg bg-[#385775] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2a435d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#385775]">Sign Out</button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default Navbar;
