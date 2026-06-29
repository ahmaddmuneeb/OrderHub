'use client'

import { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { OrderFulfillment } from '../../../types'
import { Truck } from 'lucide-react'

interface Props {
  open: boolean
  fulfillment: OrderFulfillment | null
  onClose: () => void
  onConfirm: (opts: {
    fulfillmentId: string
    trackingNumber: string
    trackingUrl: string
    trackingCompany: string
    notifyCustomer: boolean
  }) => Promise<void>
}

const CARRIERS = [
  '', 'UPS', 'USPS', 'FedEx', 'DHL Express', 'Canada Post',
  'Royal Mail', 'Australia Post', 'China Post', 'Other',
]

export function AddTrackingModal({ open, fulfillment, onClose, onConfirm }: Props) {
  const [trackingNumber, setTrackingNumber] = useState(fulfillment?.trackingNumber ?? '')
  const [trackingUrl, setTrackingUrl] = useState(fulfillment?.trackingUrl ?? '')
  const [trackingCompany, setTrackingCompany] = useState(fulfillment?.trackingCompany ?? '')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!fulfillment || !trackingNumber.trim()) return
    setSaving(true)
    try {
      await onConfirm({
        fulfillmentId: fulfillment.id,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        trackingCompany: trackingCompany.trim(),
        notifyCustomer,
      })
      onClose()
    } catch {
      // Error already shown as a toast by the parent handler
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add / Update Tracking">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.07]">
          <Truck size={13} className="text-slate-500" />
          <span className="text-xs text-slate-400">Fulfillment #{fulfillment?.id?.slice(-6)}</span>
          <span className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
            fulfillment?.status === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}>{fulfillment?.status}</span>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Carrier</label>
          <select
            value={trackingCompany}
            onChange={(e) => setTrackingCompany(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c} className="bg-slate-900">{c || '— Select carrier —'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tracking Number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. 1Z999AA10123456784"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tracking URL (optional)</label>
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://tracking.example.com/..."
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="accent-indigo-500 h-4 w-4"
          />
          <span className="text-sm text-slate-300">Send shipping notification to customer</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !trackingNumber.trim()}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Tracking'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
