'use client'

import { useState } from 'react'
import { Plus, Store } from 'lucide-react'
import { useStoreStore } from '../store/useStoreStore'
import { StoreCard } from '../components/stores/StoreCard'
import { AddStoreModal } from '../components/stores/AddStoreModal'
import { StoreCardSkeleton } from '../components/ui/Skeleton'

export function SettingsPage() {
  const { stores, storesLoading } = useStoreStore()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-slate-950">
      <div className="border-b border-white/[0.07] bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Connected Stores</h1>
            {storesLoading ? (
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded-full bg-white/[0.08]" />
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">
                {stores.length === 0
                  ? 'Connect your first store to get started'
                  : `${stores.length} store${stores.length !== 1 ? 's' : ''} connected`}
              </p>
            )}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-600/30 transition-all duration-150"
          >
            <Plus size={15} />
            Add Store
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {storesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <StoreCardSkeleton key={i} />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.02] py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/[0.06] ring-1 ring-white/[0.08]">
              <Store size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">No stores connected</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-500 leading-relaxed">
              Connect Shopify, WooCommerce, or BigCommerce to start fetching orders.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-7 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all duration-150"
            >
              <Plus size={15} />
              Connect First Store
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>

      <AddStoreModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
