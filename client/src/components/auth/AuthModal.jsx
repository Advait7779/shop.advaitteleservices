import React, { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const isIndianMobile = (value) => value.length === 10 && /^[6-9][0-9]{9}$/.test(value);
const mobileHint = 'Enter 10 digits starting with 6, 7, 8 or 9.';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, loginWithOtpResult } = useAuth();
  const [step, setStep] = useState('PHONE');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authModalOpen) {
      setStep('PHONE');
      setMobile('');
      setName('');
      setOtp('');
      setRegistrationToken('');
      setResendTimer(0);
      setDevOtp('');
      setError('');
      setLoading(false);
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (!authModalOpen || step !== 'OTP' || resendTimer <= 0) return undefined;
    const timer = setTimeout(() => setResendTimer((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [authModalOpen, step, resendTimer]);

  if (!authModalOpen) return null;

  const validMobile = isIndianMobile(mobile);
  const invalidMobileInput = mobile !== '' && (mobile.length > 10 || !/^[6-9][0-9]*$/.test(mobile));

  const sendOtp = async (event) => {
    event?.preventDefault();
    if (!validMobile) {
      setError(mobileHint);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/send-otp', { mobileNumber: mobile });
      if (data.success) {
        setOtp(data.devOtp || '');
        setDevOtp(data.devOtp || '');
        setResendTimer(30);
        setStep('OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { mobileNumber: mobile, otpCode: otp }, { skipSessionExpiry: true });
      if (data.registrationRequired) {
        setRegistrationToken(data.registrationToken);
        setStep('NAME');
      } else if (data.success) {
        loginWithOtpResult(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/complete-registration', { registrationToken, fullName: name.trim() }, { skipSessionExpiry: true });
      if (data.success) loginWithOtpResult(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account. Please try again.');
      if (err.response?.status === 401) {
        setRegistrationToken('');
        setStep('PHONE');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#172536]/60 p-3 backdrop-blur-sm sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="customer-auth-title" className="my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#172536] via-[#293d54] to-[#385775] px-5 py-5 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
            <div>
              <h2 id="customer-auth-title" className="text-lg font-bold">{step === 'NAME' ? 'Create your account' : 'Continue with mobile'}</h2>
              <p className="text-xs text-brand-200">{step === 'NAME' ? 'One last detail before you continue' : 'Sign in or create an account with one code'}</p>
            </div>
          </div>
          <button type="button" onClick={closeAuthModal} aria-label="Close" className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-5 sm:p-6">
          {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {step === 'PHONE' && (
            <form onSubmit={sendOtp} className="space-y-5">
              <p className="text-sm text-gray-600">Enter your mobile number. We’ll send you a one-time code.</p>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700" htmlFor="auth-mobile">Indian mobile number</label>
              <div className="relative -mt-4">
                <span className="absolute left-3 top-3 text-sm font-semibold text-gray-500" aria-hidden="true">+91</span>
                <input
                  id="auth-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[6-9][0-9]{9}"
                  required
                  placeholder="9999999999"
                  aria-describedby="auth-mobile-hint"
                  aria-invalid={invalidMobileInput}
                  value={mobile}
                  onChange={(event) => { setMobile(event.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-brand-50/50 py-2.5 pl-12 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <p id="auth-mobile-hint" className={'mt-2 text-xs ' + (invalidMobileInput ? 'text-red-700' : 'text-gray-600')}>
                  {mobileHint} The +91 prefix is already included.
                </p>
              </div>
              <button type="submit" disabled={loading || !validMobile} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white hover:bg-[#293d54] disabled:opacity-50">{loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending code…</> : <>Get OTP <ArrowRight className="h-4 w-4" /></>}</button>
              <p className="text-center text-xs text-gray-500">New customers can create an account after verification.</p>
            </form>
          )}
          {step === 'OTP' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit code sent to <strong>+91 {mobile}</strong>.</p>
              <button type="button" onClick={() => { setStep('PHONE'); setOtp(''); setError(''); }} className="text-xs font-semibold text-[#385775] hover:underline">Change mobile number</button>
              {devOtp && <p className="rounded-lg bg-brand-50 p-2 text-center text-xs text-brand-800">Local test code: {devOtp}</p>}
              <label htmlFor="auth-otp" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">Verification code</label>
              <input id="auth-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" autoFocus required value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '')); setError(''); }} className="w-full rounded-xl border border-gray-300 bg-brand-50/50 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white hover:bg-[#293d54] disabled:opacity-50">{loading ? 'Verifying…' : 'Verify & continue'}</button>
              <div className="text-center text-xs text-gray-600">{resendTimer > 0 ? `Resend code in ${resendTimer}s` : <button type="button" onClick={sendOtp} disabled={loading} className="font-semibold text-[#385775] hover:underline disabled:opacity-50">Resend code</button>}</div>
            </form>
          )}
          {step === 'NAME' && (
            <form onSubmit={createAccount} className="space-y-5">
              <p className="text-sm text-gray-600">Your number is verified. Add your name to create your account. You can enter a delivery address when you check out.</p>
              <label htmlFor="auth-name" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">Full name</label>
              <input id="auth-name" type="text" autoComplete="name" maxLength="100" autoFocus required value={name} onChange={(event) => { setName(event.target.value); setError(''); }} className="-mt-4 w-full rounded-lg border border-gray-300 bg-brand-50/50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#385775] px-4 py-3 font-semibold text-white hover:bg-[#293d54] disabled:opacity-50">{loading ? 'Creating account…' : <>Create account <ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
