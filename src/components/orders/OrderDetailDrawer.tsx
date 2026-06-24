'use client'

import { useState } from 'react'
import { callUpdateOrderStatus } from '../../lib/firebase'
import { useOrderStore } from '../../store/useOrderStore'
import { useStoreStore } from '../../store/useStoreStore'
import { Order, PLATFORM_STATUSES, PLATFORM_LABELS, PLATFORM_COLORS, getStatusLabel, getStatusBadgeClass } from '../../types'
import { Drawer } from '../ui/Drawer'
import { Dropdown } from '../ui/Dropdown'
import { formatCurrency } from '../../lib/utils'
import { ExternalLink, Calendar, Package, Store, Tag, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  orderId: string | null
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '') return null
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500 w-28">{label}</span>
      <span className="text-right text-xs text-slate-300 font-medium">{value}</span>
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
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${PLATFORM_COLORS[order.platform]}`}>
              {PLATFORM_LABELS[order.platform]}
            </span>
            {order.channel && (
              <span className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">
                <Store size={10} />
                {order.channel}
              </span>
            )}
            <Dropdown
              value={order.status}
              onChange={(v) => handleStatusChange(v as string)}
              disabled={savingStatus}
              size="sm"
              options={PLATFORM_STATUSES[order.platform].map((s) => ({
                value: s,
                label: getStatusLabel(s),
              }))}
            />
            {order.platformOrderUrl && (
              <a
                href={order.platformOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                View on {PLATFORM_LABELS[order.platform]}
              </a>
            )}
          </div>

          {/* Status badges grid */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Order Status</p>
            <div className="grid grid-cols-2 gap-2">
              {order.financialStatus && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment</p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.financialStatus)}`}>
                    {getStatusLabel(order.financialStatus)}
                  </span>
                </div>
              )}
              {order.fulfillmentStatus && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fulfillment</p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.fulfillmentStatus)}`}>
                    {getStatusLabel(order.fulfillmentStatus)}
                  </span>
                </div>
              )}
              {order.deliveryStatus && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivery</p>
                  <span className="text-xs font-semibold text-slate-300">{order.deliveryStatus}</span>
                </div>
              )}
              {order.deliveryMethod && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Method</p>
                  <div className="flex items-center gap-1">
                    <Truck size={11} className="text-slate-500" />
                    <span className="text-xs font-semibold text-slate-300">{order.deliveryMethod}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Customer */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                {order.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold text-white">{order.customerName}</p>
                <p className="text-sm text-slate-500">{order.customerEmail}</p>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ordered', date: order.createdAt },
                { label: 'Updated', date: order.updatedAt },
              ].map(({ label, date }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-3.5">
                  <Calendar size={13} className="mt-0.5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-200">
                      {format(new Date(date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-slate-600">{format(new Date(date), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          {order.tags && (
            <section>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {order.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/25">
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
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</p>
              <p className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4 text-sm text-slate-300 leading-relaxed">
                {order.notes}
              </p>
            </section>
          )}

          {/* Items */}
          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Items</p>
              <Package size={11} className="text-slate-600" />
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.05]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-300">{item.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.qty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-300">
                        {formatCurrency(item.price, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.08] bg-white/[0.04]">
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-slate-500">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-white">
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
