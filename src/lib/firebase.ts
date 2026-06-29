import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { StoreCredentials } from '../types'

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export const firebaseConfigured = true

async function apiFetch(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'API error')
  }
  return res.json()
}

// ─── Generic order status update (all platforms) ──────────────────────────────

export const callUpdateOrderStatus = (data: {
  platformOrderId: string
  platform: string
  status: string
  credentials: StoreCredentials
}) => apiFetch('/api/update-order-status', data)

// ─── Shopify-specific actions ─────────────────────────────────────────────────

export const callShopifyFulfill = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  notifyCustomer?: boolean
  trackingNumber?: string
  trackingUrl?: string
  trackingCompany?: string
  lineItemIds?: string[]
}) => apiFetch('/api/shopify/fulfill', data)

export const callShopifyRefund = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  lineItems: Array<{
    lineItemId: string
    quantity: number
    restockType?: string
    locationId?: string
  }>
  shipping?: { fullRefund?: boolean; amount?: string }
  note?: string
  notify?: boolean
  calculate?: boolean
  transactions?: Array<{ parentId: string; amount: string; kind?: string; gateway?: string }>
}) => apiFetch('/api/shopify/refund', data)

export const callShopifyCancel = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  reason?: string
  email?: boolean
  restock?: boolean
}) => apiFetch('/api/shopify/cancel', data)

export const callShopifyArchive = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  archive: boolean
}) => apiFetch('/api/shopify/archive', data)

export const callShopifyUpdateOrder = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  note?: string
  tags?: string
}) => apiFetch('/api/shopify/update-order', data)

export const callShopifyAddTracking = (data: {
  fulfillmentId: string
  credentials: StoreCredentials
  trackingNumber: string
  trackingUrl?: string
  trackingCompany?: string
  notifyCustomer?: boolean
}) => apiFetch('/api/shopify/add-tracking', data)

export const callShopifyMarkPaid = (data: {
  platformOrderId: string
  credentials: StoreCredentials
}) => apiFetch('/api/shopify/mark-paid', data)

export const callShopifyCapture = (data: {
  platformOrderId: string
  credentials: StoreCredentials
  parentTransactionId: string
  amount: string
}) => apiFetch('/api/shopify/capture', data)

export const callShopifyResendConfirmation = (data: {
  platformOrderId: string
  credentials: StoreCredentials
}) => apiFetch('/api/shopify/resend-confirmation', data)

export const callShopifyOrderDetail = (data: {
  platformOrderId: string
  storeId: string
  credentials: StoreCredentials
}) => apiFetch('/api/shopify/order-detail', data)
