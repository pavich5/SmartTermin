import React from 'react';

export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      {/* Image skeleton */}
      <div className="relative h-64">
        <div className="w-full h-full bg-gray-200 animate-pulse" />
        {/* Rating badge skeleton */}
        <div className="absolute top-4 right-4">
          <div className="h-7 w-16 rounded-full bg-gray-300 animate-pulse" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Name and badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="h-7 w-40 bg-gray-200 animate-pulse rounded flex-1" />
          <div className="h-6 w-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
        </div>
        
        {/* Profession */}
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-4" />
        
        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded bg-gray-300 animate-pulse" />
          <div className="h-4 w-36 bg-gray-300 animate-pulse rounded" />
        </div>
        
        {/* Services tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 w-20 rounded-full bg-gray-300 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-gray-300 animate-pulse" />
          <div className="h-6 w-18 rounded-full bg-gray-300 animate-pulse" />
        </div>
        
        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <div className="h-10 w-32 rounded-full bg-gray-400 animate-pulse" />
            <div className="h-10 w-28 rounded-full bg-gray-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

