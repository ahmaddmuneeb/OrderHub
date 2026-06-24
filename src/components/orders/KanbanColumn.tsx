'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Order, getStatusLabel, getStatusDotColor } from '../../types'
import { OrderCard } from './OrderCard'
import { CardSkeleton } from '../ui/Skeleton'

interface Props {
  status: string
  orders: Order[]
  loading: boolean
  onOrderClick: (orderId: string) => void
}

export function KanbanColumn({ status, orders, loading, onOrderClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-w-[284px] max-w-[284px] flex-col">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${getStatusDotColor(status)}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {getStatusLabel(status)}
          </span>
        </div>
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-bold text-slate-400 ring-1 ring-white/[0.1]">
          {loading ? '–' : orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`scrollbar-thin flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-2xl p-2.5 transition-all duration-150 ${
          isOver
            ? 'bg-indigo-500/10 ring-2 ring-inset ring-indigo-500/30'
            : 'bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]'
        }`}
        style={{ minHeight: 120 }}
      >
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : orders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-xs text-slate-700">
              No orders
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick(order.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
