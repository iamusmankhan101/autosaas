import DashboardStats from '@/components/DashboardStats';

export default function Index() {
  return (
    <div className="w-full h-full pb-10 fade-in">
      <div className="my-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Good morning, Usman</h1>
        <p className="text-slate-500 text-sm">Stay on top of your workshop tasks, monitor job progress, and track daily revenue.</p>
      </div>
      <DashboardStats />
    </div>
  );
}
