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
      {/* Total — accent card */}
      <div className="flex flex-col rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3.5 shadow-lg shadow-indigo-500/20">
        <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
          <ShoppingCart size={14} className="text-white" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-white">{orders.length}</p>
        <p className="mt-0.5 text-xs font-medium text-indigo-200">Total Orders</p>
      </div>

      {/* Per-status counts */}
      {showStatuses.map((status) => {
        const count = orders.filter((o) => o.status === status).length
        const dot = getStatusDotColor(status)
        return (
          <div key={status} className="flex flex-col rounded-2xl bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/[0.08]">
            <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08]">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{count}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{getStatusLabel(status)}</p>
          </div>
        )
      })}
    </div>
  )
}
