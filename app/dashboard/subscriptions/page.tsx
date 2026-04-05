'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, ChevronLeft, Eye, Send, CheckCircle,
  PlayCircle, PauseCircle, XCircle, RefreshCw, AlertTriangle,
  Calendar, Package, User, Zap, FileText, Trash2,
  ArrowUpRight, Info, ChevronRight, Tag, ToggleLeft, Activity,
  ToggleRight, StickyNote, Percent, ShoppingCart, Settings, Clock, CreditCard, Download
} from 'lucide-react';
import Link from 'next/link';
import { Card, EmptyState } from '@/components/SharedUI';
import { SkeletonTable } from '@/components/SkeletonLoaders';
import { useAuth } from '@/components/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { format, differenceInDays } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subscription {
  _id: string;
  subscriptionNumber: string;
  customer: { _id: string; name: string; email: string };
  product?: { _id: string; name: string };
  plan?: { _id: string; name: string; price: number; billingCycle: string; product?: { _id: string, name: string } };
  subscriptionType: 'Standard' | 'Custom' | 'Trial' | 'Promo' | 'Enterprise';
  status: 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Suspended' | 'Closed';
  startDate: string;
  expirationDate?: string;
  endDate: string;
  nextBillingDate?: string;
  billingCycle?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentTerm: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue' | 'Failed';
  createdAt: string;
  orderLines?: any[];
  events?: any[];
}
interface Product { _id: string; name: string; salesPrice: number; }
interface OrderLineInput { productId: string; productName: string; quantity: number; unitPrice: number; discount: number; tax: number; }

interface Plan { _id: string; name: string; price: number; billingCycle: string; product?: string; }
interface Customer { _id: string; name: string; email: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function BillingCountdown({ date }: { date?: string }) {
  if (!date) return <span className="text-xs text-slate-400">—</span>;
  const diff = differenceInDays(new Date(date), new Date());
  if (diff < 0)  return <span className="text-xs font-bold text-rose-500">Expired</span>;
  if (diff === 0) return <span className="text-xs font-bold text-rose-500">Due today</span>;
  if (diff <= 7)  return <span className="text-xs font-bold text-amber-500">In {diff} days</span>;
  return <span className="text-xs font-bold text-emerald-600">In {diff} days</span>;
}

function PaymentTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50  text-amber-700  border-amber-200',
    Overdue: 'bg-rose-50   text-rose-700   border-rose-200',
    Failed:  'bg-slate-100 text-slate-600  border-slate-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ₹{map[status] ?? map.Pending}`}>
      {status}
    </span>
  );
}

