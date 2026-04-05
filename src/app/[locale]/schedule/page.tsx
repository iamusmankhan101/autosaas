'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const BAYS = ['Bay 1 (Lift)', 'Bay 2 (General)', 'Detailing Area'];
const HOURS = Array.from({length: 10}, (_, i) => i + 9); // 9 AM to 6 PM

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const jobs = useLiveQuery(
    () => db.jobs.filter(j => j.status !== 'DELIVERED').toArray()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Bay Scheduling</h1>
          <p className="text-muted-foreground">Manage lift occupancy and workshop flow.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-md p-1">
          <Button variant="ghost" size="sm">Today</Button>
          <div className="flex items-center gap-2 px-3 border-l text-sm font-medium">
            <CalendarIcon className="h-4 w-4" />
            {selectedDate.toLocaleDateString()}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0 border-b">
          <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x">
             <div className="p-4 text-center text-sm font-medium text-muted-foreground">Time</div>
             <div className="grid grid-cols-3 divide-x text-center">
                {BAYS.map(bay => (
                  <div key={bay} className="p-4 font-semibold text-sm">{bay}</div>
                ))}
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="flex flex-col divide-y">
              {HOURS.map(hour => {
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : hour;
                
                return (
                  <div key={hour} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] divide-x min-h-[80px]">
                    <div className="p-2 flex items-start justify-center gap-1 text-xs text-muted-foreground bg-muted/20">
                      <Clock className="h-3 w-3 mt-0.5" />
                      {displayHour}:00 {ampm}
                    </div>
                    <div className="grid grid-cols-3 divide-x bg-card">
                       {BAYS.map(bay => {
                         // Find a job assigned to this bay at this simulated hour. 
                         // Since we don't have true timestamps yet, we'll just mock random slots based on seeded data if any, or leave empty.
                         const slotJobs = jobs?.filter(j => j.bay_assignment === bay && j.scheduled_time && new Date(j.scheduled_time).getHours() === hour);
                         
                         return (
                           <div key={`${bay}-${hour}`} className="p-1 hover:bg-muted/50 transition-colors relative cursor-pointer group">
                             {slotJobs?.map(job => (
                               <div key={job.id} className="absolute inset-1 rounded-md bg-amber-500 text-white p-2 text-xs font-medium overflow-hidden shadow-sm">
                                  {job.vehicle_make} {job.vehicle_model}
                                  <div className="font-mono text-[10px] opacity-80">{job.license_plate}</div>
                               </div>
                             ))}
                             <div className="absolute inset-x-0 inset-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="secondary" size="sm" className="h-6 text-xs shadow-md">Assign</Button>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                );
              })}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
