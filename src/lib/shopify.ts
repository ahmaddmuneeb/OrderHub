import axios from 'axios'
import { NormalizedOrder, OrderItem, StoreCreds } from './_server_types'

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Online Store', pos: 'Point of Sale',
  shopify_draft_order: 'Draft Order', iphone: 'Shopify Mobile',
  android: 'Shopify Mobile', checkout: 'Checkout',
}

function channelLabel(sourceName: string | null): string {
  if (!sourceName) return 'Online Store'
  return CHANNEL_LABELS[sourceName] ?? sourceName
}

function mapStatus(financialStatus: string, fulfillmentStatus: string | null, cancelledAt: string | null): string {
  if (cancelledAt) return 'cancelled'
  if (fulfillmentStatus === 'fulfilled') return 'fulfilled'
  if (fulfillmentStatus === 'partial') return 'partial'
  if (financialStatus === 'refunded' || financialStatus === 'voided') return 'cancelled'
  return 'unfulfilled'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, host: string): NormalizedOrder {
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name, qty: li.quantity, price: parseFloat(li.price),
  }))
  const c = raw.customer ?? {}
  const financialStatus = raw.financial_status ?? 'pending'
  const fulfillmentStatus = raw.fulfillment_status ?? 'unfulfilled'
  const status = mapStatus(financialStatus, fulfillmentStatus, raw.cancelled_at)
  const firstFulfillment = (raw.fulfillments ?? [])[0]
  const firstShipping = (raw.shipping_lines ?? [])[0]

  return {
    platform: 'shopify', storeId,
    platformOrderId: String(raw.id),              // internal ID — for API calls
    orderNumber: String(raw.order_number ?? raw.id), // display number
    customerName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || (raw.email ?? 'Unknown'),
    customerEmail: c.email ?? raw.email ?? '',
    items, total: parseFloat(raw.total_price ?? '0'),
    currency: raw.currency ?? 'USD',
    status,
    financialStatus,
    fulfillmentStatus,
    channel: channelLabel(raw.source_name),
    deliveryMethod: firstShipping?.title ?? '',
    deliveryStatus: firstFulfillment?.shipment_status ?? '',
    tags: raw.tags ?? '',
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    notes: raw.note ?? '',
    platformOrderUrl: `https://${host}/admin/orders/${raw.id}`,
  }
}

function shopifyHeaders(apiKey: string) {
  return { 'X-Shopify-Access-Token': apiKey, 'Content-Type': 'application/json' }
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

// Uses the modern fulfillment_orders API (required for 2022-07+ apps)
export async function pushShopifyStatus(creds: StoreCreds, platformOrderId: string, status: string) {
  const { host, headers } = shopifyBase(creds)
  const apiBase = `https://${host}/admin/api/2024-01`

  if (status === 'fulfilled') {
    // Step 1: get all fulfillment orders for this order
    const foResp = await axios.get(
      `${apiBase}/orders/${platformOrderId}/fulfillment_orders.json`,
      { headers },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fos: any[] = foResp.data?.fulfillment_orders ?? []
    const open = fos.filter((fo) => fo.status === 'open' || fo.status === 'in_progress')
    if (open.length === 0) return

    // Step 2: create fulfillment covering all open fulfillment orders
    await axios.post(
      `${apiBase}/fulfillments.json`,
      {
        fulfillment: {
          line_items_by_fulfillment_order: open.map((fo) => ({
            fulfillment_order_id: fo.id,
          })),
          notify_customer: false,
        },
      },
      { headers },
    )
  } else if (status === 'cancelled') {
    await axios.post(`${apiBase}/orders/${platformOrderId}/cancel.json`, {}, { headers })
  }
  // 'unfulfilled' / 'partial' — no direct API action; only Shopify can set these
}

export { normalize as normalizeShopifyWebhook }
