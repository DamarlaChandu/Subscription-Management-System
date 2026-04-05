'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Printer, Download, Receipt, 
  MapPin, Phone, Mail, Building, Globe, Zap,
  CheckCircle2, Clock, AlertCircle, CreditCard, BadgeCheck
} from 'lucide-react';
import { LoadingSpinner, Card } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

export default function InvoiceReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.invoice) setInvoice(data.invoice);
        else setError(data.message || 'Invoice Registry Error');
        setLoading(false);
      })
      .catch(err => {
        setError('Network Protocol Failure');
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
     <div className="p-20 flex flex-col items-center gap-6 animate-pulse">
        <LoadingSpinner />
        <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Initializing Receipt Assets...</p>
     </div>
  );

  if (error || !invoice) return (
    <div className="max-w-xl mx-auto p-20 text-center space-y-6">
       <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500" />
       </div>
       <h2 className="text-2xl font-bold text-slate-900">Entity Not Found</h2>
       <p className="text-slate-500 font-medium">{error || 'The requested settlement record does not exist.'}</p>
       <button onClick={() => router.back()} className="px-8 py-3 bg-slate-950 text-white rounded-xl font-bold text-sm">Return to Command Center</button>
    </div>
  );

  const subtotal = invoice.subtotal || 0;
  const tax = invoice.taxAmount || 0;
  const total = invoice.total || 0;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in relative">
      
      {/* 🧭 Strategic Top Bar */}
      <div className="flex items-center justify-between mb-10 print:hidden">
         <button 
           onClick={() => router.back()}
           className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
         >
            <ArrowLeft className="w-4 h-4" /> Back to Payments
         </button>
         <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
            >
               <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
               <Download className="w-4 h-4" /> Save as PDF
            </button>
         </div>
      </div>

      {/* 🧾 Principal Receipt Canvas */}
      <div id="receipt-canvas" className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:shadow-none print:border-none">
         
         {/* 1. Header Branding */}
         <div className="p-12 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                     <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">SubSaaS</h1>
                     <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Lifecycle Engine v4.0</p>
                  </div>
               </div>
               <div className="space-y-1 text-xs font-medium text-slate-500">
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> 101 Innovation Blvd, Silicon Valley, CA</p>
                  <p className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> support@subsaas.com • subsaas.io</p>
               </div>
            </div>

            <div className="text-right space-y-4">
               <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Settlement Status</p>
                  <StatusBadge status={invoice.status} />
               </div>
               <div>
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tighter uppercase">{invoice.invoiceNumber}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Date: {format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}</p>
               </div>
            </div>
         </div>

         {/* 2. Entity Summary (Customer Details) */}
         <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Bill From</h3>
               <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">SubSaaS Financial Operations</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Internal Billing ID: ENT-772-01</p>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-emerald-600">
                     <CheckCircle2 className="w-4 h-4" /> Verified Settlement Provider
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
               <div className="p-6 rounded-3xl bg-indigo-50/30 border border-indigo-100">
                  <p className="text-sm font-bold text-slate-900">{invoice.customer?.name || 'Authorized Entity'}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{invoice.customer?.email}</p>
                  {invoice.customer?.address && (
                     <p className="text-xs font-medium text-slate-400 mt-2 italic leading-relaxed">{invoice.customer.address}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center gap-2 text-xs font-bold text-indigo-600">
                     <Building className="w-4 h-4" /> Enterprise Node Unit
                  </div>
               </div>
            </div>
         </div>

         {/* 3. Transaction Particulars (Items Table) */}
         <div className="p-12 overflow-x-auto">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Service Integration Ledger</h3>
            <table className="w-full">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                     <th className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                     <th className="py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Val</th>
                     <th className="py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Total Valuation</th>
                  </tr>
               </thead>
               <tbody>
                  {invoice.items?.map((item: any, i: number) => (
                     <tr key={i} className="border-b border-slate-50">
                        <td className="py-6">
                           <p className="text-sm font-bold text-slate-900">{item.description}</p>
                           <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Digital Service Integration</p>
                        </td>
                        <td className="py-6 text-center text-sm font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-6 text-right text-sm font-bold text-slate-900">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-6 text-right text-sm font-bold text-indigo-600">₹{item.total.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* 4. Financial Sum (Totals) */}
         <div className="p-12 pb-20 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xs space-y-4">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Payment Metadata</h3>
               <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                     <CreditCard className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing Node</p>
                     <p className="text-xs font-bold text-slate-900">{invoice.paymentMethod || 'Primary Gateway'}</p>
                  </div>
               </div>
               <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                  Note: Values are calculated in real-time. This record represents a finalized lifecycle event in the SubSaaS engine.
               </p>
            </div>

            <div className="w-full md:w-80 space-y-4">
               <div className="space-y-3 py-6 border-b border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-medium text-slate-500">Subtotal</span>
                     <span className="font-bold text-slate-700">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-medium text-slate-500">Platform Tax (18%)</span>
                     <span className="font-bold text-slate-700">₹{tax.toLocaleString()}</span>
                  </div>
               </div>
               <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Settlement</span>
                  <span className="text-4xl font-bold text-slate-900 tracking-tighter italic">₹{total.toLocaleString()}</span>
               </div>
               <div className="mt-8 p-4 bg-indigo-600 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-100">
                  <BadgeCheck className="w-5 h-5 text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Authorized Transaction</span>
               </div>
            </div>
         </div>

      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          #receipt-canvas { border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}


