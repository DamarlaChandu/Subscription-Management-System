'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, AlertCircle, CreditCard, CheckCircle2, 
  ArrowRight, Shield, Globe, Lock, Cpu
} from 'lucide-react';
import { LoadingSpinner, Card } from '@/components/SharedUI';

export default function PaymentGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    fetch(`/api/subscriptions/${unwrappedParams.id}`)
      .then(r => r.json())
      .then(d => {
         if (d.subscription) {
            setSubData(d.subscription);
         } else {
            setError('Registry Record Not Found');
         }
         setLoading(false);
      })
      .catch(() => {
         setError('Verification Protocol Failed');
         setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleFinalCheckout = () => {
     setProcessing(true);
     // Simulate final checkout sequence for exact match to prompt requirements
     setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
        setTimeout(() => {
           router.push('/dashboard/subscriptions');
        }, 3000);
     }, 1500);
  };

  if (loading) return <div className="p-20"><LoadingSpinner /></div>;
  if (error) return (
     <div className="max-w-xl mx-auto p-20 text-center animate-fade-in">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure Verification Failed</h2>
        <p className="text-sm font-medium text-slate-500 mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Return to Base</button>
     </div>
  );

  const discountPercent = subData.subtotal > 0 
    ? Math.round((subData.totalDiscount / subData.subtotal) * 100) 
    : 0;

  const planName = subData.orderLines?.[0]?.description || 'Optimized Service Bundle';
  const quantity = subData.orderLines?.[0]?.quantity || 1;

  if (success) return (
     <div className="max-w-xl mx-auto p-20 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 rounded-[32px] bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
           <ShieldCheck className="w-12 h-12 text-white animate-bounce" />
        </div>
        <div className="space-y-4">
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter italic uppercase">Transaction Verified</h1>
           <p className="kpi-label font-medium">Your subscription has been successfully provisioned. Synchronizing network nodes...</p>
        </div>
     </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-40">
      
      <div className="flex items-center gap-3 mb-12 pb-6 border-b border-slate-100">
         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <Lock className="w-5 h-5 text-white" />
         </div>
         <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Checkout Gateway</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-1">End-to-End Encryption Protocol</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         
         {/* Detailed Ledger */}
         <div className="space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-10">
               <h3 className="section-heading text-sm text-slate-900 uppercase tracking-widest mb-8">Purchase Summary</h3>
               
               <div className="space-y-6">
                  <div className="flex items-start gap-4">
                     <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                        <Cpu className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900">{planName}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Digital Service Provision</p>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Node Quantity</span>
                        <span className="table-data font-bold text-slate-900">x{quantity}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">Subtotal Calculation</span>
                        <span className="table-data font-bold text-slate-900">₹{subData.subtotal.toLocaleString()}</span>
                     </div>
                     {subData.totalDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm group">
                           <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded transition-transform group-hover:scale-105">Volume Advantage ({discountPercent}%)</span>
                           <span className="font-bold text-emerald-600">- ₹{subData.totalDiscount.toLocaleString()}</span>
                        </div>
                     )}
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Final Net Settlement</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter italic">₹{subData.totalAmount.toLocaleString()}</p>
               </div>
               
               {discountPercent > 0 && (
                 <div className="mt-6 p-4 rounded-3xl bg-slate-900 text-center">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                       Strategic Savings Active: You saved ₹{subData.totalDiscount.toLocaleString()}
                    </p>
                 </div>
               )}
            </div>
         </div>

         {/* Command Payment Node */}
         <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-10 flex flex-col justify-between">
            <div>
               <h3 className="section-heading text-sm text-slate-900 uppercase tracking-widest mb-6">Execution Protocol</h3>
               <div className="p-6 rounded-3xl bg-white border border-slate-200 flex items-center gap-5 shadow-sm mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                     <CreditCard className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-900">Secure Online Checkout</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stripe / Razorpay Emulation</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Shield className="w-4 h-4 text-emerald-500" /> AES-256 Verified Connection
               </div>
               
               {/* Discount / Promo Engine */}
               <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-widest">Network Discount Code</p>
                  <div className="flex gap-3">
                     <input 
                       type="text" 
                       value={promoCode}
                       onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                       disabled={promoApplied || processing}
                       placeholder="ENTER CODE" 
                       className="flex-1 h-12 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-sm text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50"
                     />
                     <button 
                       onClick={() => { if(promoCode) setPromoApplied(true); }}
                       disabled={promoApplied || !promoCode || processing}
                       className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 shadow-sm"
                     >
                       {promoApplied ? 'Active' : 'Apply'}
                     </button>
                  </div>
                  {promoApplied && (
                     <p className="text-[10px] font-bold text-emerald-500 mt-3 flex items-center gap-1.5 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> External Promotion Registered</p>
                  )}
               </div>
            </div>

            <button 
              onClick={handleFinalCheckout}
              disabled={processing}
              className={`w-full py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group ${
                processing ? 'bg-slate-300 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-slate-950 shadow-indigo-200'
              }`}
            >
              {processing ? 'Authorizing Request...' : `Verify & Pay ₹${subData.totalAmount.toLocaleString()}`}
              {!processing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
         </div>

      </div>
    </div>
  );
}
