import { Timestamp } from 'firebase/firestore'

export type Platform = 'shopify' | 'woocommerce' | 'bigcommerce'
export type OrderStatus = string

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  platform: Platform
  storeId: string
  platformOrderId: string   // internal platform ID — used for API calls
  orderNumber: string       // human-readable number shown in UI (e.g. "1001")
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  currency: string
  status: string            // kanban column key
  financialStatus: string   // payment status
  fulfillmentStatus: string // fulfillment/shipping status
  channel: string           // sales channel
  deliveryMethod: string    // shipping method title
  deliveryStatus: string    // shipment tracking status
  tags: string              // comma-separated tags
  createdAt: string
  updatedAt: string
  notes: string
  platformOrderUrl?: string
}

export interface Store {
  id: string
  userId: string
  platform: Platform
  name: string
  storeUrl: string
  status: 'connected' | 'error' | 'disconnected'
  createdAt: Timestamp
}

export interface StoreCredentials {
  platform: Platform
  storeUrl: string
  apiKey?: string
  apiSecret?: string
  consumerKey?: string
  consumerSecret?: string
  storeHash?: string
  accessToken?: string
  clientId?: string
}

// Native statuses per platform — drives kanban columns and status dropdown
export const PLATFORM_STATUSES: Record<Platform, string[]> = {
  shopify: ['unfulfilled', 'partial', 'fulfilled', 'cancelled'],
  woocommerce: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'],
  bigcommerce: [
    'Pending', 'Awaiting Payment', 'Awaiting Fulfillment', 'Awaiting Shipment',
    'Partially Shipped', 'Shipped', 'Completed', 'Cancelled', 'Declined', 'Refunded',
  ],
}

export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  unfulfilled: 'Unfulfilled', partial: 'Partially Fulfilled',
  fulfilled: 'Fulfilled', cancelled: 'Cancelled',
  pending: 'Pending', processing: 'Processing',
  'on-hold': 'On Hold', completed: 'Completed',
  refunded: 'Refunded', failed: 'Failed',
  // Financial
  paid: 'Paid', authorized: 'Authorized',
  partially_paid: 'Partially Paid', partially_refunded: 'Partially Refunded',
  voided: 'Voided', 'on-hold_fin': 'On Hold',
}

export function getStatusLabel(status: string): string {
  return STATUS_DISPLAY_NAMES[status] ?? status
}

export function getStatusDotColor(status: string): string {
  const map: Record<string, string> = {
    unfulfilled: 'bg-blue-500', partial: 'bg-amber-500',
    fulfilled: 'bg-emerald-500', cancelled: 'bg-rose-500',
    'Cancelled': 'bg-rose-500', pending: 'bg-amber-500',
    'Pending': 'bg-amber-500', processing: 'bg-violet-500',
    'on-hold': 'bg-orange-500', completed: 'bg-emerald-500',
    'Completed': 'bg-emerald-500', refunded: 'bg-slate-500',
    'Refunded': 'bg-slate-500', failed: 'bg-rose-500',
    'Awaiting Payment': 'bg-orange-500', 'Awaiting Fulfillment': 'bg-blue-500',
    'Awaiting Shipment': 'bg-indigo-500', 'Awaiting Pickup': 'bg-cyan-500',
    'Partially Shipped': 'bg-amber-500', 'Shipped': 'bg-cyan-500',
    'Declined': 'bg-red-500',
  }
  return map[status] ?? 'bg-slate-400'
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    unfulfilled: 'bg-blue-50 text-blue-700 border-blue-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-violet-50 text-violet-700 border-violet-200',
    'on-hold': 'bg-orange-50 text-orange-700 border-orange-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refunded: 'bg-slate-50 text-slate-600 border-slate-200',
    'Refunded': 'bg-slate-50 text-slate-600 border-slate-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    authorized: 'bg-blue-50 text-blue-700 border-blue-200',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
    partially_refunded: 'bg-orange-50 text-orange-700 border-orange-200',
    voided: 'bg-slate-50 text-slate-600 border-slate-200',
    'Awaiting Payment': 'bg-orange-50 text-orange-700 border-orange-200',
    'Awaiting Fulfillment': 'bg-blue-50 text-blue-700 border-blue-200',
    'Awaiting Shipment': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Awaiting Pickup': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Partially Shipped': 'bg-amber-50 text-amber-700 border-amber-200',
    'Shipped': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Declined': 'bg-red-50 text-red-700 border-red-200',
  }
  return map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  shopify: 'bg-green-100 text-green-800',
  woocommerce: 'bg-purple-100 text-purple-800',
  bigcommerce: 'bg-gray-800 text-white',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  bigcommerce: 'BigCommerce',
}
