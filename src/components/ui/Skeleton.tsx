'use client'

import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-white/[0.07]', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-800/80 p-4 ring-1 ring-white/[0.08]">
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
      <div className="flex items-center justify-between border-t border-white/[0.07] pt-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/[0.08]">
      <Skeleton className="mb-2.5 h-8 w-8 rounded-xl" />
      <Skeleton className="mb-1.5 h-7 w-10" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-800/80 p-5 ring-1 ring-white/[0.08]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div>
            <Skeleton className="mb-1.5 h-4 w-28" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-40" />
      <div className="mt-4 flex justify-end border-t border-white/[0.07] pt-3">
        <Skeleton className="h-7 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-white/[0.07] bg-slate-900 px-6 py-4">
        {/* Title row */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="mb-1.5 h-6 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>

        {/* Store tabs */}
        <div className="mb-4 flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] p-1">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>

        {/* Filter bar */}
        <div className="flex gap-2.5">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-hidden bg-slate-950 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-w-[284px] max-w-[284px] flex-col">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="flex flex-col gap-2.5 rounded-2xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] p-2.5">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
