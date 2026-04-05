'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, FileText, DollarSign, Eye, QrCode, CreditCard, Copy, Check } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  subscription: { _id: string; subscriptionId: string };
  customer: { _id: string; name: string; email: string };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: string;
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [upiSettings, setUpiSettings] = useState({ id: '', name: '' });
  const [copied, setCopied] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'none' | 'upi' | 'card'>('none');

  const canEdit = user?.role === 'admin' || user?.role === 'internal';

  const fetchInvoices = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices || []);
    setLoading(false);
  }, [statusFilter]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const id = data.settings?.find((s: any) => s.key === 'upi_id')?.value || 'merchant@upi';
      const name = data.settings?.find((s: any) => s.key === 'upi_merchant_name')?.value || 'SubSaaS Inc.';
      setUpiSettings({ id, name });
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  }, []);

  useEffect(() => { 
    fetchInvoices(); 
    fetchSettings();
  }, [fetchInvoices, fetchSettings]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchInvoices();
  };

  const filtered = invoices.filter(inv =>
    !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Invoices" description="Track and manage all invoices" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search by invoice # or customer..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices" description="Invoices are auto-generated when subscriptions are created" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Invoice #', 'Customer', 'Subtotal', 'Tax', 'Discount', 'Total', 'Status', 'Due Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv._id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{inv.customer?.name}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>₹{inv.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>₹{inv.taxAmount.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {inv.discountAmount > 0 ? `-$${inv.discountAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>₹{inv.total.toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetailInvoice(inv)} className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-500">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && inv.status === 'draft' && (
                          <button onClick={() => updateStatus(inv._id, 'confirmed')} className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-500">Confirm</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invoice Detail Modal */}
      <Modal isOpen={!!detailInvoice} onClose={() => setDetailInvoice(null)} title="Invoice Details" size="lg">
        {detailInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Invoice Number</p>
                <p className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{detailInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Status</p>
                <StatusBadge status={detailInvoice.status} size="md" />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Customer</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{detailInvoice.customer?.name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Due Date</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(detailInvoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th className="px-4 py-2 text-left text-xs" style={{ color: 'var(--text-tertiary)' }}>Description</th>
                    <th className="px-4 py-2 text-right text-xs" style={{ color: 'var(--text-tertiary)' }}>Qty</th>
                    <th className="px-4 py-2 text-right text-xs" style={{ color: 'var(--text-tertiary)' }}>Price</th>
                    <th className="px-4 py-2 text-right text-xs" style={{ color: 'var(--text-tertiary)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInvoice.items.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-secondary)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{item.description}</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-10 items-start">
              {/* Payment Section (for Customers) */}
              {user?.role === 'customer' && detailInvoice.status !== 'paid' && (
                <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/10">
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> Instant Payment
                  </h4>
                  
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setPaymentMode('upi')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${paymentMode === 'upi' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/10'}`}
                    >
                      <QrCode className="w-4 h-4" /> UPI QR
                    </button>
                    <button 
                      onClick={() => setPaymentMode('card')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${paymentMode === 'card' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/10'}`}
                    >
                      <CreditCard className="w-4 h-4" /> Online
                    </button>
                  </div>

                  {paymentMode === 'upi' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-white p-4 rounded-2xl shadow-xl w-fit mx-auto border border-slate-100 mb-4">
                        <QRCodeSVG 
                          value={`upi://pay?pa=${upiSettings.id}&pn=${upiSettings.name}&am=${detailInvoice.total}&cu=INR&tn=Invoice ${detailInvoice.invoiceNumber}`}
                          size={160}
                          level="H"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">UPI ID</p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(upiSettings.id);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs"
                        >
                          {upiSettings.id}
                          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 mt-3 italic">Scan using Google Pay, PhonePe, or Paytm</p>
                      </div>
                    </div>
                  )}

                  {paymentMode === 'card' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-6">
                      <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">Pay securely via Credit/Debit card or Netbanking.</p>
                      <button className="mt-4 w-full py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all">
                        Proceed to Checkout
                      </button>
                    </div>
                  )}

                  {paymentMode === 'none' && (
                    <div className="text-center py-8">
                      <p className="text-xs font-bold text-slate-400">Select a payment method above to complete your transaction</p>
                    </div>
                  )}
                </div>
              )}

              <div className="w-64 space-y-2 mt-2">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="font-black">₹{detailInvoice.subtotal.toFixed(2)}</span>
                </div>
                {detailInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-rose-500">
                    <span className="font-bold uppercase tracking-widest">Discount</span>
                    <span className="font-black">-₹{detailInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="font-bold uppercase tracking-widest">Tax ({detailInvoice.taxRate}%)</span>
                  <span className="font-black">₹{detailInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Total Amount</span>
                  <span className="text-2xl font-black tracking-tighter">₹{detailInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
