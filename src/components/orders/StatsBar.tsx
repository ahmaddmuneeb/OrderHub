'use client'

import { ShoppingCart } from 'lucide-react'
import { Order, Platform, PLATFORM_STATUSES, getStatusLabel, getStatusDotColor } from '../../types'
import { StatSkeleton } from '../ui/Skeleton'

interface Props {
  orders: Order[]
  loading: boolean
  platform: Platform | null
}

export function StatsBar({ orders, loading, platform }: Props) {
  // Always show: total orders + per-status counts for the relevant platform
  const statuses = platform ? PLATFORM_STATUSES[platform] : []
  const activeStatuses = statuses.filter((s) => orders.some((o) => o.status === s))
  const showStatuses = activeStatuses.length > 0 ? activeStatuses : statuses.slice(0, 5)

  const totalCols = 1 + showStatuses.length
  const gridClass = totalCols <= 4 ? 'grid-cols-4' :
    totalCols <= 5 ? 'grid-cols-5' :
    totalCols <= 6 ? 'grid-cols-6' : 'grid-cols-4 sm:grid-cols-8'

  if (loading) {
    return (
      <div className={`grid gap-3 ${gridClass}`}>
        {Array.from({ length: Math.min(totalCols, 6) }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {/* Total */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mb-2 inline-flex w-fit rounded-lg p-1.5 bg-slate-100">
          <ShoppingCart size={13} className="text-slate-600" />
        </div>
        <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">Total</p>
      </div>

      {/* Per-status counts */}
      {showStatuses.map((status) => {
        const count = orders.filter((o) => o.status === status).length
        const dot = getStatusDotColor(status)
        return (
          <div key={status} className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="mb-2 inline-flex w-fit items-center justify-center rounded-lg p-1.5 bg-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{getStatusLabel(status)}</p>
          </div>
        )
      })}
    </div>
  )
}
