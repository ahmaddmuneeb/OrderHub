'use client'

import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-1 h-3 w-32" />
      <Skeleton className="mb-3 h-3 w-20" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-12" />
    </div>
  )
}
