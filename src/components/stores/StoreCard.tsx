'use client'

import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Store, PLATFORM_LABELS, PLATFORM_COLORS } from '../../types'
import { Unplug, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  connected: {
    icon: <CheckCircle2 size={13} className="text-emerald-500" />,
    label: 'Connected',
    chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  error: {
    icon: <AlertCircle size={13} className="text-rose-500" />,
    label: 'Error',
    chip: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  disconnected: {
    icon: <WifiOff size={13} className="text-slate-400" />,
    label: 'Disconnected',
    chip: 'bg-slate-100 text-slate-500 border border-slate-200',
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
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-150">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-base font-bold text-slate-600">
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{store.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PLATFORM_COLORS[store.platform]}`}>
              {PLATFORM_LABELS[store.platform]}
            </span>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.chip}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <p className="mt-3 font-mono text-xs text-slate-400">{store.storeUrl}</p>

      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400
                     hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <Unplug size={12} />
          Disconnect
        </button>
      </div>
    </div>
  )
}
