'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Wallet, UserPlus, Receipt, ShieldCheck, Clock,
  CreditCard, HelpCircle, Zap, LayoutGrid, Plus, Bell, Box,
  Target, Globe, Siren, ShieldAlert
} from 'lucide-react';
import { Card, LoadingSpinner } from '@/components/SharedUI';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/components/AuthContext';
import { format, differenceInDays } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const endpoint = user.role === 'admin' ? '/api/dashboard' : '/api/dashboard/customer';
    fetch(endpoint)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return user?.role === 'admin' ? (
    <AdminDashboard data={data} user={user} />
  ) : (
    <CustomerDashboard data={data} user={user} />
  );
}

function AdminDashboard({ data, user }: any) {
  const stats = data?.stats || {};
  
  if (!data) return <div className="p-20 text-center font-bold text-slate-400">Strategizing server data...</div>;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* 🏛️ Dashboard Header - SaaS Professional Scale */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">System Overview</p>
           </div>
           <h1 className="dashboard-title text-slate-900 leading-tight">
              Management Dashboard
           </h1>
           <p className="kpi-label mt-1 text-slate-500">Real-time governance and financial orchestration.</p>
        </div>
      </div>

      {/* 📊 Strategic KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Total Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} trend="+14.2%" icon={Wallet} color="indigo" sub="Settled" />
         <MetricCard label="Active Users" value={stats.totalCustomers} trend="+22% Monthly" icon={UserPlus} color="emerald" sub="Registered Nodes" />
         <MetricCard label="Pending Invoices" value={stats.pendingInvoices} trend="-4.5%" icon={Receipt} color="amber" sub="Awaiting Payment" />
         <MetricCard label="System Integrity" value="99.98%" trend="Optimal" icon={ShieldCheck} color="sky" sub="Service Availability" />
      </div>

      {/* 📂 Transactional Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <h3 className="section-heading text-slate-900">Historical Activity</h3>
               </div>
               <button className="text-xs-SaaS font-bold text-indigo-600 hover:text-indigo-700">View Audit Log</button>
            </div>

            <div className="space-y-4">
               {(data.recentPayments || []).map((pay: any, idx: number) => (
                 <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                          <CreditCard className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div>
                          <p className="table-data font-semibold text-slate-900">{pay.customer?.name || 'Verified Customer'}</p>
                          <p className="text-xs-SaaS mt-0.5">Processed {pay.method} • {format(new Date(pay.paidAt), 'MMM d, p')}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="table-data font-bold text-slate-900">₹{pay.amount.toLocaleString()}</p>
                       <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Success</span>
                    </div>
                 </div>
               ))}
               {(!data.recentPayments || data.recentPayments.length === 0) && (
                 <p className="text-center py-20 text-xs-SaaS italic text-slate-300">No activity detected.</p>
               )}
            </div>
         </div>

         <div className="lg:col-span-4 bg-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 h-full flex flex-col">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                     <HelpCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">System Intelligence</h3>
               </div>
               
               <div className="space-y-4 flex-1">
                  {(data.insights || []).slice(0, 3).map((insight: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/10 border border-white/5 space-y-1">
                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Insight Report</p>
                       <p className="text-sm font-medium leading-relaxed">{insight.message}</p>
                    </div>
                  ))}
               </div>

               <Link href="/dashboard/reports" className="w-full mt-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest text-center shadow-lg hover:bg-slate-50 transition-colors">
                  Open Control Center
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
}

function CustomerDashboard({ data, user }: any) {
  if (!data) return <div className="p-20 text-center font-bold text-slate-400">Initializing Lifecycle Hub...</div>;
  const subs = data.subscriptions || [];
  const activeSub = subs.find((s: any) => s.status === 'Active') || subs[0];
  const pendingInvoices = (data.invoices || []).filter((i: any) => i.status !== 'paid');
  
  const daysLeft = activeSub?.nextBillingDate 
    ? differenceInDays(new Date(activeSub.nextBillingDate), new Date()) 
    : 0;

  const totalPaid = (data.payments || [])?.filter((p: any) => p.status === 'completed').reduce((a: any, p: any) => a + p.amount, 0) || 0;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">Account Overview</p>
          <h1 className="dashboard-title text-slate-900">
            Welcome, {user.name}
          </h1>
          <p className="kpi-label mt-1">Manage your active enterprise services.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/shop" className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl shadow-sm hover:bg-slate-50 transition-all">
             New Service
          </Link>
          <Link href="/dashboard/subscriptions" className="px-6 py-3 bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-black transition-all">
             Manage Portfolio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
           {activeSub ? (
             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Active Plan</p>
                     <h2 className="section-heading text-slate-900">
                       {activeSub.subscriptionNumber}
                     </h2>
                   </div>
                   <StatusBadge status={activeSub.status} />
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
                        <Zap className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="table-data font-bold text-slate-900">{activeSub.plan?.name || 'Custom Setup'}</p>
                        <p className="text-xs-SaaS text-slate-500">{activeSub.plan?.billingCycle} billing cycle</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="kpi-value text-slate-900">₹{activeSub.totalAmount.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between text-xs-SaaS font-bold uppercase">
                       <span className="text-slate-400">Renewal Progress</span>
                       <span className="text-indigo-600">{daysLeft} Days to billing</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                         style={{ width: `${Math.min(100, Math.max(5, (1 - (daysLeft / 30)) * 100))}%` }}
                       />
                    </div>
                 </div>
               </div>
             </div>
           ) : (
              <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-slate-100 text-center">
                <Box className="w-12 h-12 text-slate-100 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-900">No active assets detected</h3>
                <Link href="/dashboard/shop" className="inline-block mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md">Initialize Suite</Link>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CustomerMetricCard label="Settled Payments" value={`₹${totalPaid.toLocaleString()}`} icon={CreditCard} color="indigo" />
              <CustomerMetricCard label="Total Documents" value={(data.invoices || []).length} icon={ShieldCheck} color="emerald" />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xs-SaaS font-bold uppercase tracking-widest text-slate-900 mb-6 border-b border-slate-50 pb-4">Activity Timeline</h3>
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                 {(data?.payments?.slice(0, 5) || []).map((pay: any, idx: number) => (
                   <div key={idx} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center z-10 shadow-sm">
                         <div className={`w-1.5 h-1.5 rounded-full ${pay.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">{format(new Date(pay.paidAt || pay.createdAt), 'MMM d, p')}</p>
                      <h4 className="table-data font-bold text-slate-900 leading-tight">Payment Recorded</h4>
                      <p className="text-xs-SaaS mt-1">₹{pay.amount.toLocaleString()} through {pay.method}</p>
                   </div>
                 ))}
                 {(!data?.payments || data?.payments.length === 0) && (
                   <p className="text-center py-20 text-xs-SaaS text-slate-300 italic">No cycles detected.</p>
                 )}
              </div>
           </div>

           <div className="bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden">
              <ShieldCheck className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10" />
              <h3 className="text-lg font-bold tracking-tight mb-3">Enterprise Support</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Our dedicated strategy team is standing by to assist with your portfolio governance.</p>
              <Link href="/dashboard/help" className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">
                 Open Signal
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon: Icon, color, sub }: any) {
  const accentColors: any = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', amber: 'text-amber-600', sky: 'text-sky-600' };
  const bgColors: any = { indigo: 'bg-indigo-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', sky: 'bg-sky-50' };

  return (
    <Card className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
       <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${bgColors[color]} flex items-center justify-center ${accentColors[color]} border border-slate-100`}>
             <Icon className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-bold ${accentColors[color]} bg-white border border-slate-100 px-2 py-0.5 rounded-lg`}>{trend}</span>
       </div>
       <p className="kpi-label mb-1">{label}</p>
       <h4 className="kpi-value text-slate-900">{value}</h4>
       <p className="text-[10px] font-semibold text-slate-400 mt-2 uppercase tracking-widest">{sub}</p>
    </Card>
  );
}

function CustomerMetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
       <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100">
             <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="kpi-label">{label}</p>
            <h4 className="kpi-value text-slate-900">{value}</h4>
          </div>
       </div>
    </Card>
  );
}