// ─── Create Form (Multi-Step) ─────────────────────────────────────────────────
function CreateForm({ onDone }: { onDone: () => void }) {
  const [step, setStep]           = useState(1);
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);
  const [saving, setSaving]       = useState(false);

  // Step 1: Basic
  const [basic, setBasic] = useState({
    customer: '', 
    product: '',
    plan: '',
    subscriptionType: 'Standard',
    customPrice: '',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().slice(0, 10),
    paymentTerm: 'NET 30',
  });

  // Step 2: Options
  const [options, setOptions] = useState({
    trialDays: 0,
    autoRenew: true,
    notes: '',
    discount: 0,      
    couponCode: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/users?role=customer').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([p, c, pr]) => {
      setPlans(p.plans || []);
      setCustomers(c.users || []);
      setProducts(pr.products || []);
    });
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const payload = { ...basic, ...options };
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) onDone();
    else setSaving(false);
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter">Initialize Engine</h2>
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ₹{step === i ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <Card className="p-8">
        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Customer</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold focus:ring-2 ring-indigo-500"
                value={basic.customer}
                onChange={e => setBasic({ ...basic, customer: e.target.value })}
              >
                <option value="">Select ID</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Alignment</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold focus:ring-2 ring-indigo-500"
                value={basic.plan}
                onChange={e => {
                  const p = plans.find(pl => pl._id === e.target.value);
                  setPickedPlan(p || null);
                  setBasic({ ...basic, plan: e.target.value, billingCycle: p?.billingCycle || 'monthly' });
                }}
              >
                <option value="">Select Plan</option>
                {plans.map(p => <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Synchronicity</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold focus:ring-2 ring-indigo-500"
                value={basic.startDate}
                onChange={e => setBasic({ ...basic, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Protocol</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold focus:ring-2 ring-indigo-500"
                value={basic.paymentTerm}
                onChange={e => setBasic({ ...basic, paymentTerm: e.target.value })}
              >
                <option>Immediate</option>
                <option>NET 15</option>
                <option>NET 30</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trial Period (Days)</label>
                  <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold" value={options.trialDays} onChange={e => setOptions({...options, trialDays: +e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auto-Renewal</label>
                  <div className="flex items-center gap-4 py-2">
                    <button onClick={() => setOptions({...options, autoRenew: !options.autoRenew})} className={`w-12 h-6 rounded-full relative transition-colors ₹{options.autoRenew ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ₹{options.autoRenew ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-xs font-black uppercase">{options.autoRenew ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Audit Memo</label>
                <textarea className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold h-32" placeholder="Specify custom configurations or client requirements..." value={options.notes} onChange={e => setOptions({...options, notes: e.target.value})} />
             </div>
          </div>
        )}

        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Back</button>
          )}
          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Continue Strategy</button>
          ) : (
            <button onClick={handleCreate} disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50">
              {saving ? 'Synchronizing...' : 'Initialize Lifecycle'}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Detail View (REDEVELOPED FOR Alice) ──────────────────────────────────────
function DetailView({ sub, onBack, onAction }: { sub: Subscription; onBack: () => void; onAction: (action: string) => void }) {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:shadow-xl transition-all">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Back to Ledger</span>
        </button>
        <div className="flex items-center gap-3">
          <StatusBadge status={sub.status} />
          <PaymentTag status={sub.paymentStatus || 'Pending'} />
        </div>
      </div>

      {/* 🚀 Lifecycle Stepper */}
      <div className="bg-white rounded-[40px] p-10 border-2 border-slate-50 shadow-2xl mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
          <Activity className="w-40 h-40 rotate-12" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-8 text-center">Service Lifecycle Journey</p>
          <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
             <div className="absolute left-8 right-8 top-5 h-[2px] bg-slate-100 -z-10" />
             {['Draft', 'Quotation', 'Confirmed', 'Active'].map((step, i) => {
               const isActive = sub.status === step;
               const isCompleted = ['Draft', 'Quotation', 'Confirmed', 'Active'].indexOf(sub.status) >= i;
               return (
                 <div key={step} className="flex flex-col items-center gap-4 group/step">
                   <div className={`w-10 h-10 rounded-2xl border-4 flex items-center justify-center transition-all duration-500 ₹{
                     isActive ? 'bg-indigo-600 border-indigo-100 text-white scale-125 shadow-xl shadow-indigo-200' : 
                     isCompleted ? 'bg-emerald-500 border-white text-white shadow-lg' :
                     'bg-white border-slate-100 text-slate-300'
                   }`}>
                     {isCompleted && !isActive ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-black">{i + 1}</span>}
                   </div>
                   <p className={`text-[10px] font-black uppercase tracking-widest transition-all ₹{
                     isCompleted ? 'text-slate-900' : 'text-slate-300'
                   }`}>
                     {step}
                   </p>
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
           <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Zap className="w-32 h-32 text-indigo-400" />
           </div>
           <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-3">Enterprise Registry</p>
              <h1 className="text-6xl font-black tracking-tighter italic mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>{sub.subscriptionNumber}</h1>
              <div className="flex items-center gap-6 mt-10 p-6 bg-white/5 rounded-[32px] border border-white/5 backdrop-blur-sm">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <Package className="w-7 h-7 text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-white">{sub.product?.name || sub.plan?.product?.name || 'Standard Service'}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Registered Identity Code</p>
                 </div>
              </div>
           </div>
        </div>
        <div className="bg-white rounded-[50px] p-10 border-2 border-slate-50 shadow-xl flex flex-col justify-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Lifecycle Valuation</p>
           <h2 className="text-6xl font-black tracking-tighter italic text-slate-900 leading-none mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
             ₹{sub.totalAmount.toLocaleString()}
           </h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter px-4 py-2 bg-slate-50 rounded-xl w-fit">{sub.paymentTerm}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><User className="w-5 h-5 text-indigo-500" /></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Customer Identity</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{sub.customer?.name}</p>
          <p className="text-sm font-bold text-slate-400 mt-1 italic">{sub.customer?.email}</p>
        </Card>
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-500" /></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Timing Strategy</p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Initialized</p><p className="text-sm font-black text-slate-900">{format(new Date(sub.startDate), 'MMM d, yyyy')}</p></div>
            <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Next Signal</p><div className="text-right"><p className="text-sm font-black text-slate-900">{sub.nextBillingDate ? format(new Date(sub.nextBillingDate), 'MMM d, yyyy') : '—'}</p><BillingCountdown date={sub.nextBillingDate} /></div></div>
          </div>
        </Card>
      </div>

      <Card className="p-10 bg-white border-2 border-slate-50 rounded-[40px] shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">Component Specifications</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="pb-5 text-left">Unit Type</th>
                <th className="pb-5 text-center">Volume</th>
                <th className="pb-5 text-right">Standard Price</th>
                <th className="pb-5 text-right">Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sub.orderLines && sub.orderLines.length > 0 ? (
                sub.orderLines.map((line: any, i: number) => (
                  <tr key={i} className="group/row">
                    <td className="py-6 font-black text-slate-900 truncate max-w-[200px]">{typeof line.product === 'string' ? line.product : line.product?.name}</td>
                    <td className="py-6 text-center font-bold text-slate-500">{line.quantity}</td>
                    <td className="py-6 text-right font-black text-slate-900 italic tracking-tighter">₹{line.unitPrice?.toLocaleString()}</td>
                    <td className="py-6 text-right font-black text-indigo-600 italic tracking-tighter">₹{line.amount?.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 font-black text-slate-900">{sub.plan?.name || 'Standard Cluster'}</td>
                  <td className="py-6 text-center font-bold text-slate-500">1</td>
                  <td className="py-6 text-right font-black text-slate-900">₹{sub.plan?.price?.toLocaleString() || sub.totalAmount?.toLocaleString()}</td>
                  <td className="py-6 text-right font-black text-indigo-600">₹{sub.totalAmount.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 flex flex-col md:flex-row justify-end pt-10 border-t-2 border-slate-900">
           <div className="w-full md:w-[350px] space-y-6">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                 <span>Operational Subtotal</span>
                 <span className="text-slate-900">₹{sub.subtotal?.toLocaleString() || sub.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">
                 <span>Promo Yield</span>
                 <span>-₹{sub.totalDiscount?.toLocaleString() || '0'}</span>
              </div>
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group/total mt-8 border border-white/5">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/total:scale-125 transition-all"><CreditCard className="w-20 h-20" /></div>
                 <p className="text-[9px] font-black uppercase tracking-[0.6em] text-indigo-400 mb-4">Total Net Liability</p>
                 <div className="flex items-baseline gap-3 relative z-10">
                    <span className="text-6xl font-black tracking-tighter italic leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{sub.totalAmount.toLocaleString()}</span>
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{sub.billingCycle || 'month'}</span>
                 </div>
              </div>
           </div>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-500" /></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Strategic Timeline</p>
        </div>
        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {sub.events?.map((ev: any, idx: number) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[26px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">{ev.status}</span>
                  <p className="text-xs font-bold text-slate-400 mt-1 italic">{ev.notes}</p>
                </div>
                <p className="text-[10px] font-black italic text-slate-300 uppercase">{format(new Date(ev.timestamp), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          ))}
          {!sub.events?.length && <p className="text-center py-4 text-[10px] font-bold text-slate-300 italic uppercase">No events registered</p>}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        {sub.status === 'Draft' && <ActionBtn icon={Send} label="Send Strategy" onClick={() => onAction('quotation')} color="indigo" />}
        {sub.status === 'Quotation' && <ActionBtn icon={CheckCircle} label="Authorize Strategy" onClick={() => onAction('confirm')} color="emerald" />}
        
        {/* Payment Execution Hook */}
        {sub.status === 'Confirmed' && (
           <Link href={`/dashboard/payment/${sub._id}`} className="flex-1">
             <div className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-200">
               <CreditCard className="w-4 h-4 shadow-sm" /> Execute Payment
             </div>
           </Link>
        )}

        {/* Receipt Generation Hook */}
        {(sub.status === 'Active' || sub.status === 'Closed') && (
           <Link href={`/dashboard/invoices/${sub._id}`} className="flex-1">
             <div className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200">
               <Download className="w-4 h-4 shadow-sm" /> Download Official Receipt
             </div>
           </Link>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, color }: any) {
  const colors: Record<string, string> = {
    indigo:  'bg-slate-900 text-white hover:bg-black',
    emerald: 'bg-indigo-600 text-white hover:bg-indigo-700',
  };
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl ₹{colors[color]}`}>
      <Icon className="w-4 h-4 shadow-sm" /> {label}
    </button>
  );
}

// ─── Main Subscriptions Page ──────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [view, setView]         = useState<'list' | 'detail' | 'create'>('list');
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [subs, setSubs]         = useState<Subscription[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [search, setSearch]     = useState('');

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const endpoint = user?.role === 'admin' ? '/api/subscriptions' : '/api/subscriptions/customer';
    const res = await fetch(endpoint);
    const d = await res.json();
    setSubs(d.subscriptions || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleAction = async (action: string) => {
    if (!selected) return;
    setBusy(true);
    await fetch(`/api/subscriptions ₹{selected._id}/ ₹{action}`, { method: 'POST' });
    const fresh = await fetch(`/api/subscriptions/ ₹{selected._id}`).then(r => r.json());
    if (fresh.subscription) setSelected(fresh.subscription);
    fetchSubs();
    setBusy(false);
  };

  if (loading) return <div className="max-w-6xl mx-auto py-10"><SkeletonTable /></div>;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-20 mt-8">
      {view === 'list' && (
        <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2">Service Portfolio</p>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">Active Subscriptions</h1>
            </div>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setView('create')} 
                className="group flex items-center gap-3 px-8 py-4 rounded-[28px] bg-slate-900 text-white font-black text-xs shadow-2xl hover:bg-black transition-all active:scale-95 duration-500"
              >
                <Plus className="w-4 h-4 text-white" /> Initialize New Suite
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              className="w-full bg-white border-2 border-slate-50 rounded-[32px] pl-14 pr-8 py-5 font-bold text-sm shadow-sm focus:border-indigo-100 focus:shadow-2xl transition-all" 
              placeholder="Search by identity or code..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subs.filter(s => s.subscriptionNumber.includes(search) || s.customer?.name.includes(search)).map(sub => (
              <div key={sub._id} className="group relative">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <Card 
                  hover 
                  className="p-8 bg-white border-2 border-slate-50 rounded-[40px] shadow-xl relative z-10 transition-all duration-500 hover:border-indigo-100 group cursor-pointer"
                  onClick={() => { setSelected(sub); setView('detail'); }}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                       <Zap className="w-5 h-5 text-slate-300 group-hover:text-white" />
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{sub.subscriptionNumber}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{sub.customer?.name}</p>
                  
                  <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-900">₹{sub.totalAmount.toLocaleString()}</p>
                       <p className="text-[9px] font-black uppercase text-indigo-400">{sub.billingCycle}</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
          {subs.length === 0 && <EmptyState icon={Package} title="No units found." description="Your portfolio is currently blank. Get started by initializing your first lifecycle." />}
        </>
      )}

      {view === 'detail' && selected && (
        <DetailView sub={selected} onBack={() => { setView('list'); setSelected(null); }} onAction={handleAction} />
      )}

      {view === 'create' && (
        <CreateForm onDone={() => { setView('list'); fetchSubs(); }} />
      )}
    </div>
  );
}
