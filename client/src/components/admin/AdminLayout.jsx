import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, 
  LogOut, Menu, X, Shield, ChevronRight, Calendar, FileText
} from 'lucide-react';

const AdminLayout = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(
        new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle ESC key to dismiss logout modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/admin/login');
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/orders', label: 'Orders & Shipments', icon: ShoppingBag },
    { to: '/admin/products', label: 'GPS Products', icon: Package },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/quotes', label: 'Quote Requests', icon: FileText },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/admin') return 'Dashboard Overview';
    if (location.pathname.startsWith('/admin/orders')) return 'Order Fulfillment & Tracking';
    if (location.pathname.startsWith('/admin/products')) return 'Product Catalog & Pricing';
    if (location.pathname.startsWith('/admin/customers')) return 'Customer Directory';
    if (location.pathname.startsWith('/admin/quotes')) return 'Quote Requests';
    return 'Admin Portal';
  };

  return (
    <div className="min-h-screen min-w-0 bg-[#f6f8fb] flex flex-col lg:flex-row font-sans text-gray-900">
      
      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden bg-[#293d54] text-white px-4 py-3 flex items-center justify-between border-b border-brand-900 sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-base tracking-tight">ADVAIT <span className="text-brand-400">ADMIN</span></span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,100vw)] shrink-0 bg-gradient-to-b from-[#172536] via-[#20344a] to-[#293d54] text-white flex flex-col justify-between border-r border-brand-900/60 shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <Link to="/admin" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Advait Teleservices Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="flex items-center gap-1 leading-tight">
                  <span className="text-lg font-black tracking-tight text-white">ADVAIT</span>
                  <span className="text-lg font-bold tracking-tight text-brand-400">TRACK</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-brand-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-200">Admin Control</span>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#385775] text-white shadow-lg border border-brand-400/40 translate-x-1'
                        : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-brand-300" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-4 sm:p-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-sm font-semibold text-brand-100/90 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= THEMED LOGOUT CONFIRMATION MODAL ================= */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            className="w-full max-w-[360px] bg-[#172536] border border-white/15 rounded-lg shadow-2xl p-5 text-white relative animate-fadeInScale space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-md text-brand-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                  Security Confirmation
                </span>
                <h3 className="text-base font-black text-white tracking-tight">
                  Sign Out of Admin Portal?
                </h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-white/20 hover:bg-white/10 text-xs font-bold text-brand-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 btn-press"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BACKDROP FOR MOBILE ================= */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200/80 px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sticky top-[57px] lg:top-0 z-30 shadow-xs">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Manage your products, live orders, customers, and fulfillment.
            </p>
          </div>

          {/* Day Date Year Display */}
          <div className="flex max-w-full items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md bg-brand-50/90 border border-brand-200/80 text-[#293d54] shadow-xs">
            <Calendar className="w-4 h-4 text-[#385775] shrink-0" />
            <span className="text-[11px] sm:text-[13px] font-bold tracking-tight leading-tight">
              {currentDate}
            </span>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
