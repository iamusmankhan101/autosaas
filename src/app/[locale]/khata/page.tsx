'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Customer } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  PlusCircle, Search, MessageCircle, ChevronDown, ChevronUp,
  ArrowUpRight, ArrowDownLeft, BookOpen, Users, AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type TxType = 'CREDIT' | 'PAYMENT';

export default function LedgerPage() {
  const [searchTerm, setSearchTerm]   = useState('');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [addCustomer, setAddCustomer] = useState(false);
  const [txDialog, setTxDialog]       = useState<{ customer: Customer; type: TxType } | null>(null);
  const [custForm, setCustForm]       = useState({ name: '', phone: '' });
  const [txForm, setTxForm]           = useState({ amount: '', description: '' });

  const customers = useLiveQuery(
    () => db.customers
      .filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      )
      .toArray(),
    [searchTerm]
  );

  const transactions = useLiveQuery(() => db.transactions.toArray());

  const totalUdhaar    = customers?.reduce((s, c) => s + c.total_udhaar, 0) ?? 0;
  const totalCustomers = customers?.length ?? 0;
  const debtors        = customers?.filter(c => c.total_udhaar > 0).length ?? 0;

  const txFor = (customerId: string) =>
    (transactions ?? [])
      .filter(t => t.customer_id === customerId)
      .sort((a, b) => b.created_at - a.created_at);

  const handleAddCustomer = async () => {
    if (!custForm.name.trim()) return;
    await db.customers.add({
      id: crypto.randomUUID(),
      name: custForm.name.trim(),
      phone: custForm.phone.trim(),
      total_udhaar: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    setCustForm({ name: '', phone: '' });
    setAddCustomer(false);
  };

  const handleTransaction = async () => {
    if (!txDialog || !txForm.amount) return;
    const amount = parseFloat(txForm.amount);
    if (isNaN(amount) || amount <= 0) return;

    const { customer, type } = txDialog;

    // Re-fetch fresh customer to avoid stale closure bug
    const fresh = await db.customers.get(customer.id);
    if (!fresh) return;

    await db.transactions.add({
      id: crypto.randomUUID(),
      customer_id: fresh.id,
      amount,
      type,
      description: txForm.description.trim() || (type === 'CREDIT' ? 'Udhaar added' : 'Payment received'),
      created_at: Date.now(),
    });

    const newBalance = type === 'CREDIT'
      ? fresh.total_udhaar + amount
      : Math.max(0, fresh.total_udhaar - amount);

    await db.customers.update(fresh.id, {
      total_udhaar: newBalance,
      updated_at: Date.now(),
    });

    setTxForm({ amount: '', description: '' });
    setTxDialog(null);
    // Keep row expanded so user sees the new transaction
    setExpandedId(customer.id);
  };

  const handleWhatsApp = (phone: string, amount: number) => {
    let p = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    if (!p.startsWith('92') && !p.startsWith('+92')) p = '92' + p;
    p = p.replace('+', '');
    const text = encodeURIComponent(
      `السلام علیکم،\nجناب، آپ کا ہماری ورکشاپ کی طرف PKR ${amount.toLocaleString()} کا ادھار باقی ہے۔ براہ کرم جلد ادائیگی کریں۔ شکریہ!`
    );
    window.open(`https://wa.me/${p}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-orange-500" /> Ledger
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track customer credit and payments.</p>
        </div>
        <Button onClick={() => setAddCustomer(true)} className="rounded-full px-5">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col gap-1">
          <span className="text-sm text-slate-400">Total Outstanding</span>
          <span className="text-4xl font-bold mt-1">PKR {totalUdhaar.toLocaleString()}</span>
          <span className="text-xs text-slate-400 mt-1">{debtors} customer{debtors !== 1 ? 's' : ''} with balance</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total Customers</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{totalCustomers}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Pending Udhaar</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-4xl font-bold text-amber-500 mt-1">{debtors}</span>
        </div>
      </div>

      {/* Search + Customer List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

        {/* Search bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 rounded-full bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 h-9"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_160px_160px_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-400 uppercase tracking-wide">
          <span>Customer</span>
          <span>Phone</span>
          <span className="text-right">Outstanding</span>
          <span className="text-right pr-1">Actions</span>
        </div>

        {/* Rows */}
        {!customers || customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No customers yet. Add one to get started.
          </div>
        ) : (
          customers.map(customer => {
            const isExpanded = expandedId === customer.id;
            const customerTxs = txFor(customer.id);

            return (
              <div key={customer.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">

                {/* Customer row */}
                <div
                  className="grid grid-cols-[1fr_160px_160px_auto] gap-4 px-6 py-4 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                >
                  <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                    {customer.name}
                  </div>
                  <div className="text-sm text-slate-500">{customer.phone || '—'}</div>
                  <div className="text-right">
                    {customer.total_udhaar > 0
                      ? <span className="text-red-600 dark:text-red-400 font-bold text-sm">PKR {customer.total_udhaar.toLocaleString()}</span>
                      : <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800">Cleared</Badge>
                    }
                  </div>
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      variant="outline" size="sm"
                      className="h-8 text-xs rounded-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                      onClick={() => { setTxDialog({ customer, type: 'CREDIT' }); setTxForm({ amount: '', description: '' }); }}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-1" /> Udhaar
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="h-8 text-xs rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950"
                      onClick={() => { setTxDialog({ customer, type: 'PAYMENT' }); setTxForm({ amount: '', description: '' }); }}
                    >
                      <ArrowDownLeft className="h-3 w-3 mr-1" /> Payment
                    </Button>
                    {customer.total_udhaar > 0 && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleWhatsApp(customer.phone, customer.total_udhaar)}
                        title="Send WhatsApp reminder"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded transaction history */}
                {isExpanded && (
                  <div className="px-6 pb-4 bg-slate-50/60 dark:bg-slate-900/30">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 pt-3">Transaction History</p>
                    {customerTxs.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2">No transactions yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerTxs.map(tx => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                tx.type === 'CREDIT'
                                  ? 'bg-red-100 dark:bg-red-900/30'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30'
                              )}>
                                {tx.type === 'CREDIT'
                                  ? <ArrowUpRight className="h-4 w-4 text-red-500" />
                                  : <ArrowDownLeft className="h-4 w-4 text-emerald-500" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.description}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              'font-bold text-sm',
                              tx.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                            )}>
                              {tx.type === 'CREDIT' ? '+' : '−'} PKR {tx.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={addCustomer} onOpenChange={setAddCustomer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Ali Hassan"
                value={custForm.name}
                onChange={e => setCustForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                placeholder="03xx-xxxxxxx"
                value={custForm.phone}
                onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleAddCustomer} disabled={!custForm.name.trim()}>
              Add Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={!!txDialog} onOpenChange={open => { if (!open) setTxDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {txDialog?.type === 'CREDIT'
                ? <ArrowUpRight className="h-5 w-5 text-red-500" />
                : <ArrowDownLeft className="h-5 w-5 text-emerald-500" />}
              {txDialog?.type === 'CREDIT' ? 'Add Udhaar' : 'Record Payment'}
              <span className="text-muted-foreground font-normal">— {txDialog?.customer.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={txForm.amount}
                onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                placeholder={txDialog?.type === 'CREDIT' ? 'e.g. Engine repair' : 'e.g. Cash payment'}
                value={txForm.description}
                onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleTransaction}
              disabled={!txForm.amount || parseFloat(txForm.amount) <= 0}
              variant={txDialog?.type === 'CREDIT' ? 'destructive' : 'default'}
            >
              {txDialog?.type === 'CREDIT' ? 'Add Udhaar' : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
