import React from 'react';
import RevenueChart from '@/components/RevenueChart';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Banknote, 
  MoreHorizontal, Car, PenTool, CheckCircle2, ChevronRight, Download
} from 'lucide-react';

export default async function Index() {
  return (
    <div className="w-full h-full pb-10 fade-in">
      
      {/* Header Greeting */}
      <div className="my-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Good morning, Usman</h1>
        <p className="text-slate-500 text-sm">Stay on top of your workshop tasks, monitor job progress, and track daily revenue.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Main Balance/Revenue Dark Card */}
          <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Wallet className="w-24 h-24" />
            </div>
            
            <span className="text-sm font-medium text-slate-400">Today's Revenue</span>
            <div className="flex items-center gap-4 mt-2 mb-6">
              <h2 className="text-4xl font-bold">Rs 24,500</h2>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
              </span>
            </div>
            
            <div className="flex items-center gap-3 w-full">
              <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full font-medium text-sm transition-colors border border-white/10">
                New Job Card
              </button>
              <button className="flex-1 bg-white text-slate-900 hover:bg-slate-100 py-2.5 rounded-full font-medium text-sm transition-colors shadow-md">
                Add Khata
              </button>
            </div>
          </div>

          {/* Payment Methods / "Wallets" */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Payment Methods</h3>
              <span className="text-xs text-slate-400">Total 3</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Banknote className="w-5 h-5 text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Cash</span>
                <span className="text-[10px] text-green-500 mt-1">Active</span>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-700/50">
                <CreditCard className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Card/Bank</span>
                <span className="text-[10px] text-green-500 mt-1">Active</span>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Wallet className="w-5 h-5 text-orange-500 mb-2" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Udhaar</span>
                <span className="text-[10px] text-orange-500 mt-1">Pending</span>
              </div>
            </div>
          </div>

          {/* Monthly Capacity / Spending Limit analog */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">Monthly Bay Capacity</h3>
             <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full my-4 overflow-hidden flex">
                <div className="bg-orange-500 h-full rounded-full w-[65%]"></div>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white">65 Jobs <span className="text-slate-400 font-normal">completed of</span></span>
                <span className="font-bold text-slate-900 dark:text-white">100 Target</span>
             </div>
          </div>

          {/* Active Job Tracker / "My Cards" */}
          <div className="bg-orange-500 rounded-[1.5rem] p-5 shadow-lg shadow-orange-500/20 text-white relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-semibold text-sm">Priority Job Card</h3>
               <span className="text-xs bg-white/20 px-2 py-1 rounded-full">In Progress</span>
             </div>
             <div className="flex items-center justify-between z-10 relative">
               <div>
                 <p className="text-xs text-orange-100 mb-1">Vehicle</p>
                 <p className="font-bold tracking-wider">Toyota Corolla - LEA 1234</p>
               </div>
               <Car className="w-8 h-8 opacity-50" />
             </div>
          </div>

        </div>

        {/* MIDDLE COLUMN (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Top 4 Summary Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
             {/* Card 1: Orange */}
             <div className="bg-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-medium text-orange-100">Jobs Completed</span>
                 <CheckCircle2 className="w-4 h-4 text-orange-200" />
               </div>
               <h3 className="text-2xl font-bold mb-2">42</h3>
               <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full flex items-center w-fit">
                 <ArrowUpRight className="w-3 h-3 mr-1" /> 7% This week
               </span>
             </div>

             {/* Card 2: White */}
             <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-medium text-slate-500">Pending Udhaar</span>
                 <Banknote className="w-4 h-4 text-slate-400" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Rs 18k</h3>
               <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full flex items-center w-fit">
                 <ArrowDownRight className="w-3 h-3 mr-1" /> 5% This week
               </span>
             </div>

             {/* Card 3: White */}
             <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-medium text-slate-500">Inventory Items</span>
                 <PenTool className="w-4 h-4 text-slate-400" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">124</h3>
               <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center w-fit">
                 <ArrowUpRight className="w-3 h-3 mr-1" /> Low Stock: 3
               </span>
             </div>

             {/* Card 4: White */}
             <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-medium text-slate-500">Mech. Efficiency</span>
                 <CheckCircle2 className="w-4 h-4 text-slate-400" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">85%</h3>
               <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center w-fit">
                 <ArrowUpRight className="w-3 h-3 mr-1" /> 4% This week
               </span>
             </div>
          </div>

          {/* We'll move Recent Activities to Span 8 below */}
        </div>

        {/* RIGHT COLUMN (Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm h-[320px] flex flex-col">
             <div className="flex justify-between items-start w-full">
               <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Revenue Overview</h3>
                  <p className="text-xs text-slate-400 mt-1">Weekly repair vs parts income</p>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span> Parts</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Service</span>
               </div>
             </div>
             
             {/* Responsive Bar Chart */}
             <div className="flex-1 mt-4">
               <RevenueChart />
             </div>
           </div>
        </div>

        {/* BOTTOM ROW (Spanning Middle and Right Columns) */}
        <div className="xl:col-span-8 xl:col-start-5 flex flex-col gap-6 -mt-3.5">
           
           {/* Header for activities */}
           <div className="flex justify-between items-end mb-2">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent Repair Orders</h2>
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <input type="text" placeholder="Search" className="bg-white dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-full pl-4 pr-10 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 w-48 shadow-sm" />
                 </div>
                 <button className="flex items-center gap-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-medium text-slate-600 shadow-sm">
                   Filter
                 </button>
              </div>
           </div>

           {/* Table Card */}
           <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-2 shadow-sm overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <tr>
                   <th className="px-4 py-3 font-medium rounded-l-xl">Order ID</th>
                   <th className="px-4 py-3 font-medium">Service Type</th>
                   <th className="px-4 py-3 font-medium">Price</th>
                   <th className="px-4 py-3 font-medium">Status</th>
                   <th className="px-4 py-3 font-medium">Date</th>
                   <th className="px-4 py-3 rounded-r-xl"></th>
                 </tr>
               </thead>
               <tbody>
                 {[
                   { id: 'RO_00076', type: 'Engine Overhaul', price: 'Rs 25,500', status: 'Completed', date: '17 Apr, 03:45 PM', dot: 'bg-emerald-500' },
                   { id: 'RO_00075', type: 'Oil Change', price: 'Rs 3,750', status: 'Pending', date: '15 Apr, 11:30 AM', dot: 'bg-red-500' },
                   { id: 'RO_00074', type: 'Brake Pads', price: 'Rs 4,200', status: 'Completed', date: '15 Apr, 12:00 PM', dot: 'bg-emerald-500' },
                   { id: 'RO_00073', type: 'Suspension Work', price: 'Rs 15,200', status: 'In Progress', date: '14 Apr, 09:15 PM', dot: 'bg-amber-500' },
                 ].map((row, i) => (
                   <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                     <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                       <input type="checkbox" className="rounded border-slate-300 mr-2 accent-orange-500" defaultChecked={i === 3} />
                       {row.id}
                     </td>
                     <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{row.type}</td>
                     <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.price}</td>
                     <td className="px-4 py-3">
                       <span className="flex items-center gap-2 font-medium text-xs text-slate-600 dark:text-slate-300">
                         <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`}></span>
                         {row.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-slate-500 text-xs font-medium">{row.date}</td>
                     <td className="px-4 py-3 text-right">
                       <button className="text-slate-400 hover:text-slate-600">
                         <MoreHorizontal className="w-5 h-5" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
        </div>
        
      </div>
    </div>
  );
}
