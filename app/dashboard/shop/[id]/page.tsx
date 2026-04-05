'use client';

import React, { useEffect, useState, use } from 'react';
import { 
  ChevronRight, Minus, Plus, ShoppingCart, Check, Star, Shield, 
  Truck, AlertCircle, Info, QrCode, CreditCard, Copy 
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '@/components/SharedUI';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Script from 'next/script';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface Variant {
  attribute: string;
  value: string;
  extraPrice: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  variants: Variant[];
}

interface Plan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  product?: { _id: string; name: string };
  isActive: boolean;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selections
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Checkout state
  const [subscribing, setSubscribing] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Image gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const [prodRes, plansRes, setRes] = await Promise.all([
          fetch(`/api/products/${unwrappedParams.id}`),
          fetch(`/api/plans?productId=${unwrappedParams.id}`),
          fetch('/api/settings')
        ]);
        
        const prodData = await prodRes.json();
        const plansData = await plansRes.json();
        const setData   = await setRes.json();
        
        if (prodRes.ok) {
          setProduct(prodData.product);
          if (prodData.product.variants && prodData.product.variants.length > 0) {
              setSelectedVariantIndex(0);
          }
        }
        
        if (plansRes.ok) {
          const productPlans = (plansData.plans || [])
            .filter((p: Plan) => p.isActive)
            .sort((a: Plan, b: Plan) => a.price - b.price);
            
          setPlans(productPlans);
          if (productPlans.length > 0) {
            setSelectedPlanId(productPlans[0]._id);
          }
        }

        if (setRes.ok && setData.success) {
          // Additional settings fetch
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [unwrappedParams.id]);

  // Debug & Validation Protocol
  useEffect(() => {
    const activeData = plans.find(p => p._id === selectedPlanId) || null;
    console.log('--- SYSTEM STATE VALIDATION ---');
    console.log('Available Plans:', plans);
    console.log('Target Selected Plan:', activeData);
  }, [plans, selectedPlanId]);

  const handleSubscribe = async () => {
    if (!selectedPlanId) {
      showToast('Please select a subscription plan.', 'error');
      return;
    }
    if (user?.role !== 'customer') {
      showToast('Only customers can subscribe to plans.', 'error');
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: unwrappedParams.id,
          planId: selectedPlanId,
          quantity: quantity || 1
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout initialization failed');
      }

      // Route completely to the dedicated Payment Flow
      router.push(`/dashboard/payment/${data.subscriptionId}`);

    } catch (error: any) {
      showToast(error.message, 'error');
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <EmptyState icon={AlertCircle} title="Product not found" description="This product may have been removed or is unavailable." />;

  const monthlyPlan = plans.find(p => p.billingCycle === 'monthly');
  const baseMonthlyPrice = monthlyPlan ? monthlyPlan.price : product.price;
  const variantExtraPrice = selectedVariantIndex >= 0 ? product.variants[selectedVariantIndex].extraPrice : 0;
  const activePlan = plans.find(p => p._id === selectedPlanId);
  const currentPlanPrice = activePlan ? activePlan.price : 0;
  
  // Real-time Pricing Compute Preview
  const baseSubtotal = currentPlanPrice * quantity;
  let dynamicDiscountPercent = 0;
  if (quantity === 2) dynamicDiscountPercent = 0.10;
  else if (quantity >= 3) dynamicDiscountPercent = 0.20;
  
  const discountAmount = baseSubtotal * dynamicDiscountPercent;
  const grandTotal = baseSubtotal - discountAmount;

  const galleryImages = [
    `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80&sig=1`,
    `https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80&sig=2`,
    `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80&sig=3`,
    `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80&sig=4`
  ];

  return (
    <div className="animate-fade-in relative z-0 max-w-6xl mx-auto pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[99] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : 
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 
          'bg-slate-800 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
           toast.type === 'success' ? <Check className="w-5 h-5" /> : 
           <Info className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-tertiary)' }}>
        <Link href="/dashboard/shop" className="hover:text-primary-500 transition-colors">All products</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="uppercase">{product.type}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-1/2 flex flex-col-reverse sm:flex-row gap-4 h-auto lg:h-[500px]">
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto w-full sm:w-20 sm:flex-shrink-0 scrollbar-hide py-1 px-1">
            {galleryImages.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImageIdx(idx)}
                className={`w-16 h-16 sm:w-full sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 shadow-sm ${
                  activeImageIdx === idx ? 'border-primary-500 opacity-100 ring-2 ring-primary-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                }`}>
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden border shadow-sm relative group" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
             <img src={galleryImages[activeImageIdx]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur text-xs font-bold uppercase rounded shadow-sm" style={{ color: 'var(--text-primary)'}}>
               {product.type}
             </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-6 border-b pb-6" style={{ borderColor: 'var(--border-primary)' }}>
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>{product.name}</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="section-heading text-slate-900 mb-6">Select Subscription Node</h3>
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Plans Available</p>
                </div>
              ) : (
                plans.map(plan => {
                  const isSelected = selectedPlanId === plan._id;
                  return (
                    <div key={plan._id} onClick={() => setSelectedPlanId(plan._id)}
                      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/10 shadow-lg' 
                          : 'border-slate-100 bg-white hover:border-indigo-200'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                           isSelected ? 'border-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'
                         }`}>
                           {isSelected && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                         </div>
                         <div>
                           <h4 className={`font-bold transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{plan.name}</h4>
                           <div className="text-xs mt-1 space-x-2">
                             <span className="font-bold text-slate-400 capitalize">{plan.billingCycle}ly Plan</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="text-right">
                         <p className={`text-xl font-black italic tracking-tighter ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>₹{plan.price.toLocaleString()}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per {plan.billingCycle}</p>
                       </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PRE-CHECKOUT REAL-TIME SUMMARY */}
            {(quantity >= 2 || baseSubtotal > 0) && activePlan && (
               <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-500">Gross Baseline</span>
                     <span className="font-bold text-slate-900">₹{baseSubtotal.toLocaleString()}</span>
                  </div>
                  {dynamicDiscountPercent > 0 && (
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Volume Check ({dynamicDiscountPercent * 100}%)</span>
                        <span className="font-bold text-emerald-600">-₹{discountAmount.toLocaleString()}</span>
                     </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Checkout Final</span>
                     <span className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                  </div>
               </div>
            )}
          </div>

          <div className="flex items-end gap-4 mt-auto pt-6 border-t border-slate-100">
             <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</span>
                <div className="flex items-center h-16 rounded-2xl border-2 border-slate-100 px-2 bg-slate-50">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center bg-transparent border-none outline-none font-black text-lg text-slate-900" />
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
             </div>
             
             <button 
               disabled={subscribing || !selectedPlanId || grandTotal <= 0}
               onClick={handleSubscribe}
               className="flex-1 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-950 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300"
             >
               {subscribing ? <span className="animate-pulse">Authorizing Request...</span> : (
                 <>
                   <ShoppingCart className="w-5 h-5" />
                   Subscribe Now • ₹{grandTotal > 0 ? grandTotal.toLocaleString() : '0'}
                 </>
               )}
             </button>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            {[{ icon: Shield, col: 'emerald', text: '30-day money back' }, { icon: Truck, col: 'blue', text: 'Instant Delivery' }, { icon: Info, col: 'purple', text: 'T&C Apply' }].map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-500">
                <b.icon className={`w-5 h-5 text-${b.col}-500`} />
                <span className="text-xs font-medium">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
