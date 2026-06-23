'use client'

import { useState } from 'react'
import { callUpdateOrderStatus } from '../../lib/firebase'
import { useOrderStore } from '../../store/useOrderStore'
import { useStoreStore } from '../../store/useStoreStore'
import { Order, ORDER_STATUSES, STATUS_LABELS, PLATFORM_LABELS, PLATFORM_COLORS } from '../../types'
import { Drawer } from '../ui/Drawer'
import { formatCurrency } from '../../lib/utils'
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Props {
  orderId: string | null
  onClose: () => void
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
      const msg = err instanceof Error ? err.message : 'Failed to update'
      toast.error(msg)
      updateOrderStatus(order.id, prev)
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <Drawer
      open={!!orderId && !!order}
      onClose={onClose}
      title={order ? `Order #${order.platformOrderId}` : 'Order'}
    >
      {!order ? null : (
        <div className="space-y-6">
          {/* Platform + Status */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLATFORM_COLORS[order.platform]}`}>
              {PLATFORM_LABELS[order.platform]}
            </span>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {order.platformOrderUrl && (
              <a
                href={order.platformOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink size={12} />
                View on {PLATFORM_LABELS[order.platform]}
              </a>
            )}
          </div>

          {/* Customer */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Customer
            </h3>
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.customerEmail}</p>
          </section>

          {/* Dates */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">Ordered</p>
                <p className="text-gray-700">
                  {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Updated</p>
                <p className="text-gray-700">
                  {format(new Date(order.updatedAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Items
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-700">{item.name}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{item.qty}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(item.price, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Platform status */}
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Platform Status
            </h3>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 font-mono">
              {order.platformStatus}
            </span>
          </section>
        </div>
      )}
    </Drawer>
  )
}
