'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, PLATFORM_LABELS, PLATFORM_COLORS, getStatusBadgeClass, getStatusLabel } from '../../types'
import { formatCurrency } from '../../lib/utils'

interface Props {
  order: Order
  onClick: () => void
}

export function OrderCard({ order, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const initials = order.customerName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group cursor-pointer select-none rounded-2xl bg-slate-800/80 p-4 ring-1 ring-white/[0.08]
                 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 hover:ring-indigo-500/30 hover:bg-slate-800 transition-all duration-200"
    >
      {/* Order # + Platform */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-slate-500 tracking-wide">
          #{order.orderNumber}
        </span>
        <div className="flex items-center gap-1.5">
          {order.channel && (
            <span className="truncate text-[10px] text-slate-600 max-w-[80px]">{order.channel}</span>
          )}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${PLATFORM_COLORS[order.platform]}`}>
            {PLATFORM_LABELS[order.platform]}
          </span>
        </div>
      </div>

      {/* Customer */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-sm">
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-slate-200">
            {order.customerName}
          </p>
          <p className="truncate text-xs text-slate-500">{order.customerEmail}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {order.financialStatus && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(order.financialStatus)}`}>
            {getStatusLabel(order.financialStatus)}
          </span>
        )}
        {order.fulfillmentStatus && order.fulfillmentStatus !== order.financialStatus && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(order.fulfillmentStatus)}`}>
            {getStatusLabel(order.fulfillmentStatus)}
          </span>
        )}
        {order.deliveryStatus && (
          <span className="rounded-full border border-white/[0.1] bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {order.deliveryStatus}
          </span>
        )}
      </div>

      {/* Delivery method + Tags */}
      {(order.deliveryMethod || order.tags) && (
        <div className="mb-3 flex flex-wrap gap-1">
          {order.deliveryMethod && (
            <span className="rounded-lg bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {order.deliveryMethod}
            </span>
          )}
          {order.tags && order.tags.split(',').slice(0, 2).map((tag) => tag.trim()).filter(Boolean).map((tag) => (
            <span key={tag} className="rounded-lg bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: item count + total */}
      <div className="flex items-center justify-between border-t border-white/[0.07] pt-3">
        <span className="text-[11px] text-slate-600">
          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
        </span>
        <span className="text-sm font-extrabold text-white">
          {formatCurrency(order.total, order.currency)}
        </span>
      </div>
    </div>
  )
}
