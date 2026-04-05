'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const upgradePlan = async (tier: string) => {
    setLoadingTier(tier);
    try {
      const response = await fetch('/api/safepay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      const data = await response.json();
      
      if (data.checkoutUrl) {
         // In production, we'd redirect to SafePay checkout
         // window.location.href = data.checkoutUrl;
         alert(`Sandbox initialized.\nTracker: ${data.tracker}\nURL: ${data.checkoutUrl}\n\nThis is a mock implementation.`);
      }
    } catch (error) {
       console.error("Failed to init checkout", error);
    } finally {
       setLoadingTier(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Settings & Billing</h1>
          <p className="text-muted-foreground">Manage your workshop preferences and subscription.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
         {/* Free Tier */}
         <Card>
            <CardHeader>
               <CardTitle>Muft (Free)</CardTitle>
               <CardDescription>Independent / Mobile Mechanic</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold mb-6">PKR 0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
               <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Max 50 Jobs/mo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Udhaar Tracker</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Offline Mode</li>
               </ul>
            </CardContent>
            <CardFooter>
               <Button variant="outline" className="w-full" disabled>Current Plan</Button>
            </CardFooter>
         </Card>

         {/* Karobar Tier */}
         <Card className="border-primary shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">Popular</div>
            <CardHeader>
               <CardTitle>Karobar</CardTitle>
               <CardDescription>General Garage / Tire Shop</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold mb-6">PKR 1,500<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
               <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Jobs</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Inventory Management</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> WhatsApp Reminders</li>
               </ul>
            </CardContent>
            <CardFooter>
               <Button 
                className="w-full" 
                onClick={() => upgradePlan('karobar')}
                disabled={loadingTier !== null}
               >
                 {loadingTier === 'karobar' ? 'Loading SafePay...' : 'Upgrade Now'}
               </Button>
            </CardFooter>
         </Card>

         {/* Ustad Tier */}
         <Card>
            <CardHeader>
               <CardTitle>Ustad</CardTitle>
               <CardDescription>Enterprise / Detailing</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-bold mb-6">PKR 3,000<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
               <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Multi-location Hub</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Bay Scheduling</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> FBR-ready POS</li>
               </ul>
            </CardContent>
            <CardFooter>
               <Button 
                variant="outline"
                className="w-full"
                onClick={() => upgradePlan('ustad')}
                disabled={loadingTier !== null}
               >
                 {loadingTier === 'ustad' ? 'Loading SafePay...' : 'Upgrade to Enterprise'}
               </Button>
            </CardFooter>
         </Card>
      </div>

      <div className="mt-8 flex items-center justify-center p-4 gap-2 text-muted-foreground text-sm bg-muted/20 border rounded-lg max-w-5xl">
         <ShieldCheck className="h-5 w-5" />
         Payments processed securely via JazzCash, EasyPaisa, and Raast through SafePay.
      </div>
    </div>
  );
}
