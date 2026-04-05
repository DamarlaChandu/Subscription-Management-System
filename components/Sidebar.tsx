'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import {
  LayoutDashboard, Package, Layers, CreditCard, FileText,
  DollarSign, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, Sun, Moon, Zap, Menu, X, User, ShoppingBag, HelpCircle, RefreshCw, LayoutGrid, Timer
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[]; 
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'internal', 'customer'] },
  { href: '/dashboard/products', label: 'Products', icon: Package, roles: ['admin', 'internal'] },
  { href: '/dashboard/plans', label: 'Plans', icon: Layers, roles: ['admin', 'internal'] },
  { href: '/dashboard/recurring-plans', label: 'Recurring Plans', icon: RefreshCw, roles: ['admin', 'internal'] },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['admin', 'internal'] },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'internal'] },
  { href: '/dashboard/payments', label: 'Payments', icon: DollarSign, roles: ['admin', 'internal'] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'internal'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  { href: '/dashboard/my-subscriptions', label: 'Portfolio', icon: LayoutGrid, roles: ['customer'] },
  { href: '/dashboard/my-invoices', label: 'Invoices', icon: FileText, roles: ['customer'] },
  { href: '/dashboard/my-payments', label: 'Payments', icon: DollarSign, roles: ['customer'] },
  { href: '/dashboard/shop', label: 'Shop', icon: ShoppingBag, roles: ['customer'] },
  { href: '/dashboard/help', label: 'Help & Support', icon: HelpCircle, roles: ['customer'] },
  { href: '/dashboard/profile', label: 'Profile', icon: User, roles: ['admin', 'internal', 'customer'] },
];

const roleLabels: Record<string, string> = { admin: 'Admin', internal: 'Manager', customer: 'Customer' };
const roleBadgeColors: Record<string, string> = { admin: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', internal: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', customer: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full border-r border-white/5 relative overflow-hidden" 
         style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)' }}>
      
      {/* 🌌 Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>
      
      {/* 🔮 Brand Logo Section */}
      <div className="p-8 pb-10 border-b border-white/5 relative overflow-hidden group">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-black text-white italic tracking-tighter leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>SubSaaS</h1>
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.4em] mt-1">Lifecycle Hub</p>
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Navigation Section */}
      <nav className="flex-1 py-10 px-5 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative ${
                isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-opacity ${
                isActive ? 'text-indigo-500' : 'opacity-60 group-hover:opacity-100'
              }`} />
              {!collapsed && <span className="sidebar-item">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500/80 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 👤 User & Systems Control */}
      <div className="p-8 space-y-4 border-t border-white/5 relative z-10">
        
        {/* Toggle Controls */}
        <div className="flex items-center gap-2">
           <button onClick={toggleDarkMode} className="flex-1 flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-105 active:scale-95">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
           </button>
           <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex flex-1 items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:scale-105 active:scale-95">
              {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
           </button>
        </div>

        {/* Profile Card */}
        {user && !collapsed && (
          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 group relative overflow-hidden backdrop-blur-xl hover:border-white/10 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-150 transition-transform"><User className="w-16 h-16" /></div>
             <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2 leading-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Verified {roleLabels[user.role]}
             </p>
             <h4 className="text-xs font-black text-white italic truncate max-w-[150px]">{user.name}</h4>
             <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{user.email}</p>
          </div>
        )}

        {/* Global Exit */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-5 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-rose-600 to-rose-700 shadow-xl shadow-rose-900/20 hover:scale-[1.02] hover:shadow-rose-500/30 transition-all duration-500 group active:scale-95"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out System
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 right-4 z-50 p-3 rounded-2xl bg-indigo-600 text-white shadow-2xl">
        <Menu className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md" onClick={() => setMobileOpen(false)}>
          <div className="w-72 h-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-6 right-[-48px] text-white/50 hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className={`hidden lg:block fixed top-0 left-0 h-screen transition-all duration-500 z-30 shadow-[40px_0_100px_-20px_rgba(0,0,0,0.5)] ${collapsed ? 'w-[88px]' : 'w-64'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
