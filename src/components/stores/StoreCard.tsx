'use client'

import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Store, PLATFORM_LABELS, PLATFORM_COLORS } from '../../types'
import { Unplug, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CONFIG = {
  connected: {
    icon: <CheckCircle2 size={13} className="text-emerald-400" />,
    label: 'Connected',
    chip: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  },
  error: {
    icon: <AlertCircle size={13} className="text-rose-400" />,
    label: 'Error',
    chip: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  },
  disconnected: {
    icon: <WifiOff size={13} className="text-slate-500" />,
    label: 'Disconnected',
    chip: 'bg-white/[0.06] text-slate-500 border border-white/[0.1]',
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
    <div className="group rounded-2xl bg-slate-800/80 p-5 ring-1 ring-white/[0.08] hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 hover:ring-white/[0.12] transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-700 text-lg font-bold text-slate-300 ring-1 ring-white/[0.1]">
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white">{store.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${PLATFORM_COLORS[store.platform]}`}>
              {PLATFORM_LABELS[store.platform]}
            </span>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.chip}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <p className="mt-3 font-mono text-xs text-slate-600 truncate">{store.storeUrl}</p>

      <div className="mt-4 flex justify-end border-t border-white/[0.06] pt-3">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600
                     hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <Unplug size={12} />
          Disconnect
        </button>
      </div>
    </div>
  )
}
