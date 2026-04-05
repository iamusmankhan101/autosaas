'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, User, Mail, Store, Lock, Loader2, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    workshop: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!form.name || !form.email || !form.workshop) {
        setError('Please fill all required fields.');
        return;
      }
      const success = await register(form.name, form.email, form.workshop);
      if (!success) {
        setError('Email already registered.');
      }
    } catch (err) {
      setError('An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-[#f0ebe6] overflow-hidden relative">
      
      {/* Premium Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[120px] opacity-60 pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[60vw] h-[60vw] bg-orange-100/40 rounded-full blur-[120px] opacity-60 pointer-events-none translate-y-1/2 translate-x-1/2" />

      <Card className="max-w-[480px] w-full border-0 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[3rem] bg-white/80 backdrop-blur-3xl overflow-hidden ring-1 ring-black/5 relative z-10 transition-all hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.15)]">
        <CardContent className="p-8 md:p-12 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
             <div className="w-16 h-16 bg-orange-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-lg shadow-orange-600/20 mb-6 group transition-transform hover:scale-110">
                <span className="text-white font-black text-3xl leading-none">M</span>
             </div>
             <h1 className="text-3xl font-black tracking-tight text-slate-900">Setup Your <span className="text-orange-600">Workshop</span></h1>
             <p className="text-slate-500 font-medium leading-relaxed italic">Join 500+ mechanics transforming their workshops in Pakistan.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              
              <div className="space-y-1.5 group">
                <Label className="text-slate-500 font-bold ml-1 text-xs uppercase tracking-widest">Full Name</Label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                   <Input 
                     placeholder="Ali Ahmed" 
                     className="h-14 pl-12 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 focus-visible:bg-white transition-all text-base font-medium"
                     value={form.name}
                     onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                     required
                   />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-slate-500 font-bold ml-1 text-xs uppercase tracking-widest">Workshop Name</Label>
                <div className="relative">
                   <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                   <Input 
                     placeholder="Mistry Mechanics (Main Branch)" 
                     className="h-14 pl-12 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 focus-visible:bg-white transition-all text-base font-medium"
                     value={form.workshop}
                     onChange={e => setForm(f => ({ ...f, workshop: e.target.value }))}
                     required
                   />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-slate-500 font-bold ml-1 text-xs uppercase tracking-widest">Business Email</Label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                   <Input 
                     type="email" 
                     placeholder="owner@workshop.com" 
                     className="h-14 pl-12 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 focus-visible:bg-white transition-all text-base font-medium"
                     value={form.email}
                     onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                     required
                   />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <Label className="text-slate-500 font-bold ml-1 text-xs uppercase tracking-widest">Access Key (Password)</Label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                   <Input 
                     type="password" 
                     placeholder="••••••••" 
                     className="h-14 pl-12 rounded-2xl bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-orange-600/20 focus-visible:bg-white transition-all text-base font-medium"
                     value={form.password}
                     onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                     required
                   />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm font-bold text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 italic">
                 {error}
              </p>
            )}

            <Button 
               type="submit" 
               className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-base font-bold shadow-xl shadow-orange-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
               disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setting Up...
                </>
              ) : (
                <>
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-4 pt-4 border-t border-slate-100">
             <p className="text-sm text-slate-500 font-medium">Already have a workshop registered?</p>
             <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm font-black text-slate-900 hover:text-orange-600 transition-colors"
             >
                <LogIn className="h-4 w-4" /> Sign In to Your Account
             </Link>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
