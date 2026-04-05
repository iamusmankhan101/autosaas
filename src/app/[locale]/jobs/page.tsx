'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Info, Camera } from 'lucide-react';
import { compressImageToThumbnail } from '@/lib/image-util';

export default function JobsPage() {
  const t = useTranslations('Index'); // Fallback to index translations for now 

  const activeJobs = useLiveQuery(
    () => db.jobs.filter(j => j.status !== 'DELIVERED').toArray()
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-slate-500';
      case 'IN_PROGRESS': return 'bg-amber-500';
      case 'READY': return 'bg-green-500';
      default: return 'bg-slate-200';
    }
  };

  const handleImageUpload = async (jobId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const thumbnailBase64 = await compressImageToThumbnail(file);
      const job = await db.jobs.get(jobId);
      if (job) {
         const currentThumbnails = job.thumbnails || [];
         await db.jobs.update(jobId, {
           thumbnails: [...currentThumbnails, thumbnailBase64]
         });
      }
    } catch (err) {
      console.error("Failed to compress and save image", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Job Cards</h1>
          <p className="text-muted-foreground">Manage ongoing vehicle repairs and workflows.</p>
        </div>
        <Button className="font-heading">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeJobs?.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
             <Info className="h-8 w-8 mb-2" />
             <p>No active jobs right now.</p>
          </div>
        ) : (
          activeJobs?.map((job) => (
            <Card key={job.id} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{job.vehicle_make} {job.vehicle_model}</CardTitle>
                  <p className="text-sm font-mono mt-1 text-muted-foreground">{job.license_plate}</p>
                </div>
                <Badge className={`${getStatusColor(job.status)} text-white border-transparent`}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4 border-t mt-4">
                 
                 {/* Thumbnails Row */}
                 {job.thumbnails && job.thumbnails.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto pb-2">
                     {job.thumbnails.map((thumb, idx) => (
                       <img key={idx} src={thumb} alt="Job Media" className="h-16 w-16 object-cover rounded-md border" />
                     ))}
                   </div>
                 )}

                 <div className="flex justify-between items-end">
                   <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Estate</p>
                      <p className="font-medium text-lg">PKR {job.total_amount.toLocaleString()}</p>
                   </div>
                   <div className="flex gap-2">
                     <div className="relative">
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => handleImageUpload(job.id, e)}
                       />
                       <Button variant="outline" size="sm" type="button"><Camera className="h-4 w-4" /></Button>
                     </div>
                     <Button variant="outline" size="sm">Update</Button>
                   </div>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
