'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Check, Star, AlertCircle, Loader2, Info } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

interface Plan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  product?: { name: string };
  isActive: boolean;
}

export default function BrowsePlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await fetch('/api/plans');
        const plansData = await plansRes.json();
        setPlans((plansData.plans || []).filter((p: Plan) => p.isActive));

        // If user is customer, fetch their active subscriptions to check if they already have it
        if (user?.role === 'customer') {
          const subsRes = await fetch('/api/subscriptions');
          const subsData = await subsRes.json();
          const activePlanIds = (subsData.subscriptions || [])
            .filter((sub: any) => (sub.status === 'active' || sub.status === 'confirmed') && sub.plan)
            .map((sub: any) => sub.plan._id || sub.plan);
          setActiveSubscriptions(activePlanIds);
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleGetStarted = (plan: Plan) => {
    if (user?.role !== 'customer') {
      showToast('Contact admin to subscribe to this plan.', 'info');
      return;
    }
    
    if (activeSubscriptions.includes(plan._id)) {
      showToast('You are already subscribed to this plan.', 'info');
      return;
    }

    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);

    try {
      // 1. Create Razorpay order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan._id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      // 2. Open Razorpay Checkout Window
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Needs to be provided by user
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SubSaaS Platform",
        description: `Subscription to ${selectedPlan.name}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify payment on success
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user?.id,
                planId: selectedPlan._id
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            showToast('Subscription activated successfully!', 'success');
            setIsModalOpen(false);
            
            setTimeout(() => {
              router.push('/dashboard/my-subscriptions');
            }, 1500);

          } catch (err: any) {
            showToast(err.message, 'error');
            setSubscribing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function() {
            setSubscribing(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        showToast(response.error.description || 'Payment Failed', 'error');
        setSubscribing(false);
      });
      razorpay.open();

    } catch (error: any) {
      showToast(error.message, 'error');
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const cyclePlans = {
    monthly: plans.filter(p => p.billingCycle === 'monthly'),
    yearly: plans.filter(p => p.billingCycle === 'yearly'),
    other: plans.filter(p => !['monthly', 'yearly'].includes(p.billingCycle)),
  };

  const allPlans = [...cyclePlans.monthly, ...cyclePlans.yearly, ...cyclePlans.other];

  return (
    <div className="animate-fade-in relative relative z-0">
      <PageHeader title="Browse Plans" description="Explore available subscription plans" />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : 
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 
          'bg-slate-800 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
           toast.type === 'success' ? <Check className="w-5 h-5" /> : 
           <Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {allPlans.length === 0 ? (
        <EmptyState icon={Layers} title="No plans available" description="Check back soon for new plans!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Script src="https://checkout.razorpay.com/v1/checkout.js" />
          {allPlans.map((plan, idx) => {
            const isPopular = idx === 1; // Mark second plan as popular
            const isSubscribed = activeSubscriptions.includes(plan._id);

            return (
              <Card key={plan._id} hover>
                <div className={`relative p-6 ₹{isPopular ? 'ring-2 ring-primary-500 rounded-xl' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      {plan.product?.name || 'Subscription Tier'}
                    </p>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{plan.price}</span>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/{plan.billingCycle}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    disabled={isSubscribed && user?.role === 'customer'}
                    onClick={() => handleGetStarted(plan)}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ₹{
                      isSubscribed && user?.role === 'customer'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed'
                        : isPopular
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600'
                        : 'border text-primary-500 hover:bg-primary-500/5'
                    }`}
                    style={!isPopular && !isSubscribed ? { borderColor: 'var(--border-primary)' } : {}}
                  >
                    {isSubscribed && user?.role === 'customer' ? 'Current Plan' : 'Get Started'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subscription Confirmation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !subscribing && setIsModalOpen(false)} title="Confirm Subscription" size="md">
        {selectedPlan && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-primary-500/20 bg-primary-500/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedPlan.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedPlan.product?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary-500">₹{selectedPlan.price}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/{selectedPlan.billingCycle}</p>
                </div>
              </div>
              <ul className="text-sm mt-3 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {selectedPlan.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-emerald-500" /> {f}
                  </li>
                ))}
                {selectedPlan.features.length > 3 && (
                  <li className="text-xs italic mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    + {selectedPlan.features.length - 3} more features
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Start Date:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total Due Today:</span>
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>₹{(selectedPlan.price * 1.1).toFixed(2)} <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(inc. 10% tax)</span></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={subscribing}
                className="px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubscription}
                disabled={subscribing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-600 transition-all disabled:opacity-50"
              >
                {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {subscribing ? 'Processing...' : 'Confirm & Subscribe'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
