import axios from 'axios'
import { NormalizedOrder, OrderItem, OrderStatus, StoreCreds } from './_server_types'

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending', authorized: 'pending', partially_paid: 'pending',
  paid: 'processing', partially_refunded: 'processing',
  refunded: 'canceled', voided: 'canceled',
}

function mapStatus(financial: string, fulfillment: string | null): OrderStatus {
  if (fulfillment === 'fulfilled') return 'completed'
  if (fulfillment === 'partial') return 'processing'
  return STATUS_MAP[financial] ?? 'new'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name, qty: li.quantity, price: parseFloat(li.price),
  }))
  const c = raw.customer ?? {}
  const customerName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown'
  return {
    platform: 'shopify', storeId,
    platformOrderId: String(raw.order_number ?? raw.id),
    customerName, customerEmail: c.email ?? raw.email ?? '',
    items, total: parseFloat(raw.total_price),
    currency: raw.currency ?? 'USD',
    status: mapStatus(raw.financial_status, raw.fulfillment_status),
    platformStatus: `${raw.financial_status}/${raw.fulfillment_status ?? 'unfulfilled'}`,
    createdAt: new Date(raw.created_at), updatedAt: new Date(raw.updated_at),
    notes: raw.note ?? '',
    platformOrderUrl: `https://${storeUrl}/admin/orders/${raw.id}`,
  }
}

function shopifyHeaders(apiKey: string) {
  return { 'X-Shopify-Access-Token': apiKey }
}

function shopifyBase(creds: StoreCreds) {
  const host = (creds.storeUrl ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  return { host, headers: shopifyHeaders(creds.apiKey!) }
}

export async function fetchShopifyOrders(creds: StoreCreds, storeId: string): Promise<NormalizedOrder[]> {
  const { host, headers } = shopifyBase(creds)
  const orders: NormalizedOrder[] = []
  let pageInfo: string | null = null

  do {
    const params: Record<string, string | number> = { status: 'any', limit: 250 }
    if (pageInfo) params.page_info = pageInfo

    const resp = await axios.get(
      `https://${host}/admin/api/2024-01/orders.json`,
      { params, headers },
    )
    orders.push(...(resp.data.orders ?? []).map((o: unknown) => normalize(o, storeId, host)))

    const link = resp.headers.link as string | undefined
    pageInfo = link?.includes('rel="next"')
      ? (link.match(/page_info=([^&>]+).*rel="next"/) ?? [])[1] ?? null
      : null

    if (pageInfo) await new Promise((r) => setTimeout(r, 600))
  } while (pageInfo)

  return orders
}

export async function pushShopifyStatus(creds: StoreCreds, platformOrderId: string, status: OrderStatus) {
  const { host, headers } = shopifyBase(creds)
  const base = `https://${host}/admin/api/2024-01/orders/${platformOrderId}`
  if (status === 'completed') {
    await axios.post(`${base}/fulfillments.json`, { fulfillment: { notify_customer: false } }, { headers })
  } else if (status === 'canceled') {
    await axios.post(`${base}/cancel.json`, {}, { headers })
  }
}

export { normalize as normalizeShopifyWebhook }
