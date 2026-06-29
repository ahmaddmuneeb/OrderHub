import { NextRequest } from 'next/server'
import { errResponse } from '../_server'
import type { OrderStatus, StoreCreds } from '../../../lib/_server_types'
import { pushShopifyStatus } from '../../../lib/shopify'
import { pushWooStatus } from '../../../lib/woocommerce'
import { pushBCStatus } from '../../../lib/bigcommerce'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, platform, status, credentials } = await req.json() as {
      platformOrderId: string
      platform: string
      status: OrderStatus
      credentials: StoreCreds
    }

    if (platform === 'shopify') await pushShopifyStatus(credentials, platformOrderId, status)
    else if (platform === 'woocommerce') await pushWooStatus(credentials, platformOrderId, status)
    else await pushBCStatus(credentials, platformOrderId, status)

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
