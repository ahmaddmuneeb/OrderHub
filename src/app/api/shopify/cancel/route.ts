import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { cancelShopifyOrder } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, reason, email, restock } = await req.json() as {
      platformOrderId: string
      credentials: StoreCreds
      reason?: string
      email?: boolean
      restock?: boolean
    }

    await cancelShopifyOrder(credentials, platformOrderId, { reason, email, restock })

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
