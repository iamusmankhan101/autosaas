'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAuth } from '@/components/AuthProvider';
import { useSubscription, Plan } from '@/components/SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    User as UserIcon, Mail, Store, ShieldCheck, LogOut, Save, BadgeCheck, 
    Building2, UserCircle2, Loader2, KeyRound, CheckCircle2, AlertCircle,
    Zap, Sparkles, Crown, Check, X, Image as ImageIcon, FileText, Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'account';

  const { user, updateUser, changePassword, logout } = useAuth();
  const { plan, setPlan } = useSubscription();
  
  // Profile State
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    workshop_name: user?.workshop_name || ''
  });

  // Invoice Branding State
  const [logo, setLogo] = useState<string | null>(null);
  const [invoiceHeading, setInvoiceHeading] = useState('');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray());

  // Subscription State
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        workshop_name: user.workshop_name || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      const logoSetting = settings.find(s => s.key === 'workshop_logo');
      if (logoSetting) setLogo(logoSetting.value);
      
      const headingSetting = settings.find(s => s.key === 'invoice_heading');
      if (headingSetting) setInvoiceHeading(headingSetting.value || '');

      const footerSetting = settings.find(s => s.key === 'invoice_footer');
      if (footerSetting) setInvoiceFooter(footerSetting.value || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      await updateUser({
        name: formData.name,
        workshop_name: formData.workshop_name
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPassError('Password must be at least 4 characters.');
      return;
    }
    setIsUpdatingPass(true);
    setPassError('');
    try {
      await changePassword(newPassword);
      setPassSuccess(true);
      setNewPassword('');
      setTimeout(() => {
        setPassSuccess(false);
        setShowPassForm(false);
      }, 3000);
    } catch (err) {
      setPassError('Failed to update password.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveInvoiceSettings = async () => {
    setIsSavingLogo(true);
    try {
      await db.settings.put({ key: 'workshop_logo', value: logo });
      await db.settings.put({ key: 'invoice_heading', value: invoiceHeading });
      await db.settings.put({ key: 'invoice_footer', value: invoiceFooter });
      await new Promise(r => setTimeout(r, 500));
    } finally {
      setIsSavingLogo(false);
    }
  };

  const upgradePlan = async (tier: Plan) => {
    setLoadingTier(tier);
    try {
      await new Promise(r => setTimeout(r, 1200)); 
      await setPlan(tier);
    } catch (error) {
       console.error("Failed to update plan", error);
    } finally {
       setLoadingTier(null);
    }
  };

  if (!user) return null;

  const TIERS = [
    {
      id: 'FREE',
      name: 'Muft (Free)',
      desc: 'Independent Mechanics',
      price: '0',
      tag: 'Starter',
      color: 'slate',
      icon: <Zap className="h-5 w-5 text-slate-500" />,
      features: [
        { label: 'Max 100 Jobs/mo', included: true },
        { label: 'Inventory Tracking', included: true },
        { label: 'Digital Ledger (Khata)', included: true },
        { label: 'Bay Scheduling', included: false },
        { label: 'Workflow Pipeline', included: false },
      ]
    },
    {
      id: 'BASIC',
      name: 'Basic',
      desc: 'General Workshop',
      price: '3,000',
      tag: 'Recommended',
      color: 'orange',
      icon: <Sparkles className="h-5 w-5 text-orange-500" />,
      features: [
        { label: 'Unlimited Jobs', included: true },
        { label: 'Bay Scheduling', included: true },
        { label: 'Workflow Management', included: true },
        { label: 'Staff Performance', included: true },
        { label: 'Multi-location Hub', included: false },
      ]
    },
    {
      id: 'PRO',
      name: 'Pro',
      desc: 'Enterprise / Multi-outlet',
      price: '7,000',
      tag: 'Power User',
      color: 'emerald',
      icon: <Crown className="h-5 w-5 text-emerald-500" />,
      features: [
        { label: 'Multi-location Hub', included: true, highlight: true },
        { label: 'POS (Point of Sale)', included: true, highlight: true },
        { label: 'Advanced Analytics', included: true },
        { label: 'WhatsApp Marketing', included: true },
        { label: 'Custom Branding', included: true },
      ]
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 lg:py-12 space-y-12">
      
      {/* Profile Hero */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-[3rem] blur-3xl opacity-50 transition-opacity" />
        <div className="relative flex flex-col md:flex-row items-center gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white/20 shadow-xl">
           <div className="relative">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-slate-200 overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-1 right-1 w-9 h-9 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
                 <BadgeCheck className="w-4 h-4 text-white" />
              </div>
           </div>
           
           <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{user.name}</h1>
                <span className="inline-flex px-3 py-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full">{plan} Account</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-5 text-slate-500 font-medium">
                 <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-orange-500" /> {user.workshop_name || 'Main Branch'}</div>
                 <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /> {user.email}</div>
              </div>
           </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-10">
        <div className="flex items-center justify-center">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full h-14 border border-slate-200 dark:border-slate-700">
                <TabsTrigger value="account" className="rounded-full px-8 h-11 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4" /> Profile Info
                </TabsTrigger>
                <TabsTrigger value="subscription" className="rounded-full px-8 h-11 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Subscription
                </TabsTrigger>
                <TabsTrigger value="branding" className="rounded-full px-8 h-11 text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Invoicing
                </TabsTrigger>
            </TabsList>
        </div>

        {/* Tab 1: Account Information */}
        <TabsContent value="account" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl overflow-hidden ring-1 ring-black/5">
                        <CardHeader className="p-8 md:p-10 pb-4 text-left">
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <Settings2 className="w-6 h-6 text-orange-500" /> Account Settings
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium pt-1">Update your professional details and workshop identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 md:p-10 pt-4 space-y-8">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <Label className="text-slate-500 font-black ml-1 text-[10px] uppercase tracking-widest">Full Name</Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500" />
                                            <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 text-base font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-slate-500 font-black ml-1 text-[10px] uppercase tracking-widest">Workshop Name</Label>
                                        <div className="relative">
                                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500" />
                                            <Input value={formData.workshop_name} onChange={e => setFormData(f => ({ ...f, workshop_name: e.target.value }))} className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 text-base font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2 opacity-60">
                                        <Label className="text-slate-500 font-black ml-1 text-[10px] uppercase tracking-widest">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <Input value={formData.email} readOnly className="h-14 pl-12 rounded-2xl bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-0 text-base font-bold" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-8">
                                    <p className="text-xs text-slate-400 font-medium max-w-[250px] text-left">Your identity is used for official invoices and reports generated by MistryApp.</p>
                                    <Button type="submit" disabled={isSaving} className="w-full md:w-auto h-14 px-10 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 active:scale-[0.98] transition-all font-black uppercase text-xs shadow-xl tracking-wider">
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />} Save Settings
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-black/5 overflow-hidden">
                        <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                            <ShieldCheck className="w-5 h-5 text-orange-500" /> Security
                        </CardTitle>
                        <div className="space-y-4">
                            {!showPassForm ? (
                                <Button onClick={() => setShowPassForm(true)} variant="ghost" className="w-full justify-between h-14 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold transition-all px-4 border border-transparent hover:border-slate-100">
                                    Change Password <KeyRound className="w-4 h-4 opacity-30" />
                                </Button>
                            ) : (
                                <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300 text-left">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">New Access Key</Label>
                                        <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 font-bold" autoFocus />
                                    </div>
                                    {passError && <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3" /> {passError}</p>}
                                    {passSuccess && <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 ml-1"><CheckCircle2 className="w-3 h-3" /> Updated!</p>}
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isUpdatingPass || passSuccess} className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest">{isUpdatingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Key'}</Button>
                                        <Button type="button" variant="ghost" onClick={() => { setShowPassForm(false); setPassError(''); setNewPassword(''); }} className="h-12 rounded-xl text-slate-400 font-bold text-xs">Cancel</Button>
                                    </div>
                                </form>
                            )}
                            <Button onClick={logout} variant="ghost" className="w-full justify-between h-14 rounded-2xl text-red-500 hover:text-red-700 hover:bg-red-50 font-black transition-all px-4 uppercase tracking-widest text-[11px]">
                                Sign Out <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* Tab 2: Subscription */}
        <TabsContent value="subscription" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {TIERS.map((tier) => {
                    const isActive = plan === tier.id;
                    const isPro = tier.id === 'PRO';
                    const isBasic = tier.id === 'BASIC';

                    return (
                        <Card key={tier.id} className={cn("relative group transition-all duration-500 rounded-[2.5rem] border-0 shadow-2xl overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20", isActive && "ring-2 ring-slate-900 dark:ring-white scale-[1.02] z-10", !isActive && "translate-y-2 hover:translate-y-0")}>
                            <div className={cn("absolute top-0 left-0 w-full h-2", isPro ? "bg-emerald-500" : isBasic ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700")} />
                            <CardHeader className="pt-10 pb-8 px-8 text-left">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-4", isPro ? "bg-emerald-50 dark:bg-emerald-950/50" : isBasic ? "bg-orange-50 dark:bg-orange-950/50" : "bg-slate-50")}>{tier.icon}</div>
                                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tier.name}</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">{tier.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="px-8 flex-1 text-left">
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-sm font-black text-slate-400 uppercase">PKR</span>
                                    <span className="text-5xl font-black text-slate-900 dark:text-white">{tier.price}</span>
                                    <span className="text-slate-400 font-bold ml-1">/mo</span>
                                </div>
                                <div className="space-y-4">
                                    <ul className="space-y-3">
                                        {tier.features.map((feat, i) => (
                                            <li key={i} className={cn("flex items-center gap-3 text-sm transition-opacity", !feat.included && "opacity-40 grayscale")}>
                                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", feat.included ? (isPro ? "bg-emerald-100 text-emerald-600" : isBasic ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500") : "bg-slate-50 text-slate-300")}>{feat.included ? <Check className="h-3 w-3" strokeWidth={4} /> : <X className="h-3 w-3" />}</div>
                                                <span className="font-medium">{feat.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 pt-4">
                                <Button onClick={() => upgradePlan(tier.id as Plan)} disabled={isActive || loadingTier !== null} className={cn("w-full h-14 rounded-2xl font-black text-lg transition-all", isActive ? "bg-slate-100 text-slate-400 border border-slate-200" : (isPro ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl" : isBasic ? "bg-orange-600 hover:bg-orange-700 text-white shadow-xl" : "bg-slate-900 text-white shadow-xl"))}>
                                    {loadingTier === tier.id ? <Loader2 className="animate-spin" /> : isActive ? 'Current Plan' : `Select ${tier.name}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </TabsContent>

        {/* Tab 3: Branding */}
        <TabsContent value="branding" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-xl mx-auto">
                <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden text-left">
                    <div className="h-2 bg-orange-500 w-full" />
                    <CardHeader className="p-10 pb-6">
                        <CardTitle className="text-3xl font-black tracking-tight">Invoice Branding</CardTitle>
                        <CardDescription>Upload your workshop logo to show on official invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-sm font-black uppercase tracking-widest text-slate-400">Workshop Logo</Label>
                            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 group hover:border-orange-500/50 transition-colors relative">
                                {logo ? (
                                    <div className="relative group/logo">
                                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-white"><img src={logo} alt="Logo" className="w-full h-full object-contain" /></div>
                                        <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"><X className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>
                                        <div className="space-y-1"><p className="text-sm font-bold text-slate-600 dark:text-slate-300">Choose custom logo</p><p className="text-xs text-slate-400">PNG or JPG (Max. 500kb)</p></div>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        <div className="space-y-2 group text-left">
                            <Label className="text-slate-500 font-black ml-1 text-[10px] uppercase tracking-widest">Invoice Subheading / Location</Label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <Input 
                                    placeholder="e.g. Lahore's Digital Workshop" 
                                    value={invoiceHeading}
                                    onChange={(e) => setInvoiceHeading(e.target.value)}
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 text-sm font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group text-left">
                            <Label className="text-slate-500 font-black ml-1 text-[10px] uppercase tracking-widest">Invoice Footer Text</Label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <Input 
                                    placeholder="e.g. Thank you for choosing us!" 
                                    value={invoiceFooter}
                                    onChange={(e) => setInvoiceFooter(e.target.value)}
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 flex gap-4">
                            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-relaxed font-bold uppercase tracking-widest">Logo will appear on the top-left header of all customer invoices and job cards.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="p-10 pt-0">
                        <Button onClick={saveInvoiceSettings} disabled={isSavingLogo} className="w-full h-16 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xl shadow-xl shadow-orange-600/20 uppercase tracking-widest">
                            {isSavingLogo ? <Loader2 className="animate-spin" /> : 'Save Branding'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
