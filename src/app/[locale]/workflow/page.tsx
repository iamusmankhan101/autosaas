'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, WorkflowTask } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, GripVertical, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Status = WorkflowTask['status'];
type Priority = WorkflowTask['priority'];

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'IN_PROGRESS', label: 'In Progress',  color: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'DONE',        label: 'Done',         color: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HIGH:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function WorkflowPage() {
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', mechanic: '', priority: 'MEDIUM' as Priority, job_id: '' });

  const tasks = useLiveQuery(() => db.workflow_tasks.orderBy('created_at').toArray());
  const jobs  = useLiveQuery(() => db.jobs.filter(j => j.status !== 'DELIVERED').toArray());

  const tasksByStatus = (status: Status) => tasks?.filter(t => t.status === status) ?? [];

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
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (dragId) moveTask(dragId, status);
    setDragId(null);
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Workflow</h1>
          <p className="text-muted-foreground">Assign tasks, track progress, keep your team aligned.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className={cn('rounded-2xl p-4 min-h-[400px] flex flex-col gap-3', col.color)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{col.label}</span>
              <span className="text-xs bg-white dark:bg-slate-700 rounded-full px-2 py-0.5 font-medium shadow-sm">
                {tasksByStatus(col.id).length}
              </span>
            </div>

            {/* Task Cards */}
            {tasksByStatus(col.id).map(task => {
              const job = jobs?.find(j => j.id === task.job_id);
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-medium text-sm text-slate-900 dark:text-white leading-snug">{task.title}</p>
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {job && (
                    <p className="text-xs text-muted-foreground mb-3 font-mono">
                      {job.vehicle_make} {job.vehicle_model} · {job.license_plate}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge className={cn('text-[10px] font-semibold border-0', PRIORITY_STYLES[task.priority])}>
                      {task.priority === 'HIGH' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {task.priority}
                    </Badge>
                    {task.mechanic && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {task.mechanic}
                      </span>
                    )}
                  </div>

                  {/* Quick move buttons */}
                  <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    {COLUMNS.filter(c => c.id !== col.id).map(c => (
                      <button
                        key={c.id}
                        onClick={() => moveTask(task.id, c.id)}
                        className="text-[10px] text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {tasksByStatus(col.id).length === 0 && (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl min-h-[120px]">
                Drop tasks here
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Task Title</Label>
              <Input
                placeholder="e.g. Replace brake pads"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mechanic</Label>
              <Input
                placeholder="e.g. Usman, Bilal"
                value={form.mechanic}
                onChange={e => setForm(f => ({ ...f, mechanic: e.target.value }))}
              />
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
                <Select value={form.job_id} onValueChange={v => setForm(f => ({ ...f, job_id: v }))}>
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
