'use client'

import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Store, PLATFORM_LABELS, PLATFORM_COLORS } from '../../types'
import { Unplug, CheckCircle, AlertCircle, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  connected: {
    icon: <CheckCircle size={14} className="text-green-600" />,
    label: 'Connected',
    chip: 'bg-green-50 text-green-700',
  },
  error: {
    icon: <AlertCircle size={14} className="text-red-600" />,
    label: 'Error',
    chip: 'bg-red-50 text-red-700',
  },
  disconnected: {
    icon: <Wifi size={14} className="text-gray-400" />,
    label: 'Disconnected',
    chip: 'bg-gray-100 text-gray-600',
  },
}

export function StoreCard({ store }: { store: Store }) {
  const cfg = STATUS_CONFIG[store.status] ?? STATUS_CONFIG.connected

  async function handleDisconnect() {
    if (!confirm(`Disconnect "${store.name}"?`)) return
    try {
      await deleteDoc(doc(db, 'stores', store.id))
      toast.success('Store disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-500">
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{store.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[store.platform]}`}>
              {PLATFORM_LABELS[store.platform]}
            </span>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.chip}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <div className="mt-3">
        <span className="font-mono text-xs text-gray-500">{store.storeUrl}</span>
      </div>

      <div className="mt-4 flex">
        <button
          onClick={handleDisconnect}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Unplug size={12} />
          Disconnect
        </button>
      </div>
    </div>
  )
}
