'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard, Building, Banknote, Smartphone, DollarSign,
  CheckCircle, Clock, XCircle, ArrowUpRight, Wallet,
  Receipt, TrendingUp, Search, Filter, Download, RefreshCw,
  AlertCircle, BadgeCheck, ChevronDown, Landmark, Zap, X, Copy, Check, Info, FileText, Calendar
} from 'lucide-react';
import { Card, EmptyState, Modal } from '@/components/SharedUI';
import { useAuth } from '@/components/AuthContext';
import { format } from 'date-fns';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface Payment {
  _id: string;
  invoice: { _id: string; invoiceNumber: string; total: number };
  amount: number;
  method: string;
  transactionId?: string;
  status: string;
  paidAt: string;
  createdAt: string;
}

const METHOD_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  credit_card:   { label: 'Credit Card',    icon: CreditCard,  color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  bank_transfer: { label: 'Bank Transfer',  icon: Building,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  cash:          { label: 'Cash',           icon: Banknote,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
  upi:           { label: 'UPI',            icon: Smartphone,  color: 'text-purple-600',  bg: 'bg-purple-50' },
  other:         { label: 'Other',          icon: DollarSign,  color: 'text-slate-600',   bg: 'bg-slate-50' },
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  pending:   { label: 'Pending',   icon: Clock,       color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  failed:    { label: 'Failed',    icon: XCircle,     color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_META[status] || STATUS_META.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${s.color} ${s.bg} ${s.border}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function DetailItem({ label, icon: Icon, children }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/payments')
      .then(r => r.json())
      .then(data => { setPayments(data.payments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const filtered = payments.filter(p => {
    const matchesSearch = p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
                         p.transactionId?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = filterMethod === 'all' || p.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const successCount = payments.filter(p => p.status === 'completed').length;

  if (loading) return (
    <div className="space-y-8 animate-pulse p-6 max-w-5xl mx-auto mt-4">
      <div className="h-10 w-72 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-6">{[1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-50 rounded-3xl" />)}</div>
      <div className="h-64 bg-slate-50 rounded-[40px]" />
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-12 mt-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-1">Financial History</p>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">My Payments</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Track all your billing transactions in one place.</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetch('/api/payments').then(r => r.json()).then(d => { setPayments(d.payments || []); setLoading(false); }); }}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all font-black text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" /> Refresh Particulars
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl shadow-indigo-900/40 relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 group-hover:opacity-30 transition-all duration-700">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Finalized Revenue
            </div>
            <h2 className="text-6xl font-black tracking-tighter italic mb-4">₹{totalPaid.toLocaleString()}</h2>
            <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-black uppercase tracking-tight">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ArrowUpRight className="w-4 h-4" />
              </div> 
              {successCount} Success Transactions
            </div>
          </div>
          <div className="absolute -bottom-2 left-0 right-0 h-16 opacity-30 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[50, 40, 70, 50, 80, 60, 95, 80, 100].map((v, i) => ({ i, v }))}>
                <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={4} fill="#6366f1" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 border-2 border-slate-50 shadow-xl group hover:border-amber-400 transition-all duration-500 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-[20px] bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-all shadow-sm">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            {totalPending > 0 && <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-bounce">AWAITING</span>}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Pending Balance</p>
          <h3 className="text-4xl font-black tracking-tighter text-slate-900 italic">₹{totalPending.toLocaleString()}</h3>
          <div className="text-[12px] font-bold text-slate-400 mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> {payments.filter(p => p.status === 'pending').length} In-Review
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 border-2 border-slate-50 shadow-xl group hover:border-indigo-400 transition-all duration-500 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 rounded-[20px] bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-all shadow-sm">
              <BadgeCheck className="w-7 h-7 text-indigo-500" />
            </div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Service Success</p>
          <h3 className="text-4xl font-black tracking-tighter text-slate-900 italic">
            {payments.length > 0 ? Math.round((successCount / payments.length) * 100) : 100}<span className="text-indigo-500 text-2xl">%</span>
          </h3>
          <div className="text-[12px] font-bold text-slate-400 mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Integrity Score
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'credit_card', 'bank_transfer', 'upi', 'cash'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterMethod === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {m === 'all' ? 'All Methods' : METHOD_META[m]?.label || m}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search invoice or transaction..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-5 py-3 rounded-2xl bg-white border border-slate-100 text-sm font-bold outline-none focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments found"
            description={search || filterMethod !== 'all' ? 'No transactions match your filters.' : "You haven't made any payments yet."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                <tr>
                  <th className="px-8 py-5">Invoice</th>
                  <th className="px-8 py-5">Method</th>
                  <th className="px-8 py-5">Transaction ID</th>
                  <th className="px-8 py-5 text-right">Amount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(payment => {
                  const method = METHOD_META[payment.method] || METHOD_META.other;
                  const MethodIcon = method.icon;
                  return (
                    <tr 
                      key={payment._id} 
                      className="hover:bg-indigo-50/50 transition-all group cursor-pointer active:scale-[0.99] origin-center"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Receipt className="w-3 h-3 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-xs uppercase tracking-tight">
                              {payment.invoice?.invoiceNumber || 'N/A'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">Invoice Total: ₹{payment.invoice?.total?.toLocaleString() || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${method.bg}`}>
                            <MethodIcon className={`w-3.5 h-3.5 ${method.color}`} />
                          </div>
                          <p className="font-black text-slate-700 text-xs tracking-tighter uppercase">{method.label}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-mono text-[9px] text-slate-400 bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                          {payment.transactionId || 'N/A'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-2xl font-black tracking-tighter italic ${payment.status === 'completed' ? 'text-indigo-600' : 'text-slate-400 opacity-50'}`}>
                          ₹{payment.amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <StatusChip status={payment.status} />
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-slate-700 uppercase">
                          {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy') : '—'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {payment.paidAt ? format(new Date(payment.paidAt), 'hh:mm a') : ''}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Showing {filtered.length} of {payments.length} transactions
            </p>
            <p className="text-[10px] font-black text-slate-400">
              Total Filtered: <span className="text-slate-900">₹{filtered.reduce((a, p) => a + p.amount, 0).toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)}
        title="Transaction Particulars"
      >
        {selectedPayment && (
          <div className="space-y-8 py-4">
            <div className="text-center pb-8 border-b border-slate-100">
              <div className={`w-20 h-20 rounded-[32px] mx-auto mb-6 flex items-center justify-center shadow-2xl ${METHOD_META[selectedPayment.method]?.bg || 'bg-slate-100'}`}>
                {React.createElement(METHOD_META[selectedPayment.method]?.icon || Landmark, { className: `w-10 h-10 ${METHOD_META[selectedPayment.method]?.color || 'text-slate-600'}` })}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Total Amount Processed</p>
              <h2 className="text-6xl font-black tracking-tighter italic text-slate-900">₹{selectedPayment.amount.toLocaleString()}</h2>
              <div className="mt-6 flex justify-center">
                <StatusChip status={selectedPayment.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-8">
              <DetailItem label="Transaction ID" icon={Smartphone}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 truncate max-w-[140px]">
                    {selectedPayment.transactionId}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(selectedPayment.transactionId || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </DetailItem>

              <DetailItem label="Payment Method" icon={CreditCard}>
                <p className="font-black text-slate-800 text-sm">{METHOD_META[selectedPayment.method]?.label || 'Standard'}</p>
              </DetailItem>

              <DetailItem label="Processing Date" icon={Calendar}>
                <p className="font-black text-slate-800 text-sm">
                  {format(new Date(selectedPayment.paidAt), 'MMMM d, yyyy')}
                </p>
                <p className="text-[10px] font-bold text-slate-400">{format(new Date(selectedPayment.paidAt), 'hh:mm:ss a')}</p>
              </DetailItem>

              <DetailItem label="Associated Invoice" icon={Receipt}>
                <p className="font-black text-indigo-600 text-sm uppercase underline underline-offset-4 decoration-2 decoration-indigo-200 cursor-pointer">
                  {selectedPayment.invoice?.invoiceNumber || 'N/A'}
                </p>
              </DetailItem>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98]"
              >
                Close Particulars
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
