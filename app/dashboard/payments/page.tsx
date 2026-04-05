'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, DollarSign, CreditCard, Building, Banknote, Smartphone } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';

interface Payment {
  _id: string;
  invoice: { _id: string; invoiceNumber: string; total: number };
  customer: { _id: string; name: string; email: string };
  amount: number;
  method: string;
  transactionId: string;
  status: string;
  paidAt: string;
  createdAt: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  total: number;
  customer: { _id: string; name: string };
  status: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    invoice: '', amount: 0, method: 'bank_transfer', transactionId: '', notes: '',
  });

  const canEdit = user?.role === 'admin' || user?.role === 'internal';

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const [payRes, invRes] = await Promise.all([
      fetch(`/api/payments?${params}`),
      canEdit ? fetch('/api/invoices?status=confirmed') : Promise.resolve(null),
    ]);
    const payData = await payRes.json();
    setPayments(payData.payments || []);
    if (invRes) {
      const invData = await invRes.json();
      setUnpaidInvoices(invData.invoices || []);
    }
    setLoading(false);
  }, [statusFilter, canEdit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    fetchData();
  };

  const openCreate = () => {
    if (unpaidInvoices.length > 0) {
      setForm({ invoice: unpaidInvoices[0]._id, amount: unpaidInvoices[0].total, method: 'bank_transfer', transactionId: '', notes: '' });
    }
    setModalOpen(true);
  };

  const methodIcons: Record<string, React.ElementType> = {
    credit_card: CreditCard,
    bank_transfer: Building,
    cash: Banknote,
    upi: Smartphone,
    other: DollarSign,
  };

  const filtered = payments.filter(p =>
    !search || p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track all payment transactions"
        action={canEdit && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/25">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        )}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="No payments" description="Record a payment against an invoice" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Invoice', 'Customer', 'Amount', 'Method', 'Transaction ID', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment, i) => {
                  const MethodIcon = methodIcons[payment.method] || DollarSign;
                  return (
                    <tr key={payment._id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                      <td className="px-4 py-3 font-mono text-xs">
                        <button 
                          onClick={() => payment.invoice?._id && router.push(`/dashboard/invoices/${payment.invoice._id}`)}
                          className="text-indigo-600 font-bold hover:underline hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          {payment.invoice?.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{payment.customer?.name}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-500">₹{payment.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MethodIcon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="capitalize text-xs" style={{ color: 'var(--text-secondary)' }}>{payment.method.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{payment.transactionId || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(payment.paidAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Invoice</label>
            <select value={form.invoice} onChange={e => {
              const inv = unpaidInvoices.find(i => i._id === e.target.value);
              setForm({ ...form, invoice: e.target.value, amount: inv?.total || 0 });
            }} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
              <option value="">Select invoice</option>
              {unpaidInvoices.map(inv => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} - {inv.customer?.name} (₹{inv.total.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} min={0} step={0.01} required
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Method</label>
              <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Transaction ID</label>
            <input type="text" value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              placeholder="Optional transaction reference" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
