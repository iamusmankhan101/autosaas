'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, WorkflowTask } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PlusCircle, GripVertical, User, AlertCircle, Trash2,
  CheckCircle2, Clock, Zap, KanbanSquare, Car,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Status   = WorkflowTask['status'];
type Priority = WorkflowTask['priority'];

const COLUMNS: { id: Status; label: string; accent: string; headerBg: string; dot: string }[] = [
  {
    id: 'TODO',
    label: 'To Do',
    accent: 'border-slate-300 dark:border-slate-600',
    headerBg: 'bg-slate-50 dark:bg-slate-800/60',
    dot: 'bg-slate-400',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    accent: 'border-amber-300 dark:border-amber-700',
    headerBg: 'bg-amber-50 dark:bg-amber-900/20',
    dot: 'bg-amber-400',
  },
  {
    id: 'DONE',
    label: 'Done',
    accent: 'border-emerald-300 dark:border-emerald-700',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    dot: 'bg-emerald-400',
  },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; icon: React.ReactNode }> = {
  LOW:    { label: 'Low',    cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',       icon: <Clock className="h-3 w-3" /> },
  MEDIUM: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',    icon: <Zap className="h-3 w-3" /> },
  HIGH:   { label: 'High',   cls: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',            icon: <AlertCircle className="h-3 w-3" /> },
};

export default function WorkflowPage() {
  const [open, setOpen]     = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [form, setForm]     = useState({ title: '', mechanic: '', priority: 'MEDIUM' as Priority, job_id: '' });

  const tasks = useLiveQuery(() =>
    db.workflow_tasks.toArray().then(t => t.sort((a, b) => a.created_at - b.created_at))
  );
  const jobs  = useLiveQuery(() => db.jobs.filter(j => j.status !== 'DELIVERED').toArray());
  const staff = useLiveQuery(() => db.staff.filter(s => s.active).toArray().then(s => s.sort((a, b) => a.name.localeCompare(b.name))));

  const byStatus = (s: Status) => tasks?.filter(t => t.status === s) ?? [];
  const total    = tasks?.length ?? 0;
  const done     = byStatus('DONE').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const createTask = async () => {
    if (!form.title.trim()) return;
    await db.workflow_tasks.add({
      id: crypto.randomUUID(),
      job_id: form.job_id,
      title: form.title.trim(),
      mechanic: form.mechanic.trim(),
      priority: form.priority,
      status: 'TODO',
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    setForm({ title: '', mechanic: '', priority: 'MEDIUM', job_id: '' });
    setOpen(false);
  };

  const moveTask = async (id: string, status: Status) => {
    await db.workflow_tasks.update(id, { status, updated_at: Date.now() });

    // Sync job status if task is linked to a job
    const task = await db.workflow_tasks.get(id);
    if (!task?.job_id) return;

    if (status === 'IN_PROGRESS') {
      await db.jobs.update(task.job_id, { status: 'IN_PROGRESS', updated_at: Date.now() });
    } else if (status === 'DONE') {
      // Only mark job READY if ALL linked tasks are done
      const allTasks = await db.workflow_tasks.filter(t => t.job_id === task.job_id).toArray();
      const allDone  = allTasks.every(t => t.id === id ? true : t.status === 'DONE');
      if (allDone) {
        await db.jobs.update(task.job_id, { status: 'READY', updated_at: Date.now() });
      }
    } else if (status === 'TODO') {
      // Moving back to TODO → revert job to PENDING if it was auto-advanced
      const job = await db.jobs.get(task.job_id);
      if (job && (job.status === 'READY' || job.status === 'IN_PROGRESS')) {
        await db.jobs.update(task.job_id, { status: 'PENDING', updated_at: Date.now() });
      }
    }
  };

  const deleteTask = async (id: string) => {
    await db.workflow_tasks.delete(id);
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (dragId) moveTask(dragId, status);
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KanbanSquare className="h-7 w-7 text-orange-500" /> Workflow
          </h1>
          <p className="text-slate-500 text-sm mt-1">Assign tasks, track progress, keep your team aligned.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Progress bar + stats */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-amber-500">{byStatus('IN_PROGRESS').length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-emerald-500">{done}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Overall Progress</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</p>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.id);
          const isOver   = dragOver === col.id;

          return (
            <div
              key={col.id}
              className={cn(
                'rounded-3xl border-2 flex flex-col transition-all duration-150',
                col.accent,
                isOver ? 'scale-[1.01] shadow-lg' : 'shadow-sm'
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className={cn('flex items-center justify-between px-4 py-3 rounded-t-[22px]', col.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{col.label}</span>
                </div>
                <span className="text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 p-3 min-h-[300px]">
                {colTasks.map(task => {
                  const job  = jobs?.find(j => j.id === task.job_id);
                  const pcfg = PRIORITY_CONFIG[task.priority];

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        'bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm',
                        'cursor-grab active:cursor-grabbing active:shadow-lg active:scale-[1.02] transition-all group'
                      )}
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white leading-snug flex-1">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <GripVertical className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Linked job */}
                      {job && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{job.vehicle_make} {job.vehicle_model} · {job.license_plate}</span>
                        </div>
                      )}

                      {/* Priority + mechanic */}
                      <div className="flex items-center justify-between">
                        <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full', pcfg.cls)}>
                          {pcfg.icon} {pcfg.label}
                        </span>
                        {task.mechanic && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="h-3 w-3" />
                            {task.mechanic}
                          </span>
                        )}
                      </div>

                      {/* Quick move */}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        {COLUMNS.filter(c => c.id !== col.id).map(c => (
                          <button
                            key={c.id}
                            onClick={() => moveTask(task.id, c.id)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
                            {c.label}
                          </button>
                        ))}
                        {col.id !== 'DONE' && (
                          <button
                            onClick={() => moveTask(task.id, 'DONE')}
                            className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-700 transition-colors px-2 py-1 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty drop zone */}
                {colTasks.length === 0 && (
                  <div className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-[200px] transition-colors',
                    isOver
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-slate-200 dark:border-slate-700'
                  )}>
                    <KanbanSquare className="h-6 w-6 text-slate-300" />
                    <p className="text-xs text-slate-400">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Task Title <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Replace brake pads"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign To</Label>
              {staff && staff.length > 0 ? (
                <Select value={form.mechanic} onValueChange={v => setForm(f => ({ ...f, mechanic: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select staff member..." /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name} — {s.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="e.g. Usman, Bilal"
                  value={form.mechanic}
                  onChange={e => setForm(f => ({ ...f, mechanic: e.target.value }))}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {jobs && jobs.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to Job (optional)</Label>
                <Select value={form.job_id} onValueChange={v => setForm(f => ({ ...f, job_id: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select a job..." /></SelectTrigger>
                  <SelectContent>
                    {jobs.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.vehicle_make} {j.vehicle_model} · {j.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={createTask} disabled={!form.title.trim()}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
