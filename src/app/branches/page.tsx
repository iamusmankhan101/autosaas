'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Location } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2, Edit2, Phone, Navigation, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/LocationProvider';

export default function BranchesPage() {
  const { currentLocationId, setCurrentLocationId } = useLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const locations = useLiveQuery(() => db.locations.toArray());

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (editing) {
      await db.locations.update(editing.id, {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      });
    } else {
      const id = crypto.randomUUID();
      await db.locations.add({
        id,
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        created_at: Date.now(),
      });
      // If first branch, select it
      if (!currentLocationId) {
        setCurrentLocationId(id);
      }
    }

    setOpen(false);
    setEditing(null);
    setForm({ name: '', address: '', phone: '' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (locations?.length === 1) {
      alert("You must have at least one branch.");
      return;
    }
    if (!confirm(`Delete branch "${name}"? This will not delete data from other branches, but you will lose access to this branch's data until it's re-added.`)) return;
    
    await db.locations.delete(id);
    if (currentLocationId === id) {
      const remaining = locations?.filter(l => l.id !== id);
      if (remaining && remaining.length > 0) {
        setCurrentLocationId(remaining[0].id);
      }
    }
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({ name: loc.name, address: loc.address || '', phone: loc.phone || '' });
    setOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      
      {/* Header */}
      <div className="my-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <MapPin className="h-8 w-8 text-orange-600" /> Manage Branches
          </h1>
          <p className="text-slate-500 text-sm mt-1">Add and manage your workshop locations and branches.</p>
        </div>
        
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: '', address: '', phone: '' }); } }}>
          <DialogTrigger
            render={
              <Button className="rounded-full px-6 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-none">
                <Plus className="mr-2 h-4 w-4" /> Add New Branch
              </Button>
            }
          />
          <DialogContent className="rounded-3xl border-slate-100 dark:border-slate-800 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editing ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="branch-name" className="text-xs font-bold uppercase text-slate-500 ml-1">Branch Name *</Label>
                <Input
                  id="branch-name"
                  placeholder="e.g. Model Town Branch"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border-slate-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-address" className="text-xs font-bold uppercase text-slate-500 ml-1">Address</Label>
                <Input
                  id="branch-address"
                  placeholder="City, Area, Street Name..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-xl border-slate-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-phone" className="text-xs font-bold uppercase text-slate-500 ml-1">Contact Phone</Label>
                <Input
                  id="branch-phone"
                  placeholder="+92 3xx xxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border-slate-200 focus:ring-orange-500"
                />
              </div>
              <Button onClick={handleSave} className="w-full rounded-xl py-6 text-lg font-bold bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition-all mt-2" disabled={!form.name.trim()}>
                {editing ? 'Update Branch' : 'Add Branch Location'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
          <MapPin className="absolute -bottom-6 -right-6 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Network Size</p>
              <h2 className="text-5xl font-black tracking-tight">{locations?.length ?? 0}</h2>
              <p className="text-slate-400 mt-2 font-medium">Active workshop locations across Pakistan.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 relative overflow-hidden group shadow-sm">
           <div className="relative z-10">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-4" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Primary Branch</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {locations?.find(l => l.id === currentLocationId)?.name || 'None Active'}
              </h2>
              <p className="text-slate-400 mt-2 font-medium">This is your current active dashboard view.</p>
           </div>
        </div>
      </div>

      {/* Branch List */}
      <div className="grid grid-cols-1 gap-4 mt-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-4 mb-2">Workshop Locations</h3>
        {!locations || locations.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[2.5rem]">
            <Navigation className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-bold">No branches configured.</p>
            <p className="text-sm">Click "Add New Branch" to get started.</p>
          </div>
        ) : (
          locations.map((loc) => {
            const isActive = loc.id === currentLocationId;
            return (
              <div 
                key={loc.id} 
                className={cn(
                  "group bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1",
                  isActive 
                    ? "border-orange-500/50 bg-orange-50/20 dark:bg-orange-950/10 shadow-lg shadow-orange-100/50 dark:shadow-none" 
                    : "border-slate-100 dark:border-slate-700 hover:border-orange-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600"
                  )}>
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">{loc.name}</h4>
                      {isActive && <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">Active</span>}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {loc.address && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Navigation className="h-3.5 w-3.5 text-slate-300" /> {loc.address}
                        </p>
                      )}
                      {loc.phone && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-300" /> {loc.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setCurrentLocationId(loc.id)}
                      className="rounded-full px-4 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                    >
                      Switch To
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEdit(loc)}
                    className="h-10 w-10rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(loc.id, loc.name)}
                    className="h-10 w-10 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
