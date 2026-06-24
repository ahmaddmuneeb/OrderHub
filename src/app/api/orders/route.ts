import { NextRequest } from 'next/server'
import { errResponse } from '../_server'
import type { StoreCreds, NormalizedOrder } from '../../../lib/_server_types'
import { fetchShopifyOrders } from '../../../lib/shopify'
import { fetchWooOrders } from '../../../lib/woocommerce'
import { fetchBCOrders } from '../../../lib/bigcommerce'

interface StoreInput {
  id: string
  platform: string
  credentials: StoreCreds
}

export async function POST(req: NextRequest) {
  try {
    const { stores } = await req.json() as { stores: StoreInput[] }

    const results = await Promise.allSettled(
      stores.map(async ({ id, platform, credentials }) => {
        if (platform === 'shopify') return fetchShopifyOrders(credentials, id)
        if (platform === 'woocommerce') return fetchWooOrders(credentials, id)
        return fetchBCOrders(credentials, id)
      })
    )

    const orders: Array<NormalizedOrder & { id: string }> = []
    const errors: string[] = []

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        r.value.forEach((o) => {
          orders.push({ ...o, id: `${o.platform}_${o.storeId}_${o.platformOrderId}` })
        })
      } else {
        errors.push(`${stores[i].platform} (${stores[i].id}): ${(r.reason as Error)?.message ?? 'fetch failed'}`)
      }
    })

    return Response.json({ orders, errors })
  } catch (err) {
    return errResponse(err)
  }
}
