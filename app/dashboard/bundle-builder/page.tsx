'use client';

import React, { useState } from 'react';
import { Package, Check, ArrowRight, DollarSign, BarChart3, Shield, Database } from 'lucide-react';
import { PageHeader } from '@/components/SharedUI';

// 1. Sample Plans Data
const PREDETERMINED_PLANS = [
  // Hosting
  { id: 'h1', name: 'Starter Hosting', price: 15, category: 'hosting', description: 'Perfect for small blogs' },
  { id: 'h2', name: 'Pro Hosting', price: 45, category: 'hosting', description: 'High performance for SaaS' },
  { id: 'h3', name: 'Enterprise Hosting', price: 120, category: 'hosting', description: 'Dedicated resources & SLA' },
  
  // Analytics
  { id: 'a1', name: 'Basic Analytics', price: 10, category: 'analytics', description: '30-day data retention' },
  { id: 'a2', name: 'Advanced Analytics', price: 40, category: 'analytics', description: '1-year retention & heatmaps' },
  
  // Security
  { id: 's1', name: 'Standard Security', price: 5, category: 'security', description: 'Basic SSL & daily scans' },
  { id: 's2', name: 'Advanced Security', price: 25, category: 'security', description: 'WAF & DDoS protection' },
  
  // CRM
  { id: 'c1', name: 'CRM Lite', price: 20, category: 'crm', description: 'Up to 1,000 contacts' },
  { id: 'c2', name: 'CRM Pro', price: 60, category: 'crm', description: 'Unlimited contacts & automation' },
];

interface Plan {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'hosting': return <Database className="w-5 h-5" />;
    case 'analytics': return <BarChart3 className="w-5 h-5" />;
    case 'security': return <Shield className="w-5 h-5" />;
    case 'crm': return <Package className="w-5 h-5" />;
    default: return <Package className="w-5 h-5" />;
  }
};

export default function BundleBuilderPage() {
  // 3. State Management
  const [selectedPlans, setSelectedPlans] = useState<Plan[]>([]);

  // 8. Core Function for unique category selection
  const handleSelect = (plan: Plan) => {
    setSelectedPlans((prev) => {
      // Remove any previously selected plan in the same category
      const filtered = prev.filter(p => p.category !== plan.category);
      // If the exact same plan was clicked, just deselect it (toggle off)
      if (prev.some(p => p.id === plan.id)) {
        return filtered;
      }
      // Otherwise, add the newly selected plan
      return [...filtered, plan];
    });
  };

  // Group plans by category to render them in sections
  const groupedPlans = PREDETERMINED_PLANS.reduce((acc, plan) => {
    (acc[plan.category] = acc[plan.category] || []).push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  // 7. Total Calculation
  const totalPrice = selectedPlans.reduce((sum, plan) => sum + plan.price, 0);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <PageHeader 
        title="Custom Bundle Builder" 
        description="Select ONE plan per category to craft your perfect service bundle." 
      />

      {/* 4. UI Layout: Two-column layout */ }
      <div className="flex flex-col lg:flex-row gap-8 mt-6 flex-1 overflow-hidden">
        
        {/* LEFT -> Plan cards grid */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10 custom-scrollbar">
          {Object.entries(groupedPlans).map(([category, plans]) => (
            <div key={category}>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {getCategoryIcon(category)}
                {category}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-wrap">
                {plans.map((plan) => {
                  const isSelected = selectedPlans.some(p => p.id === plan.id);
                  
                  return (
                    <div 
                      key={plan.id}
                      onClick={() => handleSelect(plan)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group ${
                        isSelected 
                          ? 'border-primary-500 shadow-md shadow-primary-500/20' 
                          : 'hover:border-primary-400/50 shadow-sm'
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? 'var(--primary-color-opacity-10, rgba(79, 70, 229, 0.05))' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--primary-color, #4f46e5)' : 'var(--border-primary)'
                      }}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-12 h-12 flex justify-end items-start p-2" style={{ backgroundColor: 'var(--primary-color, #4f46e5)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}>
                          <Check className="w-4 h-4 text-white ml-2 mb-2" />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{plan.name}</h4>
                      </div>
                      
                      <p className="text-sm mb-6 flex-1" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
                      
                      <div className="flex items-end justify-between mt-auto">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>${plan.price}</span>
                          <span className="text-xs font-semibold ml-1 uppercase" style={{ color: 'var(--text-tertiary)' }}>/mo</span>
                        </div>
                        
                        <button 
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                            isSelected 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                          }`}
                          style={!isSelected ? { color: 'var(--text-primary)' } : {}}
                        >
                          {isSelected ? 'Selected' : 'Add to Bundle'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT -> Bundle Summary Panel */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="sticky top-0 rounded-2xl border p-6 shadow-sm flex flex-col h-[calc(100vh-140px)]" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            
            <div className="mb-6 border-b pb-4" style={{ borderColor: 'var(--border-secondary)' }}>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Package className="w-6 h-6 text-primary-500" />
                Bundle Summary
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review your selected packages</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar mb-6 pr-2">
              {selectedPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-60">
                  <Package className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No plans selected</p>
                  <p className="text-xs max-w-[80%]" style={{ color: 'var(--text-tertiary)' }}>Select items from the left to build your bundle.</p>
                </div>
              ) : (
                selectedPlans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center p-3 rounded-lg border animate-fade-in" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">{plan.category}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                    </div>
                    <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>${plan.price}</span>
                  </div>
                ))
              )}
            </div>

            {/* Total Footer */}
            <div className="mt-auto border-t pt-5" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="flex justify-between items-end mb-6">
                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Estimated Total</span>
                <div className="flex items-baseline">
                  <span className="text-3xl font-black text-primary-500">${totalPrice}</span>
                  <span className="text-sm font-semibold ml-1 uppercase" style={{ color: 'var(--text-tertiary)' }}>/mo</span>
                </div>
              </div>
              
              <button 
                disabled={selectedPlans.length === 0}
                className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={selectedPlans.length > 0 ? { backgroundColor: 'var(--primary-color, #4f46e5)' } : { backgroundColor: 'var(--border-primary)', color: 'var(--text-tertiary)', boxShadow: 'none' }}
              >
                Checkout Bundle <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
