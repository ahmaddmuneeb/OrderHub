import axios from 'axios'
import OAuth from 'oauth-1.0a'
import * as crypto from 'crypto'
import { NormalizedOrder, OrderItem, StoreCreds } from './_server_types'

// WooCommerce financial/fulfillment status mapping
function wooFinancialStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending', 'on-hold': 'on-hold', failed: 'failed',
    processing: 'paid', completed: 'paid',
    cancelled: 'cancelled', refunded: 'refunded',
  }
  return map[status] ?? status
}

function wooFulfillmentStatus(status: string): string {
  const map: Record<string, string> = {
    completed: 'fulfilled', processing: 'processing',
    pending: 'unfulfilled', 'on-hold': 'on-hold',
    cancelled: 'cancelled', refunded: 'refunded', failed: 'failed',
  }
  return map[status] ?? status
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name, qty: li.quantity, price: parseFloat(li.price),
  }))
  const b = raw.billing ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstShipping = (raw.shipping_lines ?? [])[0] as any
  return {
    platform: 'woocommerce', storeId,
    platformOrderId: String(raw.id),
    orderNumber: String(raw.number ?? raw.id),
    customerName: `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() || 'Unknown',
    customerEmail: b.email ?? '',
    items, total: parseFloat(raw.total ?? '0'),
    currency: raw.currency ?? 'USD',
    status: raw.status ?? 'pending',
    financialStatus: wooFinancialStatus(raw.status ?? 'pending'),
    fulfillmentStatus: wooFulfillmentStatus(raw.status ?? 'pending'),
    channel: raw.created_via ?? 'checkout',
    deliveryMethod: firstShipping?.method_title ?? '',
    deliveryStatus: '',
    tags: '',
    createdAt: new Date(raw.date_created),
    updatedAt: new Date(raw.date_modified),
    notes: raw.customer_note ?? '',
    platformOrderUrl: `${storeUrl}/wp-admin/post.php?post=${raw.id}&action=edit`,
  }
}

function oauthHeaders(creds: StoreCreds, url: string, method: string): Record<string, string> {
  const oauth = new OAuth({
    consumer: { key: creds.consumerKey!, secret: creds.consumerSecret! },
    signature_method: 'HMAC-SHA256',
    hash_function: (base: string, key: string) =>
      crypto.createHmac('sha256', key).update(base).digest('base64'),
  })
  return oauth.toHeader(oauth.authorize({ url, method })) as unknown as Record<string, string>
}

export async function fetchWooOrders(creds: StoreCreds, storeId: string): Promise<NormalizedOrder[]> {
  const { storeUrl } = creds
  const orders: NormalizedOrder[] = []
  let page = 1
  while (true) {
    const url = `${storeUrl}/wp-json/wc/v3/orders?per_page=100&page=${page}`
    const resp = await axios.get(url, { headers: oauthHeaders(creds, url, 'GET') })
    const raw = resp.data ?? []
    if (!raw.length) break
    orders.push(...raw.map((o: unknown) => normalize(o, storeId, storeUrl ?? '')))
    if (raw.length < 100) break
    page++
  }
  return orders
}

export async function pushWooStatus(creds: StoreCreds, platformOrderId: string, status: string) {
  const url = `${creds.storeUrl}/wp-json/wc/v3/orders/${platformOrderId}`
  await axios.put(url, { status }, { headers: oauthHeaders(creds, url, 'PUT') })
}

export async function testWoo(creds: StoreCreds): Promise<boolean> {
  const url = `${creds.storeUrl}/wp-json/wc/v3/system_status`
  const r = await axios.get(url, { headers: oauthHeaders(creds, url, 'GET') })
  return r.status === 200
}

export { normalize as normalizeWooWebhook }
