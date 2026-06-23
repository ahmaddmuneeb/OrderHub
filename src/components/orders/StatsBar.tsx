'use client'

import { Order, OrderStatus, STATUS_LABELS } from '../../types'
import { StatSkeleton } from '../ui/Skeleton'

interface Props {
  orders: Order[]
  loading: boolean
}

const STAT_COLORS: Record<OrderStatus | 'total', string> = {
  total: 'text-gray-900',
  new: 'text-blue-600',
  pending: 'text-yellow-600',
  processing: 'text-purple-600',
  completed: 'text-green-600',
  canceled: 'text-red-600',
}

export function StatsBar({ orders, loading }: Props) {
  if (loading) {
    return (
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    )
  }

  const counts = {
    total: orders.length,
    new: orders.filter((o) => o.status === 'new').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    canceled: orders.filter((o) => o.status === 'canceled').length,
  }

  const stats = [
    { key: 'total', label: 'Total Orders' },
    { key: 'new', label: STATUS_LABELS.new },
    { key: 'pending', label: STATUS_LABELS.pending },
    { key: 'processing', label: STATUS_LABELS.processing },
    { key: 'completed', label: STATUS_LABELS.completed },
    { key: 'canceled', label: STATUS_LABELS.canceled },
  ] as const

  return (
    <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
      {stats.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`mt-0.5 text-2xl font-bold ${STAT_COLORS[key]}`}>
            {counts[key]}
          </p>
        </div>
      ))}
    </div>
  )
}
