'use client'

import { useState } from 'react'
import { callUpdateOrderStatus } from '../../lib/firebase'
import { useOrderStore } from '../../store/useOrderStore'
import { useStoreStore } from '../../store/useStoreStore'
import { Order, PLATFORM_STATUSES, PLATFORM_LABELS, PLATFORM_COLORS, getStatusLabel, getStatusBadgeClass } from '../../types'
import { Drawer } from '../ui/Drawer'
import { formatCurrency } from '../../lib/utils'
import { ExternalLink, Calendar, Package, Store, Tag, Truck } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Props {
  orderId: string | null
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '') return null
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-400 w-28">{label}</span>
      <span className="text-right text-xs text-slate-700 font-medium">{value}</span>
    </div>
  )
}

export function OrderDetailDrawer({ orderId, onClose }: Props) {
  const { orders, updateOrderStatus } = useOrderStore()
  const { stores } = useStoreStore()
  const order = orders.find((o) => o.id === orderId) ?? null
  const [savingStatus, setSavingStatus] = useState(false)

  async function handleStatusChange(newStatus: string) {
    if (!order || newStatus === order.status) return
    setSavingStatus(true)
    const prev = order.status
    updateOrderStatus(order.id, newStatus as Order['status'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeCreds = (stores.find((s) => s.id === order.storeId) as any)?.credentials
    try {
      await callUpdateOrderStatus({
        platformOrderId: order.platformOrderId,
        platform: order.platform,
        status: newStatus,
        credentials: storeCreds,
      })
      toast.success('Status updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
      updateOrderStatus(order.id, prev)
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <Drawer
      open={!!orderId && !!order}
      onClose={onClose}
      title={order ? `Order #${order.orderNumber}` : 'Order'}
    >
      {!order ? null : (
        <div className="space-y-6">

          {/* Platform + Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PLATFORM_COLORS[order.platform]}`}>
              {PLATFORM_LABELS[order.platform]}
            </span>
            {order.channel && (
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                <Store size={10} />
                {order.channel}
              </span>
            )}
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700
                         focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            >
              {PLATFORM_STATUSES[order.platform].map((s) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            {order.platformOrderUrl && (
              <a
                href={order.platformOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={12} />
                View on {PLATFORM_LABELS[order.platform]}
              </a>
            )}
          </div>

          {/* Status badges grid */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Order Status</p>
            <div className="grid grid-cols-2 gap-2">
              {order.financialStatus && (
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Payment</p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.financialStatus)}`}>
                    {getStatusLabel(order.financialStatus)}
                  </span>
                </div>
              )}
              {order.fulfillmentStatus && (
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Fulfillment</p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.fulfillmentStatus)}`}>
                    {getStatusLabel(order.fulfillmentStatus)}
                  </span>
                </div>
              )}
              {order.deliveryStatus && (
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Delivery</p>
                  <span className="text-xs font-medium text-slate-700">{order.deliveryStatus}</span>
                </div>
              )}
              {order.deliveryMethod && (
                <div className="rounded-lg bg-white border border-slate-200 p-2.5">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Method</p>
                  <div className="flex items-center gap-1">
                    <Truck size={11} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{order.deliveryMethod}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Customer */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Customer</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white">
                {order.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{order.customerName}</p>
                <p className="text-sm text-slate-500">{order.customerEmail}</p>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ordered', date: order.createdAt },
                { label: 'Updated', date: order.updatedAt },
              ].map(({ label, date }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3">
                  <Calendar size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-800">
                      {format(new Date(date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-slate-400">{format(new Date(date), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          {order.tags && (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {order.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notes</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {order.notes}
              </p>
            </section>
          )}

          {/* Items */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Items</p>
              <Package size={11} className="text-slate-400" />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="px-3.5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Qty</th>
                    <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3.5 py-2.5 font-medium text-slate-700">{item.name}</td>
                      <td className="px-3.5 py-2.5 text-center text-slate-500">{item.qty}</td>
                      <td className="px-3.5 py-2.5 text-right text-slate-700">
                        {formatCurrency(item.price, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-3.5 py-2.5 text-right text-sm font-semibold text-slate-600">Total</td>
                    <td className="px-3.5 py-2.5 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

        </div>
      )}
    </Drawer>
  )
}
