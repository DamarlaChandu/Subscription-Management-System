'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Layers, Edit2, Trash2, Check, Clock, RefreshCw, Pause } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';

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

export default function PlansPage() {
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
      product: plan.product._id,
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
    <div className="animate-fade-in">
      <PageHeader
        title="Plans"
        description="Manage recurring subscription plans"
        action={canEdit && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/25">
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        )}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        >
          <option value="">All Cycles</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Layers} title="No plans yet" description="Create a subscription plan to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan._id} hover>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{plan.product?.name}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-500"><Edit2 className="w-4 h-4" /></button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(plan._id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>₹{plan.price}</span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/{plan.billingCycle}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cycleColors[plan.billingCycle]} capitalize`}>
                    <Clock className="w-3 h-3 inline mr-1" />{plan.billingCycle}
                  </span>
                  {plan.isRenewable && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500"><RefreshCw className="w-3 h-3 inline mr-1" />Renewable</span>}
                  {plan.isPausable && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500"><Pause className="w-3 h-3 inline mr-1" />Pausable</span>}
                  {plan.isClosable && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">Closable</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                   <div>Min Qty: <strong>{plan.minimumQuantity || 1}</strong></div>
                   <div>Trial: <strong>{plan.trialDays || 0} days</strong></div>
                   {plan.startDate && <div>Starts: <strong>{new Date(plan.startDate).toLocaleDateString()}</strong></div>}
                   {plan.endDate && <div>Ends: <strong>{new Date(plan.endDate).toLocaleDateString()}</strong></div>}
                </div>

                {plan.features.length > 0 && (
                  <div className="space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                    {plan.features.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>+{plan.features.length - 4} more</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editPlan ? 'Edit Plan' : 'Create Plan'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Plan Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Product</label>
              <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                <option value="">Select product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} step={0.01} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Billing Cycle</label>
              <select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Minimum Quantity</label>
              <input type="number" value={form.minimumQuantity} onChange={e => setForm({ ...form, minimumQuantity: Number(e.target.value) })} min={1} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Trial Days</label>
              <input type="number" value={form.trialDays} onChange={e => setForm({ ...form, trialDays: Number(e.target.value) })} min={0}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="flex gap-6 flex-wrap">
            {[
              { key: 'isRenewable', label: 'Renewable' },
              { key: 'isPausable', label: 'Pausable' },
              { key: 'isClosable', label: 'Closable' },
              { key: 'autoClose', label: 'Auto Close' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form[opt.key as keyof typeof form] as boolean}
                  onChange={e => setForm({ ...form, [opt.key]: e.target.checked })}
                  className="rounded border-slate-300" />
                {opt.label}
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Features</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Add a feature"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
              <button type="button" onClick={addFeature} className="px-3 py-2 rounded-lg bg-primary-500 text-white text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-500/10 text-primary-500">
                  {f}
                  <button type="button" onClick={() => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) })}>
                    <span className="text-xs">×</span>
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium">
              {editPlan ? 'Update' : 'Create'} Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
