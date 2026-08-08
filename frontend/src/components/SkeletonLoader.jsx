import React from 'react';

export const SkeletonCard = () => (
  <div className="p-6 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-24 h-4 bg-slate-800 rounded-lg" />
      <div className="w-8 h-8 bg-slate-800 rounded-xl" />
    </div>
    <div className="w-36 h-8 bg-slate-800 rounded-xl" />
    <div className="w-28 h-3 bg-slate-800/60 rounded-lg" />
  </div>
);

export const SkeletonTable = ({ rows = 4 }) => (
  <div className="w-full space-y-3 animate-pulse">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-[#1F2937] flex items-center justify-between gap-4">
        <div className="w-20 h-4 bg-slate-800 rounded-lg" />
        <div className="w-40 h-4 bg-slate-800 rounded-lg" />
        <div className="w-24 h-4 bg-slate-800 rounded-lg" />
        <div className="w-16 h-6 bg-slate-800 rounded-full" />
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="p-6 rounded-[18px] bg-[#111827] border border-[#1F2937] space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-48 h-5 bg-slate-800 rounded-lg" />
      <div className="w-24 h-4 bg-slate-800 rounded-full" />
    </div>
    <div className="h-60 w-full bg-slate-900/80 rounded-2xl flex items-end justify-between p-6 gap-2">
      {[40, 65, 50, 85, 95, 70, 100].map((h, idx) => (
        <div key={idx} style={{ height: `${h}%` }} className="w-full bg-slate-800/60 rounded-t-xl" />
      ))}
    </div>
  </div>
);

const SkeletonLoader = ({ rows = 4, lines = 4, type = 'table' }) => {
  if (type === 'card') return <SkeletonCard />;
  if (type === 'chart') return <SkeletonChart />;
  return <SkeletonTable rows={rows || lines} />;
};

SkeletonLoader.SkeletonCard = SkeletonCard;
SkeletonLoader.SkeletonTable = SkeletonTable;
SkeletonLoader.SkeletonChart = SkeletonChart;

export default SkeletonLoader;
