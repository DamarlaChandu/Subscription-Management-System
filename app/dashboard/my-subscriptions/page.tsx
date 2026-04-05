'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, Clock, RefreshCw, Zap, Plus, Info, ChevronRight, Activity, Globe, ShieldCheck } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/components/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface Subscription {
  _id: string;
  subscriptionNumber: string;
  plan: { _id: string; name: string; price: number; billingCycle: string; product?: { name: string } };
  status: string;
  startDate: string;
  expirationDate: string;
  endDate?: string;
  autoRenew: boolean;
  totalAmount: number;
}

export default function MySubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/subscriptions/customer')
      .then(r => r.json())
      .then(data => { setSubscriptions(data.subscriptions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-12 pb-20 mt-10 px-4 md:px-0">
      
      {/* 🚀 Dynamic Service Hub Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-2">
            <Globe className="w-3 h-3 animate-spin-slow" /> Strategic Portfolio
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
            My <span className="text-indigo-600 italic">Engines</span>
          </h1>
          <p className="text-sm font-bold text-slate-400">Lifecycle synchronization for your active enterprise stack.</p>
        </div>
        <Link href="/dashboard/shop" className="group flex items-center gap-4 px-10 py-5 rounded-[32px] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 duration-500">
           Initialize New Strategy <Plus className="w-5 h-5 text-indigo-400 group-hover:rotate-90 transition-transform duration-500" />
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-[60px] p-24 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-10 shadow-xl">
             <Zap className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-3xl font-black tracking-tighter text-slate-900 mb-4">No active cycles detected.</h3>
          <p className="text-sm font-bold text-slate-400 max-w-sm leading-relaxed mb-10 italic">Your management suite is currently standing by. Explore our premium plans to activate your first service.</p>
          <Link href="/dashboard/shop" className="px-10 py-4 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
             Discover Strategic Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {subscriptions.map(sub => (
            <div key={sub._id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[50px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
              <Card hover className="p-0 overflow-hidden rounded-[50px] border-2 border-slate-50 group-hover:border-indigo-100 transition-all duration-500 bg-white relative z-10 shadow-xl group-hover:shadow-indigo-500/10">
                <div className="p-10 space-y-8">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[24px] bg-slate-900 flex items-center justify-center shadow-xl group-hover:bg-indigo-600 transition-colors duration-500">
                        <Zap className="w-7 h-7 text-indigo-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{sub.plan?.name || 'Custom Setup'}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Code: {sub.subscriptionNumber.split('-')[1]}</p>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Valuation */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Cycle Valuation</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black tracking-tighter text-slate-900 italic" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{sub.totalAmount.toLocaleString()}</span>
                       <span className="text-xs font-bold text-slate-400">/ {sub.plan?.billingCycle || 'month'}</span>
                    </div>
                  </div>

                  {/* Period Stats */}
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-8 mt-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Initialized</p>
                      <p className="text-xs font-black text-slate-700">{format(new Date(sub.startDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Expiration</p>
                      <p className="text-xs font-black text-rose-500">{format(new Date(sub.expirationDate || sub.endDate || Date.now()), 'MMM d, yyyy')}</p>
                    </div>
                  </div>

                  {/* Control Row */}
                  <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Registry Active</span>
                    </div>
                    <Link 
                      href={`/dashboard/subscriptions`} 
                      className="text-[10px] font-black text-indigo-600 flex items-center gap-2 hover:gap-3 transition-all px-4 py-2 bg-indigo-50 rounded-xl"
                    >
                      Management Control <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* 🔮 Strategic Guidance Section */}
      <div className="bg-slate-900 rounded-[60px] p-12 md:p-16 text-white overflow-hidden relative shadow-2xl shadow-indigo-900/30 group">
        <div className="absolute right-[-10%] top-[-20%] p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000 pointer-events-none">
           <Info className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Lifecycle Optimization
          </div>
          <h3 className="text-4xl font-black tracking-tighter mb-6 italic leading-tight">Increase your strategic capacity.</h3>
          <p className="text-sm font-bold text-slate-400 leading-relaxed mb-10 italic">
            Manage your individual subscription cycles or branch out into new mission-critical services. 
            All billing periods are calculated in real-time to ensure maximum synchronization uptime.
          </p>
          <div className="flex flex-wrap gap-4">
             <Link href="/dashboard/shop" className="px-10 py-5 bg-white text-slate-900 rounded-[28px] font-black text-xs uppercase tracking-widest hover:-translate-y-1 transition-all inline-block shadow-2xl shadow-white/10 active:scale-95">
                Explore Scale Plans
             </Link>
             <Link href="/dashboard/help" className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all inline-block active:scale-95">
                Consult Expert
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
