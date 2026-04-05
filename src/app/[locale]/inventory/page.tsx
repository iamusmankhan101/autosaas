'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, InventoryItem } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, AlertTriangle, Package2, Boxes, Pencil, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Category = InventoryItem['category'];
type Unit = InventoryItem['unit'];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'PART', label: 'Part' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'OIL',  label: 'Oil (Liters)' },
];

const TABS = [
  { value: 'ALL',  label: 'All Stock' },
  { value: 'PART', label: 'Parts' },
  { value: 'TIRE', label: 'Tires' },
  { value: 'OIL',  label: 'Oil' },
];

const CAT_COLORS: Record<Category, string> = {
  PART: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  TIRE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  OIL:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const emptyForm = {
  name: '', category: 'PART' as Category, quantity: '',
  unit: 'PIECE' as Unit, alert_threshold: '5',
};

export default function InventoryPage() {
  const [activeTab, setActiveTab]   = useState('ALL');
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState<InventoryItem | null>(null);
  const [form, setForm]             = useState(emptyForm);

  const inventory = useLiveQuery(
    () => activeTab === 'ALL'
      ? db.inventory.toArray()
      : db.inventory.filter(i => i.category === activeTab).toArray(),
    [activeTab]
  );

  const allInventory = useLiveQuery(() => db.inventory.toArray());
  const vendors      = useLiveQuery(() => db.vendors.toArray());

  const totalOwed  = vendors?.reduce((s, v) => s + v.udhaar_owed, 0) ?? 0;
  const lowStock   = (allInventory ?? []).filter(i => i.quantity <= i.alert_threshold).length;
  const totalItems = allInventory?.length ?? 0;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit   = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category,
      quantity: String(item.quantity), unit: item.unit,
      alert_threshold: String(item.alert_threshold),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      alert_threshold: parseFloat(form.alert_threshold) || 0,
    };
    if (editing) {
      await db.inventory.update(editing.id, payload);
    } else {
      await db.inventory.add({
        id: crypto.randomUUID(),
        created_at: Date.now(),
        ...payload,
      });
    }
    setOpen(false);
  };

  const sorted = (inventory ?? []).sort((a, b) => {
    // low stock first
    const aLow = a.quantity <= a.alert_threshold ? 0 : 1;
    const bLow = b.quantity <= b.alert_threshold ? 0 : 1;
    return aLow - bLow || a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Stock</h1>
          <p className="text-slate-500 text-sm mt-1">Manage workshop parts, tires, and oil liters.</p>
        </div>
        <Button onClick={openCreate} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Items</span>
            <Boxes className="h-5 w-5 text-slate-500" />
          </div>
          <span className="text-4xl font-bold mt-1">{totalItems}</span>
          <span className="text-xs text-slate-400">across all categories</span>
        </div>
        <div className={cn(
          'rounded-3xl p-6 shadow-sm border flex flex-col gap-1',
          lowStock > 0
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
        )}>
          <div className="flex items-center justify-between">
            <span className={cn('text-sm', lowStock > 0 ? 'text-amber-600' : 'text-slate-500')}>Low Stock Alerts</span>
            <AlertTriangle className={cn('h-5 w-5', lowStock > 0 ? 'text-amber-500' : 'text-slate-300')} />
          </div>
          <span className={cn('text-4xl font-bold mt-1', lowStock > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
            {lowStock}
          </span>
          <span className="text-xs text-slate-400">items below threshold</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Vendor Udhaar</span>
            <TrendingDown className="h-5 w-5 text-red-400" />
          </div>
          <span className="text-4xl font-bold text-red-500 mt-1">PKR {totalOwed.toLocaleString()}</span>
          <span className="text-xs text-slate-400">owed to suppliers</span>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Category tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-slate-100 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_120px_80px] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-400 uppercase tracking-wide">
          <span>Item Name</span>
          <span>Category</span>
          <span className="text-right">Quantity</span>
          <span />
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Package2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No items in this category.</p>
            <p className="text-sm mt-1">Click "Add Item" to get started.</p>
          </div>
        ) : (
          sorted.map((item, i) => {
            const isLow = item.quantity <= item.alert_threshold;
            return (
              <div
                key={item.id}
                className={cn(
                  'grid grid-cols-[1fr_120px_120px_80px] gap-4 px-6 py-4 items-center border-b border-slate-100 dark:border-slate-700 last:border-0',
                  isLow && 'bg-amber-50/50 dark:bg-amber-900/10'
                )}
              >
                <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                  {isLow && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                  {item.name}
                </div>
                <div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', CAT_COLORS[item.category])}>
                    {CATEGORIES.find(c => c.value === item.category)?.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className={cn('font-bold text-sm', isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white')}>
                    {item.quantity}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{item.unit === 'LITER' ? 'L' : 'pcs'}</span>
                  {isLow && (
                    <p className="text-[10px] text-amber-500 mt-0.5">min {item.alert_threshold}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Item Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Brake Pads"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => {
                  const cat = v as Category;
                  setForm(f => ({ ...f, category: cat, unit: cat === 'OIL' ? 'LITER' : 'PIECE' }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v as Unit }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIECE">Piece</SelectItem>
                    <SelectItem value="LITER">Liter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number" placeholder="0"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert</Label>
                <Input
                  type="number" placeholder="5"
                  value={form.alert_threshold}
                  onChange={e => setForm(f => ({ ...f, alert_threshold: e.target.value }))}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
