import axios, { AxiosInstance } from 'axios'
import { NormalizedOrder, OrderItem, OrderStatus, StoreCreds } from './_server_types'

const BC_MAP: Record<number, OrderStatus> = {
  0: 'pending', 1: 'pending', 7: 'processing', 8: 'processing',
  9: 'processing', 11: 'processing', 2: 'processing', 3: 'processing',
  10: 'completed', 5: 'canceled', 4: 'canceled', 6: 'canceled',
  13: 'canceled', 14: 'pending', 12: 'processing',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, storeUrl: string): NormalizedOrder {
  const items: OrderItem[] = (raw.products ?? []).map((p: any) => ({
    name: p.name, qty: p.quantity, price: parseFloat(p.base_price),
  }))
  const b = raw.billing_address ?? {}
  return {
    platform: 'bigcommerce', storeId,
    platformOrderId: String(raw.id),
    customerName: `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() || 'Unknown',
    customerEmail: b.email ?? '',
    items, total: parseFloat(raw.total_inc_tax ?? raw.total_ex_tax ?? '0'),
    currency: raw.currency_code ?? 'USD',
    status: BC_MAP[raw.status_id] ?? 'new',
    platformStatus: raw.status ?? String(raw.status_id),
    createdAt: new Date(raw.date_created), updatedAt: new Date(raw.date_modified),
    notes: raw.customer_message ?? '',
    platformOrderUrl: `${storeUrl}/manage/orders/${raw.id}`,
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

export async function pushBCStatus(creds: StoreCreds, platformOrderId: string, status: OrderStatus) {
  const bcMap: Record<OrderStatus, number> = {
    new: 1, pending: 1, processing: 11, completed: 10, canceled: 5,
  }
  await bcClient(creds).put(`/orders/${platformOrderId}`, { status_id: bcMap[status] })
}

export async function testBC(creds: StoreCreds): Promise<boolean> {
  const r = await bcClient(creds).get('/store')
  return r.status === 200
}

export { normalize as normalizeBCWebhook }
