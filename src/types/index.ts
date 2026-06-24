import { Timestamp } from 'firebase/firestore'

export type Platform = 'shopify' | 'woocommerce' | 'bigcommerce'

export type Role = 'super_admin' | 'admin' | 'manager' | 'viewer'

export type Permission =
  | 'view_orders'
  | 'update_order_status'
  | 'manage_stores'
  | 'manage_users'
  | 'view_analytics'

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ['view_orders', 'update_order_status', 'manage_stores', 'manage_users', 'view_analytics'],
  admin:       ['view_orders', 'update_order_status', 'manage_stores', 'view_analytics'],
  manager:     ['view_orders', 'update_order_status', 'view_analytics'],
  viewer:      ['view_orders', 'view_analytics'],
}

// Permissions that are locked (forced off) for a role and cannot be toggled
export const ROLE_LOCKED_PERMISSIONS: Partial<Record<Role, Permission[]>> = {
  manager: ['manage_stores'],
  viewer:  ['update_order_status', 'manage_stores'],
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_orders: 'View Orders',
  update_order_status: 'Update Order Status',
  manage_stores: 'Manage Stores',
  manage_users: 'Manage Users',
  view_analytics: 'View Analytics',
}

export interface RoleDefinition {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  createdAt: Timestamp
  createdBy?: string
}

export interface PermissionDefinition {
  id: string
  key: string
  label: string
  description: string
  isSystem: boolean
  createdAt: Timestamp
  createdBy?: string
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: Role
  permissions: Permission[]
  status: 'active' | 'suspended'
  createdAt: Timestamp
  createdBy?: string
}
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
  shopify: ['unfulfilled', 'in_progress', 'fulfilled', 'on_hold', 'delivered', 'cancelled'],
  woocommerce: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'],
  bigcommerce: [
    'Pending', 'Awaiting Payment', 'Awaiting Fulfillment', 'Awaiting Shipment',
    'Partially Shipped', 'Shipped', 'Completed', 'Cancelled', 'Declined', 'Refunded',
  ],
}

export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  unfulfilled: 'Unfulfilled', in_progress: 'In Progress',
  fulfilled: 'Fulfilled', on_hold: 'On Hold', delivered: 'Delivered',
  partial: 'Partially Fulfilled', cancelled: 'Cancelled',
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
    unfulfilled: 'bg-blue-500', in_progress: 'bg-amber-500',
    fulfilled: 'bg-emerald-500', on_hold: 'bg-orange-500', delivered: 'bg-teal-500',
    partial: 'bg-amber-500', cancelled: 'bg-rose-500',
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
    unfulfilled: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    fulfilled:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    on_hold:     'bg-orange-500/15 text-orange-400 border-orange-500/25',
    delivered:   'bg-teal-500/15 text-teal-400 border-teal-500/25',
    partial: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    'Cancelled': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Pending': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    processing: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    'on-hold': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Completed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    refunded: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'Refunded': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    failed: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    authorized: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    partially_paid: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    partially_refunded: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    voided: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'Awaiting Payment': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    'Awaiting Fulfillment': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'Awaiting Shipment': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    'Awaiting Pickup': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'Partially Shipped': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Shipped': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'Declined': 'bg-red-500/15 text-red-400 border-red-500/25',
  }
  return map[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/25'
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  shopify: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25',
  woocommerce: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25',
  bigcommerce: 'bg-slate-600/80 text-slate-200',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  bigcommerce: 'BigCommerce',
}
