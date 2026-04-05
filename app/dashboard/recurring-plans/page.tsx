'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Layers, Edit2, Trash2, Check, Clock, RefreshCw, Pause, ArrowRight } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';
import StatusBadge from '@/components/StatusBadge';

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  product: { _id: string; name: string; type: string };
  features: string[];
  minimumQuantity: number;
  startDate: string | null;
  endDate: string | null;
  isRenewable: boolean;
  isPausable: boolean;
  isClosable: boolean;
  autoClose: boolean;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
}

export default function RecurringPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    product: '',
    features: [] as string[],
    minimumQuantity: 1,
    startDate: '',
    endDate: '',
    isRenewable: true,
    isPausable: false,
    isClosable: true,
    autoClose: false,
    trialDays: 0,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'internal';
  const isAdmin = user?.role === 'admin';

  const fetchPlans = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cycleFilter) params.set('cycle', cycleFilter);
    const res = await fetch(`/api/plans?${params}`);
    const data = await res.json();
    // Filter only recurring plans if needed, but for now we show all as they all have cycles
    setPlans(data.plans || []);
    setLoading(false);
  }, [search, cycleFilter]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchProducts();
  }, [fetchPlans, fetchProducts]);

  const openCreate = () => {
    setEditPlan(null);
    setForm({
      name: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      product: products[0]?._id || '',
      features: [],
      minimumQuantity: 1,
      startDate: '',
      endDate: '',
      isRenewable: true,
      isPausable: false,
      isClosable: true,
      autoClose: false,
      trialDays: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      product: plan.product?._id || '',
      features: plan.features,
      minimumQuantity: plan.minimumQuantity || 1,
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
      isRenewable: plan.isRenewable,
      isPausable: plan.isPausable,
      isClosable: plan.isClosable !== undefined ? plan.isClosable : true,
      autoClose: plan.autoClose,
      trialDays: plan.trialDays,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editPlan ? 'PUT' : 'POST';
    const url = editPlan ? `/api/plans/${editPlan._id}` : '/api/plans';
    
    const payload = {
      ...form,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchPlans();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    fetchPlans();
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const cycleColors: Record<string, string> = {
    daily: 'bg-blue-500/10 text-blue-500',
    weekly: 'bg-purple-500/10 text-purple-500',
    monthly: 'bg-emerald-500/10 text-emerald-500',
    yearly: 'bg-amber-500/10 text-amber-500',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Recurring Plans"
        description="Configure billing rules and recurrence for your products"
        action={canEdit && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/25">
            <Plus className="w-4 h-4" /> New Recurring Plan
          </button>
        )}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Plans', value: plans.length, icon: Layers, color: 'text-primary-500' },
          { label: 'Monthly Active', value: plans.filter(p => p.billingCycle === 'monthly').length, icon: Clock, color: 'text-emerald-500' },
          { label: 'Yearly Active', value: plans.filter(p => p.billingCycle === 'yearly').length, icon: RefreshCw, color: 'text-amber-500' },
          { label: 'Revenue Potential', value: '₹' + plans.reduce((acc, p) => acc + p.price, 0).toLocaleString(), icon: ArrowRight, color: 'text-blue-500' },
        ].map((stat, i) => (
          <Card key={i}>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search recurring plans..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        >
          <option value="">All Periods</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Layers} title="No recurring plans" description="Define your first billing plan to start accepting subscriptions" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="overflow-hidden rounded-xl border-t-4" style={{ borderTopColor: plan.billingCycle === 'yearly' ? '#f59e0b' : plan.billingCycle === 'monthly' ? '#10b981' : '#3b82f6' }}>
              <Card hover className="h-full border-t-0 rounded-t-none">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{plan.product?.name}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(plan)} className="p-2 rounded-lg hover:bg-primary-500/10 text-primary-500 transition-colors" title="Edit Plan"><Edit2 className="w-4 h-4" /></button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(plan._id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors" title="Delete Plan"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm mb-6 line-clamp-2 min-h-[40px]" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>

                <div className="flex items-center gap-2 mb-6">
                   <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 font-bold text-xl">
                      ₹{plan.price}
                   </div>
                   <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      per {plan.billingCycle}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                         <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Billing Period</p>
                         <span className={`text-xs font-semibold ${cycleColors[plan.billingCycle]} py-0.5 px-2 rounded-full`}>{plan.billingCycle}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                         <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Min. Quantity</p>
                         <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.minimumQuantity || 1} units</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                         <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Trial Period</p>
                         <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.trialDays || 0} days</span>
                      </div>
                      <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                         <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Status</p>
                         <StatusBadge status={plan.isActive ? 'active' : 'inactive'} />
                      </div>
                   </div>

                   {/* Options Indicators */}
                   <div className="flex flex-wrap gap-2 pt-2">
                      {plan.isRenewable && <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded"><RefreshCw className="w-3 h-3" /> RENEWABLE</div>}
                      {plan.isPausable && <div className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-500/5 px-2 py-1 rounded"><Pause className="w-3 h-3" /> PAUSABLE</div>}
                      {plan.isClosable && <div className="text-[10px] font-bold text-purple-500 flex items-center gap-1 bg-purple-500/5 px-2 py-1 rounded"><Check className="w-3 h-3" /> CLOSABLE</div>}
                      {plan.autoClose && <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded"><Clock className="w-3 h-3" /> AUTO-CLOSE</div>}
                   </div>

                   {/* Date Ranges */}
                   {(plan.startDate || plan.endDate) && (
                      <div className="pt-4 border-t border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                         <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {plan.startDate && <div>START: <strong className="text-white">{new Date(plan.startDate).toLocaleDateString()}</strong></div>}
                            {plan.endDate && <div>END: <strong className="text-white">{new Date(plan.endDate).toLocaleDateString()}</strong></div>}
                         </div>
                      </div>
                   )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    )}

      {/* Modal for Recurring Plan Creation/Edit */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPlan ? 'Edit Recurring Plan' : 'Define Recurring Plan'} size="lg">
        <form onSubmit={handleSubmit} className="p-2 space-y-6">
          <div className="space-y-4">
             <h4 className="text-sm font-bold uppercase tracking-widest text-primary-500 border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>Plan Information</h4>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Plan Name</label>
                 <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                   placeholder="Basic Monthly, Pro Yearly, etc." />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Linked Product</label>
                 <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none transition-all"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                   <option value="">Select product...</option>
                   {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                 </select>
               </div>
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
               <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                 className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none resize-none transition-all"
                 style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                 placeholder="Describe what this billing plan covers..." />
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-sm font-bold uppercase tracking-widest text-primary-500 border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>Billing Configuration</h4>
             <div className="grid grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Price (₹)</label>
                 <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} step={0.01} required
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Billing Period</label>
                 <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                   <option value="daily">Daily</option>
                   <option value="weekly">Weekly</option>
                   <option value="monthly">Monthly</option>
                   <option value="yearly">Yearly</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Minimum Quantity</label>
                 <input type="number" value={form.minimumQuantity} onChange={e => setForm({ ...form, minimumQuantity: Number(e.target.value) })} min={1} required
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
               </div>
             </div>

             <div className="grid grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
                 <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>End Date</label>
                 <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Trial Days</label>
                 <input type="number" value={form.trialDays} onChange={e => setForm({ ...form, trialDays: Number(e.target.value) })} min={0}
                   className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                   style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
               </div>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-sm font-bold uppercase tracking-widest text-primary-500 border-b pb-2" style={{ borderColor: 'var(--border-primary)' }}>Plan Options</h4>
             <div className="grid grid-cols-2 gap-y-4 gap-x-8 px-2">
                {[
                  { key: 'isRenewable', label: 'Renewable', desc: 'Allows automatic renewal at the end of period' },
                  { key: 'isPausable', label: 'Pausable', desc: 'Customers can pause subscription billing' },
                  { key: 'isClosable', label: 'Closable', desc: 'Allows manual closing of the plan' },
                  { key: 'autoClose', label: 'Auto Close', desc: 'Automatically closes at end of period' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-1 relative flex items-center justify-center">
                      <input type="checkbox" checked={form[opt.key as keyof typeof form] as boolean}
                        onChange={e => setForm({ ...form, [opt.key]: e.target.checked })}
                        className="peer opacity-0 absolute w-5 h-5 cursor-pointer" />
                      <div className="w-5 h-5 rounded border border-slate-600 bg-white/5 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
                         <Check className={`w-3.5 h-3.5 text-white transition-opacity ${form[opt.key as keyof typeof form] ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                    <div>
                       <span className="block text-sm font-bold group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                       <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</span>
                    </div>
                  </label>
                ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Included Features</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="e.g. 24/7 Support, Analytics Dashboard"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
              <button type="button" onClick={addFeature} className="px-6 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-colors shadow-lg shadow-primary-500/20">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-500/10 text-primary-500 border border-primary-500/20">
                  {f}
                  <button type="button" onClick={() => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) })} className="hover:text-rose-500 transition-colors">
                    <span className="text-sm font-bold">×</span>
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 rounded-lg border text-sm font-bold transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-bold transition-all shadow-xl shadow-primary-500/25">
              {editPlan ? 'Update Configuration' : 'Create Recurring Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
