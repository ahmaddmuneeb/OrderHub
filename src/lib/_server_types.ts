export interface StoreCreds {
  platform: 'shopify' | 'woocommerce' | 'bigcommerce'
  storeUrl: string
  apiKey?: string; apiSecret?: string
  consumerKey?: string; consumerSecret?: string
  storeHash?: string; accessToken?: string; clientId?: string
}

export type OrderStatus = string

export interface Address {
  firstName?: string
  lastName?: string
  company?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  country?: string
  zip?: string
  phone?: string
}

export interface FulfillmentLineItem {
  name: string
  qty: number
  sku?: string
}

export interface OrderFulfillment {
  id: string
  status: string
  shipmentStatus?: string
  trackingNumber?: string
  trackingNumbers: string[]
  trackingUrl?: string
  trackingUrls: string[]
  trackingCompany?: string
  lineItems: FulfillmentLineItem[]
  createdAt?: string
}

export interface Transaction {
  id: string
  kind: string
  status: string
  amount: string
  currency: string
  gateway: string
  createdAt: string
  parentId?: string
}

export interface TaxLine {
  title: string
  price: string
  rate: number
}

export interface DiscountCode {
  code: string
  amount: string
  type: string
}

export interface OrderItem {
  name: string
  qty: number
  price: number
  sku?: string
  variantTitle?: string
  lineItemId?: string
  fulfillableQuantity?: number
  totalDiscount?: number
  imageUrl?: string
}

export interface NormalizedOrder {
  platform: StoreCreds['platform']
  storeId: string
  platformOrderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  phone?: string
  items: OrderItem[]
  total: number
  currency: string
  subtotal: number
  totalTax: number
  totalShipping: number
  totalDiscounts: number
  status: string
  financialStatus: string
  fulfillmentStatus: string
  channel: string
  deliveryMethod: string
  deliveryStatus: string
  tags: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  notes: string
  platformOrderUrl?: string
  shippingAddress?: Address
  billingAddress?: Address
  discountCodes: DiscountCode[]
  taxLines: TaxLine[]
  fulfillments: OrderFulfillment[]
  transactions: Transaction[]
  risk?: 'low' | 'medium' | 'high' | 'none'
  gateway?: string
  paymentGateway?: string
  canMarkAsPaid?: boolean
}
