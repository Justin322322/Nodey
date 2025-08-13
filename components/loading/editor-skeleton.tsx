"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function EditorSkeleton() {
  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Toolbar Skeleton */}
      <div className="h-16 border-b border-gray-200 bg-white px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Desktop buttons */}
          <Skeleton className="hidden sm:block h-8 w-24" />
          <Skeleton className="hidden sm:block h-8 w-16" />
          <Skeleton className="hidden sm:block h-8 w-16" />
          <Skeleton className="hidden sm:block h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          
          {/* Mobile buttons */}
          <Skeleton className="sm:hidden h-8 w-8" />
          <Skeleton className="sm:hidden h-8 w-8" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 border-r border-gray-200 flex">
          {/* Desktop Node Palette */}
          <div className="hidden md:block w-72 border-r border-gray-200 bg-white p-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 pb-3 mb-4">
              <Skeleton className="h-6 w-24" />
            </div>
            
            {/* Templates Section */}
            <div className="mb-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="space-y-2">
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-5 h-5" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-5 h-5" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>

            {/* Triggers Section */}
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Section */}
            <div className="mb-6">
              <Skeleton className="h-4 w-16 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logic Section */}
            <div>
              <Skeleton className="h-4 w-12 mb-3" />
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-slate-100">
            {/* Sample workflow nodes */}
            <div className="absolute top-20 left-32">
              <div className="bg-white rounded-md border border-gray-200 shadow-sm p-0 min-w-[220px]">
                <div className="border-b border-gray-200 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300" />
                  <div className="flex items-center gap-2 pl-3 pr-2 h-10">
                    <Skeleton className="w-7 h-7 rounded" />
                    <Skeleton className="h-4 w-20" />
                    <div className="ml-auto flex gap-1">
                      <Skeleton className="w-5 h-5" />
                      <Skeleton className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-48 left-32">
              <div className="bg-white rounded-md border border-gray-200 shadow-sm p-0 min-w-[220px]">
                <div className="border-b border-gray-200 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300" />
                  <div className="flex items-center gap-2 pl-3 pr-2 h-10">
                    <Skeleton className="w-7 h-7 rounded" />
                    <Skeleton className="h-4 w-24" />
                    <div className="ml-auto flex gap-1">
                      <Skeleton className="w-5 h-5" />
                      <Skeleton className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Add Node Button */}
            <div className="fixed bottom-4 left-4 z-50 sm:hidden">
              <Skeleton className="h-8 w-20 rounded" />
            </div>

            {/* Desktop Controls */}
            <div className="absolute bottom-4 left-4 hidden md:block">
              <div className="bg-white rounded border border-gray-200 p-2">
                <div className="space-y-1">
                  <Skeleton className="w-6 h-6" />
                  <Skeleton className="w-6 h-6" />
                  <Skeleton className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-16 hidden sm:block">
              <div className="bg-white/95 rounded-md px-3 py-2 border border-gray-200">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-3 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Execution Log */}
        <div className="hidden sm:block w-96 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 border-l border-gray-600">
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center text-white/50">
              <Skeleton className="w-12 h-12 mx-auto mb-2 bg-white/20" />
              <Skeleton className="h-4 w-32 mx-auto mb-1 bg-white/20" />
              <Skeleton className="h-3 w-40 mx-auto bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
