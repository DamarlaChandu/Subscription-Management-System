'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, X, ShoppingBag, Zap, ShieldCheck, 
  Wallet, TrendingUp, CheckCircle2, ChevronRight,
  Info, AlertCircle, ShoppingCart
} from 'lucide-react';
import { Card, LoadingSpinner } from '@/components/SharedUI';

interface Plan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
  description?: string;
}

export default function MultiPlanSubscriptionPage() {
  const router = useRouter();
  // 1. STATE MANAGEMENT FIX: Central selectedPlans array
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 2. DEBUG VISIBILITY: Verify state updates in console
  useEffect(() => {
    console.log('--- Multi-Plan State Synchronized ---');
    console.log('Selected Count:', selectedPlans.length);
    console.log('Selected Data:', selectedPlans);
    console.log('--------------------------------------');
  }, [selectedPlans]);

  // Initial Fetch Setup
  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => {
        setPlans(d.plans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 3. UI CONNECTION: Plan interaction logic
  const togglePlan = (plan: Plan) => {
    setSelectedPlans(prev => {
      const exists = prev.find(p => p._id === plan._id);
      if (exists) {
        // Remove Planproperly
        return prev.filter(p => p._id !== plan._id);
      }
      // Add Plan on click (no duplicates allowed via prev.find check)
      return [...prev, plan];
    });
  };

  const removePlan = (id: string) => {
    setSelectedPlans(prev => prev.filter(p => p._id !== id));
  };

  // 4. PRICING LOGIC CONNECTION: Numerical calculations
  const calculatePricing = useCallback(() => {
    const subtotal = selectedPlans.reduce((sum, p) => sum + p.price, 0);
    const count = selectedPlans.length;
    
    let discountPercent = 0;
    if (count === 2) {
      discountPercent = 0.10; // 2 plans -> 10%
    } else if (count >= 3) {
      discountPercent = 0.20; // 3+ plans -> 20%
    }

    const discountAmount = subtotal * discountPercent;
    const finalTotal = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      discountPercent: discountPercent * 100,
      finalTotal
    };
  }, [selectedPlans]);

  const { subtotal, discountAmount, discountPercent, finalTotal } = calculatePricing();

  const handleFinalizeSelection = async () => {
    if (selectedPlans.length === 0) return;
    setSubmitting(true);
    try {
      const planIds = selectedPlans.map(p => p._id);

      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planIds })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard/subscriptions'), 3000);
      }
    } catch (err) {
      console.error('Portfolio Initialization Failure:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20"><LoadingSpinner /></div>;

  if (success) return (
     <div className="max-w-xl mx-auto p-20 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
           <Zap className="w-12 h-12 text-white animate-bounce" />
        </div>
        <div className="space-y-4">
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter italic uppercase">Portfolio Initialized</h1>
           <p className="kpi-label font-medium">Your multi-plan subscription is now registered. Synchronizing your command center...</p>
        </div>
        <div className="flex items-center justify-center gap-3 text-indigo-600 font-bold text-xs uppercase tracking-widest">
           <CheckCircle2 className="w-5 h-5 font-bold" /> Registry Active
        </div>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-40">
      
      {/* 🚀 System Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-12">
         <div>
            <div className="flex items-center gap-2 mb-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Zap className="w-4 h-4 text-white" />
               </div>
               <p className="kpi-label uppercase tracking-widest text-[#64748b]">Strategic Selection Flow</p>
            </div>
            <h1 className="dashboard-title text-slate-900 leading-none">
              Multi-Plan Subscription Engine
            </h1>
            <p className="kpi-label mt-3">Select two or more plans to unlock professional scaling discounts.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 🛠️ PLAN GRID (DYNAMIC SELECTION) */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="section-heading text-slate-900">Available Plans</h2>
              <span className="text-xs-SaaS font-semibold uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Registry Nodes: {plans.length}</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const isActive = selectedPlans.some(p => p._id === plan._id);
                return (
                  <div 
                    key={plan._id}
                    onClick={() => togglePlan(plan)}
                    className={`p-8 rounded-[40px] border-2 transition-all duration-500 cursor-pointer group relative overflow-hidden ${
                      isActive 
                        ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[0.98]' 
                        : 'bg-white border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                     {isActive && (
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                           <CheckCircle2 className="w-32 h-32 text-indigo-400" />
                        </div>
                     )}
                     <div className="flex justify-between items-start relative z-10 mb-8">
                        <div>
                           <h3 className={`text-xl font-bold tracking-tight mb-2 ${isActive ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                           <p className={`text-xs font-medium leading-relaxed max-w-[200px] ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description || 'Enterprise synchronization plan.'}</p>
                        </div>
                        <div className={`p-4 rounded-[22px] transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600'}`}>
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                     </div>

                     <div className="flex items-end justify-between relative z-10">
                        <div>
                           <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>Fee Structure</p>
                           <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>₹{plan.price.toLocaleString()}</span>
                              <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>/ {plan.billingCycle}</span>
                           </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>
                           {isActive ? <CheckCircle2 className="w-5 h-5 font-bold" /> : <Plus className="w-5 h-5" />}
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* 📊 DYNAMIC PRICING PANEL (UI CONNECTION) */}
        <div className="lg:col-span-4 sticky top-12">
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-50">
                 <h3 className="section-heading text-[12px] uppercase tracking-[0.2em] text-slate-900">Selection Stack</h3>
                 <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xl">{selectedPlans.length}</span>
              </div>

              {/* RENDER Selected Plans (DYNAMIC) */}
              <div className="space-y-3 mb-10 min-h-[100px]">
                 {selectedPlans.map((plan) => (
                    <div key={plan._id} className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 group animate-fade-in hover:shadow-lg transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-sm" />
                          <div>
                             <p className="table-data font-bold text-slate-900">{plan.name}</p>
                             <p className="text-xs-SaaS font-medium">₹{plan.price.toLocaleString()}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => removePlan(plan._id)}
                         className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm group-hover:scale-105 active:scale-95"
                       >
                          <X className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
                 
                 {selectedPlans.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                       <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Selections</p>
                    </div>
                 )}
              </div>

              {/* DYNAMIC PRICING BREAKDOWN (REAL-TIME UPDATES) */}
              {selectedPlans.length > 0 && (
                 <div className="space-y-6 animate-fade-in">
                    <div className="space-y-3 py-6 border-b border-t border-slate-50 my-8">
                       <div className="flex justify-between items-center text-sm">
                          <span className="kpi-label text-slate-500">Gross Subscription</span>
                          <span className="table-data font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                       </div>
                       {discountPercent > 0 && (
                          <div className="flex justify-between items-center text-sm group">
                             <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl transition-all group-hover:scale-105">Multi-Plan Benefit ({discountPercent}%)</span>
                             <span className="font-bold text-emerald-700 animate-pulse">- ₹{discountAmount.toLocaleString()}</span>
                          </div>
                       )}
                       <div className="flex justify-between items-center text-sm">
                          <span className="kpi-label text-slate-500 flex items-center gap-2">Strategy Fee <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                          <span className="table-data font-bold text-slate-900">₹99</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-8">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consolidated Monthly Total</p>
                       <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold tracking-tighter text-slate-900 italic">₹{(Math.round(finalTotal) + 99).toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ Cycle</span>
                       </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950 text-white space-y-3 relative overflow-hidden shadow-2xl">
                       <TrendingUp className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Lifecycle Savings</p>
                       <p className="text-lg font-bold italic">You saved ₹{Math.round(discountAmount).toLocaleString()}</p>
                       {discountPercent < 20 && (
                          <div className="pt-4 border-t border-white/10 space-y-2">
                             <p className="text-[10px] font-bold text-indigo-400">Next Discount Tier Progress</p>
                             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(selectedPlans.length / 3) * 100}%` }} />
                             </div>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Add {Math.max(1, 3 - selectedPlans.length)} more plan for 20% savings</p>
                          </div>
                       )}
                    </div>

                    <button 
                       onClick={handleFinalizeSelection}
                       disabled={submitting || selectedPlans.length === 0}
                       className={`w-full mt-8 py-5 rounded-3xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group ${
                         submitting 
                           ? 'bg-slate-400 text-white cursor-wait' 
                           : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-slate-950'
                       }`}
                    >
                       {submitting ? 'Syncing Portfolio...' : 'Initialize Portfolio'} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              )}
           </div>
        </div>

      </div>

    </div>
  );
}
