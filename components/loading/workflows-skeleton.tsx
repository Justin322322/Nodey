"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function WorkflowsSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background effects placeholder */}
      <div className="absolute inset-0 opacity-30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-64 bg-white/10" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 bg-white/20" />
              <Skeleton className="h-10 w-40 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-white/30" />
                  <Skeleton className="h-4 w-full bg-white/20" />
                </div>
                <Skeleton className="w-8 h-8 bg-white/20" />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 bg-white/20" />
                  <Skeleton className="h-3 w-8 bg-white/20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 bg-white/20" />
                  <Skeleton className="h-3 w-12 bg-white/20" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 bg-white/20" />
                  <Skeleton className="h-3 w-16 bg-white/20" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <Skeleton className="h-8 w-20 bg-white/20" />
                <Skeleton className="h-8 w-16 bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
