'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LocationProvider } from './LocationProvider';
import { SubscriptionProvider } from './SubscriptionProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#fcfcfd] z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          <p className="text-slate-500 font-bold animate-pulse">Initializing MistryApp...</p>
        </div>
      </div>
    );
  }

  // If it's an auth page, render as a full page without sidebar/header
  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-white">{children}</div>;
  }

  // Truly Fullscreen Enterprise Layout
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#fcfcfd] selection:bg-orange-100 selection:text-orange-900">
       
       {/* Background Decoration (Subtle) */}
       <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-orange-50 rounded-full blur-[120px] opacity-50 pointer-events-none" />
       <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-50 rounded-full blur-[120px] opacity-50 pointer-events-none" />

       <SubscriptionProvider>
         <LocationProvider>
            {/* Main Application Container */}
            <div className="relative flex w-full h-full z-10">
              
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 h-full">
                <Header />
                <main className="flex-1 w-full overflow-y-auto custom-scrollbar">
                  <div className="w-full px-6 md:px-8 lg:px-10 py-6 max-w-[1920px] mx-auto">
                    {children}
                  </div>
                </main>
              </div>

            </div>
          </LocationProvider>
        </SubscriptionProvider>
    </div>
  );
}
