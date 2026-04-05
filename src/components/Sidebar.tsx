'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard, BookUser, Wrench, Package, CalendarDays,
  KanbanSquare, ConciergeBell, Users, Settings, Sun, Moon, HelpCircle, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/khata',     icon: BookUser,         label: 'Ledger' },
  { href: '/jobs',      icon: Wrench,           label: 'Job Cards' },
  { href: '/services',  icon: ConciergeBell,    label: 'Services' },
  { href: '/inventory', icon: Package,          label: 'Inventory' },
  { href: '/schedule',  icon: CalendarDays,     label: 'Schedule' },
  { href: '/workflow',  icon: KanbanSquare,     label: 'Workflow' },
  { href: '/staff',     icon: Users,            label: 'Staff' },
];

function Tooltip({ label }: { label: string }) {
  return (
    <span className="
      pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
      whitespace-nowrap rounded-lg bg-slate-900 dark:bg-white
      text-white dark:text-slate-900 text-xs font-medium px-2.5 py-1.5
      opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
      transition-all duration-150 shadow-lg z-50
    ">
      {label}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[80px] bg-white dark:bg-slate-900 hidden md:flex flex-col items-center py-8 gap-6 z-10 shrink-0">

      {/* Top: Theme toggles */}
      <div className="flex flex-col gap-3 items-center">
        <div className="relative group">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Sun className="h-5 w-5 text-slate-500" />
          </button>
          <Tooltip label="Light mode" />
        </div>
        <div className="relative group">
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Moon className="h-5 w-5 text-slate-500" />
          </button>
          <Tooltip label="Dark mode" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-100 dark:bg-slate-700" />

      {/* Main nav — top aligned */}
      <nav className="flex flex-col gap-3 items-center">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <div key={href} className="relative group">
              <Link
                href={href}
                className={cn(
                  'p-3 rounded-full transition-all duration-200 flex items-center justify-center',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-110'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
              <Tooltip label={label} />
            </div>
          );
        })}
      </nav>

      {/* Bottom: Settings / Help / Logout — pushed to bottom */}
      <div className="mt-auto flex flex-col gap-3 items-center">
        <div className="relative group">
          <Link href="/help" className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Tooltip label="Help" />
        </div>
        <div className="relative group">
          <Link
            href="/settings"
            className={cn(
              'p-2 rounded-full transition-colors flex',
              pathname === '/settings'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
          <Tooltip label="Settings" />
        </div>
        <div className="relative group">
          <button className="p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
          <Tooltip label="Logout" />
        </div>
      </div>

    </aside>
  );
}
