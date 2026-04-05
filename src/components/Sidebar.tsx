'use client';

import React from 'react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/routing';
import {LayoutDashboard, BookUser, Wrench, Package, CalendarDays, Settings} from 'lucide-react';
import {cn} from '@/lib/utils';

export default function Sidebar() {
  const t = useTranslations('Index');
  const pathname = usePathname();

  const navItems = [
    {href: '/', label: t('dashboard'), icon: LayoutDashboard},
    {href: '/khata', label: t('khata'), icon: BookUser},
    {href: '/jobs', label: t('jobs'), icon: Wrench},
    {href: '/inventory', label: t('inventory'), icon: Package},
    {href: '/schedule', label: 'Bay Schedule', icon: CalendarDays},
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col hidden md:flex h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold font-heading text-primary">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            pathname === '/settings'
              ? "bg-primary text-primary-foreground font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          <span>{t('settings')}</span>
        </Link>
      </div>
    </aside>
  );
}
