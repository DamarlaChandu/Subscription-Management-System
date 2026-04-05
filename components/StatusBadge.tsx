'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  quotation: { bg: 'bg-purple-500/10', text: 'text-purple-500', dot: 'bg-purple-500' },
  draft: { bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-500' },
  paused: { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500' },
  'high-risk': { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
  overdue: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
  closed: { bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-500' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-500' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
  refunded: { bg: 'bg-purple-500/10', text: 'text-purple-500', dot: 'bg-purple-500' },
  inactive: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = statusColors[status] || { bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-500' };
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 ₹{sizeClass} font-medium rounded-full ₹{colors.bg} ₹{colors.text} capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ₹{colors.dot}`} />
      {status.replace('-', ' ')}
    </span>
  );
}
