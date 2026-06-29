'use client'

import { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { Order } from '../../../types'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  order: Order
  onClose: () => void
  onConfirm: (opts: { reason: string; email: boolean; restock: boolean }) => Promise<void>
}

const CANCEL_REASONS = [
  { value: 'customer', label: 'Customer changed / cancelled order' },
  { value: 'fraud', label: 'Fraudulent order' },
  { value: 'inventory', label: 'Items unavailable' },
  { value: 'declined', label: 'Payment declined' },
  { value: 'other', label: 'Other' },
]

export function CancelOrderModal({ open, order, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('customer')
  const [email, setEmail] = useState(true)
  const [restock, setRestock] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setSaving(true)
    try {
      await onConfirm({ reason, email, restock })
      onClose()
    } catch {
      // Error already shown as a toast by the parent handler
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cancel Order">
      <div className="space-y-5">

        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 p-4 ring-1 ring-rose-500/25">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-300">Cancel order #{order.orderNumber}?</p>
            <p className="mt-0.5 text-xs text-rose-400/70">This action cannot be undone from the dashboard. You can reopen the order from Shopify if needed.</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-indigo-500 h-4 w-4" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Restock items</p>
              <p className="text-xs text-slate-500">Return inventory quantities to their levels before this order</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="accent-indigo-500 h-4 w-4" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Send cancellation email</p>
              <p className="text-xs text-slate-500">Notify {order.customerEmail} about the cancellation</p>
            </div>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1] transition-colors"
          >
            Keep Order
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
