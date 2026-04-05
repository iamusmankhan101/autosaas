'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { FileText, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/components/LocationProvider';

const STATUS_STYLE = {
  PAID:    { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  PARTIAL: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         icon: <Clock className="h-3 w-3" /> },
  UNPAID:  { cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',                 icon: <AlertCircle className="h-3 w-3" /> },
};

export default function InvoicesPage() {
  const { currentLocationId } = useLocation();
  const router = useRouter();
  const invoices = useLiveQuery(() =>
    db.invoices.where('location_id').equals(currentLocationId || '').toArray().then(i => i.sort((a, b) => b.created_at - a.created_at)),
    [currentLocationId]
  );

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    await db.invoices.delete(id);
  };

  const total   = invoices?.reduce((s, i) => s + i.total_amount, 0) ?? 0;
  const paid    = invoices?.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total_amount, 0) ?? 0;
  const unpaid  = invoices?.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.balance, 0) ?? 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="my-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="h-7 w-7 text-orange-500" /> Invoices
        </h1>
        <p className="text-slate-500 text-sm mt-1">All generated invoices across jobs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-3xl p-6">
          <p className="text-xs text-slate-400">Total Invoiced</p>
          <p className="text-4xl font-bold mt-1">PKR {total.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{invoices?.length ?? 0} invoices</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6">
          <p className="text-xs text-slate-500">Collected</p>
          <p className="text-4xl font-bold text-emerald-500 mt-1">PKR {paid.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-4xl font-bold text-red-500 mt-1">PKR {unpaid.toLocaleString()}</p>
        </div>
      </div>

      {/* List */}
      {!invoices || invoices.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <FileText className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No invoices yet.</p>
          <p className="text-sm mt-1">Generate one from a Job Card using the invoice icon.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_100px] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700">
            <span>Invoice #</span>
            <span>Customer / Vehicle</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span />
          </div>
          {invoices.map((inv) => {
            const st = STATUS_STYLE[inv.status];
            return (
              <div
                key={inv.id}
                className={cn(
                  'grid grid-cols-[1fr_1.5fr_1fr_1fr_100px] gap-4 px-6 py-4 items-center border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer'
                )}
                onClick={() => router.push(`/invoices/${inv.id}` as any)}
              >
                <div>
                  <p className="font-mono font-semibold text-sm text-slate-900 dark:text-white">{inv.invoice_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-white">{inv.customer_name}</p>
                  <p className="text-xs font-mono text-slate-400">{inv.vehicle_make} {inv.vehicle_model} · {inv.license_plate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">PKR {inv.total_amount.toLocaleString()}</p>
                  {inv.balance > 0 && (
                    <p className="text-xs text-red-500">Due: PKR {inv.balance.toLocaleString()}</p>
                  )}
                  {inv.staff_name && (
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Tech: <span className="text-orange-500">{inv.staff_name}</span></p>
                  )}
                </div>
                <div>
                  <span className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit', st.cls)}>
                    {st.icon} {inv.status}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/invoices/${inv.id}` as any)}
                    className="text-xs text-orange-500 font-medium hover:underline"
                  >
                    View →
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id, inv.invoice_number)}
                    className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete invoice"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
