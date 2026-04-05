'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, ServiceCatalog } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Pencil, Trash2, ConciergeBell, Tag } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const emptyForm = { name: '', default_price: '', category: '' };

export default function ServicesPage() {
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<ServiceCatalog | null>(null);
  const [form, setForm]       = useState(emptyForm);

  const services = useLiveQuery(() => db.service_catalog.toArray().then(s =>
    s.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  ));

  // group by category
  const grouped = (services ?? []).reduce<Record<string, ServiceCatalog[]>>((acc, s) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit   = (s: ServiceCatalog) => {
    setEditing(s);
    setForm({ name: s.name, default_price: String(s.default_price), category: s.category });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      default_price: parseFloat(form.default_price) || 0,
      category: form.category.trim() || 'General',
    };
    if (editing) {
      await db.service_catalog.update(editing.id, payload);
    } else {
      await db.service_catalog.add({ id: crypto.randomUUID(), created_at: Date.now(), ...payload });
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await db.service_catalog.delete(id);
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ConciergeBell className="h-7 w-7 text-orange-500" /> Services
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your workshop service catalog and default prices.</p>
        </div>
        <Button onClick={openCreate} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-5 col-span-2">
          <p className="text-sm text-slate-400">Total Services</p>
          <p className="text-4xl font-bold mt-1">{services?.length ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <p className="text-sm text-slate-500">Categories</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{Object.keys(grouped).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5">
          <p className="text-sm text-slate-500">Avg. Price</p>
          <p className="text-4xl font-bold text-orange-500 mt-1">
            {services?.length
              ? `${Math.round(services.reduce((s, sv) => s + sv.default_price, 0) / services.length).toLocaleString()}`
              : '0'}
          </p>
        </div>
      </div>

      {/* Grouped list */}
      {services?.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <ConciergeBell className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No services yet.</p>
          <p className="text-sm mt-1">Add your first service to the catalog.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-orange-500" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">{category}</h2>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {items.map((svc, i) => (
                  <div
                    key={svc.id}
                    className={cn(
                      'flex items-center justify-between px-5 py-4',
                      i < items.length - 1 && 'border-b border-slate-100 dark:border-slate-700'
                    )}
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{svc.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        PKR {svc.default_price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => openEdit(svc)}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Service Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Oil Change"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                placeholder="e.g. Engine, Brakes, Tires"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Default Price (PKR)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.default_price}
                onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
