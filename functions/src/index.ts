import * as functions from 'firebase-functions/v1'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Request, Response } from 'firebase-functions/v1'
import { encrypt, decrypt } from './encryption'
import { StoreCreds, NormalizedOrder, OrderStatus } from './types'
import { fetchShopifyOrders, pushShopifyStatus, testShopifyConnection, normalizeShopifyWebhook } from './shopify'
import { fetchWooOrders, pushWooStatus, testWooConnection, normalizeWooWebhook } from './woocommerce'
import { fetchBigCommerceOrders, pushBigCommerceStatus, testBigCommerceConnection, normalizeBCWebhook } from './bigcommerce'

admin.initializeApp()
const db = admin.firestore()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required')
  return context.auth.uid
}

async function getStoreWithCreds(storeId: string, userId: string) {
  const storeRef = db.collection('stores').doc(storeId)
  const snap = await storeRef.get()
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Store not found')
  const data = snap.data()!
  if (data.userId !== userId)
    throw new functions.https.HttpsError('permission-denied', 'Access denied')

  // Support both: credentials saved by client (plain object) and by Functions (AES encrypted)
  let creds: StoreCreds
  if (data.encryptedCredentials) {
    creds = decrypt<StoreCreds>(data.encryptedCredentials)
  } else if (data.credentials) {
    creds = data.credentials as StoreCreds
  } else {
    throw new functions.https.HttpsError('failed-precondition', 'No credentials found for this store')
  }

  return { storeRef, data, creds }
}

async function upsertOrder(normalized: NormalizedOrder) {
  const docId = `${normalized.platform}_${normalized.storeId}_${normalized.platformOrderId}`
  const ref = db.collection('orders').doc(docId)
  await ref.set(
    {
      ...normalized,
      id: docId,
      userId: (await db.collection('stores').doc(normalized.storeId).get()).data()?.userId,
      createdAt: normalized.createdAt instanceof Date
        ? admin.firestore.Timestamp.fromDate(normalized.createdAt)
        : normalized.createdAt,
      updatedAt: normalized.updatedAt instanceof Date
        ? admin.firestore.Timestamp.fromDate(normalized.updatedAt)
        : normalized.updatedAt,
    },
    { merge: true },
  )
}

// ─── Test Store Connection ─────────────────────────────────────────────────────

export const testStoreConnection = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    requireAuth(context)
    const creds = data as StoreCreds
    try {
      let ok = false
      if (creds.platform === 'shopify') ok = await testShopifyConnection(creds)
      else if (creds.platform === 'woocommerce') ok = await testWooConnection(creds)
      else if (creds.platform === 'bigcommerce') ok = await testBigCommerceConnection(creds)
      if (!ok) throw new Error('Connection test returned false')
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed'
      throw new functions.https.HttpsError('invalid-argument', msg)
    }
  },
)

// ─── Add Store ─────────────────────────────────────────────────────────────────

export const addStore = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    const userId = requireAuth(context)
    const input = data as StoreCreds & { name: string }
    const { name, platform, storeUrl, ...restCreds } = input

    const creds: StoreCreds = { platform, storeUrl, ...restCreds }
    const encryptedCredentials = encrypt(creds)

    const storeRef = await db.collection('stores').add({
      userId,
      platform,
      name: name || storeUrl,
      storeUrl,
      status: 'connected',
      lastSyncedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      encryptedCredentials,
    })

    return { storeId: storeRef.id }
  },
)

// ─── Disconnect Store ──────────────────────────────────────────────────────────

export const disconnectStore = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    const userId = requireAuth(context)
    const { storeId } = data as { storeId: string }
    const { storeRef } = await getStoreWithCreds(storeId, userId)

    const ordersSnap = await db.collection('orders').where('storeId', '==', storeId).get()
    const batch = db.batch()
    ordersSnap.docs.forEach((d: admin.firestore.QueryDocumentSnapshot) => batch.delete(d.ref))
    batch.delete(storeRef)
    await batch.commit()

    return { success: true }
  },
)

// ─── Sync Orders ───────────────────────────────────────────────────────────────

