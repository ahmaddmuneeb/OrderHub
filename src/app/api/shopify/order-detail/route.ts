import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { fetchShopifyOrderDetail } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, storeId, credentials } = await req.json() as {
      platformOrderId: string
      storeId: string
      credentials: StoreCreds
    }

    const order = await fetchShopifyOrderDetail(credentials, storeId, platformOrderId)

    return Response.json({ order: { ...order, id: `shopify_${storeId}_${platformOrderId}` } })
  } catch (err) {
    return errResponse(err)
  }
}
