import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Shield, Lock, Mail, ArrowRight, Loader2, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your admin email/phone and password.');
      return;
    }

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      const target = location.state?.from?.pathname || '/admin';
      navigate(target, { replace: true });
    } else {
      setError(result.message || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172536] via-[#293d54] to-[#385775] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#9cb3c9_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[390px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-7 sm:p-8 shadow-2xl space-y-6">
        
        {/* Top Header & Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-md bg-white/15 border border-white/25 shadow-lg backdrop-blur-md">
            <img src="/logo.png" alt="Advait Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Admin Control Center
          </h2>
          <p className="text-xs sm:text-sm text-brand-200">
            Sign in with your master credentials to manage Advait Teleservices e-commerce operations.
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-200 mb-1.5 uppercase tracking-wider">
              Admin Email or Mobile
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brand-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Admin email or mobile"
                className="w-full bg-white/10 border border-white/20 rounded-md pl-10 pr-4 py-3 text-sm text-white placeholder-brand-300/60 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-brand-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-md pl-10 pr-10 py-3 text-sm text-white placeholder-brand-300/60 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-300 hover:text-white transition-colors focus:outline-none p-1 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-md bg-white text-[#172536] font-bold text-sm shadow-xl hover:bg-brand-50 hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 btn-press disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Store */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-brand-300 hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            &larr; Return to Public Website
          </Link>
        </div>

      </div>

      {/* Footer Branding */}
      <p className="relative z-10 text-xs text-brand-300/70 mt-8">
        Advait Teleservices Private Limited &copy; {new Date().getFullYear()} &bull; Secure Administrator Portal
      </p>

    </div>
  );
};

export default AdminLogin;
