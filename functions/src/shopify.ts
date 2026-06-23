import axios from 'axios'
import { NormalizedOrder, OrderItem, OrderStatus, StoreCreds } from './types'

const SHOPIFY_STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  authorized: 'pending',
  partially_paid: 'pending',
  paid: 'processing',
  partially_refunded: 'processing',
  refunded: 'canceled',
  voided: 'canceled',
}

function mapShopifyStatus(financialStatus: string, fulfillmentStatus: string | null): OrderStatus {
  if (fulfillmentStatus === 'fulfilled') return 'completed'
  if (fulfillmentStatus === 'partial') return 'processing'
  return SHOPIFY_STATUS_MAP[financialStatus] ?? 'new'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeShopifyOrder(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name,
    qty: li.quantity,
    price: parseFloat(li.price),
  }))

  const customer = raw.customer ?? {}
  const customerName =
    `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() ||
    raw.billing_address?.name ||
    'Unknown'

  return {
    platform: 'shopify',
    storeId,
    platformOrderId: String(raw.order_number ?? raw.id),
    customerName,
    customerEmail: customer.email ?? raw.email ?? '',
    items,
    total: parseFloat(raw.total_price),
    currency: raw.currency ?? 'USD',
    status: mapShopifyStatus(raw.financial_status, raw.fulfillment_status),
    platformStatus: `${raw.financial_status}/${raw.fulfillment_status ?? 'unfulfilled'}`,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    notes: raw.note ?? '',
    platformOrderUrl: `https://${storeUrl}/admin/orders/${raw.id}`,
  }
}

export async function fetchShopifyOrders(
  creds: StoreCreds,
  storeId: string,
  since?: Date,
): Promise<NormalizedOrder[]> {
  const { storeUrl, apiKey, apiSecret } = creds
  if (!storeUrl || !apiKey || !apiSecret) throw new Error('Missing Shopify credentials')

  const baseUrl = `https://${apiKey}:${apiSecret}@${storeUrl}/admin/api/2024-01/orders.json`
  const orders: NormalizedOrder[] = []
  let pageInfo: string | null = null

  do {
    const params: Record<string, string | number> = {
      status: 'any',
      limit: 250,
    }
    if (pageInfo) {
      params.page_info = pageInfo
    } else if (since) {
      params.updated_at_min = since.toISOString()
    }

    const resp = await axios.get(baseUrl, {
      params,
      // Respect Shopify 2 req/s rate limit — handled by caller via delay
    })

    const rawOrders = resp.data.orders ?? []
    orders.push(...rawOrders.map((o: unknown) => normalizeShopifyOrder(o, storeId, storeUrl)))

    // Extract next page cursor from Link header
    const linkHeader = resp.headers.link as string | undefined
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/page_info=([^&>]+).*rel="next"/)
      pageInfo = match ? match[1] : null
    } else {
      pageInfo = null
    }

    // Shopify rate limit: 2 req/s
    if (pageInfo) await new Promise((r) => setTimeout(r, 600))
  } while (pageInfo)

  return orders
}

export async function pushShopifyStatus(
  creds: StoreCreds,
  platformOrderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  const { storeUrl, apiKey, apiSecret } = creds
  if (!storeUrl || !apiKey || !apiSecret) throw new Error('Missing Shopify credentials')

  // Shopify doesn't have a single "status" field — we map to fulfillment actions
  if (newStatus === 'completed') {
    // Create a fulfillment via Fulfillment API (simplified — creates first fulfillment)
    await axios.post(
      `https://${apiKey}:${apiSecret}@${storeUrl}/admin/api/2024-01/orders/${platformOrderId}/fulfillments.json`,
      { fulfillment: { notify_customer: false } },
    )
  } else if (newStatus === 'canceled') {
    await axios.post(
      `https://${apiKey}:${apiSecret}@${storeUrl}/admin/api/2024-01/orders/${platformOrderId}/cancel.json`,
      {},
    )
  }
  // Other statuses are informational only in our system
}

export async function testShopifyConnection(creds: StoreCreds): Promise<boolean> {
  const { storeUrl, apiKey, apiSecret } = creds
  const resp = await axios.get(
    `https://${apiKey}:${apiSecret}@${storeUrl}/admin/api/2024-01/shop.json`,
  )
  return resp.status === 200
}

// Normalize a single Shopify webhook payload
export function normalizeShopifyWebhook(
  payload: Record<string, unknown>,
  storeId: string,
  storeUrl: string,
): NormalizedOrder {
  return normalizeShopifyOrder(payload, storeId, storeUrl)
}

