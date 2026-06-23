import axios from 'axios'
import OAuth from 'oauth-1.0a'
import * as crypto from 'crypto'
import { NormalizedOrder, OrderItem, OrderStatus, StoreCreds } from './types'

const WOO_STATUS_MAP: Record<string, OrderStatus> = {
  'pending': 'pending',
  'processing': 'processing',
  'on-hold': 'pending',
  'completed': 'completed',
  'cancelled': 'canceled',
  'refunded': 'canceled',
  'failed': 'canceled',
  'trash': 'canceled',
}

function mapWooStatus(status: string): OrderStatus {
  return WOO_STATUS_MAP[status] ?? 'new'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWooOrder(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name,
    qty: li.quantity,
    price: parseFloat(li.price),
  }))

  const billing = raw.billing ?? {}
  const customerName = `${billing.first_name ?? ''} ${billing.last_name ?? ''}`.trim() || 'Unknown'

  return {
    platform: 'woocommerce',
    storeId,
    platformOrderId: String(raw.number ?? raw.id),
    customerName,
    customerEmail: billing.email ?? '',
    items,
    total: parseFloat(raw.total ?? '0'),
    currency: raw.currency ?? 'USD',
    status: mapWooStatus(raw.status),
    platformStatus: raw.status,
    createdAt: new Date(raw.date_created),
    updatedAt: new Date(raw.date_modified),
    notes: raw.customer_note ?? '',
    platformOrderUrl: `${storeUrl}/wp-admin/post.php?post=${raw.id}&action=edit`,
  }
}

function makeOAuthHeaders(
  creds: StoreCreds,
  url: string,
  method: string,
): Record<string, string> {
  const oauth = new OAuth({
    consumer: {
      key: creds.consumerKey!,
      secret: creds.consumerSecret!,
    },
    signature_method: 'HMAC-SHA256',
    hash_function(base_string: string, key: string) {
      return crypto.createHmac('sha256', key).update(base_string).digest('base64')
    },
  })

  const authData = oauth.authorize({ url, method })
  return oauth.toHeader(authData) as unknown as Record<string, string>
}

export async function fetchWooOrders(
  creds: StoreCreds,
  storeId: string,
): Promise<NormalizedOrder[]> {
  const { storeUrl, consumerKey, consumerSecret } = creds
  if (!storeUrl || !consumerKey || !consumerSecret)
    throw new Error('Missing WooCommerce credentials')

  const orders: NormalizedOrder[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${storeUrl}/wp-json/wc/v3/orders?per_page=${perPage}&page=${page}&orderby=date&order=desc`
    const headers = makeOAuthHeaders(creds, url, 'GET')

    const resp = await axios.get(url, { headers })
    const rawOrders = resp.data ?? []

    if (rawOrders.length === 0) break
    orders.push(...rawOrders.map((o: unknown) => normalizeWooOrder(o, storeId, storeUrl)))

    if (rawOrders.length < perPage) break
    page++
  }

  return orders
}

export async function pushWooStatus(
  creds: StoreCreds,
  platformOrderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  const { storeUrl } = creds
  if (!storeUrl) throw new Error('Missing WooCommerce store URL')

  const wooStatusMap: Record<OrderStatus, string> = {
    new: 'pending',
    pending: 'on-hold',
    processing: 'processing',
    completed: 'completed',
    canceled: 'cancelled',
  }

  const url = `${storeUrl}/wp-json/wc/v3/orders/${platformOrderId}`
  const headers = makeOAuthHeaders(creds, url, 'PUT')
  await axios.put(url, { status: wooStatusMap[newStatus] }, { headers })
}

export async function testWooConnection(creds: StoreCreds): Promise<boolean> {
  const { storeUrl, consumerKey, consumerSecret } = creds
  if (!storeUrl || !consumerKey || !consumerSecret) return false

  const url = `${storeUrl}/wp-json/wc/v3/system_status`
  const headers = makeOAuthHeaders(creds, url, 'GET')
  const resp = await axios.get(url, { headers })
  return resp.status === 200
}

export function normalizeWooWebhook(
  payload: Record<string, unknown>,
  storeId: string,
  storeUrl: string,
): NormalizedOrder {
  return normalizeWooOrder(payload, storeId, storeUrl)
}
