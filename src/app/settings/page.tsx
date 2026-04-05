'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new consolidated profile settings
    router.replace('/profile');
  }, [router]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      <p className="text-slate-500 font-medium animate-pulse">Redirecting to Workshop Settings...</p>
    </div>
  );
}
