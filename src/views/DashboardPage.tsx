'use client'

import { useState, useMemo } from 'react'
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
import { Order, PLATFORM_STATUSES, PLATFORM_LABELS, Store } from '../types'
import { KanbanColumn } from '../components/orders/KanbanColumn'
import { FilterBar } from '../components/orders/FilterBar'
import { StatsBar } from '../components/orders/StatsBar'
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer'
import { OrderCard } from '../components/orders/OrderCard'
import toast from 'react-hot-toast'
import { Store as StoreIcon, RefreshCw, Plus, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export function DashboardPage() {
  const { filteredOrders, updateOrderStatus, setSelectedOrderId, selectedOrderId, orders } =
    useOrderStore()
  const { stores, storesLoading } = useStoreStore()
  const { loading, refresh } = useOrders()
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  // Determine which store is currently selected (null = all stores)
  const selectedStore: Store | null = stores.find((s) => s.id === selectedStoreId) ?? null

  // Filter displayed orders by selected store (on top of search/platform/date filters)
  const allFiltered = filteredOrders()
  const displayOrders = selectedStoreId
    ? allFiltered.filter((o) => o.storeId === selectedStoreId)
    : allFiltered

  // Kanban columns: use selected store's platform statuses, or derive from all visible orders
  const kanbanColumns = useMemo(() => {
    if (selectedStore) {
      return PLATFORM_STATUSES[selectedStore.platform]
    }
    // All stores: show the union of statuses that actually have orders, ordered by platform priority
    const seen = new Set(displayOrders.map((o) => o.status))
    const allStatuses = stores.flatMap((s) => PLATFORM_STATUSES[s.platform])
    const deduped = [...new Set(allStatuses)]
    return deduped.filter((s) => seen.has(s))
  }, [selectedStore, displayOrders, stores])

  function getColumnOrders(status: string) {
    return displayOrders.filter((o) => o.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveOrder(orders.find((o) => o.id === event.active.id) ?? null)
  }

  function handleDragOver(_event: DragOverEvent) {}

  async function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null)
    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as string
    if (!kanbanColumns.includes(newStatus)) return

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
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
      updateOrderStatus(orderId, order.status)
    }
  }

  if (storesLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <StoreIcon size={28} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No stores connected</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Connect your Shopify, WooCommerce, or BigCommerce store to start managing orders.
        </p>
        <Link
          href="/settings/stores"
          className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} />
          Connect a Store
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        {/* Title row */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {selectedStore ? selectedStore.name || PLATFORM_LABELS[selectedStore.platform] : 'All Stores'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {loading
                ? 'Loading…'
                : `${displayOrders.length} order${displayOrders.length !== 1 ? 's' : ''}${!selectedStore ? ` across ${stores.length} store${stores.length !== 1 ? 's' : ''}` : ''}`}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Store tabs */}
        <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setSelectedStoreId(null)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              !selectedStoreId
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <LayoutGrid size={12} />
            All Stores
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedStoreId === store.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <StoreIcon size={12} />
              {store.name || PLATFORM_LABELS[store.platform]}
            </button>
          ))}
        </div>

        {/* Stats + filters */}
        <div className="mb-4">
          <StatsBar orders={displayOrders} loading={loading} platform={selectedStore?.platform ?? null} />
        </div>
        <FilterBar />
      </div>

      {/* Kanban board */}
      <div className="scrollbar-thin flex-1 overflow-x-auto p-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4" style={{ minWidth: 'max-content' }}>
            {kanbanColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={getColumnOrders(status)}
                loading={loading}
                onOrderClick={setSelectedOrderId}
              />
            ))}
            {!loading && kanbanColumns.length === 0 && (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                No orders match the current filters
              </div>
            )}
          </div>

          <DragOverlay>
            {activeOrder ? <OrderCard order={activeOrder} onClick={() => {}} /> : null}
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
