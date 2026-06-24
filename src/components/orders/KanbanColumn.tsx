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
    <div className="flex min-w-[272px] max-w-[272px] flex-col">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${getStatusDotColor(status)}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {getStatusLabel(status)}
          </span>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {loading ? '–' : orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`scrollbar-thin flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-all duration-150 ${
          isOver
            ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300'
            : 'bg-slate-100'
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
            <div className="flex flex-1 items-center justify-center py-12 text-xs text-slate-400">
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
