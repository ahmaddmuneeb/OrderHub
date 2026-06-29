import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { markShopifyOrderPaid } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials } = await req.json() as {
      platformOrderId: string
      credentials: StoreCreds
    }

    await markShopifyOrderPaid(credentials, platformOrderId)

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
