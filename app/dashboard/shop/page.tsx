'use client';

import React, { useEffect, useState } from 'react';
import { Package, Search, ShoppingBag, ArrowRight, ShoppingCart, Zap, Globe, ShieldCheck, Activity, Target, ChevronRight } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState } from '@/components/SharedUI';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  description: string;
  type: string;
  salesPrice: number;
  isActive: boolean;
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)) || p.type.toLowerCase().includes(q);
    const matchType = typeFilter === 'All' || p.type === typeFilter;
    const matchActive = p.isActive !== false;
    return matchSearch && matchType && matchActive;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-12 pb-20 mt-10 px-4 md:px-0">
      
      {/* 🚀 High-Impact Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-2">
              <Zap className="w-3 h-3 animate-pulse" /> Strategic Acquisition
           </div>
           <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-[0.8] mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Service <br /> <span className="text-indigo-600 italic">Inventory</span>
           </h1>
           <p className="text-sm font-bold text-slate-400 max-w-md">Browse our certified catalog of enterprise-grade solutions and managed services.</p>
        </div>

        <div className="flex flex-col gap-4">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Filter Protocol</p>
           <div className="flex bg-slate-50 p-1.5 rounded-[24px] border border-slate-100 shadow-sm overflow-x-auto">
              {['All', 'digital', 'service', 'physical'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTypeFilter(t)}
                  className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    typeFilter === t ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 🔍 Command Search Terminal */}
      <div className="relative group">
         <div className="absolute inset-0 bg-indigo-600/5 rounded-[32px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
         <div className="relative z-10">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <input 
              className="w-full bg-white border-2 border-slate-50 rounded-[32px] pl-16 pr-8 py-6 font-bold text-lg shadow-xl shadow-slate-200/20 focus:border-indigo-100 transition-all outline-none" 
              placeholder="Query product registry or type..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
         </div>
      </div>

      {/* 📦 Strategic Catalog Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Registry Empty" description="No active nodes match your query protocol. Adjust filters to discover new service paths." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map((product) => (
            <div key={product._id} className="group relative">
               <div className="absolute inset-0 bg-indigo-500/5 rounded-[50px] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
               <Card hover className="p-0 overflow-hidden rounded-[50px] border-2 border-slate-50 group-hover:border-indigo-100 transition-all duration-700 bg-white relative z-10 shadow-xl shadow-slate-400/5">
                 <div className="h-64 relative overflow-hidden bg-slate-950 cursor-pointer" onClick={() => router.push(`/dashboard/shop/${product._id}`)}>
                    {/* Visual Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                    <img 
                      src={`https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80&sig=${product._id}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-1000 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.3em]">
                       {product.type}
                    </div>
                    <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Verified Node
                    </div>
                 </div>

                 <div className="p-10 space-y-6">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                       <p className="text-sm font-bold text-slate-400 line-clamp-2 italic">{product.description || 'Enterprise-grade synchronization and lifecycle governing protocol.'}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Standard Price</p>
                          <p className="text-3xl font-black text-slate-900 italic" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{product.salesPrice?.toLocaleString()}</p>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/shop/${product._id}`); }}
                         className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all duration-500 active:scale-95 relative z-20"
                       >
                          <ChevronRight className="w-6 h-6" />
                       </button>
                    </div>
                 </div>
               </Card>
            </div>
          ))}
        </div>
      )}

      {/* 🔮 Scaling Call-to-Action */}
      <div className="bg-white rounded-[60px] p-12 md:p-16 border-[3px] border-slate-50 shadow-2xl relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <Target className="w-64 h-64" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-24 h-24 rounded-[32px] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-600/30">
               <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-4">
               <h3 className="text-4xl font-black tracking-tighter text-slate-900 italic">Enterprise Compliance.</h3>
               <p className="text-sm font-bold text-slate-400 max-w-2xl italic leading-relaxed">
                  Every product in our registry is verified for maximum synchronization uptime and security. 
                  Need a custom solution for your enterprise cluster? Contact our strategic advisors.
               </p>
            </div>
            <Link href="/dashboard/help" className="md:ml-auto px-10 py-5 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
               Request Custom
            </Link>
         </div>
      </div>
    </div>
  );
}
