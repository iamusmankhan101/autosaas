'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useLocation } from '@/components/LocationProvider';
import { 
  BarChart3, Users, Car, Banknote, Printer, 
  ChevronRight, Calendar, ArrowUpRight, TrendingUp,
  Download, Filter, Briefcase, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TimeRange = '1D' | '7D' | '30D';

export default function ReportsPage() {
  const { currentLocationId } = useLocation();
  const [range, setRange] = useState<TimeRange>('7D');

  // Fetch all necessary data for the current location
  const invoices = useLiveQuery(() => 
    db.invoices.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const customers = useLiveQuery(() => 
    db.customers.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const vehicles = useLiveQuery(() => 
    db.vehicles.toArray(), // Vehicles are currently missing location_id in schema, but we'll filter by jobs
    [currentLocationId]
  );
  const jobs = useLiveQuery(() => 
    db.jobs.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const staff = useLiveQuery(() => 
    db.staff.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const rangeMs = range === '1D' ? 24 * 60 * 60 * 1000 : range === '7D' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startTime = now - rangeMs;

    const filteredInvoices = (invoices ?? []).filter(i => i.created_at >= startTime);
    const filteredCustomers = (customers ?? []).filter(c => c.created_at >= startTime);
    const filteredJobs = (jobs ?? []).filter(j => j.created_at >= startTime);
    
    // Vehicles don't have location_id, so we find vehicles associated with jobs in this location/time
    const vehicleIdsInRange = new Set(filteredJobs.map(j => j.license_plate));
    const newVehicles = (vehicles ?? []).filter(v => v.created_at >= startTime);

    const revenue = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingRevenue = filteredInvoices.filter(i => i.status === 'UNPAID' || i.status === 'PARTIAL').reduce((sum, inv) => sum + (inv.total_amount - inv.advance_paid), 0);

    return {
      revenue,
      pendingRevenue,
      newCustomers: filteredCustomers.length,
      totalCustomers: customers?.length ?? 0,
      vehiclesServiced: vehicleIdsInRange.size,
      newVehicles: newVehicles.length,
      jobsCompleted: filteredJobs.filter(j => j.status === 'DELIVERED').length,
      activeStaff: staff?.filter(s => s.active).length ?? 0,
      recentInvoices: filteredInvoices.sort((a,b) => b.created_at - a.created_at).slice(0, 5)
    };
  }, [range, invoices, customers, vehicles, jobs, staff]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 print:m-0">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
             <BarChart3 className="h-8 w-8 text-orange-500" /> Executive Summary
          </h1>
          <p className="text-slate-500 font-medium">Insights and business performance overview.</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
              <TabsList className="bg-transparent">
                  <TabsTrigger value="1D" className="rounded-xl px-6 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900">Daily</TabsTrigger>
                  <TabsTrigger value="7D" className="rounded-xl px-6 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900">7 Days</TabsTrigger>
                  <TabsTrigger value="30D" className="rounded-xl px-6 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900">30 Days</TabsTrigger>
              </TabsList>
           </Tabs>
           <Button onClick={handlePrint} variant="outline" className="rounded-xl border-dashed border-2 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              <Printer className="mr-2 h-4 w-4" /> Print Report
           </Button>
        </div>
      </div>

      {/* Print Header (Visible only when printing) */}
      <div className="hidden print:block text-center space-y-2 mb-10">
          <h1 className="text-4xl font-bold">Auto Pulse - Workshop Report</h1>
          <p className="text-slate-500">Report Range: {range === '1D' ? 'Last 24 Hours' : range === '7D' ? 'Last 7 Days' : 'Last 30 Days'}</p>
          <p className="text-sm font-mono text-slate-400">Date Generated: {new Date().toLocaleString()}</p>
          <hr className="mt-6 border-slate-200" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2.5rem] border-0 shadow-lg shadow-orange-500/5 bg-white dark:bg-slate-800 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                <Banknote className="h-32 w-32" />
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-orange-600" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-black text-slate-900 dark:text-white">PKR {stats.revenue.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-orange-600 font-bold mt-2 flex items-center gap-1">
                     <ArrowUpRight className="h-3 w-3" /> Collected this period
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-0 shadow-lg shadow-blue-500/5 bg-white dark:bg-slate-800 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                <Users className="h-32 w-32" />
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">New Customers</p>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.newCustomers}</span>
                  <p className="text-xs text-slate-400 font-medium mt-2">Out of {stats.totalCustomers} total</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-0 shadow-lg shadow-emerald-500/5 bg-white dark:bg-slate-800 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                <Car className="h-32 w-32" />
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <Car className="h-6 w-6 text-emerald-600" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicles Serviced</p>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.vehiclesServiced}</span>
                  <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                     <TrendingUp className="h-3 w-3" /> Growth: +{stats.newVehicles} new
                  </p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-0 shadow-lg shadow-slate-900/5 bg-white dark:bg-slate-800 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                <UserCheck className="h-32 w-32" />
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-slate-600 dark:text-slate-200" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Staff at Location</p>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeStaff}</span>
                  <p className="text-xs text-slate-400 font-medium mt-2">Active Mechanics/Staff</p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Breakdown */}
        <Card className="lg:col-span-1 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold">Revenue Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Uncollected Udhaar</p>
                    <p className="text-2xl font-black text-red-500">PKR {stats.pendingRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Based on partial/unpaid POS and job invoices.</p>
                </div>

                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metrics for {range}</p>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium font-medium">Jobs Delivered</span>
                            <span className="font-black text-slate-900 dark:text-white">{stats.jobsCompleted}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-orange-500 h-full w-[70%]" />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Direct POS Sales</span>
                            <span className="font-black text-slate-900 dark:text-white">{(invoices?.filter(i => !i.job_id && i.created_at >= (Date.now() - (range === '1D' ? 24*60*60*1000 : range === '7D' ? 7*24*60*60*1000 : 30*24*60*60*1000))).length ?? 0)}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full w-[45%]" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Recent Billing Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="text-orange-500 font-bold">View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-8 py-4">Invoice #</th>
                                <th className="px-8 py-4">Customer</th>
                                <th className="px-8 py-4">Date</th>
                                <th className="px-8 py-4 text-right">Amount</th>
                                <th className="px-8 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                            {stats.recentInvoices.map((inv) => (
                                <tr key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors">
                                    <td className="px-8 py-4 font-mono font-bold text-slate-400 group-hover:text-orange-600 transition-colors uppercase">{inv.invoice_number}</td>
                                    <td className="px-8 py-4">
                                        <p className="font-bold text-slate-900 dark:text-white">{inv.customer_name}</p>
                                        <p className="text-xs text-slate-400">{inv.vehicle_make} {inv.vehicle_model}</p>
                                    </td>
                                    <td className="px-8 py-4 text-slate-500">
                                        {new Date(inv.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="px-8 py-4 text-right font-black text-slate-900 dark:text-white">PKR {inv.total_amount.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={cn(
                                            "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                            inv.status === 'PAID' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                        )}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats.recentInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No activity recorded for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
