'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import RevenueChart from './RevenueChart';
import Link from 'next/link';
import {
  ArrowUpRight, Wallet, Banknote, CheckCircle2, Activity,
  MoreHorizontal, Car,
} from 'lucide-react';
import { useLocation } from './LocationProvider';

export default function DashboardStats() {
  const { currentLocationId } = useLocation();
  const jobs = useLiveQuery(() => db.jobs.where('location_id').equals(currentLocationId || '').toArray(), [currentLocationId]);
  const customers = useLiveQuery(() => db.customers.where('location_id').equals(currentLocationId || '').toArray(), [currentLocationId]);

  const completedJobs = jobs?.filter(j => j.status === 'DELIVERED') ?? [];
  const activeJobs    = jobs?.filter(j => j.status !== 'DELIVERED') ?? [];
  const totalRevenue  = completedJobs.reduce((sum, j) => sum + j.total_amount, 0);
  const totalUdhaar   = customers?.reduce((sum, c) => sum + c.total_udhaar, 0) ?? 0;

  // Today's revenue
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayRevenue = completedJobs
    .filter(j => j.updated_at >= todayStart.getTime())
    .reduce((sum, j) => sum + j.total_amount, 0);

  // Priority active job (most recently updated)
  const priorityJob = activeJobs.sort((a, b) => b.updated_at - a.updated_at)[0];

  // Recent jobs for table (last 5 across all)
  const recentJobs = [...(jobs ?? [])].sort((a, b) => b.updated_at - a.updated_at).slice(0, 5);

  const statusDot: Record<string, string> = {
    DELIVERED:   'bg-emerald-500',
    PENDING:     'bg-red-500',
    IN_PROGRESS: 'bg-amber-500',
    READY:       'bg-blue-500',
  };

  const fmt = (n: number) =>
    n >= 1000 ? `Rs ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `Rs ${n}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">

      {/* LEFT COLUMN */}
      <div className="xl:col-span-4 flex flex-col gap-6">

        {/* Total Revenue dark card */}
        <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-24 h-24" />
          </div>
          <span className="text-sm font-medium text-slate-400">Total Revenue</span>
          <div className="flex items-center gap-4 mt-2 mb-1">
            <h2 className="text-4xl font-bold">Rs {totalRevenue.toLocaleString()}</h2>
          </div>
          <span className="text-xs text-slate-400 mb-6">
            Today: <span className="text-emerald-400 font-semibold">Rs {todayRevenue.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-3 w-full">
            <Link href="/jobs" className="flex-1">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full font-medium text-sm transition-colors border border-white/10">
                New Job Card
              </button>
            </Link>
            <Link href="/khata" className="flex-1">
              <button className="w-full bg-white text-slate-900 hover:bg-slate-100 py-2.5 rounded-full font-medium text-sm transition-colors shadow-md">
                Add Customer
              </button>
            </Link>
          </div>
        </div>

        {/* Active Jobs count */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Active Jobs</h3>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">{activeJobs.length}</p>
          <p className="text-xs text-slate-400 mt-1">vehicles currently in workshop</p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: jobs?.length ? `${Math.min((activeJobs.length / (jobs.length || 1)) * 100, 100)}%` : '0%' }}
            />
          </div>
        </div>

        {/* Priority Job Card */}
        {priorityJob ? (
          <div className="bg-orange-500 rounded-[1.5rem] p-5 shadow-lg shadow-orange-500/20 text-white relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-sm">Priority Job</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{priorityJob.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-100 mb-1">Vehicle</p>
                <p className="font-bold tracking-wider">{priorityJob.vehicle_make} {priorityJob.vehicle_model} · {priorityJob.license_plate}</p>
              </div>
              <Car className="w-8 h-8 opacity-50" />
            </div>
          </div>
        ) : (
          <div className="bg-orange-500/10 border border-orange-200 dark:border-orange-900 rounded-[1.5rem] p-5 text-orange-600 dark:text-orange-400 text-sm flex items-center gap-3">
            <Car className="w-5 h-5 shrink-0" />
            No active jobs right now.
          </div>
        )}
      </div>

      {/* MIDDLE COLUMN */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">

          {/* Jobs Completed */}
          <div className="bg-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-orange-100">Jobs Completed</span>
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{completedJobs.length}</h3>
            <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full flex items-center w-fit">
              <ArrowUpRight className="w-3 h-3 mr-1" /> All time
            </span>
          </div>

          {/* Active Jobs */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-500">Active Jobs</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{activeJobs.length}</h3>
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center w-fit">
              In progress
            </span>
          </div>

          {/* Total Revenue */}
          <div className="col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-500">Total Revenue (all time)</span>
              <Banknote className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Rs {totalRevenue.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-400">
              Pending udhaar: <span className="text-red-500 font-semibold">Rs {totalUdhaar.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Revenue Overview Chart */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col" style={{ minHeight: 320 }}>
          <div className="flex justify-between items-start w-full mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-400 mt-1">Monthly completed job income</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Revenue</span>
            </div>
          </div>
          <div className="flex-1">
            <RevenueChart jobs={completedJobs} />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — Recent Jobs */}
      <div className="xl:col-span-12 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent Jobs</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-2 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium rounded-l-xl">Vehicle</th>
                <th className="px-4 py-3 font-medium">Plate</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">No jobs yet.</td>
                </tr>
              ) : recentJobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{job.vehicle_make} {job.vehicle_model}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{job.license_plate}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Rs {job.total_amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-xs text-slate-600 dark:text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[job.status] ?? 'bg-slate-400'}`} />
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(job.updated_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
