'use client';

import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import {Search, Bell, Info, Menu} from 'lucide-react';
import {Link, usePathname} from '@/i18n/routing';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';

export default function Header() {
  const pathname = usePathname();

  // Pill Navigation Items mimicking the dashboard design
  const navItems = [
    {href: '/', label: 'Overview'},
    {href: '/khata', label: 'Khata'},
    {href: '/jobs', label: 'Manage'},
    {href: '/inventory', label: 'Inventory'},
    {href: '/schedule', label: 'Account'},
    {href: '/reports', label: 'Reports'},
  ];

  return (
    <header className="h-[88px] flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 z-10 w-full bg-[#fcfcfd]/80 dark:bg-[#0f172a]/80 backdrop-blur-sm">
      
      {/* Left: Brand/Logo & Mobile Menu */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex items-center gap-2">
           <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center">
             <span className="text-white font-bold text-lg leading-none">M</span>
           </div>
           <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MistryApp</span>
        </div>
      </div>
      
      {/* Middle: Pill Navigation */}
      <nav className="hidden lg:flex items-center bg-white dark:bg-slate-800 rounded-full px-2 py-2 shadow-sm border border-slate-100 dark:border-slate-700">
        {navItems.map((item) => {
           // Basic matching since we map these loosely
           const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
           return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {item.label}
              </Link>
           );
        })}
      </nav>

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
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </div>

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
            {/* Mock User Avatar */}
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Usm" alt="User" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Usman Khan</span>
            <span className="text-xs text-slate-500 mt-1">usman@mistry...</span>
          </div>
        </div>
      </div>

    </header>
  );
}
