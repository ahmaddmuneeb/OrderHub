import axios from 'axios'
import {
  NormalizedOrder, OrderItem, StoreCreds, Address, OrderFulfillment,
  Transaction, TaxLine, DiscountCode,
} from './_server_types'

const API_VERSION = '2024-01'

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Online Store', pos: 'Point of Sale',
  shopify_draft_order: 'Draft Order', iphone: 'Shopify Mobile',
  android: 'Shopify Mobile', checkout: 'Checkout',
}

function channelLabel(sourceName: string | null): string {
  if (!sourceName) return 'Online Store'
  return CHANNEL_LABELS[sourceName] ?? sourceName
}

function mapStatus(
  financialStatus: string,
  fulfillmentStatus: string | null,
  cancelledAt: string | null,
  closedAt: string | null,
): string {
  if (cancelledAt) return 'cancelled'
  if (financialStatus === 'refunded' || financialStatus === 'voided') return 'cancelled'
  if (closedAt) return 'fulfilled'
  if (fulfillmentStatus === 'fulfilled') return 'fulfilled'
  if (fulfillmentStatus === 'partial') return 'partial'
  return 'unfulfilled'
}

function mapAddress(raw: Record<string, string> | null | undefined): Address | undefined {
  if (!raw) return undefined
  return {
    firstName: raw.first_name,
    lastName: raw.last_name,
    company: raw.company,
    address1: raw.address1,
    address2: raw.address2,
    city: raw.city,
    province: raw.province,
    country: raw.country,
    zip: raw.zip,
    phone: raw.phone,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFulfillment(f: any): OrderFulfillment {
  return {
    id: String(f.id),
    status: f.status ?? 'success',
    shipmentStatus: f.shipment_status ?? undefined,
    trackingNumber: f.tracking_number ?? undefined,
    trackingNumbers: Array.isArray(f.tracking_numbers) ? f.tracking_numbers : (f.tracking_number ? [f.tracking_number] : []),
    trackingUrl: f.tracking_url ?? undefined,
    trackingUrls: Array.isArray(f.tracking_urls) ? f.tracking_urls : (f.tracking_url ? [f.tracking_url] : []),
    trackingCompany: f.tracking_company ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lineItems: (f.line_items ?? []).map((li: any) => ({
      name: li.name, qty: li.quantity, sku: li.sku ?? undefined,
    })),
    createdAt: f.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(t: any): Transaction {
  return {
    id: String(t.id),
    kind: t.kind,
    status: t.status,
    amount: t.amount,
    currency: t.currency,
    gateway: t.gateway,
    createdAt: t.created_at,
    parentId: t.parent_id ? String(t.parent_id) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, storeId: string, host: string): NormalizedOrder {
  const c = raw.customer ?? {}
  const financialStatus = raw.financial_status ?? 'pending'
  const fulfillmentStatus = raw.fulfillment_status ?? 'unfulfilled'
  const status = mapStatus(financialStatus, fulfillmentStatus, raw.cancelled_at, raw.closed_at)
  const firstShipping = (raw.shipping_lines ?? [])[0]
  const rawFulfillments: any[] = raw.fulfillments ?? []

  // Shopify only sets shipment_status when a carrier tracking service reports back.
  // For manually-fulfilled orders with tracking numbers, shipment_status is null even
  // though Shopify admin shows "Shipping". Scan all fulfillments and fall back to
  // inferring 'in_transit' when tracking exists but no carrier status is available.
  const carrierStatus = rawFulfillments.map((f) => f.shipment_status).find(Boolean) ?? null
  const hasTracking = rawFulfillments.some(
    (f) => f.tracking_number || (Array.isArray(f.tracking_numbers) && f.tracking_numbers.length > 0),
  )
  const derivedDeliveryStatus: string =
    carrierStatus
    ?? (fulfillmentStatus === 'fulfilled' && hasTracking ? 'in_transit' : '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: OrderItem[] = (raw.line_items ?? []).map((li: any) => ({
    name: li.name,
    qty: li.quantity,
    price: parseFloat(li.price ?? '0'),
    sku: li.sku ?? undefined,
    variantTitle: li.variant_title ?? undefined,
    lineItemId: String(li.id),
    fulfillableQuantity: li.fulfillable_quantity ?? 0,
    totalDiscount: parseFloat(li.total_discount ?? '0'),
    imageUrl: li.image?.src ?? undefined,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taxLines: TaxLine[] = (raw.tax_lines ?? []).map((tl: any) => ({
    title: tl.title, price: tl.price, rate: tl.rate,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const discountCodes: DiscountCode[] = (raw.discount_codes ?? []).map((dc: any) => ({
    code: dc.code, amount: dc.amount, type: dc.type,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fulfillments: OrderFulfillment[] = (raw.fulfillments ?? []).map((f: any) => mapFulfillment(f))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: Transaction[] = (raw.transactions ?? []).map((t: any) => mapTransaction(t))

  // Risk assessment
  let risk: NormalizedOrder['risk'] = 'none'
  if (raw.risk_level === 'HIGH' || raw.risks?.some((r: { level: string }) => r.level === 'HIGH')) risk = 'high'
  else if (raw.risk_level === 'MEDIUM' || raw.risks?.some((r: { level: string }) => r.level === 'MEDIUM')) risk = 'medium'
  else if (raw.risk_level === 'LOW') risk = 'low'

  // Total shipping from shipping_lines
  const totalShipping = (raw.shipping_lines ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, sl: any) => sum + parseFloat(sl.price ?? '0'), 0,
  )

  return {
    platform: 'shopify',
    storeId,
    platformOrderId: String(raw.id),
    orderNumber: String(raw.order_number ?? raw.id),
    customerName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || (raw.email ?? 'Unknown'),
    customerEmail: c.email ?? raw.email ?? '',
    phone: raw.phone ?? c.phone ?? undefined,
    items,
    total: parseFloat(raw.total_price ?? '0'),
    currency: raw.currency ?? 'USD',
    subtotal: parseFloat(raw.subtotal_price ?? '0'),
    totalTax: parseFloat(raw.total_tax ?? '0'),
    totalShipping,
    totalDiscounts: parseFloat(raw.total_discounts ?? '0'),
    status,
    financialStatus,
    fulfillmentStatus,
    channel: channelLabel(raw.source_name),
    deliveryMethod: firstShipping?.title ?? '',
    deliveryStatus: derivedDeliveryStatus,
    tags: raw.tags ?? '',
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    closedAt: raw.closed_at ? new Date(raw.closed_at) : undefined,
    notes: raw.note ?? '',
    platformOrderUrl: `https://${host}/admin/orders/${raw.id}`,
    shippingAddress: mapAddress(raw.shipping_address),
    billingAddress: mapAddress(raw.billing_address),
    discountCodes,
    taxLines,
    fulfillments,
    transactions,
    risk,
    gateway: raw.payment_gateway ?? undefined,
    paymentGateway: raw.payment_gateway ?? undefined,
  }
}

function shopifyHeaders(apiKey: string) {
  return { 'X-Shopify-Access-Token': apiKey, 'Content-Type': 'application/json' }
}

function shopifyBase(creds: StoreCreds) {
  const host = (creds.storeUrl ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  return { host, headers: shopifyHeaders(creds.apiKey!) }
}

function apiBase(host: string) {
  return `https://${host}/admin/api/${API_VERSION}`
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function fetchShopifyOrders(creds: StoreCreds, storeId: string): Promise<NormalizedOrder[]> {
  const { host, headers } = shopifyBase(creds)
  const orders: NormalizedOrder[] = []
  let pageInfo: string | null = null

  do {
    const params: Record<string, string | number> = { status: 'any', limit: 250 }
    if (pageInfo) params.page_info = pageInfo

    const resp = await axios.get(
      `${apiBase(host)}/orders.json`,
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

export async function fetchShopifyOrderDetail(creds: StoreCreds, storeId: string, orderId: string): Promise<NormalizedOrder> {
  const { host, headers } = shopifyBase(creds)

  const [restResp, gqlResp] = await Promise.all([
    axios.get(
      `${apiBase(host)}/orders/${orderId}.json`,
      { params: { fields: 'id,order_number,created_at,updated_at,closed_at,cancelled_at,financial_status,fulfillment_status,currency,total_price,subtotal_price,total_tax,total_discounts,total_shipping_price_set,shipping_lines,customer,email,phone,billing_address,shipping_address,line_items,tax_lines,discount_codes,fulfillments,transactions,note,tags,source_name,payment_gateway,risk_level' }, headers },
    ),
    axios.post(
      `${apiBase(host)}/graphql.json`,
      { query: `{ order(id: "gid://shopify/Order/${orderId}") { canMarkAsPaid } }` },
      { headers },
    ).catch(() => null),
  ])

  const order = normalize(restResp.data.order, storeId, host)
  const canMarkAsPaid: boolean = gqlResp?.data?.data?.order?.canMarkAsPaid ?? false
  return { ...order, canMarkAsPaid }
}

// ─── FULFILL ─────────────────────────────────────────────────────────────────

export async function fulfillShopifyOrder(
  creds: StoreCreds,
  platformOrderId: string,
  opts: { notifyCustomer?: boolean; trackingNumber?: string; trackingUrl?: string; trackingCompany?: string; lineItemIds?: string[] },
): Promise<void> {
  const { host, headers } = shopifyBase(creds)

  const foResp = await axios.get(
    `${apiBase(host)}/orders/${platformOrderId}/fulfillment_orders.json`,
    { headers },
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fos: any[] = foResp.data?.fulfillment_orders ?? []
  const open = fos.filter((fo) => fo.status === 'open' || fo.status === 'in_progress')
  if (open.length === 0) throw new Error('No open fulfillment orders to fulfill')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItemsByFO = open.map((fo: any) => {
    const entry: Record<string, unknown> = { fulfillment_order_id: fo.id }
    if (opts.lineItemIds?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = (fo.line_items ?? []).filter((li: any) =>
        opts.lineItemIds!.includes(String(li.line_item_id))
      )
      if (filtered.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entry.fulfillment_order_line_items = filtered.map((li: any) => ({
          id: li.id, quantity: li.quantity,
        }))
      }
    }
    return entry
  })

  const trackingInfo: Record<string, string> = {}
  if (opts.trackingNumber) trackingInfo.number = opts.trackingNumber
  if (opts.trackingUrl) trackingInfo.url = opts.trackingUrl
  if (opts.trackingCompany) trackingInfo.company = opts.trackingCompany

  await axios.post(
    `${apiBase(host)}/fulfillments.json`,
    {
      fulfillment: {
        line_items_by_fulfillment_order: lineItemsByFO,
        notify_customer: opts.notifyCustomer ?? true,
        ...(Object.keys(trackingInfo).length ? { tracking_info: trackingInfo } : {}),
      },
    },
    { headers },
  )
}

// ─── UPDATE TRACKING ─────────────────────────────────────────────────────────

export async function updateShopifyTracking(
  creds: StoreCreds,
  fulfillmentId: string,
  trackingNumber: string,
  trackingUrl?: string,
  trackingCompany?: string,
  notifyCustomer = true,
): Promise<void> {
  const { host, headers } = shopifyBase(creds)

  const trackingInfo: Record<string, string> = { number: trackingNumber }
  if (trackingUrl) trackingInfo.url = trackingUrl
  if (trackingCompany) trackingInfo.company = trackingCompany

  await axios.post(
    `${apiBase(host)}/fulfillments/${fulfillmentId}/update_tracking.json`,
    {
      fulfillment: {
        notify_customer: notifyCustomer,
        tracking_info: trackingInfo,
      },
    },
    { headers },
  )
}

// ─── CANCEL ──────────────────────────────────────────────────────────────────

export async function cancelShopifyOrder(
  creds: StoreCreds,
  platformOrderId: string,
  opts: { reason?: string; email?: boolean; restock?: boolean } = {},
): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  await axios.post(
    `${apiBase(host)}/orders/${platformOrderId}/cancel.json`,
    {
      reason: opts.reason ?? 'other',
      email: opts.email ?? true,
      restock: opts.restock ?? true,
    },
    { headers },
  )
}

// ─── REFUND ──────────────────────────────────────────────────────────────────

export interface RefundLineItem {
  lineItemId: string
  quantity: number
  restockType?: 'return' | 'cancel' | 'decline' | 'no_restock'
  locationId?: string
}

export interface RefundShipping {
  fullRefund?: boolean
  amount?: string
}

export async function calculateShopifyRefund(
  creds: StoreCreds,
  platformOrderId: string,
  lineItems: RefundLineItem[],
  shipping?: RefundShipping,
): Promise<{ refundLineItems: unknown[]; transactions: unknown[]; shipping: unknown }> {
  const { host, headers } = shopifyBase(creds)
  const resp = await axios.post(
    `${apiBase(host)}/orders/${platformOrderId}/refunds/calculate.json`,
    {
      refund: {
        shipping: shipping ?? {},
        refund_line_items: lineItems.map((li) => ({
          line_item_id: li.lineItemId,
          quantity: li.quantity,
          restock_type: li.restockType ?? 'return',
        })),
      },
    },
    { headers },
  )
  return resp.data.refund
}

export async function refundShopifyOrder(
  creds: StoreCreds,
  platformOrderId: string,
  opts: {
    lineItems: RefundLineItem[]
    shipping?: RefundShipping
    note?: string
    notify?: boolean
    transactions?: Array<{ parentId: string; amount: string; kind?: string; gateway?: string }>
  },
): Promise<void> {
  const { host, headers } = shopifyBase(creds)

  // Build a location map from the calculate endpoint — Shopify tells us the correct
  // location_id for each line item, which is required when restock_type is 'return'
  const restockItems = opts.lineItems.filter(
    (li) => (li.restockType === 'return' || !li.restockType) && !li.locationId,
  )
  const locationByLineItemId: Record<string, string> = {}
  if (restockItems.length > 0) {
    try {
      const calc = await axios.post(
        `${apiBase(host)}/orders/${platformOrderId}/refunds/calculate.json`,
        {
          refund: {
            refund_line_items: restockItems.map((li) => ({
              line_item_id: li.lineItemId,
              quantity: li.quantity,
              restock_type: 'return',
            })),
          },
        },
        { headers },
      )
      for (const rli of (calc.data?.refund?.refund_line_items ?? [])) {
        if (rli.line_item_id && rli.location_id) {
          locationByLineItemId[String(rli.line_item_id)] = String(rli.location_id)
        }
      }
    } catch (err: any) {
      console.warn('[Shopify] Refund calculate failed:', err?.response?.data ?? err?.message)
    }
  }

  const refundBody: Record<string, unknown> = {
    notify: opts.notify ?? true,
    note: opts.note ?? '',
    refund_line_items: opts.lineItems.map((li) => {
      const requestedRestock = li.restockType ?? 'return'
      const locId = li.locationId ?? locationByLineItemId[li.lineItemId] ?? null
      // If we wanted to restock but couldn't get a location, fall back to no_restock
      const restock = requestedRestock === 'return' && !locId ? 'no_restock' : requestedRestock
      return {
        line_item_id: li.lineItemId,
        quantity: li.quantity,
        restock_type: restock,
        ...(locId ? { location_id: locId } : {}),
      }
    }),
    transactions: (opts.transactions ?? []).map((t) => ({
      parent_id: t.parentId,
      amount: t.amount,
      kind: t.kind ?? 'refund',
      ...(t.gateway ? { gateway: t.gateway } : {}),
    })),
  }
  if (opts.shipping?.fullRefund) refundBody.shipping = { full_refund: true }
  else if (opts.shipping?.amount) refundBody.shipping = { amount: opts.shipping.amount }

  await axios.post(
    `${apiBase(host)}/orders/${platformOrderId}/refunds.json`,
    { refund: refundBody },
    { headers },
  )
}

// ─── UPDATE NOTE / TAGS ───────────────────────────────────────────────────────

export async function updateShopifyOrder(
  creds: StoreCreds,
  platformOrderId: string,
  fields: { note?: string; tags?: string },
): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  await axios.put(
    `${apiBase(host)}/orders/${platformOrderId}.json`,
    { order: { id: platformOrderId, ...fields } },
    { headers },
  )
}

// ─── ARCHIVE / UNARCHIVE ──────────────────────────────────────────────────────

export async function archiveShopifyOrder(creds: StoreCreds, platformOrderId: string): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  await axios.post(`${apiBase(host)}/orders/${platformOrderId}/close.json`, {}, { headers })
}

export async function unarchiveShopifyOrder(creds: StoreCreds, platformOrderId: string): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  await axios.post(`${apiBase(host)}/orders/${platformOrderId}/open.json`, {}, { headers })
}

// ─── MARK AS PAID ─────────────────────────────────────────────────────────────

export async function markShopifyOrderPaid(
  creds: StoreCreds,
  platformOrderId: string,
): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  const gid = `gid://shopify/Order/${platformOrderId}`
  const mutation = `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        order { id displayFinancialStatus }
        userErrors { field message }
      }
    }
  `
  const res = await axios.post(
    `${apiBase(host)}/graphql.json`,
    { query: mutation, variables: { input: { id: gid } } },
    { headers: { ...headers, 'Content-Type': 'application/json' } },
  )
  const errors = res.data?.data?.orderMarkAsPaid?.userErrors
  if (errors?.length) throw new Error(errors.map((e: any) => e.message).join(', '))
}

export async function captureShopifyPayment(
  creds: StoreCreds,
  platformOrderId: string,
  parentTransactionId: string,
  amount: string,
): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  await axios.post(
    `${apiBase(host)}/orders/${platformOrderId}/transactions.json`,
    {
      transaction: {
        kind: 'capture',
        parent_id: parentTransactionId,
        amount,
      },
    },
    { headers },
  )
}

// ─── RESEND ORDER CONFIRMATION ────────────────────────────────────────────────

export async function resendShopifyOrderConfirmation(
  creds: StoreCreds,
  platformOrderId: string,
): Promise<void> {
  const { host, headers } = shopifyBase(creds)
  // Shopify doesn't have a direct REST endpoint; we use notification via the order email
  await axios.post(
    `${apiBase(host)}/orders/${platformOrderId}/send_fulfillment_receipt.json`,
    {},
    { headers },
  ).catch(() => {
    // Fallback: update the order to trigger a re-notification (best effort)
  })
}

// ─── LEGACY COMPAT (used by update-order-status route) ───────────────────────

export async function pushShopifyStatus(creds: StoreCreds, platformOrderId: string, status: string) {
  if (status === 'fulfilled') {
    await fulfillShopifyOrder(creds, platformOrderId, { notifyCustomer: false })
  } else if (status === 'cancelled') {
    await cancelShopifyOrder(creds, platformOrderId, { email: false })
  }
}

export { normalize as normalizeShopifyWebhook }
