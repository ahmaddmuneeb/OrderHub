'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  callUpdateOrderStatus,
  callShopifyFulfill,
  callShopifyRefund,
  callShopifyCancel,
  callShopifyArchive,
  callShopifyUpdateOrder,
  callShopifyAddTracking,
  callShopifyMarkPaid,
  callShopifyCapture,
  callShopifyResendConfirmation,
  callShopifyOrderDetail,
} from '../../lib/firebase'
import { useOrderStore } from '../../store/useOrderStore'
import { useStoreStore } from '../../store/useStoreStore'
import {
  Order, OrderFulfillment,
  PLATFORM_STATUSES, PLATFORM_LABELS, PLATFORM_COLORS,
  getStatusLabel, getStatusBadgeClass,
} from '../../types'
import { Drawer } from '../ui/Drawer'
import { Dropdown } from '../ui/Dropdown'
import { formatCurrency } from '../../lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ExternalLink, Calendar, Package, Store, Tag, Truck, User,
  MapPin, CreditCard, RefreshCw, RotateCcw, Archive,
  CheckCircle2, XCircle, Mail, Plus, Pencil, Check, X,
  ChevronDown, ChevronUp, AlertTriangle, DollarSign,
} from 'lucide-react'

import { FulfillmentModal } from './shopify/FulfillmentModal'
import { RefundModal } from './shopify/RefundModal'
import { AddTrackingModal } from './shopify/AddTrackingModal'
import { CancelOrderModal } from './shopify/CancelOrderModal'

interface Props {
  orderId: string | null
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{children}</p>
}

function InfoRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.05] last:border-0">
      <span className="shrink-0 text-xs text-slate-500 w-32">{label}</span>
      <span className={`text-right text-xs font-medium text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

function addressLine(addr: Order['shippingAddress']): string {
  if (!addr) return ''
  return [
    [addr.firstName, addr.lastName].filter(Boolean).join(' '),
    addr.company,
    addr.address1,
    addr.address2,
    [addr.city, addr.province, addr.zip].filter(Boolean).join(', '),
    addr.country,
  ].filter(Boolean).join('\n')
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderDetailDrawer({ orderId, onClose }: Props) {
  const t = useTranslations('orders')
  const { orders, updateOrderStatus, updateOrderNote, updateOrderTags, updateOrderFields } =
    useOrderStore()
  const { stores } = useStoreStore()
  const order = orders.find((o) => o.id === orderId) ?? null

  const [savingStatus, setSavingStatus] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Modals
  const [showFulfill, setShowFulfill] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [showTracking, setShowTracking] = useState(false)
  const [trackingFulfillment, setTrackingFulfillment] = useState<OrderFulfillment | null>(null)
  const [showCancel, setShowCancel] = useState(false)

  // Inline editing
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [editingTags, setEditingTags] = useState(false)
  const [tagsValue, setTagsValue] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  // UI toggles
  const [showTimeline, setShowTimeline] = useState(false)
  const [showFinancial, setShowFinancial] = useState(true)

  // ── helpers ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeCreds = useCallback(() => (stores.find((s) => s.id === order?.storeId) as any)?.credentials, [stores, order])

  const isShopify = order?.platform === 'shopify'
  const isArchived = !!order?.closedAt

  const canFulfill = isShopify && order && order.items.some((i) => (i.fulfillableQuantity ?? 0) > 0)
  const canRefund = isShopify && order && (order.financialStatus === 'paid' || order.financialStatus === 'partially_paid' || order.financialStatus === 'partially_refunded')
  const canCapture = isShopify && order && order.financialStatus === 'authorized' && order.transactions?.some((t) => t.kind === 'authorization' && t.status === 'success')
  // Use Shopify's own canMarkAsPaid field (fetched via GraphQL) — the authoritative answer
  const canMarkPaid = isShopify && order && (order.canMarkAsPaid ?? false)
  // Shopify only allows cancel on unfulfilled/pending orders; fulfilled orders must be refunded first
  const canCancel = isShopify
    ? order && order.status !== 'cancelled' && order.status !== 'fulfilled' && order.status !== 'partial'
    : order && order.status !== 'cancelled'

  // ── status change ──
  async function handleStatusChange(newStatus: string) {
    if (!order || newStatus === order.status) return
    setSavingStatus(true)
    const prev = order.status
    updateOrderStatus(order.id, newStatus)
    try {
      await callUpdateOrderStatus({
        platformOrderId: order.platformOrderId,
        platform: order.platform,
        status: newStatus,
        credentials: storeCreds(),
      })
      toast.success('Status updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
      updateOrderStatus(order.id, prev)
    } finally {
      setSavingStatus(false)
    }
  }

  // ── refresh order from Shopify (used after every action to sync true state) ──
  async function refreshFromShopify(showToast = false) {
    if (!order || !isShopify) return
    try {
      const { order: fresh } = await callShopifyOrderDetail({
        platformOrderId: order.platformOrderId,
        storeId: order.storeId,
        credentials: storeCreds(),
      })
      updateOrderFields(order.id, {
        ...fresh,
        createdAt: new Date(fresh.createdAt).toISOString(),
        updatedAt: new Date(fresh.updatedAt).toISOString(),
      })
      if (showToast) toast.success('Order refreshed')
    } catch (err) {
      if (showToast) toast.error(err instanceof Error ? err.message : 'Failed to refresh order')
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await refreshFromShopify(true)
    setRefreshing(false)
  }

  // ── fulfill ──
  async function handleFulfill(opts: {
    lineItemIds: string[]; trackingNumber: string; trackingUrl: string;
    trackingCompany: string; notifyCustomer: boolean
  }) {
    if (!order) return
    try {
      await callShopifyFulfill({ platformOrderId: order.platformOrderId, credentials: storeCreds(), ...opts })
      toast.success('Order fulfilled')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fulfill order')
      throw err
    }
  }

  // ── refund ──
  async function handleRefund(opts: {
    lineItems: Array<{ lineItemId: string; quantity: number; restockType: string }>
    shipping?: { fullRefund?: boolean; amount?: string }
    note: string
    notify: boolean
    transactions: Array<{ parentId: string; amount: string; kind: string; gateway?: string }>
  }) {
    if (!order) return
    try {
      await callShopifyRefund({
        platformOrderId: order.platformOrderId,
        credentials: storeCreds(),
        lineItems: opts.lineItems,
        shipping: opts.shipping,
        note: opts.note,
        notify: opts.notify,
        transactions: opts.transactions,
      })
      toast.success('Refund processed')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process refund')
      throw err
    }
  }

  // ── cancel ──
  async function handleCancel(opts: { reason: string; email: boolean; restock: boolean }) {
    if (!order) return
    try {
      await callShopifyCancel({
        platformOrderId: order.platformOrderId,
        credentials: storeCreds(),
        reason: opts.reason,
        email: opts.email,
        restock: opts.restock,
      })
      toast.success('Order cancelled')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
      throw err
    }
  }

  // ── add tracking ──
  async function handleAddTracking(opts: { fulfillmentId: string; trackingNumber: string; trackingUrl: string; trackingCompany: string; notifyCustomer: boolean }) {
    if (!order) return
    try {
      await callShopifyAddTracking({ credentials: storeCreds(), ...opts })
      toast.success('Tracking updated')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tracking')
      throw err
    }
  }

  // ── archive ──
  async function handleArchive() {
    if (!order) return
    const a = !isArchived
    try {
      await callShopifyArchive({ platformOrderId: order.platformOrderId, credentials: storeCreds(), archive: a })
      toast.success(a ? 'Order archived' : 'Order unarchived')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive order')
    }
  }

  // ── mark as paid ──
  async function handleMarkPaid() {
    if (!order) return
    try {
      await callShopifyMarkPaid({
        platformOrderId: order.platformOrderId,
        credentials: storeCreds(),
      })
      toast.success('Order marked as paid')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid')
    }
  }

  // ── capture payment ──
  async function handleCapture() {
    if (!order) return
    const authTx = order.transactions?.find((t) => t.kind === 'authorization' && t.status === 'success')
    if (!authTx) return
    try {
      await callShopifyCapture({
        platformOrderId: order.platformOrderId,
        credentials: storeCreds(),
        parentTransactionId: authTx.id,
        amount: authTx.amount,
      })
      toast.success('Payment captured')
      refreshFromShopify()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to capture payment')
    }
  }

  // ── save note ──
  async function handleSaveNote() {
    if (!order) return
    setSavingNote(true)
    try {
      await callShopifyUpdateOrder({ platformOrderId: order.platformOrderId, credentials: storeCreds(), note: noteValue })
      updateOrderNote(order.id, noteValue)
      setEditingNote(false)
      toast.success('Note saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  // ── save tags ──
  async function handleSaveTags() {
    if (!order) return
    setSavingTags(true)
    try {
      await callShopifyUpdateOrder({ platformOrderId: order.platformOrderId, credentials: storeCreds(), tags: tagsValue })
      updateOrderTags(order.id, tagsValue)
      setEditingTags(false)
      toast.success('Tags saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tags')
    } finally {
      setSavingTags(false)
    }
  }

  // ── resend confirmation ──
  async function handleResendConfirmation() {
    if (!order) return
    try {
      await callShopifyResendConfirmation({ platformOrderId: order.platformOrderId, credentials: storeCreds() })
      toast.success('Confirmation email sent')
    } catch {
      toast.error('Failed to resend confirmation')
    }
  }

  if (!order) return null

  return (
    <>
      <Drawer
        open={!!orderId && !!order}
        onClose={onClose}
        title={`Order #${order.orderNumber}`}
      >
        <div className="space-y-5 pb-8">

          {/* ── Header row: platform + status + links ── */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${PLATFORM_COLORS[order.platform]}`}>
              {PLATFORM_LABELS[order.platform]}
            </span>
            {order.channel && (
              <span className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">
                <Store size={10} />
                {order.channel}
              </span>
            )}
            {isArchived && (
              <span className="flex items-center gap-1 rounded-full bg-slate-700/60 px-2.5 py-1 text-xs font-semibold text-slate-400">
                <Archive size={10} />
                Archived
              </span>
            )}
            {order.risk && order.risk !== 'none' && order.risk !== 'low' && (
              <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${order.risk === 'high' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                <AlertTriangle size={10} />
                {order.risk === 'high' ? 'High Risk' : 'Medium Risk'}
              </span>
            )}
            {isShopify ? (
              <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${getStatusBadgeClass(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            ) : (
              <Dropdown
                value={order.status}
                onChange={(v) => handleStatusChange(v as string)}
                disabled={savingStatus}
                size="sm"
                options={PLATFORM_STATUSES[order.platform].map((s) => ({
                  value: s, label: getStatusLabel(s),
                }))}
              />
            )}
            <div className="ms-auto flex items-center gap-1.5">
              {isShopify && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh order from Shopify"
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/[0.1] hover:text-white disabled:opacity-40 transition-colors"
                >
                  <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                </button>
              )}
              {order.platformOrderUrl && (
                <a
                  href={order.platformOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <ExternalLink size={12} />
                  {t('viewOn', { platform: PLATFORM_LABELS[order.platform] })}
                </a>
              )}
            </div>
          </div>

          {/* ── Shopify Action Buttons ── */}
          {isShopify && (
            <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
              <SectionTitle>Actions</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {canFulfill && (
                  <button
                    onClick={() => setShowFulfill(true)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
                  >
                    <CheckCircle2 size={13} />Fulfill Order
                  </button>
                )}
                {canRefund && (
                  <button
                    onClick={() => setShowRefund(true)}
                    className="flex items-center gap-2 rounded-xl bg-amber-500/15 px-3 py-2.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/25 hover:bg-amber-500/25 transition-colors"
                  >
                    <RotateCcw size={13} />Refund
                  </button>
                )}
                {canCapture && (
                  <button
                    onClick={handleCapture}
                    className="flex items-center gap-2 rounded-xl bg-violet-500/15 px-3 py-2.5 text-xs font-bold text-violet-400 ring-1 ring-violet-500/25 hover:bg-violet-500/25 transition-colors"
                  >
                    <CreditCard size={13} />Capture Payment
                  </button>
                )}
                {isShopify && order?.financialStatus === 'pending' && (
                  canMarkPaid ? (
                    <button
                      onClick={handleMarkPaid}
                      className="flex items-center gap-2 rounded-xl bg-teal-500/15 px-3 py-2.5 text-xs font-bold text-teal-400 ring-1 ring-teal-500/25 hover:bg-teal-500/25 transition-colors"
                    >
                      <DollarSign size={13} />Mark as Paid
                    </button>
                  ) : (
                    <button
                      disabled
                      title="Shopify does not allow marking this order as paid — the customer must complete payment through the original payment method."
                      className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-white/[0.06] cursor-not-allowed"
                    >
                      <DollarSign size={13} />Mark as Paid
                    </button>
                  )
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowCancel(true)}
                    className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-3 py-2.5 text-xs font-bold text-rose-400 ring-1 ring-rose-500/25 hover:bg-rose-500/25 transition-colors"
                  >
                    <XCircle size={13} />Cancel Order
                  </button>
                )}
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 rounded-xl bg-slate-700/40 px-3 py-2.5 text-xs font-bold text-slate-400 ring-1 ring-white/[0.07] hover:bg-slate-700/60 transition-colors"
                >
                  <Archive size={13} />{isArchived ? 'Unarchive' : 'Archive'}
                </button>
                {order.customerEmail && (
                  <button
                    onClick={handleResendConfirmation}
                    className="flex items-center gap-2 rounded-xl bg-blue-500/15 px-3 py-2.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/25 hover:bg-blue-500/25 transition-colors"
                  >
                    <Mail size={13} />Resend Email
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Status rows ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <SectionTitle>{t('orderStatus')}</SectionTitle>
            <div className="space-y-2">

              {/* Payment status */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
                    <CreditCard size={13} className="text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Payment</span>
                </div>
                {order.financialStatus ? (
                  <Badge className={getStatusBadgeClass(order.financialStatus)}>{getStatusLabel(order.financialStatus)}</Badge>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>

              {/* Fulfillment status */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
                    <Package size={13} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Fulfillment</span>
                </div>
                {order.fulfillmentStatus ? (
                  <Badge className={getStatusBadgeClass(order.fulfillmentStatus)}>{getStatusLabel(order.fulfillmentStatus)}</Badge>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>

              {/* Delivery status */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15">
                    <Truck size={13} className="text-cyan-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Delivery Status</span>
                </div>
                {order.deliveryStatus ? (
                  <Badge className={getStatusBadgeClass(order.deliveryStatus)}>{order.deliveryStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</Badge>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>

              {/* Delivery method */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15">
                    <MapPin size={13} className="text-indigo-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Delivery Method</span>
                </div>
                {order.deliveryMethod ? (
                  <span className="text-xs font-semibold text-slate-300">{order.deliveryMethod}</span>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>

            </div>
            {order.gateway && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.05] pt-3">
                <CreditCard size={11} className="text-slate-600" />
                <span className="text-xs text-slate-500">Payment via</span>
                <span className="text-xs font-semibold text-slate-400">{order.gateway}</span>
              </div>
            )}
          </section>

          {/* ── Customer ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <SectionTitle>
              <User size={10} className="inline mr-1.5" />
              {t('customer')}
            </SectionTitle>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                {order.customerName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold text-white">{order.customerName}</p>
                <p className="text-sm text-slate-500">{order.customerEmail}</p>
                {order.phone && <p className="text-xs text-slate-600">{order.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {order.shippingAddress && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <MapPin size={9} />Shipping
                  </p>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{addressLine(order.shippingAddress)}</p>
                  {order.shippingAddress.phone && (
                    <p className="mt-1 text-xs text-slate-500">{order.shippingAddress.phone}</p>
                  )}
                </div>
              )}
              {order.billingAddress && (
                <div className="rounded-xl bg-white/[0.05] ring-1 ring-white/[0.07] p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <CreditCard size={9} />Billing
                  </p>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{addressLine(order.billingAddress)}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Items ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <SectionTitle>
              <Package size={10} className="inline mr-1.5" />
              {t('items')}
            </SectionTitle>
            <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.08]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.05]">
                    <th className="px-4 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('product')}</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('qty')}</th>
                    <th className="px-4 py-3 text-end text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-300">{item.name}</p>
                        {item.variantTitle && <p className="text-xs text-slate-500">{item.variantTitle}</p>}
                        {item.sku && <p className="text-xs text-slate-600 font-mono">SKU: {item.sku}</p>}
                        {item.totalDiscount != null && item.totalDiscount > 0 && (
                          <p className="text-xs text-emerald-500">−{formatCurrency(item.totalDiscount, order.currency)} off</p>
                        )}
                        {(item.fulfillableQuantity ?? 0) > 0 && (
                          <span className="text-[10px] text-amber-400">Unfulfilled: {item.fulfillableQuantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.qty}</td>
                      <td className="px-4 py-3 text-end font-semibold text-slate-300">
                        {formatCurrency(item.price * item.qty, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Financial Summary ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-2">
            <button
              onClick={() => setShowFinancial((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <SectionTitle>Financial Summary</SectionTitle>
              {showFinancial ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
            </button>
            {showFinancial && (
              <div className="rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/[0.05]">
                  <InfoRow label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
                  {order.totalDiscounts > 0 && (
                    <InfoRow label="Discounts" value={<span className="text-emerald-400">−{formatCurrency(order.totalDiscounts, order.currency)}</span>} />
                  )}
                  {order.totalShipping > 0 && (
                    <InfoRow label="Shipping" value={formatCurrency(order.totalShipping, order.currency)} />
                  )}
                  {order.totalTax > 0 && (
                    <InfoRow label="Tax" value={formatCurrency(order.totalTax, order.currency)} />
                  )}
                  {order.taxLines?.map((tl, i) => (
                    <InfoRow
                      key={i}
                      label={`  ${tl.title} (${(tl.rate * 100).toFixed(0)}%)`}
                      value={formatCurrency(parseFloat(tl.price), order.currency)}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.1] bg-white/[0.04] px-4 py-3">
                  <span className="text-sm font-bold text-slate-200">{t('total')}</span>
                  <span className="text-base font-extrabold text-white">{formatCurrency(order.total, order.currency)}</span>
                </div>
                {order.discountCodes?.length > 0 && (
                  <div className="border-t border-white/[0.06] px-4 py-2.5">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Discount Codes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {order.discountCodes.map((dc, i) => (
                        <span key={i} className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                          {dc.code} (−{dc.amount} {dc.type === 'percentage' ? '%' : order.currency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Transactions ── */}
          {order.transactions?.length > 0 && (
            <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
              <SectionTitle><CreditCard size={10} className="inline mr-1.5" />Payment Transactions</SectionTitle>
              <div className="space-y-2">
                {order.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.07]">
                    <div>
                      <p className="text-xs font-semibold text-slate-300 capitalize">{tx.kind.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-600">{tx.gateway} · {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, HH:mm') : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200">{formatCurrency(parseFloat(tx.amount), tx.currency)}</p>
                      <span className={`text-[10px] font-bold ${tx.status === 'success' ? 'text-emerald-400' : tx.status === 'failure' ? 'text-rose-400' : 'text-slate-500'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Fulfillments ── */}
          {order.fulfillments?.length > 0 && (
            <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
              <SectionTitle><Truck size={10} className="inline mr-1.5" />Fulfillments</SectionTitle>
              <div className="space-y-3">
                {order.fulfillments.map((f) => (
                  <div key={f.id} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck size={13} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-300">Fulfillment #{f.id.slice(-6)}</span>
                        <Badge className={f.status === 'success' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border-amber-500/25'}>
                          {f.status}
                        </Badge>
                      </div>
                      {isShopify && (
                        <button
                          onClick={() => { setTrackingFulfillment(f); setShowTracking(true) }}
                          className="flex items-center gap-1 rounded-lg bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-white/[0.12] hover:text-slate-200 transition-colors"
                        >
                          <Plus size={10} />Tracking
                        </button>
                      )}
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {f.trackingNumber && (
                        <div className="flex items-center gap-2">
                          {f.trackingUrl ? (
                            <a href={f.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                              <ExternalLink size={10} />
                              {f.trackingCompany && <span className="text-slate-500">{f.trackingCompany}:</span>}
                              {f.trackingNumber}
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                              {f.trackingCompany && <span className="font-sans text-slate-500">{f.trackingCompany}:</span>}
                              {f.trackingNumber}
                            </span>
                          )}
                        </div>
                      )}
                      {f.trackingNumbers.length > 1 && f.trackingNumbers.slice(1).map((tn, i) => (
                        <p key={i} className="text-xs font-mono text-slate-500">{tn}</p>
                      ))}
                      {!f.trackingNumber && !f.trackingNumbers.length && (
                        <p className="text-xs text-slate-600 italic">No tracking added</p>
                      )}
                      {f.lineItems?.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {f.lineItems.map((li, i) => (
                            <p key={i} className="text-xs text-slate-500">{li.name} × {li.qty}</p>
                          ))}
                        </div>
                      )}
                      {f.createdAt && (
                        <p className="text-[10px] text-slate-600">{format(new Date(f.createdAt), 'MMM d, yyyy HH:mm')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Dates ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <SectionTitle>
              <Calendar size={10} className="inline mr-1.5" />
              {t('timeline')}
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('ordered'), date: order.createdAt },
                { label: t('updated'), date: order.updatedAt },
                ...(order.closedAt ? [{ label: 'Archived', date: order.closedAt }] : []),
              ].map(({ label, date }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-3.5">
                  <Calendar size={13} className="mt-0.5 shrink-0 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-200">
                      {format(new Date(date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-slate-600">{format(new Date(date), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tags ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <SectionTitle>
                <Tag size={10} className="inline mr-1.5" />
                {t('tags')}
              </SectionTitle>
              {isShopify && !editingTags && (
                <button
                  onClick={() => { setTagsValue(order.tags ?? ''); setEditingTags(true) }}
                  className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Pencil size={10} />Edit
                </button>
              )}
            </div>
            {editingTags ? (
              <div className="space-y-2">
                <input
                  value={tagsValue}
                  onChange={(e) => setTagsValue(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingTags(false)} className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    <X size={11} />Cancel
                  </button>
                  <button onClick={handleSaveTags} disabled={savingTags} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                    <Check size={11} />{savingTags ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                {order.tags ? (
                  order.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/25">
                      <Tag size={9} />{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-600 italic">No tags</span>
                )}
              </div>
            )}
          </section>

          {/* ── Notes ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <SectionTitle>{t('notes')}</SectionTitle>
              {isShopify && !editingNote && (
                <button
                  onClick={() => { setNoteValue(order.notes ?? ''); setEditingNote(true) }}
                  className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Pencil size={10} />Edit
                </button>
              )}
            </div>
            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  rows={3}
                  placeholder="Add a note..."
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingNote(false)} className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    <X size={11} />Cancel
                  </button>
                  <button onClick={handleSaveNote} disabled={savingNote} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                    <Check size={11} />{savingNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : order.notes ? (
              <p className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {order.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-600 italic">No notes</p>
            )}
          </section>

          {/* ── Order metadata toggle ── */}
          <section className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07] p-2">
            <button
              onClick={() => setShowTimeline((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-xs font-semibold text-slate-400">Order Details</span>
              {showTimeline ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
            </button>
            {showTimeline && (
              <div className="mt-2 px-4 py-2 divide-y divide-white/[0.05]">
                <InfoRow label="Order ID" value={order.platformOrderId} mono />
                <InfoRow label="Order #" value={order.orderNumber} />
                <InfoRow label="Platform" value={PLATFORM_LABELS[order.platform]} />
                <InfoRow label="Channel" value={order.channel} />
                <InfoRow label="Currency" value={order.currency} />
                {order.gateway && <InfoRow label="Gateway" value={order.gateway} />}
              </div>
            )}
          </section>

        </div>
      </Drawer>

      {/* ── Shopify Modals ── */}
      {order && isShopify && (
        <>
          <FulfillmentModal
            open={showFulfill}
            order={order}
            onClose={() => setShowFulfill(false)}
            onConfirm={handleFulfill}
          />
          <RefundModal
            open={showRefund}
            order={order}
            onClose={() => setShowRefund(false)}
            onConfirm={handleRefund}
          />
          <AddTrackingModal
            open={showTracking}
            fulfillment={trackingFulfillment}
            onClose={() => setShowTracking(false)}
            onConfirm={handleAddTracking}
          />
          <CancelOrderModal
            open={showCancel}
            order={order}
            onClose={() => setShowCancel(false)}
            onConfirm={handleCancel}
          />
        </>
      )}
    </>
  )
}
