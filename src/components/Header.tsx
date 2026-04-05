'use client';

import React from 'react';
import {Search, Bell, Info, Menu, Store} from 'lucide-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import LocationSwitcher from './LocationSwitcher';
import { useSubscription } from './SubscriptionProvider';
import { useAuth } from './AuthProvider';

export default function Header() {
  const { canUseMultiLocation } = useSubscription();
  const { user } = useAuth();

  return (
    <header className="h-[88px] flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 z-20 w-full bg-[#fcfcfd]/80 dark:bg-[#0f172a]/80 backdrop-blur-sm">
      
      {/* Left: Brand/Logo & Mobile Menu */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center gap-2">
             <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center">
               <span className="text-white font-bold text-lg leading-none">A</span>
             </div>
             <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Auto Pulse</span>
          </div>
        </div>

        {/* Location Switcher */}
        <div className="hidden md:block">
          {canUseMultiLocation ? (
            <LocationSwitcher />
          ) : (
            <div className="flex items-center gap-2 px-3 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-slate-500">
              <Store className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-tight">Main Branch</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Muft</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation removed as requested */}

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <Link 
          href="/profile"
          className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
            {/* Mock User Avatar */}
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="User" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{user?.name || 'User'}</span>
            <span className="text-xs text-slate-500 mt-1">{user?.email || 'user@mistry...'}</span>
          </div>
        </Link>
      </div>

    </header>
  );
}
