import axios, { AxiosInstance } from 'axios'
import { NormalizedOrder, OrderItem, StoreCreds } from './_server_types'

const BC_STATUS_IDS: Record<string, number> = {
  'Incomplete': 0, 'Pending': 1, 'Shipped': 2, 'Partially Shipped': 3,
  'Refunded': 4, 'Cancelled': 5, 'Declined': 6, 'Awaiting Payment': 7,
  'Awaiting Pickup': 8, 'Awaiting Shipment': 9, 'Completed': 10,
  'Awaiting Fulfillment': 11, 'Manual Verification Required': 12,
  'Disputed': 13, 'Partially Refunded': 14,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.products ?? []).map((p: any) => ({
    name: p.name, qty: p.quantity, price: parseFloat(p.base_price),
    sku: p.sku ?? undefined,
    lineItemId: String(p.id),
  }))
  const b = raw.billing_address ?? {}
  const status = raw.status ?? String(raw.status_id)

  return {
    platform: 'bigcommerce', storeId,
    platformOrderId: String(raw.id),
    orderNumber: String(raw.id),
    customerName: `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() || 'Unknown',
    customerEmail: b.email ?? '',
    items, total: parseFloat(raw.total_inc_tax ?? raw.total_ex_tax ?? '0'),
    currency: raw.currency_code ?? 'USD',
    subtotal: parseFloat(raw.subtotal_inc_tax ?? raw.subtotal_ex_tax ?? '0'),
    totalTax: parseFloat(raw.total_tax ?? '0'),
    totalShipping: parseFloat(raw.shipping_cost_inc_tax ?? '0'),
    totalDiscounts: parseFloat(raw.discount_amount ?? '0'),
    status,
    financialStatus: raw.payment_status ?? '',
    fulfillmentStatus: status,
    channel: raw.channel_id ? `Channel ${raw.channel_id}` : 'Storefront',
    deliveryMethod: '',
    deliveryStatus: '',
    tags: '',
    createdAt: new Date(raw.date_created),
    updatedAt: new Date(raw.date_modified),
    notes: raw.customer_message ?? '',
    platformOrderUrl: `${storeUrl}/manage/orders/${raw.id}`,
    discountCodes: [],
    taxLines: [],
    fulfillments: [],
    transactions: [],
  }
}

function bcClient(creds: StoreCreds): AxiosInstance {
  return axios.create({
    baseURL: `https://api.bigcommerce.com/stores/${creds.storeHash}/v2`,
    headers: { 'X-Auth-Token': creds.accessToken!, 'Content-Type': 'application/json' },
  })
}

export async function fetchBCOrders(creds: StoreCreds, storeId: string): Promise<NormalizedOrder[]> {
  const client = bcClient(creds)
  const orders: NormalizedOrder[] = []
  let page = 1
  while (true) {
    const resp = await client.get('/orders', { params: { limit: 250, page } })
    const raw = resp.data ?? []
    if (!Array.isArray(raw) || !raw.length) break
    const enriched = await Promise.all(
      raw.map(async (o: Record<string, unknown>) => {
        const p = await client.get(`/orders/${o.id}/products`).catch(() => ({ data: [] }))
        return { ...o, products: p.data }
      }),
    )
    orders.push(...enriched.map((o) => normalize(o, storeId, creds.storeUrl ?? '')))
    if (raw.length < 250) break
    page++
    await new Promise((r) => setTimeout(r, 500))
  }
  return orders
}

export async function pushBCStatus(creds: StoreCreds, platformOrderId: string, status: string) {
  const statusId = BC_STATUS_IDS[status]
  if (statusId === undefined) return
  await bcClient(creds).put(`/orders/${platformOrderId}`, { status_id: statusId })
}

export async function testBC(creds: StoreCreds): Promise<boolean> {
  const r = await bcClient(creds).get('/store')
  return r.status === 200
}

export { normalize as normalizeBCWebhook }
