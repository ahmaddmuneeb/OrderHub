import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { updateShopifyOrder } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, note, tags } = await req.json() as {
      platformOrderId: string
      credentials: StoreCreds
      note?: string
      tags?: string
    }

    await updateShopifyOrder(credentials, platformOrderId, { note, tags })

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
