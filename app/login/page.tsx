'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Zap, Eye, EyeOff, Loader2, ShieldCheck, Globe, Activity, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        await login(form.email, form.password);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* 🚀 Left - High-End Brand Experience */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-900 border-r border-white/5">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-20">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[20px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                <Zap className="w-7 h-7 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-black italic tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>SubSaaS</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Management Engine</p>
             </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-6">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Online
                </div>
                <h2 className="text-7xl font-black tracking-tighter leading-[0.9] italic" style={{ fontFamily: "'Outfit', sans-serif" }}>
                   Strategic <br /> <span className="text-indigo-500">Lifecycle</span> <br /> Control.
                </h2>
                <p className="text-xl font-medium text-slate-400 max-w-lg leading-relaxed italic">
                   The next generation of subscription management. 
                   Harness the power of synchronized billing and enterprise-grade lifecycle governing.
                </p>
             </div>

             <div className="grid grid-cols-3 gap-12 pt-10 border-t border-white/5">
                {[
                  { label: 'Network Uptime', value: '99.9%', icon: Globe },
                  { label: 'Active Clusters', value: '1.4k+', icon: Activity },
                  { label: 'Verified Nodes', value: '100%', icon: ShieldCheck },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <stat.icon className="w-3 h-3 text-indigo-400" /> {stat.label}
                    </div>
                    <p className="text-3xl font-black text-white italic" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
                  </div>
                ))}
             </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
             © 2026 SubSaaS Protocol Inc. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* 🔐 Right - Secure Access Terminal */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-20 relative">
        <div className="absolute inset-0 bg-slate-950 opacity-90 lg:hidden" />
        
        <div className="w-full max-w-md relative z-10 space-y-12 animate-fade-in">
          
          <div className="space-y-4">
             <h3 className="text-4xl font-black tracking-tighter italic" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {isSignup ? 'Initialize Account' : 'Authorized Access'}
             </h3>
             <p className="text-sm font-bold text-slate-400 leading-none">
                {isSignup ? 'Synchronize your enterprise with our protocol' : 'Enter your credentials to access the hub'}
             </p>
          </div>

          {error && (
            <div className="p-5 rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Identity Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-6 py-5 rounded-[24px] bg-white/5 border border-white/5 text-sm font-bold outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder-slate-700"
                  placeholder="e.g. John Doe"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Access Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-6 py-5 rounded-[24px] bg-white/5 border border-white/5 text-sm font-bold outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder-slate-700"
                placeholder="identity@subsaas.me"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-2">Secure Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-6 py-5 rounded-[24px] bg-white/5 border border-white/5 text-sm font-bold outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder-slate-700 pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 rounded-[28px] bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-700 transition-all hover:-translate-y-1 shadow-2xl shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-3 italic"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isSignup ? 'Begin Integration' : 'Sync Protocol'}
            </button>
          </form>

          <div className="text-center pt-4">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 hover:text-white transition-all underline decoration-indigo-400/30 underline-offset-8"
            >
              {isSignup ? 'Transition to Login' : 'Register New Hub'}
            </button>
          </div>

          {/* 📡 Demo Registry Box */}
          {!isSignup && (
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 space-y-5 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform"><Activity className="w-20 h-20" /></div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Demo Terminal
               </p>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Admin Cluster</span>
                     <span className="text-white">admin@subsaas.com</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Customer Node</span>
                     <span className="text-white">alice@example.com</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Standard Key</span>
                     <span className="text-emerald-400">password123</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
