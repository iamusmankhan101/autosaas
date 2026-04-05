'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookUser, Wrench, Package, CalendarDays,
  KanbanSquare, ConciergeBell, Users, Car, FileText, Settings, HelpCircle, LogOut,
  Lock, ShoppingCart, UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from './SubscriptionProvider';

function Tooltip({ label }: { label: string }) {
  return (
    <span className="
      pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
      whitespace-nowrap rounded-lg bg-slate-900
      text-white text-xs font-medium px-2.5 py-1.5
      opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
      transition-all duration-150 shadow-lg z-50
    ">
      {label}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { canUseBayScheduling, canUseWorkflow, canUsePOS } = useSubscription();

  const navItems = [
    { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/khata',     icon: BookUser,         label: 'Ledger' },
    { href: '/jobs',      icon: Wrench,           label: 'Job Cards' },
    { href: '/pos',       icon: ShoppingCart,     label: 'POS',       locked: !canUsePOS },
    { href: '/vehicles',  icon: Car,              label: 'Vehicles' },
    { href: '/invoices',  icon: FileText,         label: 'Invoices' },
    { href: '/services',  icon: ConciergeBell,    label: 'Services' },
    { href: '/inventory', icon: Package,          label: 'Inventory' },
    { href: '/schedule',  icon: CalendarDays,     label: 'Schedule',   locked: !canUseBayScheduling },
    { href: '/workflow',  icon: KanbanSquare,     label: 'Workflow',   locked: !canUseWorkflow },
    { href: '/staff',     icon: Users,            label: 'Staff' },
  ];

  return (
    <aside className="w-[80px] bg-white hidden md:flex flex-col items-center py-8 gap-6 z-10 shrink-0 border-r border-slate-100">

      {/* Main nav — top aligned */}
      <nav className="flex flex-col gap-3 items-center">
        {navItems.map(({ href, icon: Icon, label, locked }) => {
          const isActive = pathname === href;
          return (
            <div key={href} className="relative group">
              <Link
                href={locked ? '/profile?tab=subscription' : href}
                className={cn(
                  'p-3 rounded-full transition-all duration-200 flex items-center justify-center relative',
                  isActive
                    ? 'bg-slate-900 text-white shadow-md scale-110'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100',
                  locked && 'opacity-60 grayscale-[0.5]'
                )}
              >
                <Icon className="h-5 w-5" />
                {locked && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white">
                    <Lock className="h-2 w-2 text-white" />
                  </div>
                )}
              </Link>
              <Tooltip label={locked ? `${label} (Upgrade Required)` : label} />
            </div>
          );
        })}
      </nav>

      {/* Bottom: Settings / Help / Logout — pushed to bottom */}
      <div className="mt-auto flex flex-col gap-3 items-center">
        <div className="relative group">
          <Link href="/help" className="p-2 rounded-full text-slate-400 hover:text-slate-900 transition-colors flex">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Tooltip label="Help" />
        </div>
        <div className="relative group">
          <Link
            href="/profile"
            className={cn(
              'p-2 rounded-full transition-colors flex',
              pathname === '/profile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-900'
            )}
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
          <Tooltip label="Profile" />
        </div>
        <div className="relative group">
          <Link
            href="/profile?tab=subscription"
            className={cn(
              'p-2 rounded-full transition-colors flex',
              pathname === '/profile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-900'
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
          <Tooltip label="System Settings" />
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
