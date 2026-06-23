import axios, { AxiosInstance } from 'axios'
import { NormalizedOrder, OrderItem, OrderStatus, StoreCreds } from './types'

const BC_STATUS_MAP: Record<number, OrderStatus> = {
  0: 'pending',      // Incomplete
  1: 'pending',      // Pending
  2: 'processing',   // Shipped
  3: 'canceled',     // Partially Shipped
  4: 'pending',      // Refunded
  5: 'canceled',     // Cancelled
  6: 'completed',    // Declined
  7: 'processing',   // Awaiting Payment
  8: 'processing',   // Awaiting Pickup
  9: 'processing',   // Awaiting Shipment
  10: 'completed',   // Completed
  11: 'processing',  // Awaiting Fulfillment
  12: 'processing',  // Manual Verification Required
  13: 'canceled',    // Disputed
  14: 'pending',     // Partially Refunded
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBCOrder(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.products ?? []).map((p: any) => ({
    name: p.name,
    qty: p.quantity,
    price: parseFloat(p.base_price),
  }))

  const customerName =
    `${raw.billing_address?.first_name ?? ''} ${raw.billing_address?.last_name ?? ''}`.trim() ||
    'Unknown'

  return {
    platform: 'bigcommerce',
    storeId,
    platformOrderId: String(raw.id),
    customerName,
    customerEmail: raw.billing_address?.email ?? '',
    items,
    total: parseFloat(raw.total_inc_tax ?? raw.total_ex_tax ?? '0'),
    currency: raw.currency_code ?? 'USD',
    status: BC_STATUS_MAP[raw.status_id] ?? 'new',
    platformStatus: raw.status ?? String(raw.status_id),
    createdAt: new Date(raw.date_created),
    updatedAt: new Date(raw.date_modified),
    notes: raw.customer_message ?? '',
    platformOrderUrl: `${storeUrl}/manage/orders/${raw.id}`,
  }
}

function bcClient(creds: StoreCreds): AxiosInstance {
  const { storeHash, accessToken } = creds
  if (!storeHash || !accessToken) throw new Error('Missing BigCommerce credentials')

  return axios.create({
    baseURL: `https://api.bigcommerce.com/stores/${storeHash}/v2`,
    headers: {
      'X-Auth-Token': accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
}

export async function fetchBigCommerceOrders(
  creds: StoreCreds,
  storeId: string,
): Promise<NormalizedOrder[]> {
  const client = bcClient(creds)
  const orders: NormalizedOrder[] = []
  let page = 1
  const limit = 250
  const storeUrl = creds.storeUrl ?? ''

  while (true) {
    const resp = await client.get('/orders', {
      params: { limit, page, sort: 'date_created:desc' },
    })

    const rawOrders = resp.data ?? []
    if (!Array.isArray(rawOrders) || rawOrders.length === 0) break

    // Fetch products for each order (BC v2 doesn't embed products)
    const enriched = await Promise.all(
      rawOrders.map(async (o: Record<string, unknown>) => {
        try {
          const prodResp = await client.get(`/orders/${o.id}/products`)
          return { ...o, products: prodResp.data ?? [] }
        } catch {
          return { ...o, products: [] }
        }
      }),
    )

    orders.push(...enriched.map((o) => normalizeBCOrder(o, storeId, storeUrl)))

    if (rawOrders.length < limit) break

    page++
    // BC: 150 req/min = ~2.5/s; add small delay
    await new Promise((r) => setTimeout(r, 500))
  }

  return orders
}

export async function pushBigCommerceStatus(
  creds: StoreCreds,
  platformOrderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  const client = bcClient(creds)

  const bcStatusMap: Record<OrderStatus, number> = {
    new: 1,
    pending: 1,
    processing: 11,
    completed: 10,
    canceled: 5,
  }

  await client.put(`/orders/${platformOrderId}`, {
    status_id: bcStatusMap[newStatus],
  })
}

export async function testBigCommerceConnection(creds: StoreCreds): Promise<boolean> {
  const client = bcClient(creds)
  const resp = await client.get('/store')
  return resp.status === 200
}

export function normalizeBCWebhook(
  payload: Record<string, unknown>,
  storeId: string,
  storeUrl: string,
): NormalizedOrder {
  return normalizeBCOrder(payload, storeId, storeUrl)
}
