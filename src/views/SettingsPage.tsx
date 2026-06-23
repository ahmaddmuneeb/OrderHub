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
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Connections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your connected e-commerce stores
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Store size={40} className="mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700">No stores connected</h3>
          <p className="mb-4 mt-1 text-sm text-gray-400">
            Connect Shopify, WooCommerce, or BigCommerce to start fetching orders.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={14} />
            Connect First Store
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      <AddStoreModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
