import { Timestamp } from 'firebase-admin/firestore'

export type Platform = 'shopify' | 'woocommerce' | 'bigcommerce'
export type OrderStatus = 'new' | 'pending' | 'processing' | 'completed' | 'canceled'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface NormalizedOrder {
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
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  notes: string
  platformOrderUrl?: string
}

export interface StoreDoc {
  id?: string
  userId: string
  platform: Platform
  name: string
  storeUrl: string
  status: 'connected' | 'error' | 'syncing' | 'disconnected'
  lastSyncedAt: Timestamp | null
  createdAt: Timestamp
  encryptedCredentials: string
}

export interface StoreCreds {
  platform: Platform
  storeUrl: string
  // Shopify
  apiKey?: string
  apiSecret?: string
  // WooCommerce
  consumerKey?: string
  consumerSecret?: string
  // BigCommerce
  storeHash?: string
  accessToken?: string
  clientId?: string
}
