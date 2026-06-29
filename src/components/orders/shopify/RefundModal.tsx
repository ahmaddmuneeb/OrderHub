'use client'

import { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { Order } from '../../../types'
import { formatCurrency } from '../../../lib/utils'
import { DollarSign } from 'lucide-react'

interface RefundItem {
  lineItemId: string
  name: string
  maxQty: number
  price: number
  quantity: number
  restock: boolean
}

interface Props {
  open: boolean
  order: Order
  onClose: () => void
  onConfirm: (opts: {
    lineItems: Array<{ lineItemId: string; quantity: number; restockType: string }>
    shipping?: { fullRefund?: boolean; amount?: string }
    note: string
    notify: boolean
    transactions: Array<{ parentId: string; amount: string; kind: string; gateway?: string }>
  }) => Promise<void>
}

export function RefundModal({ open, order, onClose, onConfirm }: Props) {
  const eligibleItems = order.items.filter((i) => i.qty > 0 && i.lineItemId)
  const [items, setItems] = useState<RefundItem[]>(
    eligibleItems.map((i) => ({
      lineItemId: i.lineItemId!,
      name: i.name,
      maxQty: i.qty,
      price: i.price,
      quantity: 0,
      restock: true,
    })),
  )
  const [refundShipping, setRefundShipping] = useState(false)
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  function setQty(id: string, qty: number) {
    setItems((prev) => prev.map((i) => i.lineItemId === id ? { ...i, quantity: Math.max(0, Math.min(qty, i.maxQty)) } : i))
  }

  function toggleRestock(id: string) {
    setItems((prev) => prev.map((i) => i.lineItemId === id ? { ...i, restock: !i.restock } : i))
  }

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingTotal = refundShipping ? order.totalShipping : 0
  const refundTotal = itemsTotal + shippingTotal

  const paidTransaction = order.transactions?.find(
    (t) => (t.kind === 'sale' || t.kind === 'capture') && t.status === 'success',
  )

  async function handleSubmit() {
    const lineItems = items
      .filter((i) => i.quantity > 0)
      .map((i) => ({
        lineItemId: i.lineItemId,
        quantity: i.quantity,
        restockType: i.restock ? 'return' : 'no_restock',
      }))

    const transactions = paidTransaction
      ? [{
          parentId: paidTransaction.id,
          amount: refundTotal.toFixed(2),
          kind: 'refund',
          gateway: paidTransaction.gateway,
        }]
      : []

    setSaving(true)
    try {
      await onConfirm({
        lineItems,
        shipping: refundShipping ? { fullRefund: true } : undefined,
        note,
        notify,
        transactions,
      })
      onClose()
    } catch {
      // Error already shown as a toast by the parent handler
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Refund Order">
      <div className="space-y-5">

        {/* Items */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Items to Refund</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.lineItemId} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.price, order.currency)} each</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setQty(item.lineItemId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] text-lg leading-none"
                    >−</button>
                    <span className="w-6 text-center text-sm font-bold text-slate-200">{item.quantity}</span>
                    <button
                      onClick={() => setQty(item.lineItemId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQty}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07] text-slate-300 hover:bg-white/[0.12] disabled:opacity-30 text-lg leading-none"
                    >+</button>
                  </div>
                </div>
                {item.quantity > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={item.restock}
                        onChange={() => toggleRestock(item.lineItemId)}
                        className="accent-indigo-500"
                      />
                      Restock item
                    </label>
                    <span className="ms-auto text-xs font-bold text-emerald-400">
                      −{formatCurrency(item.price * item.quantity, order.currency)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shipping refund */}
        {order.totalShipping > 0 && (
          <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.07]">
            <div>
              <p className="text-sm font-semibold text-slate-200">Refund shipping</p>
              <p className="text-xs text-slate-500">{formatCurrency(order.totalShipping, order.currency)}</p>
            </div>
            <input
              type="checkbox"
              checked={refundShipping}
              onChange={(e) => setRefundShipping(e.target.checked)}
              className="accent-indigo-500 h-4 w-4"
            />
          </label>
        )}

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/[0.1]">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Refund Total</span>
          </div>
          <span className="text-base font-extrabold text-emerald-400">
            {formatCurrency(refundTotal, order.currency)}
          </span>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Reason (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Reason for refund..."
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none"
          />
        </div>

        {/* Notify */}
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-indigo-500 h-4 w-4" />
          <span className="text-sm text-slate-300">Send refund notification to customer</span>
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
            disabled={saving || refundTotal <= 0}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Processing…' : `Refund ${formatCurrency(refundTotal, order.currency)}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
