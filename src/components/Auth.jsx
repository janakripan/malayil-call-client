import React, { useState } from 'react';
import { Phone, Lock, User, AtSign, ArrowRight, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Auth({ onLoginSuccess }) {
  // Steps: 'phone' | 'otp' | 'register'
  const [step, setStep] = useState('phone');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Simulated SMS Toast state
  const [smsToast, setSmsToast] = useState(null);

  // Trigger simulated OTP SMS toast
  const showSimulatedSms = (number, code) => {
    setSmsToast({ number, code });
    // Keep it on-screen for 15 seconds to allow easy copy-paste
    setTimeout(() => {
      setSmsToast(null);
    }, 15000);
  };

  // Submit phone number
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      const data = await response.json();

      if (data.success) {
        setStep('otp');
        showSimulatedSms(phoneNumber.trim(), data.otp);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Connection to server failed. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), otp: otp.trim() })
      });
      const data = await response.json();

      if (data.success) {
        if (data.userExists) {
          // Store user token in localStorage
          localStorage.setItem('malayil_call_token', data.token);
          localStorage.setItem('malayil_call_user', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        } else {
          setStep('register');
        }
      } else {
        setError(data.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      setError('Verification connection failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Client-side username formatting validation
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername)) {
      setError('Username must be 3-15 alphanumeric characters or underscores.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          username: cleanUsername,
          displayName: displayName.trim()
        })
      });
      const data = await response.json();

      if (data.success) {
        const mockToken = `mock-token-${phoneNumber.trim()}-${Date.now()}`;
        localStorage.setItem('malayil_call_token', mockToken);
        localStorage.setItem('malayil_call_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Registration failed. Try a different username.');
      }
    } catch (err) {
      setError('Registration connection failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
      {/* Title / Logo Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Malayil Call
        </h1>
        <p className="text-zinc-400 mt-2 text-sm max-w-xs">
          Private, anonymous data calling. Register securely using your mobile number.
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md glass p-8 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-2xl">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Phone Entry */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl outline-none text-white transition-all placeholder:text-zinc-600"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white font-medium rounded-xl shadow-lg shadow-emerald-600/10"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change Number
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl outline-none text-white tracking-widest font-semibold transition-all placeholder:text-zinc-600 placeholder:tracking-normal"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white font-medium rounded-xl shadow-lg shadow-emerald-600/10"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* STEP 3: Complete Profile/Registration */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Create Profile</h2>
              <p className="text-zinc-400 text-xs">Set up your username and display name. Your mobile number will never be shown to other users.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Display Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl outline-none text-white transition-all placeholder:text-zinc-600"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Choose Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <AtSign className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="johndoe_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-xl outline-none text-white transition-all placeholder:text-zinc-600"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white font-medium rounded-xl shadow-lg shadow-emerald-600/10"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Register & Log In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>

      {/* Simulated SMS Toast Overlay (Visual Wow Factor) */}
      {smsToast && (
        <div className="fixed bottom-6 right-6 max-w-sm w-full bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md animate-bounce-in z-50 text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">Simulated SMS Received</span>
                <span className="text-[10px] text-zinc-500">Just Now</span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                To: <span className="font-semibold">{smsToast.number}</span>
              </p>
              <div className="bg-zinc-950/80 rounded-lg p-2.5 mt-2 border border-zinc-800/80 flex items-center justify-between">
                <code className="text-emerald-400 font-mono tracking-widest text-sm font-bold select-all">
                  {smsToast.code}
                </code>
                <button 
                  onClick={() => {
                    setOtp(smsToast.code);
                    setSmsToast(null);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] uppercase font-bold tracking-wider hover:underline"
                >
                  Auto-Fill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
