'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Vehicle, Customer, JobCard } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PlusCircle, Car, Search, Pencil, User,
  Hash, Palette, Calendar, FileText, Wrench, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/LocationProvider';

const emptyForm = {
  customer_id: '', make: '', model: '', year: '',
  license_plate: '', color: '', vin: '', notes: '',
};

export default function VehiclesPage() {
  const { currentLocationId } = useLocation();
  const [search, setSearch]       = useState('');
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<Vehicle | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const vehicles = useLiveQuery(() =>
    db.vehicles
      .where('location_id')
      .equals(currentLocationId || '')
      .toArray()
      .then(v => v.sort((a, b) => b.created_at - a.created_at)),
    [currentLocationId]
  );
  const customers = useLiveQuery(() => 
    db.customers.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const jobs = useLiveQuery(() => 
    db.jobs.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );

  const filtered = (vehicles ?? []).filter(v => {
    const q = search.toLowerCase();
    return (
      v.license_plate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  });

  const customerName = (id: string) =>
    customers?.find(c => c.id === id)?.name ?? '—';

  const jobsFor = (v: Vehicle) =>
    (jobs ?? [])
      .filter(j => j.license_plate === v.license_plate)
      .sort((a, b) => b.created_at - a.created_at);

  const totalRevenue = (v: Vehicle) =>
    jobsFor(v).filter(j => j.status === 'DELIVERED').reduce((s, j) => s + j.total_amount, 0);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit   = (v: Vehicle) => {
    setEditing(v);
    setForm({
      customer_id: v.customer_id, make: v.make, model: v.model,
      year: v.year ? String(v.year) : '', license_plate: v.license_plate,
      color: v.color ?? '', vin: v.vin ?? '', notes: v.notes ?? '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    await db.vehicles.delete(id);
  };

  const handleSave = async () => {
    if (!form.make.trim() || !form.license_plate.trim()) return;
    const payload = {
      customer_id: form.customer_id,
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year ? parseInt(form.year) : undefined,
      license_plate: form.license_plate.trim().toUpperCase(),
      color: form.color.trim() || undefined,
      vin: form.vin.trim() || undefined,
      notes: form.notes.trim() || undefined,
      updated_at: Date.now(),
    };
    if (editing) {
      await db.vehicles.update(editing.id, payload);
    } else {
      await db.vehicles.add({ 
        id: crypto.randomUUID(), 
        created_at: Date.now(), 
        location_id: currentLocationId || '',
        ...payload 
      });
    }
    setOpen(false);
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING:     'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    READY:       'bg-blue-100 text-blue-700',
    DELIVERED:   'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="h-7 w-7 text-orange-500" /> Vehicles
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track every vehicle and maintain detailed customer records.</p>
        </div>
        <Button onClick={openCreate} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-5 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400">Total Vehicles</p>
          <p className="text-4xl font-bold mt-1">{vehicles?.length ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <p className="text-xs text-slate-500">Customers</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {new Set(vehicles?.map(v => v.customer_id).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <p className="text-xs text-slate-500">Active Jobs</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">
            {(jobs ?? []).filter(j => j.status !== 'DELIVERED').length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <p className="text-xs text-slate-500">Total Visits</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{jobs?.length ?? 0}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search plate, make, model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        />
      </div>

      {/* Vehicle list */}
      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <Car className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">{search ? 'No vehicles match your search.' : 'No vehicles yet.'}</p>
          {!search && <p className="text-sm mt-1">Add your first vehicle to get started.</p>}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_48px] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
            <span>Vehicle</span>
            <span>Owner</span>
            <span>Visits</span>
            <span>Revenue</span>
            <span />
          </div>

          {filtered.map(vehicle => {
            const vJobs    = jobsFor(vehicle);
            const revenue  = totalRevenue(vehicle);
            const isExpanded = expandedId === vehicle.id;
            const activeJob  = vJobs.find(j => j.status !== 'DELIVERED');

            return (
              <div key={vehicle.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">

                {/* Row */}
                <div
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_48px] gap-4 px-6 py-4 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : vehicle.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                      <Car className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                        {vehicle.year && <span className="text-slate-400 font-normal ml-1">'{String(vehicle.year).slice(-2)}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-slate-400">{vehicle.license_plate}</span>
                        {vehicle.color && (
                          <span className="text-xs text-slate-400">· {vehicle.color}</span>
                        )}
                        {activeJob && (
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STATUS_COLOR[activeJob.status])}>
                            {activeJob.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {vehicle.customer_id ? customerName(vehicle.customer_id) : <span className="text-slate-400">—</span>}
                  </div>

                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{vJobs.length}</div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    PKR {revenue.toLocaleString()}
                  </div>

                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(vehicle)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model} · ${vehicle.license_plate}`)}
                      className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-slate-300" />
                      : <ChevronDown className="h-4 w-4 text-slate-300" />}
                  </div>
                </div>

                {/* Expanded: vehicle details + job history */}
                {isExpanded && (
                  <div className="px-6 pb-5 bg-slate-50/60 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mb-5">
                      {vehicle.vin && (
                        <div className="flex items-start gap-2">
                          <Hash className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Chassis / VIN</p>
                            <p className="text-sm font-mono text-slate-900 dark:text-white">{vehicle.vin}</p>
                          </div>
                        </div>
                      )}
                      {vehicle.color && (
                        <div className="flex items-start gap-2">
                          <Palette className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Color</p>
                            <p className="text-sm text-slate-900 dark:text-white">{vehicle.color}</p>
                          </div>
                        </div>
                      )}
                      {vehicle.year && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Year</p>
                            <p className="text-sm text-slate-900 dark:text-white">{vehicle.year}</p>
                          </div>
                        </div>
                      )}
                      {vehicle.notes && (
                        <div className="flex items-start gap-2 col-span-2">
                          <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Notes</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{vehicle.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Job history */}
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" /> Service History ({vJobs.length})
                    </p>
                    {vJobs.length === 0 ? (
                      <p className="text-sm text-slate-400">No jobs recorded for this vehicle.</p>
                    ) : (
                      <div className="space-y-2">
                        {vJobs.map(job => (
                          <div key={job.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {job.services && job.services.length > 0
                                  ? job.services.map(s => s.name).join(', ')
                                  : 'General Service'}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(job.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full', STATUS_COLOR[job.status])}>
                                {job.status.replace('_', ' ')}
                              </span>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                PKR {job.total_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Make <span className="text-red-500">*</span></Label>
                <Input placeholder="Toyota" value={form.make}
                  onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input placeholder="Corolla" value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>License Plate <span className="text-red-500">*</span></Label>
                <Input placeholder="LEA-1234" value={form.license_plate}
                  onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input type="number" placeholder="2020" value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input placeholder="White" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Chassis / VIN</Label>
                <Input placeholder="Optional" value={form.vin}
                  onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Owner (Customer)</Label>
              {customers && customers.length > 0 ? (
                <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  No customers yet. Add them in the{' '}
                  <a href="/khata" className="text-orange-500 underline">Ledger</a>.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="e.g. AC not working, check engine light" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSave}
              disabled={!form.make.trim() || !form.license_plate.trim()}>
              {editing ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
