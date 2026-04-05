'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, StaffMember } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PlusCircle, Users, Wrench, CheckCircle2, Clock,
  Pencil, ToggleLeft, ToggleRight, Phone, Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const ROLES = ['Mechanic', 'Helper', 'Electrician', 'Painter', 'Detailer', 'Manager'];

const emptyForm = { name: '', phone: '', role: 'Mechanic', active: true };

export default function StaffPage() {
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm]       = useState(emptyForm);

  const staff = useLiveQuery(() =>
    db.staff.toArray().then(s => s.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)))
  );

  const tasks = useLiveQuery(() => db.workflow_tasks.toArray());
  const jobs  = useLiveQuery(() => db.jobs.toArray());

  const activeStaff   = (staff ?? []).filter(s => s.active).length;
  const inactiveStaff = (staff ?? []).filter(s => !s.active).length;

  // per-staff stats
  const statsFor = (member: StaffMember) => {
    const myTasks    = (tasks ?? []).filter(t => t.mechanic === member.name);
    const myDone     = myTasks.filter(t => t.status === 'DONE').length;
    const myActive   = myTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const myJobIds   = [...new Set(myTasks.map(t => t.job_id).filter(Boolean))];
    const myJobs     = (jobs ?? []).filter(j => myJobIds.includes(j.id));
    const myRevenue  = myJobs.filter(j => j.status === 'DELIVERED').reduce((s, j) => s + j.total_amount, 0);
    return { total: myTasks.length, done: myDone, active: myActive, revenue: myRevenue };
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit   = (s: StaffMember) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone, role: s.role, active: s.active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), phone: form.phone.trim(), role: form.role, active: form.active };
    if (editing) {
      await db.staff.update(editing.id, payload);
    } else {
      await db.staff.add({ id: crypto.randomUUID(), created_at: Date.now(), ...payload });
    }
    setOpen(false);
  };

  const toggleActive = async (member: StaffMember) => {
    await db.staff.update(member.id, { active: !member.active });
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-orange-500" /> Staff
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage mechanics and workshop team members.</p>
        </div>
        <Button onClick={openCreate} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-5 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400">Total Staff</p>
          <p className="text-4xl font-bold mt-1">{staff?.length ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500">Active</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-500">{activeStaff}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500">Inactive</p>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-400">{inactiveStaff}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-500">Tasks Today</p>
            <Wrench className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-orange-500">
            {(tasks ?? []).filter(t => t.status === 'IN_PROGRESS').length}
          </p>
        </div>
      </div>

      {/* Staff list */}
      {!staff || staff.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No staff added yet.</p>
          <p className="text-sm mt-1">Add your first team member.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map(member => {
            const stats = statsFor(member);
            return (
              <div
                key={member.id}
                className={cn(
                  'bg-white dark:bg-slate-800 rounded-3xl border shadow-sm overflow-hidden flex flex-col',
                  member.active
                    ? 'border-slate-100 dark:border-slate-700'
                    : 'border-slate-100 dark:border-slate-700 opacity-60'
                )}
              >
                {/* Top */}
                <div className="flex items-start justify-between px-5 pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0',
                      member.active ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
                    )}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{member.role}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(member)}
                    className="shrink-0 mt-0.5"
                    title={member.active ? 'Deactivate' : 'Activate'}
                  >
                    {member.active
                      ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                      : <ToggleLeft className="h-6 w-6 text-slate-300" />}
                  </button>
                </div>

                {/* Phone */}
                {member.phone && (
                  <div className="flex items-center gap-2 px-5 pb-3 text-xs text-slate-400">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Tasks</p>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Active</p>
                    <p className="font-bold text-sm text-amber-500">{stats.active}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Done</p>
                    <p className="font-bold text-sm text-emerald-500">{stats.done}</p>
                  </div>
                </div>

                {/* Revenue */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400">Jobs Revenue</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    PKR {stats.revenue.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => openEdit(member)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-slate-200 dark:border-slate-600 py-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Usman Ali"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                placeholder="03xx-xxxxxxx"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
              <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                {form.active
                  ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                  : <ToggleLeft className="h-6 w-6 text-slate-300" />}
              </button>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
