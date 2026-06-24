'use client'

import { useState } from 'react'
import { Plus, Store } from 'lucide-react'
import { useStoreStore } from '../store/useStoreStore'
import { StoreCard } from '../components/stores/StoreCard'
import { AddStoreModal } from '../components/stores/AddStoreModal'

export function SettingsPage() {
  const { stores } = useStoreStore()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Connected Stores</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {stores.length === 0
                ? 'Connect your first store to get started'
                : `${stores.length} store${stores.length !== 1 ? 's' : ''} connected`}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            Add Store
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Store size={24} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800">No stores connected</h3>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">
              Connect Shopify, WooCommerce, or BigCommerce to start fetching orders.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
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
