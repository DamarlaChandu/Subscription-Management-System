import React from 'react';

export function SkeletonKPI() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-40 bg-slate-50 rounded-3xl border border-slate-100" />
      ))}
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-pulse">
       <div className="p-8 bg-slate-50/50 border-b flex justify-between space-x-6">
          <div className="h-12 w-64 bg-slate-200 rounded-2xl" />
          <div className="h-12 w-48 bg-slate-200 rounded-2xl" />
       </div>
       <div className="p-8 space-y-6">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full" />
          ))}
       </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="h-80 bg-slate-50/50 rounded-3xl border border-slate-100 animate-pulse flex items-center justify-center">
       <div className="w-1/2 h-40 bg-slate-100 rounded-2xl" />
    </div>
  );
}
