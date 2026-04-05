'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, Mail, KeyRound, Lock, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDemoOtp(data.otp || '');
      setEmailSent(data.emailSent || false);
      setStep('otp');
      setSuccess(data.emailSent
        ? `OTP sent to ${email}! Check your inbox (and spam folder).`
        : 'OTP generated! Use the demo code below.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    otpRefs.current[nextEmpty]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('reset');
      setSuccess('OTP verified! Set your new password.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const stepInfo = {
    email: { title: 'Forgot Password', desc: 'Enter your email to receive a verification code', icon: Mail },
    otp: { title: 'Verify OTP', desc: 'Enter the 6-digit code sent to your email', icon: KeyRound },
    reset: { title: 'Reset Password', desc: 'Create a new password for your account', icon: Lock },
  };

  const CurrentIcon = stepInfo[step].icon;

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SubSaaS</h1>
              <p className="text-xs text-slate-400 tracking-widest uppercase">AI Management</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Account<br />
            <span className="gradient-text">Recovery</span>
          </h2>
          <p className="text-slate-400 max-w-md text-lg leading-relaxed">
            Don&apos;t worry! We&apos;ll help you get back into your account with a secure OTP verification process.
          </p>

          {/* Steps indicator */}
          <div className="mt-12 flex items-center gap-4">
            {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s ? 'bg-primary-500 text-white scale-110' :
                  (['email', 'otp', 'reset'].indexOf(step) > i) ? 'bg-emerald-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {(['email', 'otp', 'reset'].indexOf(step) > i) ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${step === s ? 'text-white' : 'text-slate-500'}`}>
                  {s === 'email' ? 'Email' : s === 'otp' ? 'Verify' : 'Reset'}
                </span>
                {i < 2 && <div className={`w-12 h-0.5 ${(['email', 'otp', 'reset'].indexOf(step) > i) ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>SubSaaS</h1>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
              <CurrentIcon className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stepInfo[step].title}
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {stepInfo[step].desc}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          {/* OTP delivery notice */}
          {step === 'otp' && emailSent && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
              <p className="font-medium">📧 OTP sent to your email!</p>
              <p className="text-xs mt-1 opacity-80">Check your inbox and spam folder for the verification code.</p>
            </div>
          )}
          {step === 'otp' && !emailSent && demoOtp && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
              <p className="font-medium">🔐 Demo Mode - Your OTP code is:</p>
              <p className="text-2xl font-bold tracking-[0.5em] mt-1 text-center">{demoOtp}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium text-sm hover:from-primary-700 hover:to-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send OTP
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-lg border outline-none transition-all focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium text-sm hover:from-primary-700 hover:to-primary-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify OTP
              </button>
              <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); setSuccess(''); }}
                className="w-full text-sm text-primary-500 hover:text-primary-600 font-medium">
                Resend OTP
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reset Password
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
