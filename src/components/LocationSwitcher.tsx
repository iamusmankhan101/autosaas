'use client';

import React from 'react';
import { useLocation } from './LocationProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function LocationSwitcher() {
  const { currentLocationId, setCurrentLocationId, locations, isLoading } = useLocation();

  const currentLevel = locations?.find(l => l.id === currentLocationId);

  if (isLoading) return <div className="h-9 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-orange-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
            {currentLevel?.name || 'Select Branch'}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 mt-2 rounded-2xl p-2 shadow-xl border-slate-100 dark:border-slate-800 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-2">
            Your Branches
          </DropdownMenuLabel>
          {locations?.map((location) => (
            <DropdownMenuItem
              key={location.id}
              onClick={() => setCurrentLocationId(location.id)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900 dark:text-white">{location.name}</span>
                {location.address && <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{location.address}</span>}
              </div>
              {currentLocationId === location.id && (
                <Check className="h-4 w-4 text-orange-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
        
        <Link href="/profile">
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-500 transition-colors">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Manage Branches</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
