import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { PageContainer } from '../ui/PageContainer';

export function ArtistProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Banner skeleton */}
      <div className="relative h-80">
        <Skeleton className="w-full h-full bg-gray-200" />
      </div>

      {/* Header card skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-8" style={{ marginTop: '-100px' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Profile image skeleton */}
              <div className="relative">
                <Skeleton className="w-32 h-32 rounded-2xl bg-gray-200" />
              </div>
              
              {/* Info skeleton */}
              <div className="flex-1 w-full">
                <Skeleton className="h-8 w-48 mb-2 bg-gray-200" />
                <Skeleton className="h-6 w-32 mb-3 bg-gray-200" />
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-6 w-24 bg-gray-200" />
                </div>
                <Skeleton className="h-5 w-40 bg-gray-200" />
              </div>
              
              {/* Button skeleton */}
              <Skeleton className="hidden md:block h-12 w-40 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      <PageContainer>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About section skeleton */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Skeleton className="h-7 w-24 mb-4 bg-gray-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-4 w-3/4 bg-gray-200" />
              </div>
            </section>

            {/* Services section skeleton */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Skeleton className="h-7 w-32 mb-6 bg-gray-200" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2 bg-gray-200" />
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                    </div>
                    <Skeleton className="h-6 w-20 bg-gray-200" />
                  </div>
                ))}
              </div>
            </section>

            {/* Portfolio section skeleton */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Skeleton className="h-7 w-32 mb-6 bg-gray-200" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl bg-gray-200" />
                ))}
              </div>
            </section>

            {/* Reviews section skeleton */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <Skeleton className="h-7 w-32 mb-6 bg-gray-200" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2 bg-gray-200" />
                        <Skeleton className="h-4 w-20 mb-2 bg-gray-200" />
                        <Skeleton className="h-4 w-full bg-gray-200" />
                        <Skeleton className="h-4 w-3/4 mt-1 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Skeleton className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-16 mb-2 bg-gray-200" />
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <Skeleton className="h-5 w-32 mb-4 bg-gray-200" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                      <Skeleton className="h-4 w-16 bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

