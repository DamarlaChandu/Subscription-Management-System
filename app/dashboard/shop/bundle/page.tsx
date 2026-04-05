'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, Package, ShieldCheck, Cpu, Database, 
  LineChart, CheckCircle2, ShoppingBag, X, 
  ArrowRight, Info, AlertTriangle, TrendingUp,
  CreditCard, Sparkles, Rocket
} from 'lucide-react';
import { LoadingSpinner, Card } from '@/components/SharedUI';
import { useAuth } from '@/components/AuthContext';

export default function SmartBundlePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [calc, setCalc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Initial Data Retrieval
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      });
  }, []);

  // 2. Real-time Computation Logic
  useEffect(() => {
    if (selected.length === 0) {
      setCalc(null);
      return;
    }
    fetch('/api/bundle/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedServices: selected })
    })
      .then(r => r.json())
      .then(d => setCalc(d));
  }, [selected]);

  const toggleService = (prod: any) => {
    setSelected(prev => {
      const exists = prev.find(p => p._id === prod._id);
      if (exists) return prev.filter(p => p._id !== prod._id);
      return [...prev, { ...prod, monthlyPrice: prod.basePrice }];
    });
  };

  const handleCompleteIntegration = async () => {
    if (!user || selected.length === 0) return;
    setSubmitting(true);
    
    try {
      // 🏗️ Construct Order Lines for the Subscription Engine
      const orderLines = selected.map(s => ({
        product: s._id,
        quantity: 1,
        unitPrice: s.basePrice,
        description: `High-fidelity integration of ${s.name}`,
        amount: s.basePrice
      }));

      const res = await fetch('/api/subscriptions/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderLines,
          totalAmount: calc.finalAmount,
          subtotal: calc.baseAmount,
          totalDiscount: calc.savings,
          subscriptionType: 'Smart Bundle',
          tier: calc.tier
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard/subscriptions'), 3000);
      }
    } catch (err) {
      console.error('Integration Failure:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20"><LoadingSpinner /></div>;

  if (success) return (
     <div className="max-w-xl mx-auto p-20 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
           <Rocket className="w-12 h-12 text-white animate-bounce" />
        </div>
        <div className="space-y-4">
           <h1 className="text-4xl font-bold text-slate-900 tracking-tighter italic uppercase">Intelligence Synced</h1>
           <p className="text-slate-500 font-medium">Your Smart Bundle integration is now active in your account registry. Preparing your command center...</p>
        </div>
        <div className="flex items-center justify-center gap-3 text-emerald-600 font-bold text-xs uppercase tracking-widest">
           <CheckCircle2 className="w-5 h-5" /> Lifecycle Initialized
        </div>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-fade-in space-y-12">
      
      {/* 🚀 Header Strategy */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-12">
         <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Sparkles className="w-5 h-5 text-white" />
               </div>
               <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em]">Lifecycle Optimization</p>
            </div>
            <h1 className="dashboard-title text-slate-900 leading-none">Smart Bundle Builder</h1>
            <p className="kpi-label mt-3 text-slate-500">Curate your technical ecosystem. Our engine automatically optimizes pricing as you integrate more services.</p>
         </div>
         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
               <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Node</p>
               <p className="text-xs font-bold text-slate-900">{user?.name || 'Authorized Client'}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* 🛠️ Service Selection Grid (Left) */}
        <div className="lg:col-span-8">
           <div className="mb-8 flex items-center justify-between">
              <h2 className="section-heading text-slate-900">Available Integrations</h2>
              <p className="text-xs-SaaS font-bold text-slate-400">{products.length} Node Modules</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {products.map((prod) => {
                const isActive = selected.some(s => s._id === prod._id);
                return (
                  <div 
                    key={prod._id}
                    className={`p-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col justify-between h-48 group cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[0.98]' 
                        : 'bg-white border-slate-100 hover:border-indigo-600/30'
                    }`}
                    onClick={() => toggleService(prod)}
                  >
                     <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl transition-colors ${isActive ? 'bg-white/10 text-emerald-400' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600'}`}>
                           <Cpu className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end">
                           <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>Unit Price</p>
                           <p className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>₹{prod.basePrice.toLocaleString()}</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between mt-auto">
                        <div>
                           <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{prod.name}</h3>
                           <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{prod.description}</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${isActive ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-all transform shadow-sm ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* 📊 High-Performance Summary Panel (Right) */}
        <div className="lg:col-span-4 sticky top-12 space-y-8">
           
           <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                 <h3 className="section-heading text-sm text-slate-900 uppercase tracking-widest">Active Stack</h3>
                 <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-100">{selected.length}</span>
              </div>

              {selected.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                   <ShoppingBag className="w-10 h-10 text-slate-300" />
                   <p className="text-xs-SaaS font-bold text-slate-400 uppercase tracking-widest">Initialize Bundle</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {selected.map((s) => (
                      <div key={s._id} className="group flex items-center gap-2 pl-3 pr-1 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-800 shadow-lg animate-fade-in transition-all hover:scale-105">
                         {s.name}
                         <button onClick={(e) => { e.stopPropagation(); toggleService(s); }} className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
                            <X className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                </div>
              )}

              {calc && (
                 <div className="mt-10 pt-8 border-t border-slate-50 space-y-6">
                    
                    {/* Efficiency Score Logic */}
                    <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100/50">
                       <div className="flex justify-between items-center mb-3">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Bundle Efficiency</p>
                          <p className="text-sm font-bold text-indigo-700">{calc.efficiency}% Value</p>
                       </div>
                       <div className="h-2 w-full bg-indigo-200/50 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${calc.efficiency}%` }} />
                       </div>
                       <div className="mt-4 flex items-center gap-2">
                          <BadgePercent className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{calc.tier} unlocked</p>
                       </div>
                    </div>

                    {/* Pricing Breakdown Engine */}
                    <div className="space-y-4 px-2">
                       <div className="flex justify-between items-center text-xs-SaaS">
                          <span className="font-medium text-slate-400">Baseline Multi-Service</span>
                          <span className="font-bold text-slate-900">₹{calc.baseAmount.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs-SaaS group">
                          <span className="font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded transition-transform group-hover:scale-105">Strategy Deduction</span>
                          <span className="font-bold text-emerald-600">- ₹{calc.savings.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs-SaaS">
                          <span className="font-medium text-slate-400 flex items-center gap-1.5">Platform Node Fee <Info className="w-3 h-3 cursor-help text-slate-300" /></span>
                          <span className="font-bold text-slate-900">₹{calc.platformFee.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 mt-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Integrated Total</p>
                       <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-slate-900 tracking-tighter italic">₹{Math.round(calc.finalAmount).toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ Month</span>
                       </div>
                       
                       <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Savings Unlocked: ₹{calc.savings.toLocaleString()}</p>
                       </div>

                       {calc.nextTierCount > 0 && selected.length > 0 && (
                          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                             <AlertTriangle className="w-4 h-4 text-amber-500" />
                             <p className="text-[10px] font-bold text-amber-700 leading-tight">Add {calc.nextTierCount - selected.length} more modules for higher tier savings.</p>
                          </div>
                       )}

                       <button 
                         onClick={handleCompleteIntegration}
                         disabled={submitting || selected.length === 0}
                         className={`w-full mt-8 py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group ${
                           submitting 
                             ? 'bg-slate-400 text-white cursor-wait' 
                             : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-slate-950'
                         }`}
                       >
                         {submitting ? 'Syncing Nodes...' : 'Finalize Bundle Strategy'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
                 </div>
              )}
           </div>

           {/* Insights Panel */}
           {calc && (
             <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl group animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                   </div>
                   <h3 className="section-heading text-xs text-white uppercase tracking-[0.2em]">Growth Insight</h3>
                </div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed mb-6">
                   Your selection of {selected.length} modules represents an optimal technical ecosystem with a high efficiency score.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                   <CheckCircle2 className="w-4 h-4" /> Ready for Deployment
                </div>
             </div>
           )}

        </div>

      </div>

    </div>
  );
}

function BadgePercent(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m15 9-6 6" />
      <path d="M9 9h.01" />
      <path d="M15 15h.01" />
    </svg>
  );
}
