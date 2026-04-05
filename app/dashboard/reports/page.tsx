'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { PageHeader, Card, LoadingSpinner } from '@/components/SharedUI';
import { 
  TrendingUp, TrendingDown, Users, CreditCard, 
  Target, Zap, Calendar, Download, Filter,
  ArrowUpRight, ArrowDownRight, Info, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';

const ReportCharts = lazy(() => import('@/components/ReportCharts'));

interface DashboardData {
  stats: {
    totalRevenue: number;
    activeSubscriptions: number;
    totalCustomers: number;
    overdueInvoices: number;
    forecastedRevenue: number;
    totalSubscriptions: number;
    totalProducts: number;
  };
  health: { healthy: number; warning: number; highRisk: number };
  monthlyRevenue: Array<{ _id: string; revenue: number; count: number }>;
  statusDistribution: Array<{ _id: string; count: number }>;
  typeDistribution: Array<{ _id: string; count: number }>;
  mrrByType: Array<{ _id: string; total: number }>;
  topPlans: Array<{ count: number; plan: { name: string; price: number } }>;
  insights: Array<{ type: 'positive' | 'negative' | 'info' | 'warning'; message: string }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Generating deep-intelligence reports..." />;
  if (!data) return <div className="text-center py-20 text-slate-500">No analytical data available at this time.</div>;

  const revChange = 12.5; // Mock logic for display

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Business Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time revenue monitoring and lifecycle health orchestration.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all">
            <Calendar className="w-4 h-4" /> Last 6 Months
          </button>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Gross Revenue" 
          value={`₹${data.stats.totalRevenue.toLocaleString()}`} 
          trend="+14.2%" 
          positive={true} 
          icon={TrendingUp} 
          color="indigo" 
        />
        <MetricCard 
          title="Active Subscriptions" 
          value={data.stats.activeSubscriptions} 
          trend="+32" 
          positive={true} 
          icon={Zap} 
          color="emerald" 
        />
        <MetricCard 
          title="Revenue Forecast" 
          value={`₹${data.stats.forecastedRevenue.toLocaleString()}`} 
          trend="Next 30d" 
          positive={null} 
          icon={Target} 
          color="rose" 
        />
        <MetricCard 
          title="Overdue Debt" 
          value={`₹${(data.stats.overdueInvoices * 500).toLocaleString()}`} 
          trend="- ₹2,400" 
          positive={false} 
          icon={AlertTriangle} 
          color="amber" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Engine (Charts) */}
        <div className="lg:col-span-2 space-y-8">
           <Suspense fallback={<LoadingSpinner text="Visualizing datasets..." />}>
              <ReportCharts
                monthlyRevenue={data.monthlyRevenue}
                health={data.health}
                statusDistribution={data.statusDistribution}
                typeDistribution={data.typeDistribution}
                mrrByType={data.mrrByType}
                topPlans={data.topPlans}
              />
           </Suspense>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          <Card className="overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Zap className="w-20 h-20" /></div>
            <div className="p-6">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-indigo-500" /> Smart Insights
               </h3>
               <div className="space-y-4">
                  {data.insights.map((insight, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl flex gap-3 shadow-sm border ${
                      insight.type === 'positive' ? 'bg-emerald-50 border-emerald-100' :
                      insight.type === 'negative' ? 'bg-rose-50 border-rose-100' :
                      insight.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex-shrink-0 mt-1">
                        {insight.type === 'positive' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {insight.type === 'negative' && <XCircle className="w-4 h-4 text-rose-600" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        {insight.type === 'info' && <Info className="w-4 h-4 text-slate-600" />}
                      </div>
                      <p className={`text-xs font-bold leading-relaxed ${
                        insight.type === 'positive' ? 'text-emerald-800' :
                        insight.type === 'negative' ? 'text-rose-800' :
                        insight.type === 'warning' ? 'text-amber-800' :
                        'text-slate-800'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  ))}
                  {data.insights.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Processing real-time metrics... insights will appear shortly.</p>
                  )}
               </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 mt-4">
              <button className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors">
                 Get Full Audit Log
              </button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                 <Target className="w-4 h-4 text-rose-500" /> Plan Performance
              </h3>
              <div className="space-y-5">
                {data.topPlans.map((tp, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">{idx+1}</div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{tp.plan.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{tp.count} subscriptions</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-900">₹{(tp.count * tp.plan.price).toLocaleString()}</p>
                       <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (tp.count/data.stats.activeSubscriptions)*100)}%` }}></div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, positive, icon: Icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-500 shadow-indigo-500/20',
    emerald: 'bg-emerald-500 shadow-emerald-500/20',
    rose: 'bg-rose-500 shadow-rose-500/20',
    amber: 'bg-amber-500 shadow-amber-500/20',
  };

  return (
    <Card hover className="relative overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-xl text-white ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
          {positive !== null && (
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
              positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
          {positive === null && (
            <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
              {trend}
            </div>
          )}
        </div>
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
      <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
    </Card>
  );
}
