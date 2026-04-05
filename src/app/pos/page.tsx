'use client';

import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ShoppingCart, Search, User, CreditCard, Banknote, 
  Trash2, Plus, Minus, CheckCircle2, Store, Lock, 
  PlusCircle, Printer, X, Package, ConciergeBell,
} from 'lucide-react';
import { db, InventoryItem, ServiceCatalog, Customer, Invoice, StaffMember, Vehicle } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscription } from '@/components/SubscriptionProvider';
import { useLocation } from '@/components/LocationProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'PART' | 'SERVICE';
};

export default function POSPage() {
  const router = useRouter();
  const { currentLocationId } = useLocation();
  const { canUsePOS } = useSubscription();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'KHATA'>('CASH');
  const [saleSuccess, setSaleSuccess] = useState<Invoice | null>(null);

  // Quick Add Dialogs
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', plate: '' });

  const [showNewStaff, setShowNewStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Mechanic' });

  // Data
  const inventory = useLiveQuery(() => 
    db.inventory.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const catalog = useLiveQuery(() => 
    db.service_catalog.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const customers = useLiveQuery(() => 
     db.customers.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const staff = useLiveQuery(() => 
    db.staff.where('location_id').equals(currentLocationId || '').and(s => s.active).toArray(),
    [currentLocationId]
  );
  const vehicles = useLiveQuery(() => 
    db.vehicles.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );
  const allInvoices = useLiveQuery(() => 
    db.invoices.where('location_id').equals(currentLocationId || '').toArray(),
    [currentLocationId]
  );

  // Filtering
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const svc = (catalog ?? []).filter(s => s.name?.toLowerCase().includes(q)).map(s => ({ ...s, type: 'SERVICE' as const }));
    const inv = (inventory ?? []).filter(i => (i.name?.toLowerCase().includes(q)) && i.quantity > 0).map(i => ({ ...i, type: 'PART' as const }));
    return [...svc, ...inv];
  }, [catalog, inventory, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return (customers ?? []).filter(c => 
        (c.name?.toLowerCase().includes(q)) || 
        (c.phone?.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const selectableVehicles = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === 'WALK-IN') return [];
    let vs = (vehicles ?? []).filter(v => v.customer_id === selectedCustomerId);
    if (vehicleSearch) {
        const q = vehicleSearch.toLowerCase();
        vs = vs.filter(v => 
            v.license_plate.toLowerCase().includes(q) || 
            v.model.toLowerCase().includes(q) || 
            v.make.toLowerCase().includes(q)
        );
    }
    return vs;
  }, [vehicles, selectedCustomerId, vehicleSearch]);

  const filteredStaff = useMemo(() => {
    let ss = (staff ?? []);
    if (staffSearch) {
        const q = staffSearch.toLowerCase();
        ss = ss.filter(s => (s.name?.toLowerCase().includes(q)) || (s.role?.toLowerCase().includes(q)));
    }
    return ss;
  }, [staff, staffSearch]);

  if (!canUsePOS) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">POS is Locked</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          The Point-of-Sale module is exclusive to the **Pro Plan**. 
          Upgrade now to get FBR-ready invoicing and multi-location sales tracking.
        </p>
        <Link 
          href="/profile?tab=subscription" 
          className="rounded-full px-8 h-12 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.type === 'PART' && existing.quantity >= (item.quantity as number)) {
             alert('Out of stock!');
             return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.type === 'PART' ? (item.price || 0) : (item.default_price || 0),
        quantity: 1,
        type: item.type
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const setPrice = (id: string, price: number) => {
     setCart(prev => prev.map(i => i.id === id ? { ...i, price } : i));
  };

  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const total = subtotal;

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const id = crypto.randomUUID();
    await db.customers.add({
      id,
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      total_udhaar: 0,
      location_id: currentLocationId || '',
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    setSelectedCustomerId(id);
    setNewCustomer({ name: '', phone: '' });
    setShowNewCustomer(false);
  };

  const handleAddNewVehicle = async () => {
    if (!newVehicle.make.trim() || !newVehicle.plate.trim() || !selectedCustomerId) return;
    const id = crypto.randomUUID();
    await db.vehicles.add({
      id,
      customer_id: selectedCustomerId,
      location_id: currentLocationId || '',
      make: newVehicle.make.trim(),
      model: newVehicle.model.trim(),
      license_plate: newVehicle.plate.trim(),
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    setSelectedVehicleId(id);
    setNewVehicle({ make: '', model: '', plate: '' });
    setShowNewVehicle(false);
  };

  const handleAddNewStaff = async () => {
    if (!newStaff.name.trim() || !currentLocationId) return;
    const id = crypto.randomUUID();
    await db.staff.add({
      id,
      location_id: currentLocationId,
      name: newStaff.name.trim(),
      phone: '',
      role: newStaff.role,
      active: true,
      created_at: Date.now(),
    });
    setSelectedStaffId(id);
    setNewStaff({ name: '', role: 'Mechanic' });
    setShowNewStaff(false);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0 || !currentLocationId) return;

    const invoiceId = crypto.randomUUID();
    const count = (allInvoices?.length ?? 0) + 1;
    const invNum = `INV-${String(count).padStart(4, '0')}`;
    const cust = customers?.find(c => c.id === selectedCustomerId);
    const mech = staff?.find(s => s.id === selectedStaffId);
    const v = vehicles?.find(veh => veh.id === selectedVehicleId);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invNum,
      job_id: '', // Direct POS sale, no job card
      customer_id: selectedCustomerId,
      location_id: currentLocationId,
      staff_id: selectedStaffId,
      staff_name: mech?.name ?? '',
      vehicle_id: selectedVehicleId,
      customer_name: cust?.name ?? 'Walk-in Customer',
      customer_phone: cust?.phone ?? '',
      vehicle_make: v?.make ?? 'Direct Sale',
      vehicle_model: v?.model ?? 'POS',
      license_plate: v?.license_plate ?? 'N/A',
      services: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })), // Reusing JobService interface
      total_amount: total,
      advance_paid: paymentMethod === 'KHATA' ? 0 : total,
      balance: paymentMethod === 'KHATA' ? total : 0,
      status: paymentMethod === 'KHATA' ? 'UNPAID' : 'PAID',
      created_at: Date.now(),
    };

    await db.invoices.add(newInvoice);

    // If Khata, add transaction
    if (paymentMethod === 'KHATA' && selectedCustomerId && selectedCustomerId !== 'WALK-IN') {
      await db.transactions.add({
        id: crypto.randomUUID(),
        customer_id: selectedCustomerId,
        location_id: currentLocationId,
        amount: total,
        type: 'CREDIT',
        description: `POS Sale: ${invNum}`,
        created_at: Date.now(),
      });
      await db.customers.update(selectedCustomerId, {
          total_udhaar: (cust?.total_udhaar ?? 0) + total,
          updated_at: Date.now()
      });
    }

    // Decrement inventory
    for (const item of cart) {
      if (item.type === 'PART') {
        const invItem = inventory?.find(i => i.id === item.id);
        if (invItem) {
          await db.inventory.update(item.id, {
            quantity: Math.max(0, invItem.quantity - item.quantity)
          });
        }
      }
    }

    setSaleSuccess(newInvoice);
    setCart([]);
    setSelectedStaffId('');
    setSelectedVehicleId('');
  };

  const handlePrint = () => {
    if (saleSuccess) {
      router.push(`/invoices/${saleSuccess.id}` as any);
      setSaleSuccess(null);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 pb-6 overflow-hidden">
      
      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-500" /> POS Catalog
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-9 rounded-full h-10" 
                placeholder="Search part or service..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredCatalog.map(item => (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-left group flex flex-col justify-between h-32"
              >
                <div>
                    <div className="flex items-center justify-between mb-1">
                        {item.type === 'SERVICE' ? (
                            <ConciergeBell className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                            <Package className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {item.type === 'PART' && (
                            <span className="text-[10px] font-bold text-slate-400">{item.quantity} in stock</span>
                        )}
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-orange-500">{item.name}</p>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    PKR {(item.type === 'SERVICE' ? (item as any).default_price : (item as any).price || 0).toLocaleString()}
                </p>
              </button>
            ))}
            {filteredCatalog.length === 0 && (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                    <Search className="h-10 w-10 opacity-20 mb-2" />
                    <p>No matching items found</p>
                 </div>
            )}
          </div>
        </div>

        {/* Success State Overlay/Card */}
        {saleSuccess ? (
             <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-20 w-20 text-white mb-6" />
                <h3 className="text-3xl font-black mb-2">Sale Complete!</h3>
                <p className="text-emerald-100 max-w-xs text-lg font-medium opacity-90 mb-8">
                    Invoice **{saleSuccess.invoice_number}** generated successfully.
                </p>
                <div className="flex gap-4">
                    <Button onClick={handlePrint} className="rounded-full px-8 bg-white text-emerald-600 hover:bg-emerald-50 font-bold h-14 text-lg">
                        <Printer className="mr-2 h-5 w-5" /> Print Invoice
                    </Button>
                    <Button onClick={() => setSaleSuccess(null)} variant="ghost" className="rounded-full px-8 text-white hover:bg-white/10 font-bold h-14">
                        Next Customer
                    </Button>
                </div>
             </div>
        ) : (
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden border border-slate-800">
                <ShoppingCart className="h-32 w-32 opacity-5 absolute -bottom-8 -right-8 rotate-12" />
                <Store className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">Ready for Checkout</h3>
                <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
                    Select a customer and add items to the cart to complete a sale and generate an invoice.
                </p>
            </div>
        )}
      </div>

      {/* Right Column: Cart / Checkout */}
      <div className="w-[450px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-lg flex flex-col overflow-hidden relative">
        
        {/* Customer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Checkout</h2>
            <button 
                onClick={() => setShowNewCustomer(true)}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 uppercase tracking-wider"
            >
                <PlusCircle className="h-3.5 w-3.5" /> New Customer
            </button>
          </div>

          <div className="space-y-3">
            {/* Customer Search & Select */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input 
                  id="customer-search-input"
                  placeholder="Search existing customer..." 
                  className="pl-9 h-9 text-xs rounded-xl border-slate-100"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Select 
                value={selectedCustomerId} 
                onValueChange={(v: string | null) => { 
                  const cid = v ?? '';
                  setSelectedCustomerId(cid); 
                  setVehicleSearch('');
                  
                  // Auto-select first vehicle for this customer
                  if (cid && cid !== 'WALK-IN') {
                    const firstVehicle = (vehicles ?? []).find(veh => veh.customer_id === cid);
                    if (firstVehicle) {
                      setSelectedVehicleId(firstVehicle.id);
                    } else {
                      setSelectedVehicleId('');
                    }
                  } else {
                    setSelectedVehicleId('');
                  }
                }}
              >
                <SelectTrigger className="rounded-2xl h-11 border-slate-100 dark:border-slate-700">
                    <SelectValue placeholder="Select Customer (Walk-in)">
                      {selectedCustomerId === 'WALK-IN' ? "Walk-in Customer" : (customers?.find(c => c.id === selectedCustomerId)?.name || "Select Customer (Walk-in)")}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="WALK-IN">Walk-in Customer</SelectItem>
                    {/* Ensure selected customer is always available if not in filtered list */}
                    {selectedCustomerId && selectedCustomerId !== 'WALK-IN' && !filteredCustomers.some(c => c.id === selectedCustomerId) && (
                        (() => {
                            const sc = (customers ?? []).find(c => c.id === selectedCustomerId);
                            return sc ? <SelectItem key={sc.id} value={sc.id}>{sc.name} · {sc.phone}</SelectItem> : null;
                        })()
                    )}
                    {filteredCustomers?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} · {c.phone}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle & Staff Selection */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Vehicle</Label>
                    {selectedCustomerId && selectedCustomerId !== 'WALK-IN' && (
                        <button onClick={() => setShowNewVehicle(true)} className="text-[10px] text-orange-500 font-bold hover:underline">Add New</button>
                    )}
                </div>
                
                {selectedCustomerId && selectedCustomerId !== 'WALK-IN' && (
                  <div className="relative mb-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 pointer-events-none" />
                    <Input 
                      id="vehicle-search-input"
                      placeholder="Search..." 
                      className="pl-7.5 h-8 text-[10px] rounded-lg border-slate-100"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                )}

                <Select value={selectedVehicleId} onValueChange={(v: string | null) => setSelectedVehicleId(v ?? '')} disabled={!selectedCustomerId || selectedCustomerId === 'WALK-IN' || (selectableVehicles?.length === 0 && !showNewVehicle && !vehicleSearch)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs border-slate-100">
                    <SelectValue placeholder="No Vehicle">
                      {vehicles?.find(v => v.id === selectedVehicleId)?.license_plate || "No Vehicle"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Ensure selected vehicle is always available */}
                    {selectedVehicleId && !selectableVehicles.some(v => v.id === selectedVehicleId) && (
                        (() => {
                            const sv = (vehicles ?? []).find(v => v.id === selectedVehicleId);
                            return sv ? <SelectItem key={sv.id} value={sv.id}>{sv.license_plate} · {sv.model}</SelectItem> : null;
                        })()
                    )}
                    {selectableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.license_plate} · {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Technician</Label>
                    <button onClick={() => setShowNewStaff(true)} className="text-[10px] text-orange-500 font-bold hover:underline">Add New</button>
                </div>

                {staff && staff.length > 5 && (
                  <div className="relative mb-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300 pointer-events-none" />
                    <Input 
                      id="staff-search-input"
                      placeholder="Search..." 
                      className="pl-7.5 h-8 text-[10px] rounded-lg border-slate-100"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                )}

                <Select value={selectedStaffId} onValueChange={(v: string | null) => setSelectedStaffId(v ?? '')}>
                  <SelectTrigger className="rounded-xl h-10 text-xs border-slate-100">
                    <SelectValue placeholder="Select Staff">
                       {staff?.find(s => s.id === selectedStaffId)?.name || "Select Staff"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {selectedStaffId && !filteredStaff.some(s => s.id === selectedStaffId) && (
                        (() => {
                            const ss = (staff ?? []).find(s => s.id === selectedStaffId);
                            return ss ? <SelectItem key={ss.id} value={ss.id}>{ss.name}</SelectItem> : null;
                        })()
                    )}
                    {filteredStaff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
              <ShoppingCart className="h-12 w-12" />
              <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-black",
                        item.type === 'SERVICE' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                      )}>{item.type}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">PKR {(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-400 hover:text-red-500 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Price:</span>
                        <Input 
                            type="number" 
                            className="h-8 w-24 text-right text-xs font-bold rounded-lg border-slate-100" 
                            value={item.price}
                            onChange={(e) => setPrice(item.id, parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Totals & Complete */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 space-y-5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
              {[
                  { id: 'CASH', icon: Banknote, label: 'Cash' },
                  { id: 'CARD', icon: CreditCard, label: 'Card' },
                  { id: 'KHATA', icon: User, label: 'Udhaar' },
              ].map(m => {
                  const isActive = paymentMethod === m.id;
                  return (
                      <button 
                         key={m.id}
                         onClick={() => setPaymentMethod(m.id as any)}
                         className={cn(
                             "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                             isActive 
                                ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105" 
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                         )}
                      >
                         <m.icon className={cn("h-4 w-4", !isActive && "text-slate-400")} />
                         <span className="text-[10px] font-black uppercase tracking-wider">{m.label}</span>
                      </button>
                  );
              })}
          </div>

          <div className="flex items-center justify-between text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-4">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="text-3xl font-black">PKR {total.toLocaleString()}</span>
          </div>

          <Button 
            onClick={handleCompleteSale}
            className="w-full rounded-2xl h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xl shadow-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3" 
            disabled={cart.length === 0 || !!saleSuccess}
          >
            {paymentMethod === 'KHATA' ? 'Create Udhaar Sale' : 'Complete Payment'} 
            <CheckCircle2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Dialogs */}
        <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
            <DialogContent>
                <DialogHeader><DialogTitle>Quick Register Customer</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Usman Khan" value={newCustomer.name} onChange={e => setNewCustomer(prev => ({...prev, name: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="03xx xxxxxxx" value={newCustomer.phone} onChange={e => setNewCustomer(prev => ({...prev, phone: e.target.value}))} />
                    </div>
                    <Button onClick={handleAddNewCustomer} className="w-full rounded-xl" disabled={!newCustomer.name.trim()}>
                        Add & Select
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showNewVehicle} onOpenChange={setShowNewVehicle}>
            <DialogContent>
                <DialogHeader><DialogTitle>Quick Add Vehicle</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Make</Label>
                            <Input placeholder="Suzuki" value={newVehicle.make} onChange={e => setNewVehicle(prev => ({...prev, make: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Input placeholder="Alto" value={newVehicle.model} onChange={e => setNewVehicle(prev => ({...prev, model: e.target.value}))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>License Plate</Label>
                        <Input placeholder="ABC-1234" value={newVehicle.plate} onChange={e => setNewVehicle(prev => ({...prev, plate: e.target.value}))} />
                    </div>
                    <Button onClick={handleAddNewVehicle} className="w-full rounded-xl" disabled={!newVehicle.make.trim() || !newVehicle.plate.trim()}>
                        Add & Select Vehicle
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showNewStaff} onOpenChange={setShowNewStaff}>
            <DialogContent>
                <DialogHeader><DialogTitle>Quick Hire Staff</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Staff Name</Label>
                        <Input placeholder="Ali Ahmed" value={newStaff.name} onChange={e => setNewStaff(prev => ({...prev, name: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newStaff.role} onValueChange={(v: string | null) => setNewStaff(prev => ({...prev, role: v ?? 'Mechanic'}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Mechanic">Mechanic</SelectItem>
                                <SelectItem value="Electrician">Electrician</SelectItem>
                                <SelectItem value="Painter">Painter</SelectItem>
                                <SelectItem value="Helper">Helper</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddNewStaff} className="w-full rounded-xl" disabled={!newStaff.name.trim()}>
                        Add & Select Staff
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

    </div>
  );
}
