'use client';

import React, { useState } from 'react';
import {
  User, Mail, Phone, Building, Shield, Save,
  Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Edit3, Camera, BadgeCheck, Clock, Key, ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/SharedUI';
import { useAuth } from '@/components/AuthContext';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  admin:    { label: 'Administrator', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200',  icon: '👑' },
  internal: { label: 'Manager',       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      icon: '⚙️' },
  customer: { label: 'Customer',      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: '👤' },
};

function InputField({ label, icon: Icon, type = 'text', value, onChange, disabled, placeholder, required }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-12 pr-5 py-3.5 rounded-2xl border-2 text-sm font-bold outline-none transition-all ${
            disabled
              ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/10'
          }`}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }: any) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 bg-white border-slate-100 text-slate-900 text-sm font-bold outline-none focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/10 transition-all"
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    company: user?.company || '',
    address: user?.address || '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword:  '',
    newPassword:      '',
    confirmPassword:  '',
  });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Profile updated successfully!', 'success');
      if (refreshUser) refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return showToast('New passwords do not match.', 'error');
    if (pwdForm.newPassword.length < 6) return showToast('Password must be at least 6 characters.', 'error');
    setChangingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Password changed successfully!', 'success');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPwd(false);
    }
  };

  if (!user) return null;

  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.customer;
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8 pb-12 mt-6">

      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-1">Account Management</p>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">My Profile</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">Manage your personal information and security settings.</p>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Hero Identity Card */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black tracking-tighter">{initials}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-all" title="Change avatar (coming soon)">
              <Camera className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-4xl font-black tracking-tighter italic">{user.name}</h2>
            <p className="text-slate-400 font-bold mt-1">{user.email}</p>
            <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border text-sm font-black uppercase tracking-widest ${role.bg} ${role.color}`}>
              <Shield className="w-4 h-4" />
              {role.icon} {role.label}
            </div>
          </div>

          {/* Account Quick Stats */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {[
              { label: 'Member Since', value: 'Apr 2026', icon: Clock },
              { label: 'Account Status', value: 'Active', icon: BadgeCheck },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
                <p className="font-black text-sm">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <Card className="p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Personal Information</h3>
            <p className="text-[11px] font-bold text-slate-400">Update your name, contact, and company details.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" icon={User} value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required placeholder="Your full name" />
            <InputField label="Email Address" icon={Mail} value={user.email} disabled placeholder="Email cannot be changed" />
            <InputField label="Phone Number" icon={Phone} value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 00000" />
            <InputField label="Company / Organisation" icon={Building} value={form.company} onChange={(e: any) => setForm({ ...form, company: e.target.value })} placeholder="Your company name" />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-2xl shadow-slate-200 hover:-translate-y-0.5 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <p className="text-[10px] font-bold text-slate-400">Your email address cannot be changed for security reasons.</p>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Security & Password</h3>
            <p className="text-[11px] font-bold text-slate-400">Change your password periodically to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleChangePwd} className="space-y-6 max-w-xl">
          <PasswordField
            label="Current Password"
            value={pwdForm.currentPassword}
            onChange={(e: any) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            placeholder="Enter current password"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PasswordField
              label="New Password"
              value={pwdForm.newPassword}
              onChange={(e: any) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              placeholder="Min. 6 characters"
            />
            <PasswordField
              label="Confirm New Password"
              value={pwdForm.confirmPassword}
              onChange={(e: any) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
              placeholder="Repeat new password"
            />
          </div>

          {/* Password strength hint */}
          {pwdForm.newPassword.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Password Strength</p>
              <div className="flex gap-1.5">
                {[6, 8, 10, 12].map(len => (
                  <div key={len} className={`h-1.5 flex-1 rounded-full transition-all ${pwdForm.newPassword.length >= len ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2">
                {pwdForm.newPassword.length < 6 ? 'Too short' : pwdForm.newPassword.length < 8 ? 'Weak' : pwdForm.newPassword.length < 10 ? 'Fair' : 'Strong'}
              </p>
            </div>
          )}

          <button type="submit" disabled={changingPwd}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-500 text-white font-black text-sm shadow-xl shadow-amber-200 hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {changingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>

      {/* Danger Zone */}
      <div className="border-2 border-dashed border-rose-200 rounded-[32px] p-8">
        <h3 className="font-black text-rose-600 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm font-bold text-rose-400 mb-6">These actions are permanent and cannot be undone.</p>
        <button
          onClick={() => showToast('Account deletion requires admin approval. Please contact support.', 'error')}
          className="px-6 py-3 rounded-2xl border-2 border-rose-200 text-rose-600 font-black text-sm hover:bg-rose-50 transition-all">
          Request Account Deletion
        </button>
      </div>
    </div>
  );
}
