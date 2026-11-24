import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { X, Phone, User, MapPin, Building, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

const AuthModal = () => {
  const { authModalOpen, authModalMode, closeAuthModal, loginWithOtpResult } = useAuth();

  const [step, setStep] = useState('PHONE'); // PHONE | REGISTER | OTP | DETAILS | NO_ACCOUNT | EXISTING_ACCOUNT
  const [flowMode, setFlowMode] = useState('login');
  const [existingAccount, setExistingAccount] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
  });

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [registrationToken, setRegistrationToken] = useState('');

  useEffect(() => {
    if (authModalOpen) {
      setFlowMode(authModalMode);
      setStep(authModalMode === 'register' ? 'REGISTER' : 'PHONE');
      setExistingAccount(null);
    } else {
      setFormData({ fullName: '', mobileNumber: '', addressLine1: '', addressLine2: '', city: '', pincode: '' });
      setOtpCode('');
      setDevOtp('');
      setRegistrationToken('');
      setErrorMessage('');
    }
  }, [authModalOpen, authModalMode]);

  useEffect(() => {
    if (!authModalOpen || step !== 'OTP' || resendTimer <= 0) return undefined;
    const timer = setTimeout(() => setResendTimer((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [authModalOpen, step, resendTimer]);

  if (!authModalOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const switchFlow = (mode) => {
    setFlowMode(mode);
    setStep(mode === 'register' ? (registrationToken ? 'DETAILS' : 'REGISTER') : 'PHONE');
    if (mode === 'login') setRegistrationToken('');
    setErrorMessage('');
    setExistingAccount(null);
    setOtpCode('');
  };

  const validRegistrationDetails = () =>
    formData.fullName.trim() && formData.addressLine1.trim() && formData.city.trim() && /^\d{6}$/.test(formData.pincode.trim());

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (flowMode === 'register' && step === 'REGISTER' && !validRegistrationDetails()) {
      setErrorMessage('Enter your name, delivery address, city and valid 6-digit PIN.');
      return;
    }

    const cleanPhone = formData.mobileNumber.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-otp', { mobileNumber: cleanPhone });

      if (res.data.success) {
        setFormData((current) => ({ ...current, mobileNumber: cleanPhone }));
        setStep('OTP');
        setOtpCode('');
        setDevOtp('');
        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
          setOtpCode(res.data.devOtp); // Auto-fill for ultra smooth testing
        }
        // Start countdown
        setResendTimer(30);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to send OTP. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      const cleanPhone = formData.mobileNumber.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/verify-otp', { mobileNumber: cleanPhone, otpCode: otpCode.trim() });

      if (res.data.success) {
        if (res.data.registrationRequired) {
          setRegistrationToken(res.data.registrationToken);
          if (flowMode === 'register') {
            await completeRegistration(res.data.registrationToken);
          } else {
            setStep('NO_ACCOUNT');
          }
        } else if (flowMode === 'register') {
          setExistingAccount({ token: res.data.token, user: res.data.user });
          setStep('EXISTING_ACCOUNT');
        } else {
          loginWithOtpResult(res.data.token, res.data.user);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (verifiedToken) => {
    setErrorMessage('');
    if (!validRegistrationDetails()) {
      setErrorMessage('Enter your name, delivery address, city and valid 6-digit PIN.');
      setStep('DETAILS');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/complete-registration', { ...formData, registrationToken: verifiedToken });
      if (res.data.success) loginWithOtpResult(res.data.token, res.data.user);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not create your account. Please try again.');
      if ([401, 409].includes(err.response?.status)) {
        setRegistrationToken('');
        setStep('REGISTER');
        setOtpCode('');
      } else {
        setStep('DETAILS');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    completeRegistration(registrationToken);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#172536]/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all animate-scale-in my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Account header */}
        <div className="bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Advait Teleservices Logo" className="w-9 h-9 rounded-lg bg-white p-0.5 object-contain shadow" />
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">{flowMode === 'register' || step === 'DETAILS' ? 'Create Your Account' : 'Login to Your Account'}</h3>
              <p className="text-xs text-brand-200">{flowMode === 'register' || step === 'DETAILS' ? 'Set up your account with a verified mobile number' : 'Secure sign-in with a one-time OTP'}</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="font-semibold">Notice:</span> {errorMessage}
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <p className="text-sm text-gray-600">Enter the mobile number linked to your account. We&apos;ll send an OTP to sign you in.</p>
              <div>
                <label htmlFor="auth-mobile" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold text-gray-500">+91</span>
                  <input id="auth-mobile" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} maxLength="10" inputMode="numeric" autoComplete="tel-national" placeholder="9999999999" required className="w-full rounded-lg border border-gray-300 bg-brand-50/50 py-2 pl-12 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-[#293d54] disabled:opacity-50">
                {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending OTP...</> : <>Get OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs text-gray-600">New here? <button type="button" onClick={() => switchFlow('register')} className="font-semibold text-[#385775] hover:underline">Register an account</button></p>
            </form>
          ) : step === 'REGISTER' || step === 'DETAILS' ? (
            <form onSubmit={step === 'REGISTER' ? handleSendOtp : handleRegister} className="space-y-4">
              <p className="text-xs text-gray-600 mb-2">
                {step === 'DETAILS' ? 'Your mobile number is verified. Add your details once to complete your account.' : 'Add your details once. We will verify your mobile number before creating the account.'}
              </p>

              {step === 'REGISTER' && (
                <div>
                  <label htmlFor="register-mobile" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-gray-500">+91</span>
                    <input id="register-mobile" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} maxLength="10" inputMode="numeric" autoComplete="tel-national" placeholder="9999999999" required className="w-full rounded-lg border border-gray-300 bg-brand-50/50 py-2 pl-12 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-brand-600" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {step === 'DETAILS' && <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-[#385775]">Verified mobile: +91 {formData.mobileNumber}</p>}

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Address Line 1 (Flat / House No, Building, Street) *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-brand-600" />
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    placeholder="e.g. Flat 402, Green Valley Apartments"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Address Line 2 (Area, Landmark, Road)
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-brand-600" />
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="e.g. Near Amanora Town Centre"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* City & Pincode Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Pune"
                    required
                    className="w-full px-3 py-2 text-sm bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength="6"
                    placeholder="411028"
                    required
                    className="w-full px-3 py-2 text-sm bg-brand-50/50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#385775] hover:bg-[#293d54] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {step === 'REGISTER' ? 'Sending OTP...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    <span>{step === 'REGISTER' ? 'Get OTP to Register' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Details are securely stored for fast checkout on Advait Teleservices</span>
              </div>
              <p className="text-center text-xs text-gray-600">Already registered? <button type="button" onClick={() => switchFlow('login')} className="font-semibold text-[#385775] hover:underline">Login</button></p>
            </form>
          ) : step === 'NO_ACCOUNT' ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-gray-700">This mobile number has no account yet. Register to save your details and continue.</p>
              <button type="button" onClick={() => switchFlow('register')} className="w-full rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white hover:bg-[#293d54]">Complete Registration</button>
              <button type="button" onClick={() => { setRegistrationToken(''); switchFlow('login'); }} className="text-xs font-semibold text-[#385775] hover:underline">Use another mobile number</button>
            </div>
          ) : step === 'EXISTING_ACCOUNT' ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-gray-700">This mobile number already has an account. Your OTP is verified; sign in to continue.</p>
              <button type="button" onClick={() => loginWithOtpResult(existingAccount.token, existingAccount.user)} className="w-full rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white hover:bg-[#293d54]">Login to Existing Account</button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 text-[#385775] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Enter Verification Code</h4>
                <p className="text-xs text-gray-600 mt-1">
                  We sent a 6-digit OTP to <strong className="text-gray-800">+91 {formData.mobileNumber}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setStep(flowMode === 'register' ? 'REGISTER' : 'PHONE')}
                  className="text-xs text-brand-700 font-medium hover:underline mt-1"
                >
                  Change mobile number
                </button>
              </div>

              {/* Developer Test Helper */}
              {devOtp && (
                <div className="p-3 bg-brand-50 border border-brand-300 rounded-xl text-center">
                  <span className="text-xs text-brand-800 font-medium block">
                    ⚡ Auto-generated OTP for instant testing:
                  </span>
                  <span className="text-lg font-sans font-bold tracking-widest text-brand-900">
                    {devOtp}
                  </span>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.5em] font-sans text-2xl font-bold py-3 bg-brand-50/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#385775] hover:bg-[#293d54] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* Resend Timer */}
              <div className="text-center text-xs text-gray-500">
                {resendTimer > 0 ? (
                  <span>Resend OTP in <strong className="text-brand-700">{resendTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-brand-700 font-semibold hover:underline"
                  >
                    Resend OTP via SMS
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
