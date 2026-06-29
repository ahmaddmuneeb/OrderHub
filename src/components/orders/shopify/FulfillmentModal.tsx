'use client'

import { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { Order, OrderItem } from '../../../types'
import { formatCurrency } from '../../../lib/utils'
import { Truck, Package, Bell, BellOff } from 'lucide-react'

interface Props {
  open: boolean
  order: Order
  onClose: () => void
  onConfirm: (opts: {
    lineItemIds: string[]
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

export function FulfillmentModal({ open, order, onClose, onConfirm }: Props) {
  const fulfillableItems = order.items.filter((i) => (i.fulfillableQuantity ?? 0) > 0)
  const [selected, setSelected] = useState<Record<string, number>>(
    Object.fromEntries(fulfillableItems.map((i) => [i.lineItemId!, i.fulfillableQuantity!])),
  )
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [trackingCompany, setTrackingCompany] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [saving, setSaving] = useState(false)

  function toggleItem(item: OrderItem) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[item.lineItemId!]) {
        delete next[item.lineItemId!]
      } else {
        next[item.lineItemId!] = item.fulfillableQuantity!
      }
      return next
    })
  }

  async function handleSubmit() {
    const lineItemIds = Object.keys(selected)
    if (lineItemIds.length === 0) return
    setSaving(true)
    try {
      await onConfirm({ lineItemIds, trackingNumber, trackingUrl, trackingCompany, notifyCustomer })
      onClose()
    } catch {
      // Error already shown as a toast by the parent handler
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Fulfill Order">
      <div className="space-y-5">

        {/* Items to fulfill */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Items to Fulfill</p>
          <div className="space-y-2">
            {fulfillableItems.length === 0 ? (
              <p className="text-sm text-slate-500">All items are already fulfilled.</p>
            ) : fulfillableItems.map((item) => (
              <label
                key={item.lineItemId}
                className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 transition-all ${
                  selected[item.lineItemId!]
                    ? 'bg-indigo-500/10 ring-indigo-500/40'
                    : 'bg-white/[0.04] ring-white/[0.08] hover:ring-white/[0.15]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected[item.lineItemId!]}
                  onChange={() => toggleItem(item)}
                  className="accent-indigo-500"
                />
                <Package size={14} className="shrink-0 text-slate-500" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{item.name}</p>
                  {item.variantTitle && (
                    <p className="text-xs text-slate-500">{item.variantTitle}</p>
                  )}
                  {item.sku && <p className="text-xs text-slate-600">SKU: {item.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-300">{formatCurrency(item.price, order.currency)}</p>
                  <p className="text-[10px] text-slate-500">Qty: {item.fulfillableQuantity}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tracking */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Truck size={10} className="inline mr-1.5" />Tracking (Optional)
          </p>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">Carrier</label>
                <select
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-xs text-slate-200 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">{c || '— Select —'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="1Z999AA10123456784"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Tracking URL (Optional)</label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.example.com/..."
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>
        </div>

        {/* Notify customer */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
          <div className="flex items-center gap-2.5">
            {notifyCustomer ? (
              <Bell size={14} className="text-indigo-400" />
            ) : (
              <BellOff size={14} className="text-slate-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-200">Send notification to customer</p>
              <p className="text-xs text-slate-500">Email customer about fulfillment</p>
            </div>
          </div>
          <div
            onClick={() => setNotifyCustomer((v) => !v)}
            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${notifyCustomer ? 'bg-indigo-600' : 'bg-white/10'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifyCustomer ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.1] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || Object.keys(selected).length === 0}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Fulfilling…' : 'Fulfill Order'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
