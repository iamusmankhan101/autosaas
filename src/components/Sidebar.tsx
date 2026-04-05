'use client';

import React from 'react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/routing';
import {LayoutDashboard, BookUser, Wrench, Package, CalendarDays, KanbanSquare, ConciergeBell, Settings, Sun, Moon, HelpCircle, LogOut} from 'lucide-react';
import {cn} from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {href: '/', icon: LayoutDashboard},
    {href: '/khata', icon: BookUser},
    {href: '/jobs', icon: Wrench},
    {href: '/services', icon: ConciergeBell},
    {href: '/inventory', icon: Package},
    {href: '/schedule', icon: CalendarDays},
    {href: '/workflow', icon: KanbanSquare},
  ];

  return (
    <aside className="w-[80px] bg-white dark:bg-slate-900 hidden md:flex flex-col items-center py-8 justify-between z-10 shrink-0">
      
      {/* Top: Theme Toggle (Mockup style) */}
      <div className="flex flex-col gap-4 items-center">
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Sun className="h-5 w-5 text-slate-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Moon className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Middle: Main Navigation */}
      <nav className="flex flex-col gap-6 items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-3 rounded-full transition-all duration-200",
                isActive 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-110" 
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings / Help / Logout */}
      <div className="flex flex-col gap-4 items-center">
        <Link href="/help" className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <HelpCircle className="h-5 w-5" />
        </Link>
        <Link href="/settings" className={cn("p-2 rounded-full transition-colors", pathname === '/settings' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
          <Settings className="h-5 w-5" />
        </Link>
        <button className="p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      
    </aside>
  );
}
