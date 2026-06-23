'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Order, OrderStatus, STATUS_LABELS, COLUMN_HEADER_COLORS } from '../../types'
import { OrderCard } from './OrderCard'
import { CardSkeleton } from '../ui/Skeleton'

interface Props {
  status: OrderStatus
  orders: Order[]
  loading: boolean
  onOrderClick: (orderId: string) => void
}

export function KanbanColumn({ status, orders, loading, onOrderClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-w-[260px] max-w-[300px] flex-1 flex-col">
      <div
        className={`mb-3 flex items-center justify-between rounded-t-lg border-t-4 bg-gray-100 px-3 py-2 ${COLUMN_HEADER_COLORS[status]}`}
      >
        <span className="text-sm font-semibold text-gray-700">
          {STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-600">
          {orders.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-b-lg p-2 transition-colors ${
          isOver ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-inset' : 'bg-gray-100'
        }`}
        style={{ minHeight: '120px' }}
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
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-gray-400">
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
