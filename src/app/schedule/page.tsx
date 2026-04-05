'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, JobCard } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Wrench, Car, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSubscription } from '@/components/SubscriptionProvider';
import Link from 'next/link';
import { Lock } from 'lucide-react';

const BAYS = ['Bay 1 (Lift)', 'Bay 2 (General)', 'Detailing Area'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9 AM – 6 PM

const BAY_COLORS = [
  'bg-orange-500 shadow-orange-200 dark:shadow-orange-900',
  'bg-blue-500 shadow-blue-200 dark:shadow-blue-900',
  'bg-violet-500 shadow-violet-200 dark:shadow-violet-900',
];

const BAY_HEADER_COLORS = [
  'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900',
  'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900',
  'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900',
];

function fmt(hour: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour;
  return `${h}:00 ${ampm}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function SchedulePage() {
  const { canUseBayScheduling } = useSubscription();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [assignDialog, setAssignDialog] = useState<{ bay: string; hour: number } | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  if (!canUseBayScheduling) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Scheduling is Locked</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Bay Scheduling is available on the **Basic** and **Pro** plans. 
          Manage your workshop flow, lifts, and bays efficiently by upgrading today.
        </p>
        <Link 
          href="/profile?tab=subscription" 
          className="rounded-full px-8 h-12 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  const jobs = useLiveQuery(() => db.jobs.filter(j => j.status !== 'DELIVERED').toArray());

  const goDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const isToday = isSameDay(selectedDate, new Date());

  // jobs scheduled on selected date
  const scheduledToday = (jobs ?? []).filter(j => {
    if (!j.scheduled_time) return false;
    return isSameDay(new Date(j.scheduled_time), selectedDate);
  });

  const slotJobs = (bay: string, hour: number) =>
    scheduledToday.filter(j =>
      j.bay_assignment === bay && j.scheduled_time &&
      new Date(j.scheduled_time).getHours() === hour
    );

  const unscheduled = (jobs ?? []).filter(j => !j.scheduled_time || !j.bay_assignment);

  const handleAssign = async () => {
    if (!assignDialog || !selectedJobId) return;
    const scheduled = new Date(selectedDate);
    scheduled.setHours(assignDialog.hour, 0, 0, 0);
    await db.jobs.update(selectedJobId, {
      bay_assignment: assignDialog.bay,
      scheduled_time: scheduled.getTime(),
      updated_at: Date.now(),
    });
    setAssignDialog(null);
    setSelectedJobId('');
  };

  const handleUnassign = async (job: JobCard) => {
    await db.jobs.update(job.id, {
      bay_assignment: undefined,
      scheduled_time: undefined,
      updated_at: Date.now(),
    });
  };

  // summary counts
  const totalSlots = scheduledToday.length;
  const bayLoad = BAYS.map(bay => ({
    bay,
    count: scheduledToday.filter(j => j.bay_assignment === bay).length,
  }));

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Bay Scheduling</h1>
          <p className="text-slate-500 text-sm mt-1">Manage lift occupancy and workshop flow.</p>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => goDay(-1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 px-2 text-sm font-medium text-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-orange-500" />
            {fmtDate(selectedDate)}
            {isToday && (
              <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-semibold">TODAY</span>
            )}
          </div>
          <button
            onClick={() => goDay(1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="ml-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-5 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400">Jobs Scheduled</p>
          <p className="text-4xl font-bold mt-1">{totalSlots}</p>
          <p className="text-xs text-slate-400 mt-1">for {isToday ? 'today' : 'this day'}</p>
        </div>
        {bayLoad.map((b, i) => (
          <div key={b.bay} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
            <div className={cn('w-2 h-2 rounded-full mb-2', BAY_COLORS[i].split(' ')[0])} />
            <p className="text-xs text-slate-500 truncate">{b.bay}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{b.count}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-[88px_1fr] border-b border-slate-100 dark:border-slate-700">
          <div className="p-4 flex items-center justify-center">
            <Clock className="h-4 w-4 text-slate-300" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
            {BAYS.map((bay, i) => (
              <div key={bay} className={cn('p-4 text-center border-b-2', BAY_HEADER_COLORS[i])}>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{bay}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{bayLoad[i].count} job{bayLoad[i].count !== 1 ? 's' : ''} today</p>
              </div>
            ))}
          </div>
        </div>

        {/* Time rows */}
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
          {HOURS.map(hour => {
            const isPast = isToday && new Date().getHours() > hour;
            const isCurrent = isToday && new Date().getHours() === hour;

            return (
              <div
                key={hour}
                className={cn(
                  'grid grid-cols-[88px_1fr] min-h-[80px]',
                  isPast && 'opacity-50'
                )}
              >
                {/* Time label */}
                <div className={cn(
                  'flex flex-col items-center justify-start pt-3 gap-0.5',
                  isCurrent && 'bg-orange-50 dark:bg-orange-900/10'
                )}>
                  <span className={cn(
                    'text-xs font-semibold',
                    isCurrent ? 'text-orange-500' : 'text-slate-400'
                  )}>
                    {fmt(hour)}
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>

                {/* Bay cells */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
                  {BAYS.map((bay, bi) => {
                    const cellJobs = slotJobs(bay, hour);
                    return (
                      <div
                        key={bay}
                        className="relative p-1.5 group hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer min-h-[80px]"
                        onClick={() => { if (cellJobs.length === 0) { setAssignDialog({ bay, hour }); setSelectedJobId(''); } }}
                      >
                        {cellJobs.map(job => (
                          <div
                            key={job.id}
                            className={cn(
                              'absolute inset-1.5 rounded-2xl text-white p-3 text-xs font-medium shadow-md flex flex-col justify-between',
                              BAY_COLORS[bi]
                            )}
                            onClick={e => e.stopPropagation()}
                          >
                            <div>
                              <p className="font-bold leading-tight">{job.vehicle_make} {job.vehicle_model}</p>
                              <p className="font-mono text-[10px] opacity-80 mt-0.5">{job.license_plate}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] opacity-70 bg-white/20 px-1.5 py-0.5 rounded-full">
                                {job.status.replace('_', ' ')}
                              </span>
                              <button
                                onClick={() => handleUnassign(job)}
                                className="opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Hover assign prompt */}
                        {cellJobs.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-slate-400 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-full shadow-sm">
                              + Assign
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled jobs */}
      {unscheduled.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Car className="h-4 w-4" /> Unscheduled Jobs ({unscheduled.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map(job => (
              <div
                key={job.id}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm shadow-sm"
              >
                <Wrench className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{job.vehicle_make} {job.vehicle_model}</span>
                <span className="font-mono text-xs text-slate-400">{job.license_plate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={open => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Job — {assignDialog?.bay} at {assignDialog ? fmt(assignDialog.hour) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Select Job</Label>
              {!jobs || jobs.filter(j => j.status !== 'DELIVERED').length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No active jobs available.</p>
              ) : (
                <Select value={selectedJobId} onValueChange={v => setSelectedJobId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.filter(j => j.status !== 'DELIVERED').map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.vehicle_make} {job.vehicle_model} · {job.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleAssign}
              disabled={!selectedJobId}
            >
              Assign to {assignDialog?.bay}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
