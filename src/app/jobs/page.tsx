'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, JobCard, JobService } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PlusCircle, Camera, Wrench, Car, CheckCircle2,
  Clock, PackageCheck, Truck, X, Plus, Trash2, ConciergeBell, User, FileText,
  Lock, BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { compressImageToThumbnail } from '@/lib/image-util';
import { useLocation } from '@/components/LocationProvider';
import { useSubscription } from '@/components/SubscriptionProvider';

type Status = JobCard['status'];

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:     { label: 'Pending',     color: 'bg-slate-500',  icon: <Clock className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-500',  icon: <Wrench className="h-3 w-3" /> },
  READY:       { label: 'Ready',       color: 'bg-blue-500',   icon: <PackageCheck className="h-3 w-3" /> },
  DELIVERED:   { label: 'Delivered',   color: 'bg-emerald-500',icon: <Truck className="h-3 w-3" /> },
};

const STATUSES: Status[] = ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED'];

const emptyForm = {
  vehicle_make: '', vehicle_model: '', license_plate: '',
  advance_paid: '', status: 'PENDING' as Status,
  services: [] as JobService[],
  assignedStaff: '',
  customer_id: '',
};

export default function JobsPage() {
  const { currentLocationId } = useLocation();
  const { plan, jobLimit } = useSubscription();

  const [createOpen, setCreateOpen]     = useState(false);
  const [updateJob, setUpdateJob]       = useState<JobCard | null>(null);
  const [servicesJob, setServicesJob]   = useState<JobCard | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [form, setForm]                 = useState(emptyForm);
  const [newSvc, setNewSvc]   = useState({ catalogId: '', price: '' });
  const [editSvc, setEditSvc] = useState({ catalogId: '', price: '' });
  // inline new customer form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  // invoice customer prompt
  const [invoiceJob, setInvoiceJob] = useState<JobCard | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  const allJobs = useLiveQuery(() =>
    db.jobs.where('location_id').equals(currentLocationId || '').toArray().then(j => j.sort((a, b) => b.created_at - a.created_at)),
    [currentLocationId]
  );

  // Monthly limit check
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const jobsThisMonth = (allJobs ?? []).filter(j => j.created_at >= startOfMonth.getTime()).length;
  const isLimitReached = jobLimit !== null && jobsThisMonth >= jobLimit;

  const catalog = useLiveQuery(() =>
    db.service_catalog.where('location_id').equals(currentLocationId || '').toArray().then(s => s.sort((a, b) => a.name.localeCompare(b.name))),
    [currentLocationId]
  );
// ... existing catalog/staff queries ...
  const activeStaff = useLiveQuery(() =>
    db.staff.where('location_id').equals(currentLocationId || '').and(s => !!s.active).toArray().then(s => s.sort((a, b) => a.name.localeCompare(b.name))),
    [currentLocationId]
  );

  const allTasks = useLiveQuery(() => db.workflow_tasks.where('location_id').equals(currentLocationId || '').toArray(), [currentLocationId]);
  const customers = useLiveQuery(() => db.customers.toArray());
  const allInvoices = useLiveQuery(() => db.invoices.where('location_id').equals(currentLocationId || '').toArray(), [currentLocationId]);

  const jobs = (allJobs ?? []).filter(j =>
    filterStatus === 'ALL' ? j.status !== 'DELIVERED' : j.status === filterStatus
  );

  const counts = {
    ALL:         (allJobs ?? []).filter(j => j.status !== 'DELIVERED').length,
    PENDING:     (allJobs ?? []).filter(j => j.status === 'PENDING').length,
    IN_PROGRESS: (allJobs ?? []).filter(j => j.status === 'IN_PROGRESS').length,
    READY:       (allJobs ?? []).filter(j => j.status === 'READY').length,
    DELIVERED:   (allJobs ?? []).filter(j => j.status === 'DELIVERED').length,
  };

  // ── form service helpers ──
  const addFormService = () => {
    const cat = catalog?.find(c => c.id === newSvc.catalogId);
    if (!cat) return;
    const svc: JobService = {
      id: crypto.randomUUID(),
      name: cat.name,
      price: parseFloat(newSvc.price) || cat.default_price,
    };
    setForm(f => ({ ...f, services: [...f.services, svc] }));
    setNewSvc({ catalogId: '', price: '' });
  };

  const removeFormService = (id: string) =>
    setForm(f => ({ ...f, services: f.services.filter(s => s.id !== id) }));

  const formTotal = form.services.reduce((s, svc) => s + svc.price, 0);

  // ── inline add customer ──
  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const id = crypto.randomUUID();
    await db.customers.add({
      id,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      total_udhaar: 0,
      location_id: currentLocationId || '',
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    setForm(f => ({ ...f, customer_id: id }));
    setNewCustomer({ name: '', phone: '' });
    setShowNewCustomer(false);
  };

  // ── create job ──
  const handleCreate = async () => {
    if (!form.vehicle_make.trim() || !form.license_plate.trim() || !currentLocationId) return;
    
    if (isLimitReached) {
      alert(`Monthly job limit reached (${jobLimit} jobs). Please upgrade your plan in Settings to add more jobs.`);
      return;
    }

    const jobId = crypto.randomUUID();
    const plate = form.license_plate.trim().toUpperCase();

    await db.jobs.add({
      id: jobId,
      customer_id: form.customer_id,
      location_id: currentLocationId,
      vehicle_make: form.vehicle_make.trim(),
      vehicle_model: form.vehicle_model.trim(),
      license_plate: plate,
      status: form.status,
      services: form.services,
      total_amount: formTotal,
      advance_paid: parseFloat(form.advance_paid) || 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Auto-create vehicle record if plate doesn't exist yet
    const existingVehicle = await db.vehicles.filter(v => v.license_plate === plate).first();
    if (!existingVehicle) {
      await db.vehicles.add({
        id: crypto.randomUUID(),
        customer_id: form.customer_id,
        make: form.vehicle_make.trim(),
        model: form.vehicle_model.trim(),
        license_plate: plate,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    } else if (form.customer_id && !existingVehicle.customer_id) {
      // Link customer to existing vehicle if not already linked
      await db.vehicles.update(existingVehicle.id, { customer_id: form.customer_id, updated_at: Date.now() });
    }

    // Auto-create a workflow task linked to this job
    const taskStatus =
      form.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
      form.status === 'READY' || form.status === 'DELIVERED' ? 'DONE' : 'TODO';
    await db.workflow_tasks.add({
      id: crypto.randomUUID(),
      job_id: jobId,
      location_id: currentLocationId,
      title: `${form.vehicle_make.trim()} ${form.vehicle_model.trim()} — ${plate}`,
      mechanic: form.assignedStaff,
      priority: 'MEDIUM',
      status: taskStatus,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    setForm(emptyForm);
    setNewSvc({ catalogId: '', price: '' });
    setCreateOpen(false);
  };

  // ── generate invoice from job ──
  const handleGenerateInvoice = async (job: JobCard) => {
    const existing = (allInvoices ?? []).find(i => i.job_id === job.id);
    if (existing) {
      window.open(`/en/invoices/${existing.id}`, '_blank');
      return;
    }
    // If no customer linked, prompt for name first
    if (!job.customer_id) {
      setInvoiceJob(job);
      setWalkInName('');
      setWalkInPhone('');
      return;
    }
    await createInvoice(job, null);
  };

  const createInvoice = async (job: JobCard, walkIn: { name: string; phone: string } | null) => {
    let customerId = job.customer_id;
    let customerName = 'Walk-in Customer';
    let customerPhone = '';

    if (walkIn && walkIn.name.trim()) {
      // Create a real customer record
      customerId = crypto.randomUUID();
      customerName = walkIn.name.trim();
      customerPhone = walkIn.phone.trim();
      await db.customers.add({
        id: customerId,
        name: customerName,
        phone: customerPhone,
        total_udhaar: 0,
        location_id: currentLocationId || '',
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      // Link customer to job and vehicle
      await db.jobs.update(job.id, { customer_id: customerId, updated_at: Date.now() });
      const vehicle = await db.vehicles.filter(v => v.license_plate === job.license_plate).first();
      if (vehicle && !vehicle.customer_id) {
        await db.vehicles.update(vehicle.id, { customer_id: customerId, updated_at: Date.now() });
      }
    } else if (customerId) {
      const c = customers?.find(c => c.id === customerId);
      customerName = c?.name ?? 'Walk-in Customer';
      customerPhone = c?.phone ?? '';
    }

    const count = (allInvoices?.length ?? 0) + 1;
    const invoiceId = crypto.randomUUID();
    const advance = job.advance_paid ?? 0;
    const balance = job.total_amount - advance;
    await db.invoices.add({
      id: invoiceId,
      invoice_number: `INV-${String(count).padStart(4, '0')}`,
      job_id: job.id,
      customer_id: customerId ?? '',
      location_id: currentLocationId || job.location_id,
      customer_name: customerName,
      customer_phone: customerPhone,
      vehicle_make: job.vehicle_make,
      vehicle_model: job.vehicle_model,
      license_plate: job.license_plate,
      services: job.services ?? [],
      total_amount: job.total_amount,
      advance_paid: advance,
      balance,
      status: balance <= 0 ? 'PAID' : advance > 0 ? 'PARTIAL' : 'UNPAID',
      created_at: Date.now(),
    });
    setInvoiceJob(null);
    window.open(`/en/invoices/${invoiceId}`, '_blank');
  };

  // ── delete job ──
  const handleDeleteJob = async (job: JobCard) => {
    if (!confirm(`Delete job for ${job.vehicle_make} ${job.vehicle_model} · ${job.license_plate}?`)) return;
    await db.workflow_tasks.filter(t => t.job_id === job.id).delete();
    await db.invoices.filter(i => i.job_id === job.id).delete();
    await db.jobs.delete(job.id);
  };

  // ── status update (syncs workflow tasks) ──
  const handleStatusChange = async (job: JobCard, status: Status) => {
    await db.jobs.update(job.id, { status, updated_at: Date.now() });

    // Sync linked workflow tasks
    const linkedTasks = await db.workflow_tasks.filter(t => t.job_id === job.id).toArray();
    if (linkedTasks.length > 0) {
      const taskStatus =
        status === 'DELIVERED' || status === 'READY' ? 'DONE' :
        status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO';
      await Promise.all(
        linkedTasks.map(t => db.workflow_tasks.update(t.id, { status: taskStatus, updated_at: Date.now() }))
      );
    }

    setUpdateJob(null);
  };

  // ── image ──
  const handleImageUpload = async (jobId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const thumb = await compressImageToThumbnail(file);
      const job = await db.jobs.get(jobId);
      if (job) {
        await db.jobs.update(jobId, {
          thumbnails: [...(job.thumbnails ?? []), thumb],
          updated_at: Date.now(),
        });
      }
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  const handleRemoveThumb = async (job: JobCard, idx: number) => {
    const thumbs = (job.thumbnails ?? []).filter((_, i) => i !== idx);
    await db.jobs.update(job.id, { thumbnails: thumbs, updated_at: Date.now() });
  };

  // ── services on existing job ──
  const handleAddService = async () => {
    if (!servicesJob || !editSvc.catalogId) return;
    const cat = catalog?.find(c => c.id === editSvc.catalogId);
    if (!cat) return;
    const fresh = await db.jobs.get(servicesJob.id);
    if (!fresh) return;
    const svc: JobService = {
      id: crypto.randomUUID(),
      name: cat.name,
      price: parseFloat(editSvc.price) || cat.default_price,
    };
    const services = [...(fresh.services ?? []), svc];
    const total_amount = services.reduce((s, sv) => s + sv.price, 0);
    await db.jobs.update(fresh.id, { services, total_amount, updated_at: Date.now() });
    setServicesJob({ ...fresh, services, total_amount });
    setEditSvc({ catalogId: '', price: '' });
  };

  const handleRemoveService = async (svcId: string) => {
    if (!servicesJob) return;
    const fresh = await db.jobs.get(servicesJob.id);
    if (!fresh) return;
    const services = (fresh.services ?? []).filter(s => s.id !== svcId);
    const total_amount = services.reduce((s, sv) => s + sv.price, 0);
    await db.jobs.update(fresh.id, { services, total_amount, updated_at: Date.now() });
    setServicesJob({ ...fresh, services, total_amount });
  };

  // ── shared service picker UI ──
  const ServicePicker = ({
    value, onValueChange, price, onPriceChange, onAdd,
  }: {
    value: string; onValueChange: (v: string) => void;
    price: string; onPriceChange: (v: string) => void;
    onAdd: () => void;
  }) => {
    const selected = catalog?.find(c => c.id === value);
    return (
      <div className="space-y-2">
        <Label>Add from Catalog</Label>
        {!catalog || catalog.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No services in catalog yet. Add them in the{' '}
            <a href="/services" className="text-orange-500 underline">Services</a> page.
          </p>
        ) : (
          <div className="flex gap-2">
            <Select value={value} onValueChange={(v: string | null) => {
              const id = v ?? '';
              const cat = catalog?.find(c => c.id === id);
              onValueChange(id);
              onPriceChange(cat ? String(cat.default_price) : '');
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select service...">
                  {catalog?.find(c => c.id === value)?.name || "Select service..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {catalog.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — PKR {c.default_price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Price"
              value={price}
              onChange={e => onPriceChange(e.target.value)}
              className="w-28"
              title={selected ? `Default: PKR ${selected.default_price.toLocaleString()}` : ''}
            />
            <Button type="button" variant="outline" size="icon" onClick={onAdd} disabled={!value}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Job Cards</h1>
            {jobLimit !== null && (
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                isLimitReached 
                  ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800" 
                  : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700"
              )}>
                {jobsThisMonth} / {jobLimit} Jobs <span className="opacity-60 ml-0.5">This Month</span>
              </div>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">Manage ongoing vehicle repairs and workflows.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="rounded-full px-5 border-2 border-dashed border-slate-200"
            onClick={() => window.location.href = '/reports'}
          >
            <BarChart3 className="mr-2 h-4 w-4 text-orange-500" /> Summary Report
          </Button>
          <Button 
            onClick={() => isLimitReached ? window.location.href = '/profile?tab=subscription' : setCreateOpen(true)} 
            className={cn("rounded-full px-5", isLimitReached && "bg-orange-600 hover:bg-orange-700")}
          >
            {isLimitReached ? (
              <><Lock className="mr-2 h-4 w-4" /> Upgrade to Add</>
            ) : (
              <><PlusCircle className="mr-2 h-4 w-4" /> Create Job</>
            )}
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['ALL', ...STATUSES] as const).map(s => {
          const isActive = filterStatus === s;
          const count = counts[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              )}
            >
              {s === 'ALL' ? 'Active' : STATUS_CONFIG[s].label}
              <span className={cn(
                'ml-2 text-xs px-1.5 py-0.5 rounded-full',
                isActive
                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Job Cards Grid */}
      {jobs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <Car className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No jobs here yet.</p>
          <p className="text-sm mt-1">Click "Create Job" to add one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map(job => {
            const cfg = STATUS_CONFIG[job.status];
            const balance = job.total_amount - job.advance_paid;
            return (
              <div key={job.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                {/* Top */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                      {job.vehicle_make} {job.vehicle_model}
                    </p>
                    <p className="font-mono text-xs text-slate-400 mt-0.5">{job.license_plate}</p>
                    {(() => {
                      const customerName = job.customer_id
                        ? customers?.find(c => c.id === job.customer_id)?.name
                        : null;
                      const mechanic = (allTasks ?? []).find(t => t.job_id === job.id && t.mechanic)?.mechanic;
                      return (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {customerName && (
                            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <User className="h-3 w-3" /> {customerName}
                            </p>
                          )}
                          {mechanic && (
                            <p className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                              <Wrench className="h-3 w-3" /> {mechanic}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <span className={cn('flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full', cfg.color)}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {/* Services list */}
                {job.services && job.services.length > 0 && (
                  <div className="px-5 pb-3 space-y-1">
                    {job.services.map(svc => (
                      <div key={svc.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                          {svc.name}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          PKR {svc.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Thumbnails */}
                {job.thumbnails && job.thumbnails.length > 0 && (
                  <div className="flex gap-2 px-5 pb-3 overflow-x-auto">
                    {job.thumbnails.map((thumb, idx) => (
                      <div key={idx} className="relative shrink-0 group">
                        <img src={thumb} alt="Job photo" className="h-16 w-16 object-cover rounded-xl border border-slate-100 dark:border-slate-700" />
                        <button
                          onClick={() => handleRemoveThumb(job, idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 mt-auto">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">PKR {job.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Advance</p>
                    <p className="font-bold text-sm text-emerald-600">PKR {job.advance_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Balance</p>
                    <p className={cn('font-bold text-sm', balance > 0 ? 'text-red-500' : 'text-emerald-600')}>
                      PKR {balance.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-5 py-4">
                  <button
                    onClick={() => setUpdateJob(job)}
                    className="flex-1 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-full hover:opacity-90 transition-opacity"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => { setServicesJob(job); setEditSvc({ catalogId: '', price: '' }); }}
                    className="flex-1 text-xs font-medium border border-slate-200 dark:border-slate-600 py-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <ConciergeBell className="h-3.5 w-3.5" /> Services
                  </button>
                  <button
                    onClick={() => handleGenerateInvoice(job)}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 transition-colors"
                    title="Generate Invoice"
                  >
                    <FileText className="h-4 w-4 text-slate-500 hover:text-orange-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job)}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                  </button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(job.id, e)} />
                    <div className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Camera className="h-4 w-4 text-slate-500" />
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Job Dialog ── */}
      <Dialog open={createOpen} onOpenChange={o => { setCreateOpen(o); if (!o) { setForm(emptyForm); setNewSvc({ catalogId: '', price: '' }); setShowNewCustomer(false); setNewCustomer({ name: '', phone: '' }); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Job Card</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Customer</Label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(v => !v)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                >
                  <PlusCircle className="h-3 w-3" />
                  {showNewCustomer ? 'Cancel' : 'New Customer'}
                </button>
              </div>

              {showNewCustomer ? (
                <div className="space-y-2 p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900">
                  <Input
                    placeholder="Customer name *"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(c => ({ ...c, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone (03xx-xxxxxxx)"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer(c => ({ ...c, phone: e.target.value }))}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={handleAddNewCustomer}
                    disabled={!newCustomer.name.trim()}
                  >
                    Add & Select Customer
                  </Button>
                </div>
              ) : (
                <>
                  {customers && customers.length > 0 ? (
                    <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v ?? '' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer (optional)...">
                          {customers?.find(c => c.id === form.customer_id)?.name || "Select customer (optional)..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-slate-400 py-1">
                      No customers yet.{' '}
                      <button type="button" onClick={() => setShowNewCustomer(true)} className="text-orange-500 underline">
                        Add one now
                      </button>
                    </p>
                  )}
                  {form.customer_id && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {customers?.find(c => c.id === form.customer_id)?.name} selected
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Make <span className="text-red-500">*</span></Label>
                <Input placeholder="Toyota" value={form.vehicle_make}
                  onChange={e => setForm(f => ({ ...f, vehicle_make: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input placeholder="Corolla" value={form.vehicle_model}
                  onChange={e => setForm(f => ({ ...f, vehicle_model: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>License Plate <span className="text-red-500">*</span></Label>
              <Input placeholder="LEA-1234" value={form.license_plate}
                onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} />
            </div>

            {/* Services from catalog */}
            <div className="space-y-2">
              <Label>Services</Label>
              {form.services.length > 0 && (
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden mb-2">
                  {form.services.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-200">{svc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">PKR {svc.price.toLocaleString()}</span>
                        <button onClick={() => removeFormService(svc.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-white">
                    <span>Total</span><span>PKR {formTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <ServicePicker
                value={newSvc.catalogId}
                onValueChange={v => setNewSvc(s => ({ ...s, catalogId: v }))}
                price={newSvc.price}
                onPriceChange={v => setNewSvc(s => ({ ...s, price: v }))}
                onAdd={addFormService}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assign Labour</Label>
              {activeStaff && activeStaff.length > 0 ? (
                <Select
                  value={form.assignedStaff}
                  onValueChange={v => setForm(f => ({ ...f, assignedStaff: v ?? '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member...">
                      {activeStaff?.find(s => s.id === form.assignedStaff)?.name || "Select staff member..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeStaff.map(s => (
                      <SelectItem key={s.id} value={s.name}>
                        <span className="flex items-center gap-2">
                          {s.name}
                          <span className="text-xs text-slate-400">— {s.role}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-slate-400 py-1.5">
                  No active staff. Add them in the{' '}
                  <a href="/staff" className="text-orange-500 underline">Staff</a> page.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Advance Paid (PKR)</Label>
              <Input type="number" placeholder="0" value={form.advance_paid}
                onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!form.vehicle_make.trim() || !form.license_plate.trim()}
            >
              Create Job Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Update Status Dialog ── */}
      <Dialog open={!!updateJob} onOpenChange={open => !open && setUpdateJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Status — {updateJob?.vehicle_make} {updateJob?.vehicle_model}
              <span className="font-mono text-sm text-muted-foreground ml-2">{updateJob?.license_plate}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s];
              const isActive = updateJob?.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateJob && handleStatusChange(updateJob, s)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left',
                    isActive
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700'
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                  )}
                >
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0', cfg.color)}>
                    {cfg.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{cfg.label}</p>
                    {isActive && <p className="text-[10px] text-slate-400">Current</p>}
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-slate-900 dark:text-white ml-auto" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Services Dialog (existing job) ── */}
      <Dialog open={!!servicesJob} onOpenChange={open => !open && setServicesJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Services — {servicesJob?.vehicle_make} {servicesJob?.vehicle_model}
              <span className="font-mono text-sm text-muted-foreground ml-2">{servicesJob?.license_plate}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {servicesJob?.services && servicesJob.services.length > 0 ? (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
                {servicesJob.services.map(svc => (
                  <div key={svc.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-700 dark:text-slate-200">{svc.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-white">PKR {svc.price.toLocaleString()}</span>
                      <button onClick={() => handleRemoveService(svc.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>PKR {servicesJob.total_amount.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No services added yet.</p>
            )}

            <ServicePicker
              value={editSvc.catalogId}
              onValueChange={v => setEditSvc(s => ({ ...s, catalogId: v }))}
              price={editSvc.price}
              onPriceChange={v => setEditSvc(s => ({ ...s, price: v }))}
              onAdd={handleAddService}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
