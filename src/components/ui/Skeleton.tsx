'use client'

import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="mb-3 flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1.5 h-3.5 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <Skeleton className="mb-2 h-7 w-7 rounded-lg" />
      <Skeleton className="mb-1.5 h-7 w-10" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}
