'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Package, DollarSign, Layers, Clock, 
  ChevronLeft, Plus, Trash2, Save, 
  Activity, Calendar, CheckCircle, PauseCircle, XCircle
} from 'lucide-react';
import { PageHeader, LoadingSpinner, Card } from '@/components/SharedUI';
import { useAuth } from '@/components/AuthContext';
import { useRouter, useParams } from 'next/navigation';

const TABS = ['General Info', 'Variants', 'Recurring Pricing'] as const;

export default function ProductFormPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const isNew = id === 'new' || !id;
  const isEditing = !isNew && typeof window !== 'undefined' && window.location.pathname.endsWith('/edit');
  const isDetail = !isNew && !isEditing;

  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('General Info');
  const [loading, setLoading] = useState(!isNew);
  const [saveLoading, setSaveLoading] = useState(false);
  const [product, setProduct] = useState<any>({
    name: '', type: 'Service', salesPrice: 0, costPrice: 0,
    variants: [], recurringPlans: []
  });

  const fetchData = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.product) {
         setProduct(data.product);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const method = isEditing || isDetail ? 'PUT' : 'POST';
      const url = isNew ? '/api/products' : `/api/products/${id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) router.push('/dashboard/products');
    } catch (e) { console.error(e); }
    finally { setSaveLoading(false); }
  };

  const addVariant = () => {
    setProduct((prev: any) => ({
      ...prev,
      variants: [...(prev?.variants || []), { attribute: '', value: '', extraPrice: 0 }]
    }));
  };

  const removeVariant = (idx: number) => {
    setProduct((prev: any) => ({
      ...prev,
      variants: (prev?.variants || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const addPlan = () => {
    setProduct((prev: any) => ({
      ...prev,
      recurringPlans: [...(prev?.recurringPlans || []), { 
        planName: '', billingCycle: 'Monthly', price: 0, minQuantity: 1, status: 'Active' 
      }]
    }));
  };

  const removePlan = (idx: number) => {
    setProduct((prev: any) => ({
      ...prev,
      recurringPlans: (prev?.recurringPlans || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateSubDoc = (collection: 'variants' | 'recurringPlans', idx: number, field: string, val: any) => {
    setProduct((prev: any) => {
      const updatedColl = [...(prev?.[collection] || [])];
      updatedColl[idx] = { ...updatedColl[idx], [field]: val };
      return { ...prev, [collection]: updatedColl };
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => router.push('/dashboard/products')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <h1 className="text-2xl font-black">{isNew ? 'New Product' : isEditing ? 'Edit Product' : product?.name || 'Protocol Registry'}</h1>
        </div>
        <div className="flex gap-2">
               {!isDetail && (
                  <button onClick={handleSave} disabled={saveLoading} className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95">
                     <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Product'}
                  </button>
               )}
            {isDetail && (
               <button onClick={() => router.push(`/dashboard/products/${id}/edit`)} className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-sm">
                  Edit Details
               </button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 scrollbar-hide overflow-x-auto">
               {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${
                     activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}>{tab}</button>
               ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
         {activeTab === 'General Info' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">Basic Info</h3>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Product Name</label>
                       <input disabled={isDetail} value={product.name || ''} onChange={e => setProduct({...product, name: e.target.value})} type="text" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                    </div>
                    <div>
                       <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Product Type</label>
                       <select disabled={isDetail} value={product.type || 'Service'} onChange={e => setProduct({...product, type: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold">
                          <option>Physical</option>
                          <option>Digital</option>
                          <option>Service</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">Pricing Engine</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                       <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Sales Price</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                          <input disabled={isDetail} value={product.salesPrice || 0} onChange={e => setProduct({...product, salesPrice: Number(e.target.value)})} type="number" className="w-full p-4 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 font-black" />
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Cost Price</label>
                       <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                          <input disabled={isDetail} value={product.costPrice || 0} onChange={e => setProduct({...product, costPrice: Number(e.target.value)})} type="number" className="w-full p-4 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 font-black" />
                       </div>
                    </div>
                 </div>
                 <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30">
                    <p className="text-xs font-bold text-indigo-600">Calculated Margin: ₹{(product.salesPrice || 0) - (product.costPrice || 0)}</p>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'Variants' && (
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">Variant Options</h3>
                 {!isDetail && (
                    <button onClick={addVariant} className="text-xs font-black text-indigo-600 hover:scale-105 transition-transform flex items-center gap-1">
                       <Plus className="w-4 h-4" /> Add Variant
                    </button>
                 )}
              </div>

              <div className="space-y-4">
                 {(product.variants || []).map((v: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all">
                       <div className="flex-1 grid grid-cols-3 gap-4">
                          <input disabled={isDetail} placeholder="Attribute (e.g., Color)" value={v.attribute || ''} onChange={e => updateSubDoc('variants', i, 'attribute', e.target.value)} className="bg-transparent font-bold text-sm outline-none" />
                          <input disabled={isDetail} placeholder="Value (e.g., Red)" value={v.value || ''} onChange={e => updateSubDoc('variants', i, 'value', e.target.value)} className="bg-transparent font-bold text-sm outline-none" />
                          <div className="flex items-center gap-2">
                             <span className="text-slate-300 font-bold">+₹</span>
                             <input disabled={isDetail} type="number" placeholder="Extra" value={v.extraPrice || 0} onChange={e => updateSubDoc('variants', i, 'extraPrice', Number(e.target.value))} className="bg-transparent font-black text-sm outline-none w-full" />
                          </div>
                       </div>
                       {!isDetail && <button onClick={() => removeVariant(i)} className="p-2 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                 ))}
                 {(product.variants || []).length === 0 && <p className="text-center py-10 text-slate-400 font-medium">This product has no variants.</p>}
              </div>
           </div>
         )}

         {activeTab === 'Recurring Pricing' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">Subscription Plans</h3>
                  {!isDetail && (
                     <button onClick={addPlan} className="text-xs font-black text-indigo-600 hover:scale-105 transition-transform flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Recurring Plan
                     </button>
                  )}
               </div>

               <div className="space-y-4">
                  {(product.recurringPlans || []).map((plan: any, i: number) => (
                     <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 relative group">
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                           <div className="sm:col-span-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1">Plan Name</label>
                              <input disabled={isDetail} placeholder="Basic Monthly" value={plan.planName || ''} onChange={e => updateSubDoc('recurringPlans', i, 'planName', e.target.value)} className="bg-transparent font-bold text-sm outline-none w-full" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1">Cycle</label>
                              <select disabled={isDetail} value={plan.billingCycle || 'Monthly'} onChange={e => updateSubDoc('recurringPlans', i, 'billingCycle', e.target.value)} className="bg-transparent font-black text-sm outline-none w-full appearance-none">
                                 <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1 ml-1">Base Price</label>
                              <div className="flex items-center gap-1">
                                 <span className="text-slate-300 font-bold">₹</span>
                                 <input disabled={isDetail} type="number" value={plan.price || 0} onChange={e => updateSubDoc('recurringPlans', i, 'price', Number(e.target.value))} className="bg-transparent font-black text-sm outline-none w-full" />
                              </div>
                           </div>
                           <div className="flex items-center justify-end">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                 plan.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                 plan.status === 'Paused' ? 'bg-amber-50 text-amber-600' :
                                 'bg-slate-100 text-slate-500'
                              }`}>{plan.status || 'Active'}</span>
                           </div>
                        </div>
                        {!isDetail && <button onClick={() => removePlan(i)} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"><Trash2 className="w-4 h-4" /></button>}
                        {isDetail && <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                           <button className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1 hover:bg-amber-50 px-2 py-1 rounded transition-colors"><PauseCircle className="w-3 h-3" /> Suspend</button>
                           <button className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded transition-colors"><XCircle className="w-3 h-3" /> Retire</button>
                        </div>}
                     </div>
                  ))}
                  {(product.recurringPlans || []).length === 0 && <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl"><p className="text-slate-400 font-bold italic">No recurring arrangements configured for this catalog item.</p></div>}
               </div>
            </div>
         )}
      </div>

    </div>
  );
}
