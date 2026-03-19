import React from 'react';

function PlanSkeleton() {
  return (
    <div className="p-5 md:p-10">
      {/* Hero Image Skeleton */}
      <div className="w-full h-[300px] bg-gray-200 animate-pulse rounded-xl mb-10"></div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-[200px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
        <div className="h-[200px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
      </div>
    </div>
  );
}

export default PlanSkeleton;