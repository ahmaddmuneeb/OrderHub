'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, PLATFORM_COLORS, PLATFORM_LABELS } from '../../types'
import { timeAgo, formatCurrency } from '../../lib/utils'
import { Package } from 'lucide-react'

interface Props {
  order: Order
  onClick: () => void
}

export function OrderCard({ order, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-pointer select-none rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-150"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-gray-700">
          #{order.platformOrderId}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PLATFORM_COLORS[order.platform]}`}
        >
          {PLATFORM_LABELS[order.platform]}
        </span>
      </div>

      <p className="mb-0.5 text-sm font-medium text-gray-900 leading-tight">
        {order.customerName}
      </p>
      <p className="mb-2 text-xs text-gray-400">{order.customerEmail}</p>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Package size={11} />
          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(order.total, order.currency)}
        </span>
      </div>

      <p className="mt-1.5 text-right text-[10px] text-gray-400">
        {timeAgo(new Date(order.createdAt))}
      </p>
    </div>
  )
}
