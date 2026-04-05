'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { PageHeader, Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';

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

export default function MyInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/invoices?customer=${user.id}`)
      .then(r => r.json())
      .then(data => { setInvoices(data.invoices || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Invoices" description="View your billing history" />

      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices" description="You don't have any invoices yet" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Invoice #', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv._id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderBottom: i < invoices.length - 1 ? '1px solid var(--border-secondary)' : 'none' }}>
                    <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>₹{inv.total.toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailInvoice(inv)} className="p-1.5 rounded-lg hover:bg-primary-500/10 text-primary-500">
                        <Eye className="w-4 h-4" />
                      </button>
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

            <div className="flex justify-end">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span><span>₹{detailInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Tax ({detailInvoice.taxRate}%)</span><span>₹{detailInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}>
                  <span>Total</span><span>₹{detailInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
