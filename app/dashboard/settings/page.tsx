'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Save, Plus, Users, Shield, Loader2, Database, Trash2, 
  CreditCard, receipt, Building, Lock, Globe, FileText, CheckCircle2 
} from 'lucide-react';
import { Card, LoadingSpinner } from '@/components/SharedUI';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthContext';

interface Setting {
  _id: string;
  key: string;
  value: string;
  label: string;
  type: string;
  options?: string[];
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [tab, setTab] = useState<'general' | 'users' | 'billing'>('general');
  const [userModal, setUserModal] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'customer', phone: '', company: '',
  });

  const isAdmin = user?.role === 'admin';

  const fetchData = useCallback(async () => {
    const [settingsRes, usersRes] = await Promise.all([
      fetch('/api/settings'),
      isAdmin ? fetch('/api/users') : Promise.resolve(null),
    ]);
    const settingsData = await settingsRes.json();
    setSettings(settingsData.settings || []);
    if (usersRes) {
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const saveSettings = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settings.map(s => ({ key: s.key, value: s.value, label: s.label, type: s.type, options: s.options })) }),
    });
    setSaving(false);
  };

  // ... (keep creating user and seeding methods as they are mostly functional)
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    });
    setUserModal(false);
    setUserForm({ name: '', email: '', password: '', role: 'customer', phone: '', company: '' });
    fetchData();
  };

  const seedDatabase = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      const data = await res.json();
      setSeedResult(data.message || 'Seeded successfully!');
      fetchData();
    } catch {
      setSeedResult('Failed to seed database');
    }
    setSeeding(false);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      alert('An error occurred while deleting the user');
    }
  };

  if (loading) return <div className="p-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-40">
      
      {/* 🚀 High-Impact Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-100 pb-12">
         <div>
            <div className="flex items-center gap-2 mb-3">
               <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                  <Lock className="w-4 h-4 text-white" />
               </div>
               <p className="kpi-label uppercase tracking-widest text-[#64748b]">Configuration Control</p>
            </div>
            <h1 className="dashboard-title text-slate-900 leading-none">
              Platform Settings
            </h1>
            <p className="kpi-label mt-3">Manage your organization's operational security and financial configurations.</p>
         </div>

         {/* Navigation Tabs */}
         <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            {[
              { key: 'general', label: 'General', icon: Shield },
              { key: 'billing', label: 'Billing', icon: CreditCard },
              ...(isAdmin ? [{ key: 'users', label: 'User Nodes', icon: Users }] : []),
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  tab === t.key
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation Sidebar Context (Left) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
              <Globe className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10" />
              <h3 className="text-xl font-bold tracking-tight mb-4">Enterprise Hub</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">
                 All system modifications are logged in our internal audit registry. Ensure compliance with your organization's IT protocol before altering global values.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                 <CheckCircle2 className="w-4 h-4" /> System Locked & Secure
              </div>
           </div>

           {isAdmin && tab === 'general' && (
             <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-xl text-center">
                <Database className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <h3 className="section-heading text-sm text-slate-900 uppercase tracking-widest mb-2">Registry Seeding</h3>
                <p className="text-xs font-medium text-slate-500 mb-6">Reset and initialize the master database with structured starting parameters.</p>
                <button
                  onClick={seedDatabase}
                  disabled={seeding}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all flex justify-center items-center gap-2"
                >
                  {seeding ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Database className="w-4 h-4 text-indigo-600" />}
                  {seeding ? 'Initializing...' : 'Force Seed Protocol'}
                </button>
                {seedResult && (
                  <p className="mt-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-tight">{seedResult}</p>
                )}
             </div>
           )}
        </div>

        {/* Content Area (Right) */}
        <div className="lg:col-span-8">
           
           {/* GENERAL SETTINGS */}
           {tab === 'general' && (
             <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="section-heading text-slate-900">System Variables</h3>
                      <p className="text-xs font-medium text-slate-500">Master configuration protocol</p>
                   </div>
                   {isAdmin && (
                     <button
                       onClick={saveSettings}
                       disabled={saving}
                       className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
                     >
                       {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       Commit Changes
                     </button>
                   )}
                </div>

                <div className="p-8 space-y-6">
                   {settings.length === 0 ? (
                      <p className="kpi-label text-center py-10">No variables configured. Initialize seed protocol.</p>
                   ) : (
                      settings.map(setting => (
                        <div key={setting.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                           <div>
                              <p className="text-sm font-bold text-slate-900">{setting.label}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{setting.key}</p>
                           </div>
                           <div className="w-full md:w-64">
                              {setting.type === 'select' && setting.options ? (
                                <select
                                  value={setting.value}
                                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                                  disabled={!isAdmin}
                                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                                >
                                  {setting.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : setting.type === 'boolean' ? (
                                <select
                                  value={setting.value}
                                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                                  disabled={!isAdmin}
                                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                                >
                                  <option value="true">Enabled</option>
                                  <option value="false">Disabled</option>
                                </select>
                              ) : (
                                <input
                                  type={setting.type === 'number' ? 'number' : 'text'}
                                  value={setting.value}
                                  onChange={e => handleSettingChange(setting.key, e.target.value)}
                                  disabled={!isAdmin}
                                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                                />
                              )}
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
           )}

           {/* BILLING SETTINGS (NEW PRO MOCKUP) */}
           {tab === 'billing' && (
             <div className="space-y-8 animate-fade-in">
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                   <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                         <h3 className="section-heading text-slate-900">Payment Infrastructure</h3>
                         <p className="text-xs font-medium text-slate-500">Manage your verified transaction nodes.</p>
                      </div>
                      <button className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg active:scale-95">
                         <Plus className="w-4 h-4" /> Add Node
                      </button>
                   </div>
                   <div className="p-8 space-y-4">
                      {/* Primary Node */}
                      <div className="p-6 rounded-3xl border-2 border-indigo-500 bg-indigo-50/30 flex justify-between items-center">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center shadow-sm">
                               <CreditCard className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3">
                                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Visa</h4>
                                  <span className="px-2 py-0.5 rounded uppercase text-[9px] font-bold tracking-widest bg-emerald-100 text-emerald-700">Primary</span>
                               </div>
                               <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Ending in •••• 4242</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">Edit</button>
                      </div>
                      {/* Secondary Node */}
                      <div className="p-6 rounded-3xl border border-slate-200 bg-white flex justify-between items-center group">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                               <Building className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                               <h4 className="text-lg font-bold text-slate-900 tracking-tight">Silicon Valley Bank</h4>
                               <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Routing •••• 9811</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Make Primary</button>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                   <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="section-heading text-slate-900">Entity Information</h3>
                      <p className="text-xs font-medium text-slate-500">Corporate billing details</p>
                   </div>
                   <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Name</p>
                            <p className="text-sm font-bold text-slate-900">{user?.company || user?.name || 'SubSaaS Internal'} LLC</p>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Identity</p>
                            <p className="text-sm font-bold text-slate-900 font-mono">TIN-889-1029</p>
                         </div>
                         <div className="space-y-2 md:col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Address</p>
                            <p className="text-sm font-bold text-slate-900">101 Innovation Blvd, Core Hub, Silicon Valley, CA 94043</p>
                         </div>
                      </div>
                      <button className="mt-8 px-6 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                         Update Record
                      </button>
                   </div>
                </div>
             </div>
           )}

           {/* USERS REGISTRY */}
           {tab === 'users' && (
             <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="section-heading text-slate-900">User Nodes</h3>
                      <p className="text-xs font-medium text-slate-500">Active identities and access protocols</p>
                   </div>
                   <button
                     onClick={() => setUserModal(true)}
                     className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                   >
                     <Plus className="w-4 h-4" /> Provision Node
                   </button>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-sm">
                      <thead>
                         <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</th>
                            <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Clearance Level</th>
                            <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Command</th>
                         </tr>
                      </thead>
                      <tbody>
                         {users.map((u, i) => (
                           <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5">
                                 <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                 <p className="text-xs font-medium text-slate-500 mt-1">{u.email}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                                    u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                    u.role === 'internal' ? 'bg-sky-100 text-sky-700' :
                                    'bg-slate-100 text-slate-600'
                                 }`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-xs font-bold text-slate-600">{u.isActive ? 'Online' : 'Offline'}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 {u.role !== 'admin' && (
                                    <button
                                      onClick={() => deleteUser(u._id)}
                                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                      title="Revoke Node"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                 )}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

        </div>
      </div>

      {/* Modern Provisioning Modal */}
      <Modal isOpen={userModal} onClose={() => setUserModal(false)} title="Provision New Node">
        <form onSubmit={createUser} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Entity Name</label>
              <input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Secure Email</label>
              <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Authorization Key</label>
              <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Clearance Level</label>
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all">
                <option value="customer">Client Identity</option>
                <option value="internal">Internal Operator</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => setUserModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Abort</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors">Provision Identity</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
