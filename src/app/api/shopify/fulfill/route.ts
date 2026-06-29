import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { fulfillShopifyOrder } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, notifyCustomer, trackingNumber, trackingUrl, trackingCompany, lineItemIds } =
      await req.json() as {
        platformOrderId: string
        credentials: StoreCreds
        notifyCustomer?: boolean
        trackingNumber?: string
        trackingUrl?: string
        trackingCompany?: string
        lineItemIds?: string[]
      }

    await fulfillShopifyOrder(credentials, platformOrderId, {
      notifyCustomer: notifyCustomer ?? true,
      trackingNumber,
      trackingUrl,
      trackingCompany,
      lineItemIds,
    })

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
