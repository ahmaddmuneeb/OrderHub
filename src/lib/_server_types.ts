export interface StoreCreds {
  platform: 'shopify' | 'woocommerce' | 'bigcommerce'
  storeUrl: string
  apiKey?: string; apiSecret?: string
  consumerKey?: string; consumerSecret?: string
  storeHash?: string; accessToken?: string; clientId?: string
}

export type OrderStatus = string

export interface OrderItem { name: string; qty: number; price: number }

export interface NormalizedOrder {
  platform: StoreCreds['platform']
  storeId: string
  platformOrderId: string   // internal platform ID — used for API calls
  orderNumber: string       // human-readable order number shown in UI
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  currency: string
  status: string            // kanban column key (fulfillment-based for Shopify)
  financialStatus: string   // payment status
  fulfillmentStatus: string // fulfillment/shipping status
  channel: string           // sales channel (online store, POS, app, etc.)
  deliveryMethod: string    // shipping method title
  deliveryStatus: string    // shipment tracking status
  tags: string              // comma-separated tags
  createdAt: Date
  updatedAt: Date
  notes: string
  platformOrderUrl?: string
}
