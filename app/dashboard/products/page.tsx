'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Plus, Search, Package, Edit2, Trash2, 
  ChevronRight, MoreVertical, Layers, Filter,
  ArrowUpDown, CheckSquare, Square
} from 'lucide-react';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  variants: any[];
  recurringPlans: any[];
  createdAt: string;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'internal';

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in flex flex-col h-full max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Product Intelligence" 
        description="Registry of all protocols, variants, and recurring billing arrangements." 
        action={
          <div className="flex gap-3">
            {selectedIds.length > 0 && canEdit && (
              <button 
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-rose-500/10 text-rose-500 text-sm font-black border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:shadow-rose-500/20">
                <Trash2 className="w-4 h-4" /> Finalize Deletion ({selectedIds.length})
              </button>
            )}
            {canEdit && (
              <button 
                onClick={() => router.push('/dashboard/products/new')}
                className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-105 active:scale-95 text-white text-sm font-black shadow-2xl shadow-indigo-500/30 transition-all">
                <Plus className="w-4 h-4" strokeWidth={3} /> Register New Protocol
              </button>
            )}
          </div>
        } 
      />

      {/* 🚀 Admin KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Catalog', value: products.length, icon: Package, color: 'indigo' },
          { label: 'Revenue Velocity (Avg)', value: `₹${Math.round(products.reduce((acc, p) => acc + (p.salesPrice || 0), 0) / (products.length || 1)).toLocaleString()}`, icon: ArrowUpDown, color: 'emerald' },
          { label: 'Variant Multiplier', value: products.reduce((acc, p) => acc + (p.variants?.length || 0), 0), icon: Layers, color: 'violet' },
          { label: 'Active In-Market', value: products.length > 0 ? 'Optimal' : 'Draft', icon: CheckSquare, color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none group hover:border-indigo-500/20 transition-all">
            <div className="flex items-center justify-between mb-3 text-slate-400 group-hover:text-indigo-400 transition-colors">
              <stat.icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border bg-white border-slate-200 shadow-2xl shadow-indigo-900/10 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/80">
          <div className="flex items-center gap-4">
             <button onClick={toggleSelectAll} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                {selectedIds.length === products.length && products.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-400" />}
             </button>
             <span className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em]">
               {selectedIds.length} Protocols Selected
             </span>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search the protocol catalog..." value={search} onChange={e => setSearch(e.target.value)} 
              className="w-full pl-12 pr-6 py-3.5 rounded-full border text-sm outline-none transition-all border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-900 placeholder:text-slate-400" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="Empty Inventory" description="Your product catalog is currently empty." />
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-slate-500">
                  <th className="w-16 px-6 py-6"></th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Product Registry</th>
                  <th className="px-4 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Type</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">Market Price</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">Cost Basis</th>
                  <th className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Variants</th>
                  <th className="px-6 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p._id} onClick={() => router.push(`/dashboard/products/${p._id}`)} className="group cursor-pointer transition-all hover:bg-indigo-50">
                    <td className="px-6 py-6" onClick={e => { e.stopPropagation(); toggleSelect(p._id); }}>
                       {selectedIds.includes(p._id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />}
                    </td>
                    <td className="px-6 py-6">
                      <div className="font-black text-slate-900 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Layers className="w-5 h-5 text-indigo-600" />
                          </div>
                         <span className="text-sm tracking-tight">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-black text-slate-500 uppercase text-[9px] tracking-widest border border-slate-200">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-black text-slate-900 text-right text-base tracking-tighter">
                      ₹{(p.salesPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-6 font-bold text-slate-400 text-right text-sm">
                      ₹{(p.costPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {p.variants?.length || 0} OPTIONS
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${p._id}/edit`) }} className="p-2.5 hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/20"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={(e) => handleDelete(p._id, e)} className="p-2.5 hover:bg-rose-600 hover:text-white rounded-xl text-rose-500 transition-all shadow-lg hover:shadow-rose-500/20"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
