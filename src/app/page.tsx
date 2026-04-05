'use client';

import DashboardStats from '@/components/DashboardStats';
import { useAuth } from '@/components/AuthProvider';

export default function Index() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="w-full h-full pb-10 fade-in">
      <div className="my-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Good morning, {firstName}
        </h1>
        <p className="text-slate-500 text-sm">Stay on top of your workshop tasks, monitor job progress, and track daily revenue.</p>
      </div>
      <DashboardStats />
    </div>
  );
}
