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
import { Order, Platform, PLATFORM_STATUSES, PLATFORM_LABELS } from '../types'
import { KanbanColumn } from '../components/orders/KanbanColumn'
import { FilterBar } from '../components/orders/FilterBar'
import { StatsBar } from '../components/orders/StatsBar'
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer'
import { OrderCard } from '../components/orders/OrderCard'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { toast } from 'sonner'
import { Store as StoreIcon, RefreshCw, Plus, ShoppingBag, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'

/* ─── Platform tab definitions ─── */

const PLATFORM_TABS: {
  value: Platform
  label: string
  icon: React.ElementType
  activeText: string
  activeBorder: string
  activeBadge: string
}[] = [
  {
    value: 'shopify',
    label: 'Shopify',
    icon: ShoppingBag,
    activeText: 'text-emerald-400',
    activeBorder: 'border-emerald-500',
    activeBadge: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    value: 'woocommerce',
    label: 'WooCommerce',
    icon: ShoppingCart,
    activeText: 'text-violet-400',
    activeBorder: 'border-violet-500',
    activeBadge: 'bg-violet-500/15 text-violet-400',
  },
  {
    value: 'bigcommerce',
    label: 'BigCommerce',
    icon: Package,
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-500',
    activeBadge: 'bg-blue-500/15 text-blue-400',
  },
]

/* ─── Component ─── */

export function DashboardPage() {
  const { filteredOrders, updateOrderStatus, setSelectedOrderId, selectedOrderId, orders } =
    useOrderStore()
  const { stores, storesLoading } = useStoreStore()
  const { loading, refresh } = useOrders()

  const [activePlatform, setActivePlatform] = useState<Platform>('shopify')
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  /* Derived data */
  const platformStores = stores.filter((s) => s.platform === activePlatform)
  const selectedStore   = platformStores.find((s) => s.id === selectedStoreId) ?? null

  const allFiltered    = filteredOrders()
  const platformOrders = allFiltered.filter((o) => o.platform === activePlatform)
  const displayOrders  = selectedStoreId
    ? platformOrders.filter((o) => o.storeId === selectedStoreId)
    : platformOrders

  const kanbanColumns = PLATFORM_STATUSES[activePlatform]

  function getColumnOrders(status: string) {
    return displayOrders.filter((o) => o.status === status)
  }

  function handlePlatformChange(p: Platform) {
    setActivePlatform(p)
    setSelectedStoreId(null)
  }

  /* Drag handlers */
  function handleDragStart(e: DragStartEvent) {
    setActiveOrder(orders.find((o) => o.id === e.active.id) ?? null)
  }

  function handleDragOver(_e: DragOverEvent) {}

  async function handleDragEnd(e: DragEndEvent) {
    setActiveOrder(null)
    const { active, over } = e
    if (!over) return

    const orderId   = active.id as string
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
      updateOrderStatus(orderId, order.status)
    }
  }

  /* ── Loading ── */
  if (storesLoading) return <DashboardSkeleton />

  /* ── No stores at all ── */
  if (stores.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center bg-slate-950">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.06] ring-1 ring-white/[0.08]">
          <StoreIcon size={32} className="text-slate-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">No stores connected</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
          Connect your Shopify, WooCommerce, or BigCommerce store to start managing orders from one place.
        </p>
        <Link
          href="/settings/stores"
          className="mt-7 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all duration-150"
        >
          <Plus size={15} />
          Connect a Store
        </Link>
      </div>
    )
  }

  /* ── Main layout ── */
  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* ══ Header ══ */}
      <div className="shrink-0 border-b border-white/[0.07] bg-slate-900">

        {/* Title + refresh */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {selectedStore
                ? selectedStore.name || PLATFORM_LABELS[activePlatform]
                : PLATFORM_LABELS[activePlatform]}
            </h1>
            {loading ? (
              <div className="mt-1.5 h-3 w-28 animate-pulse rounded-full bg-white/[0.08]" />
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">
                {displayOrders.length} order{displayOrders.length !== 1 ? 's' : ''}
                {platformStores.length > 1 && !selectedStore
                  ? ` across ${platformStores.length} stores`
                  : ''}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.1] hover:text-white disabled:opacity-40 transition-all duration-150"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin text-indigo-400' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Platform tabs ── */}
        <div className="flex border-b border-white/[0.06] px-6 mt-1">
          {PLATFORM_TABS.map(({ value, label, icon: Icon, activeText, activeBorder, activeBadge }) => {
            const active = activePlatform === value
            const count  = orders.filter((o) => o.platform === value).length
            return (
              <button
                key={value}
                onClick={() => handlePlatformChange(value)}
                className={`flex items-center gap-2 border-b-2 -mb-px px-4 py-3.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? `${activeBorder} ${activeText}`
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                {label}
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-bold transition-all ${
                    active ? activeBadge : 'bg-white/[0.06] text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Per-store sub-tabs (only if platform has 2+ stores) ── */}
        {platformStores.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto px-6 pt-3 pb-2">
            <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] p-1">
              <button
                onClick={() => setSelectedStoreId(null)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  !selectedStoreId
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                All {PLATFORM_LABELS[activePlatform]}
              </button>
              {platformStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    selectedStoreId === store.id
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <StoreIcon size={11} />
                  {store.name || store.storeUrl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats + filters (only when platform has stores) ── */}
        {platformStores.length > 0 && (
          <div className="space-y-3 px-6 pb-4 pt-3">
            <StatsBar orders={displayOrders} loading={loading} platform={activePlatform} />
            <FilterBar />
          </div>
        )}
      </div>

      {/* ══ Body ══ */}
      {platformStores.length === 0 ? (

        /* Empty state: no stores for this platform */
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center bg-slate-950">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.06] ring-1 ring-white/[0.08]">
            {(() => {
              const tab = PLATFORM_TABS.find((t) => t.value === activePlatform)!
              return <tab.icon size={32} className="text-slate-500" />
            })()}
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            No {PLATFORM_LABELS[activePlatform]} stores connected
          </h2>
          <p className="mt-2 max-w-xs text-sm text-slate-400 leading-relaxed">
            Connect a {PLATFORM_LABELS[activePlatform]} store to see and manage its orders here.
          </p>
          <Link
            href="/settings/stores"
            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all duration-150"
          >
            <Plus size={14} />
            Connect {PLATFORM_LABELS[activePlatform]}
          </Link>
        </div>

      ) : (

        /* Kanban board */
        <div className="scrollbar-thin flex-1 overflow-x-auto bg-slate-950 p-5">
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
              {!loading && displayOrders.length === 0 && (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
                  No orders match the current filters
                </div>
              )}
            </div>

            <DragOverlay>
              {activeOrder ? <OrderCard order={activeOrder} onClick={() => {}} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  )
}
