'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '', hover = false, onClick }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition-all duration-200 ${hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, color = 'primary' }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    accent: 'from-accent-500 to-accent-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Card hover>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
            {trend && (
              <p className={`text-xs font-medium ₹{trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ₹{colorMap[color]} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="bg-white rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-20">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{title}</h3>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 group"
          >
            <Loader2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
