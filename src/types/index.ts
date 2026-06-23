import { Timestamp } from 'firebase/firestore'

export type Platform = 'shopify' | 'woocommerce' | 'bigcommerce'
export type OrderStatus = 'new' | 'pending' | 'processing' | 'completed' | 'canceled'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  platform: Platform
  storeId: string
  platformOrderId: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  currency: string
  status: OrderStatus
  platformStatus: string
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

export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'pending',
  'processing',
  'completed',
  'canceled',
]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  canceled: 'Canceled',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
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

export const COLUMN_HEADER_COLORS: Record<OrderStatus, string> = {
  new: 'border-t-blue-500',
  pending: 'border-t-yellow-500',
  processing: 'border-t-purple-500',
  completed: 'border-t-green-500',
  canceled: 'border-t-red-500',
}
