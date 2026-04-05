'use client';

import React from 'react';
import { Card } from '@/components/SharedUI';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardChartsProps {
  monthlyRevenue: Array<{ _id: string; revenue: number; count: number }>;
  health: { healthy: number; warning: number; highRisk: number };
  statusDistribution: Array<{ _id: string; count: number }>;
  topPlans: Array<{ count: number; plan: { name: string; price: number } }>;
  colors: string[];
}

export default function DashboardCharts({
  monthlyRevenue, health, statusDistribution, topPlans, colors
}: DashboardChartsProps) {
  const chartData = monthlyRevenue.map(m => ({
    month: new Date(m._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: Math.round(m.revenue),
    transactions: m.count,
  }));

  const healthData = [
    { name: 'Healthy', value: health.healthy, color: '#10b981' },
    { name: 'Warning', value: health.warning, color: '#f59e0b' },
    { name: 'High Risk', value: health.highRisk, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const statusData = statusDistribution.map((s, i) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: colors[i % colors.length],
  }));

  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Subscription Health */}
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Subscription Health</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {healthData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Status Distribution & Top Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Plans</h3>
            <div className="space-y-3">
              {topPlans.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: colors[i % colors.length] }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.plan.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>₹{item.plan.price}/mo</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.count} subs</span>
                </div>
              ))}
              {topPlans.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No plan data yet</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
