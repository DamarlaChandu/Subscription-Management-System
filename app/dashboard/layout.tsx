'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Sidebar from '@/components/Sidebar';
import { LoadingSpinner } from '@/components/SharedUI';
import { Search, Bell, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <Sidebar />
      <main className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-20 w-full h-16 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 backdrop-blur-md" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
          {/* Global Search */}
          <div className="hidden sm:flex items-center w-full max-w-md relative">
            <Search className="absolute left-3 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Search customers, subscriptions, invoices..." 
              className="w-full pl-9 pr-4 py-2 rounded-full border text-sm outline-none transition-colors border-transparent focus:border-primary-500"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative" style={{ color: 'var(--text-secondary)' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <button className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
