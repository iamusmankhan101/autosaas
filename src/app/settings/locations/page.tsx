'use client';

import React, { useState } from 'react';
import { db, Location } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Phone, Plus, Trash2, Edit2, Check, Store } from 'lucide-react';
import { useLocation } from '@/components/LocationProvider';
import { cn } from '@/lib/utils';

export default function LocationsSettingsPage() {
  const locations = useLiveQuery(() => db.locations.toArray());
  const { currentLocationId, setCurrentLocationId } = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;

    await db.locations.add({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      created_at: Date.now(),
    });

    setForm({ name: '', address: '', phone: '' });
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingLocation || !form.name.trim()) return;

    await db.locations.update(editingLocation.id, {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    });

    setForm({ name: '', address: '', phone: '' });
    setEditingLocation(null);
  };

  const handleDelete = async (id: string) => {
    if (locations?.length === 1) {
      alert("You must have at least one branch.");
      return;
    }
    if (!confirm("Are you sure? This will NOT delete data associated with this location, but you won't be able to access it easily.")) return;
    
    await db.locations.delete(id);
    if (currentLocationId === id && locations) {
      const remaining = locations.filter(l => l.id !== id);
      if (remaining.length > 0) {
        setCurrentLocationId(remaining[0].id);
      }
    }
  };

  const openEdit = (loc: Location) => {
    setEditingLocation(loc);
    setForm({
      name: loc.name,
      address: loc.address || '',
      phone: loc.phone || '',
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Manage Branches</h1>
          <p className="text-slate-500 text-sm mt-1">Add and manage your workshop locations.</p>
        </div>
        <Dialog open={isAddOpen || !!editingLocation} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingLocation(null);
            setForm({ name: '', address: '', phone: '' });
          }
        }}>
          <DialogTrigger>
            <div onClick={() => setIsAddOpen(true)} className="inline-flex items-center justify-center rounded-full px-6 h-10 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add New Branch
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. DHA Phase 5 Branch"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street 123, Sector Y..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="03xx-xxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button 
                onClick={editingLocation ? handleUpdate : handleAdd} 
                className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 mt-2"
                disabled={!form.name.trim()}
              >
                {editingLocation ? 'Save Changes' : 'Create Branch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations?.map((location) => (
          <Card key={location.id} className={cn(
            "group relative overflow-hidden transition-all duration-300 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm hover:shadow-md",
            currentLocationId === location.id ? "ring-2 ring-orange-500 bg-orange-50/10" : ""
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                  <Store className="h-6 w-6" />
                </div>
                {currentLocationId === location.id && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2.5 py-1 rounded-full">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <CardTitle className="mt-4 text-xl">{location.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location.address || 'No address set'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {location.phone && (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {location.phone}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 rounded-full border-slate-200 dark:border-slate-700"
                onClick={() => setCurrentLocationId(location.id)}
                disabled={currentLocationId === location.id}
              >
                {currentLocationId === location.id ? 'Current Branch' : 'Switch to this'}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => openEdit(location)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"
                onClick={() => handleDelete(location.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
