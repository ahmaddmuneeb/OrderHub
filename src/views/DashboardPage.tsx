'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core'
import { callUpdateOrderStatus } from '../lib/firebase'
import { useOrders } from '../hooks/useOrders'
import { useOrderStore } from '../store/useOrderStore'
import { useStoreStore } from '../store/useStoreStore'
import { Order, ORDER_STATUSES, OrderStatus } from '../types'
import { KanbanColumn } from '../components/orders/KanbanColumn'
import { FilterBar } from '../components/orders/FilterBar'
import { StatsBar } from '../components/orders/StatsBar'
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer'
import { OrderCard } from '../components/orders/OrderCard'
import toast from 'react-hot-toast'
import { Store, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function DashboardPage() {
  const { filteredOrders, updateOrderStatus, setSelectedOrderId, selectedOrderId, orders } =
    useOrderStore()
  const { stores, storesLoading } = useStoreStore()
  const { loading, refresh } = useOrders()
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const displayOrders = filteredOrders()

  function getColumnOrders(status: OrderStatus) {
    return displayOrders.filter((o) => o.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    const order = orders.find((o) => o.id === event.active.id)
    setActiveOrder(order ?? null)
  }

  function handleDragOver(_event: DragOverEvent) {}

  async function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null)
    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as OrderStatus

    if (!ORDER_STATUSES.includes(newStatus)) return

    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === newStatus) return

    updateOrderStatus(orderId, newStatus)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeCreds = (stores.find((s) => s.id === order.storeId) as any)?.credentials

    try {
      await callUpdateOrderStatus({
        platformOrderId: order.platformOrderId,
        platform: order.platform,
        status: newStatus,
        credentials: storeCreds,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status'
      toast.error(msg)
      updateOrderStatus(orderId, order.status)
    }
  }

  if (storesLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Store size={48} className="mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">No stores connected</h2>
        <p className="mb-6 mt-2 text-sm text-gray-400 max-w-sm">
          Connect your Shopify, WooCommerce, or BigCommerce store to start seeing orders.
        </p>
        <Link
          href="/settings/stores"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Connect a Store
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <StatsBar orders={displayOrders} loading={loading} />
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <FilterBar />
      </div>

      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
            {ORDER_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={getColumnOrders(status)}
                loading={loading}
                onOrderClick={setSelectedOrderId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder ? (
              <OrderCard order={activeOrder} onClick={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  )
}
