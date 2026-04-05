'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', profit: 34000, loss: 12000 },
  { name: 'Feb', profit: 45000, loss: 15000 },
  { name: 'Mar', profit: 38000, loss: 18000 },
  { name: 'Apr', profit: 52000, loss: 10000 },
  { name: 'May', profit: 60000, loss: 24000 },
  { name: 'Jun', profit: 40000, loss: 30000 },
  { name: 'Jul', profit: 58000, loss: 12000 },
  { name: 'Aug', profit: 45000, loss: 8000 },
];

export default function RevenueChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-full h-[200px] animate-pulse bg-slate-100 dark:bg-slate-700 rounded-xl" />;
  }

  return (
    <div style={{ width: '100%', height: 200, minWidth: 200, minHeight: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          barSize={12}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="loss" stackId="a" fill="#0f172a" radius={[0, 0, 4, 4]} />
          <Bar dataKey="profit" stackId="a" fill="#ea580c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

