'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const invoice = useLiveQuery(() => db.invoices.get(id), [id]);
  const settings = useLiveQuery(() => db.settings.toArray());
  const logo = settings?.find(s => s.key === 'workshop_logo')?.value;
  const invoiceHeading = settings?.find(s => s.key === 'invoice_heading')?.value || "Lahore's Digital Workshop";
  const invoiceFooter = settings?.find(s => s.key === 'invoice_footer')?.value || "MistryApp · Lahore's Digital Workshop Companion";

  const markPaid = async () => {
    if (!invoice) return;
    await db.invoices.update(invoice.id, { status: 'PAID', balance: 0 });
    // also update job advance_paid
    if (invoice.job_id) {
      await db.jobs.update(invoice.job_id, {
        advance_paid: invoice.total_amount,
        updated_at: Date.now(),
      });
    }
  };

  if (invoice === undefined) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  }
  if (invoice === null) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Invoice not found.</div>;
  }

  const STATUS_COLOR = {
    PAID:    'text-emerald-600 bg-emerald-50 border-emerald-200',
    PARTIAL: 'text-amber-600 bg-amber-50 border-amber-200',
    UNPAID:  'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="pb-10">
      {/* Toolbar — hidden on print */}
      <div className="my-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push('/invoices' as any)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>
        <div className="flex items-center gap-3">
          {invoice.status !== 'PAID' && (
            <Button variant="outline" onClick={markPaid} className="rounded-full">
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Mark as Paid
            </Button>
          )}
          <Button onClick={() => window.print()} className="rounded-full px-5">
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice document */}
      <div id="invoice-print" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-2xl mx-auto p-8 print:shadow-none print:border-none print:rounded-none print:max-w-full">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            {logo ? (
              <div className="w-40 h-16 mb-2">
                <img src={logo} alt="Workshop Logo" className="w-full h-full object-contain object-left" />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MistryApp</h1>
            )}
            <p className="text-sm text-slate-400 mt-0.5">{invoiceHeading}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-500">{invoice.invoice_number}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(invoice.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border mt-2', STATUS_COLOR[invoice.status])}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Customer + Vehicle + Technician */}
        <div className="grid grid-cols-2 gap-6 mb-8 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-semibold text-slate-900 dark:text-white">{invoice.customer_name}</p>
            {invoice.customer_phone && (
              <p className="text-sm text-slate-500 mt-0.5">{invoice.customer_phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Vehicle</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {invoice.vehicle_make} {invoice.vehicle_model}
            </p>
            <p className="text-sm font-mono text-slate-500 mt-0.5">{invoice.license_plate}</p>
          </div>
          {invoice.staff_name && (
            <div className="col-span-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
               <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Technician / Inspector</p>
               <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{invoice.staff_name}</p>
            </div>
          )}
        </div>

        {/* Services table */}
        <div className="mb-6">
          <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold uppercase tracking-wide rounded-t-xl">
            <span>Service / Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Amount</span>
          </div>
          {invoice.services.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400 border border-t-0 border-slate-100 dark:border-slate-700 rounded-b-xl">
              General Service
            </div>
          ) : (
            invoice.services.map((svc, i) => (
              <div
                key={svc.id}
                className={cn(
                  'grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-3 text-sm border-x border-b border-slate-100 dark:border-slate-700',
                  i === invoice.services.length - 1 && 'rounded-b-xl'
                )}
              >
                <span className="text-slate-700 dark:text-slate-200 font-medium">{svc.name}</span>
                <span className="text-right text-slate-500 font-bold">{svc.quantity || 1}</span>
                <span className="text-right font-black text-slate-900 dark:text-white">PKR {(svc.price * (svc.quantity || 1)).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>PKR {invoice.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Advance Paid</span>
              <span>− PKR {invoice.advance_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Balance Due</span>
              <span className={invoice.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                PKR {invoice.balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 text-center">
          <p className="text-sm text-slate-400">Thank you for your business!</p>
          <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-black">{invoiceFooter}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