export const syncOrders = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
    const userId = requireAuth(context)
    const { storeId } = data as { storeId: string }
    const { storeRef, data: storeData, creds } = await getStoreWithCreds(storeId, userId)

    await storeRef.update({ status: 'syncing' })

    try {
      let orders: NormalizedOrder[] = []

      if (storeData.platform === 'shopify') {
        orders = await fetchShopifyOrders(creds, storeId)
      } else if (storeData.platform === 'woocommerce') {
        orders = await fetchWooOrders(creds, storeId)
      } else if (storeData.platform === 'bigcommerce') {
        orders = await fetchBigCommerceOrders(creds, storeId)
      }

      for (let i = 0; i < orders.length; i += 400) {
        await Promise.all(orders.slice(i, i + 400).map(upsertOrder))
      }

      await storeRef.update({ status: 'connected', lastSyncedAt: FieldValue.serverTimestamp() })
      return { synced: orders.length }
    } catch (err: unknown) {
      await storeRef.update({ status: 'error' })
      const msg = err instanceof Error ? err.message : 'Sync failed'
      throw new functions.https.HttpsError('internal', msg)
    }
  })

// ─── Update Order Status ───────────────────────────────────────────────────────

export const updateOrderStatus = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    const userId = requireAuth(context)
    const { orderId, status } = data as { orderId: string; status: OrderStatus }

    const orderSnap = await db.collection('orders').doc(orderId).get()
    if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found')

    const order = orderSnap.data()!
    const { creds } = await getStoreWithCreds(order.storeId, userId)

    try {
      if (order.platform === 'shopify') await pushShopifyStatus(creds, order.platformOrderId, status)
      else if (order.platform === 'woocommerce') await pushWooStatus(creds, order.platformOrderId, status)
      else if (order.platform === 'bigcommerce') await pushBigCommerceStatus(creds, order.platformOrderId, status)
    } catch {
      // Platform push failed — status still updated locally
    }

    await db.collection('orders').doc(orderId).update({ status, updatedAt: FieldValue.serverTimestamp() })
    return { success: true }
  },
)

// ─── Shopify Webhook ───────────────────────────────────────────────────────────

export const webhookShopify = functions.https.onRequest(async (req: Request, res: Response) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return }
  const storeId = req.query.storeId as string
  if (!storeId) { res.status(400).send('Missing storeId'); return }

  const storeSnap = await db.collection('stores').doc(storeId).get()
  if (!storeSnap.exists) { res.status(404).send('Store not found'); return }

  const storeData = storeSnap.data()!
  const creds: StoreCreds = storeData.encryptedCredentials
    ? decrypt<StoreCreds>(storeData.encryptedCredentials)
    : storeData.credentials as StoreCreds

  const normalized = normalizeShopifyWebhook(req.body as Record<string, unknown>, storeId, creds.storeUrl ?? '')
  await upsertOrder(normalized)
  res.status(200).send('ok')
})

// ─── WooCommerce Webhook ───────────────────────────────────────────────────────

export const webhookWoo = functions.https.onRequest(async (req: Request, res: Response) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return }
  const storeId = req.query.storeId as string
  if (!storeId) { res.status(400).send('Missing storeId'); return }

  const storeSnap = await db.collection('stores').doc(storeId).get()
  if (!storeSnap.exists) { res.status(404).send('Store not found'); return }

  const storeData = storeSnap.data()!
  const creds: StoreCreds = storeData.encryptedCredentials
    ? decrypt<StoreCreds>(storeData.encryptedCredentials)
    : storeData.credentials as StoreCreds

  const normalized = normalizeWooWebhook(req.body as Record<string, unknown>, storeId, creds.storeUrl ?? '')
  await upsertOrder(normalized)
  res.status(200).send('ok')
})

// ─── BigCommerce Webhook ───────────────────────────────────────────────────────

export const webhookBigCommerce = functions.https.onRequest(async (req: Request, res: Response) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return }
  const storeId = req.query.storeId as string
  if (!storeId) { res.status(400).send('Missing storeId'); return }

  const storeSnap = await db.collection('stores').doc(storeId).get()
  if (!storeSnap.exists) { res.status(404).send('Store not found'); return }

  const storeData = storeSnap.data()!
  const creds: StoreCreds = storeData.encryptedCredentials
    ? decrypt<StoreCreds>(storeData.encryptedCredentials)
    : storeData.credentials as StoreCreds

  const payload = req.body as Record<string, unknown>
  const orderId = (payload.data as Record<string, unknown>)?.id
  if (!orderId) { res.status(400).send('No order ID in payload'); return }

  const normalized = normalizeBCWebhook(
    { id: orderId, ...(payload.data as Record<string, unknown>) },
    storeId,
    creds.storeUrl ?? '',
  )
  await upsertOrder(normalized)
  res.status(200).send('ok')
})
