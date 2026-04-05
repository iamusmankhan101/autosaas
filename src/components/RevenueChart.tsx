'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { JobCard } from '@/lib/db';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  jobs?: JobCard[];
}

export default function RevenueChart({ jobs }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const data = useMemo(() => {
    if (!jobs || jobs.length === 0) {
      // fallback placeholder so chart isn't empty
      return MONTHS.slice(0, 8).map(name => ({ name, revenue: 0 }));
    }
    const byMonth: Record<number, number> = {};
    jobs.forEach(j => {
      const month = new Date(j.updated_at).getMonth();
      byMonth[month] = (byMonth[month] ?? 0) + j.total_amount;
    });
    return MONTHS.map((name, i) => ({ name, revenue: byMonth[i] ?? 0 }));
  }, [jobs]);

  if (!mounted) {
    return <div className="w-full h-[200px] animate-pulse bg-slate-100 dark:bg-slate-700 rounded-xl" />;
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : `${v}`} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
