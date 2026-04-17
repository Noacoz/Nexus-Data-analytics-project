import React from 'react';

const pulse = 'animate-pulse bg-slate-700/50 rounded';

export const SkeletonText = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`${pulse} ${width} ${height}`} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`glass rounded-2xl p-6 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`${pulse} w-10 h-10 rounded-lg`} />
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-1/2" />
        <SkeletonText width="w-1/3" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonText />
      <SkeletonText width="w-5/6" />
      <SkeletonText width="w-4/6" />
    </div>
  </div>
);

export const SkeletonStatCard = () => (
  <div className="glass rounded-xl p-6">
    <SkeletonText width="w-1/3" height="h-3" />
    <div className={`${pulse} w-16 h-8 mt-3 rounded`} />
    <SkeletonText width="w-1/2" height="h-3 mt-2" />
  </div>
);

export const SkeletonDashboard = () => (
  <div className="p-6 space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
    {/* Dataset cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </div>
);

export const SkeletonDatasetDetail = () => (
  <div className="p-6 space-y-6">
    <div className="flex items-center gap-4 mb-6">
      <div className={`${pulse} w-8 h-8 rounded-lg`} />
      <SkeletonText width="w-48" height="h-6" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
    <SkeletonCard className="h-64" />
  </div>
);
