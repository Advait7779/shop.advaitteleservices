import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { CategoryProvider } from './context/CategoryContext';
import { useScrollReveal, useScrollToTop } from './hooks/useAnimations';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModal';
import Toast from './components/common/Toast';

// Public Store Pages
import Home from './pages/Home';
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Account = lazy(() => import('./pages/Account'));

// Admin Portal Components & Pages
import AdminRoute from './components/admin/AdminRoute';
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));

function AdminHome() {
  const { adminUser } = useAdminAuth();
  const permissions = adminUser.permissions;
  if (permissions.includes('analytics')) return <AdminDashboard />;
  const section = [['orders', 'orders'], ['catalog', 'products'], ['customers', 'customers']]
    .find(([permission]) => permissions.includes(permission));
  if (section) return <Navigate replace to={'/admin/' + section[1]} />;
  return <p role="status">No admin sections have been assigned to this account.</p>;
}

const RouteLoading = ({ admin = false }) => (
  <div className={`flex items-center justify-center text-sm ${admin ? 'min-h-screen bg-[#172536] text-white' : 'min-h-[40vh] bg-[#f6f8fb] text-[#293d54]'}`} role="status">
    Loading page...
  </div>
);

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Activate scroll-reveal observer and scroll-to-top on route change for public store
  useScrollReveal();
  useScrollToTop();

  // If on admin paths, render admin suite without public store layout
  if (isAdminPath) {
    return (
      <Suspense fallback={<RouteLoading admin />}><Routes location={location}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="orders" element={<AdminRoute permission="orders"><AdminOrders /></AdminRoute>} />
          <Route
            path="products"
            element={<AdminRoute permission="catalog"><CategoryProvider><AdminProducts /></CategoryProvider></AdminRoute>}
          />
          <Route path="customers" element={<AdminRoute permission="customers"><AdminCustomers /></AdminRoute>} />
        </Route>
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes></Suspense>
    );
  }

  // Public customer e-commerce store
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fb] text-[#172536]">
      <Navbar />
      <main className="flex-1">
        <div key={location.pathname} className="page-transition">
          <Suspense fallback={<RouteLoading />}><Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/shop" element={<Shop key={location.search} />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/account" element={<Account />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
        </div>
      </main>
      <AuthModal />
      <Toast />
      <Footer />
    </div>
  );
}

function App() {
  const isAdminPath = useLocation().pathname.startsWith('/admin');
  return isAdminPath ? (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  ) : (
    <CategoryProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </CategoryProvider>
  );
}

export default App;
