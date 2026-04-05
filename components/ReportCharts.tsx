'use client';

import React from 'react';
import { Card } from '@/components/SharedUI';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

interface ReportChartsProps {
  monthlyRevenue: Array<{ _id: string; revenue: number; count: number }>;
  health: { healthy: number; warning: number; highRisk: number };
  statusDistribution: Array<{ _id: string; count: number }>;
  typeDistribution: Array<{ _id: string; count: number }>;
  mrrByType: Array<{ _id: string; total: number }>;
  topPlans: Array<{ count: number; plan: { name: string; price: number } }>;
}

export default function ReportCharts({
  monthlyRevenue, health, statusDistribution, typeDistribution, mrrByType, topPlans
}: ReportChartsProps) {
  const revenueData = monthlyRevenue.map(m => ({
    month: new Date(m._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: Math.round(m.revenue),
    transactions: m.count,
    avg: m.count > 0 ? Math.round(m.revenue / m.count) : 0,
  }));

  const healthData = [
    { name: 'Healthy', value: health.healthy, color: '#10b981' },
    { name: 'Warning', value: health.warning, color: '#f59e0b' },
    { name: 'High Risk', value: health.highRisk, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const statusData = statusDistribution.map((s, i) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    count: s.count,
    color: COLORS[i % COLORS.length],
  }));

  const typeData = (typeDistribution || []).map((t, i) => ({
    name: t._id,
    count: t.count,
    color: COLORS[(i + 2) % COLORS.length],
  }));

  const mrrTypeData = (mrrByType || []).map((t, i) => ({
    name: t._id,
    total: t.total,
    color: COLORS[(i + 4) % COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Primary Revenue Engine */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="text-xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>Revenue Performance</h3>
             <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">Monthly aggregation (in INR)</p>
           </div>
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> REVENUE
             </div>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[10px] font-black text-sky-600">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" /> TRANSACATIONS
             </div>
           </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={v => `₹${v/1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px',
                  fontWeight: 800,
                  fontSize: '12px'
                }} 
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              <Area yAxisId="right" type="monotone" dataKey="transactions" stroke="#38bdf8" fillOpacity={1} fill="url(#colorTransactions)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Subscription Health Distribution</h3>
          <div className="h-64 flex items-center justify-center relative">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-black text-slate-900 leading-none">{healthData.reduce((p,c)=>p+c.value,0)}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Plans</p>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {healthData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                </div>
             ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Lifecycle State Breakdown</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={5} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                   <Tooltip 
                     cursor={{ fill: 'transparent' }} 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={24}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscription Type Mix */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">Subscription Type Mix</h3>
            <span className="text-[10px] font-black underline decoration-indigo-500 underline-offset-4 tracking-tighter text-indigo-600">Volume distribution</span>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="count"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by Type */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">Revenue by Model</h3>
            <span className="text-[10px] font-black underline decoration-rose-500 underline-offset-4 tracking-tighter text-rose-600">MRR Share (INR)</span>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrTypeData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} width={80} />
                   <Tooltip 
                     cursor={{ fill: '#f8fafc' }} 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     formatter={(value: any) => [`₹${value?.toLocaleString()}`, 'MRR']}
                   />
                   <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={24}>
                      {mrrTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
