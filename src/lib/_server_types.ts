export interface StoreCreds {
  platform: 'shopify' | 'woocommerce' | 'bigcommerce'
  storeUrl: string
  apiKey?: string; apiSecret?: string
  consumerKey?: string; consumerSecret?: string
  storeHash?: string; accessToken?: string; clientId?: string
}

export type OrderStatus = 'new' | 'pending' | 'processing' | 'completed' | 'canceled'

export interface OrderItem { name: string; qty: number; price: number }

export interface NormalizedOrder {
  platform: StoreCreds['platform']
  storeId: string; platformOrderId: string
  customerName: string; customerEmail: string
  items: OrderItem[]; total: number; currency: string
  status: OrderStatus; platformStatus: string
  createdAt: Date; updatedAt: Date
  notes: string; platformOrderUrl?: string
}
