import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { updateShopifyTracking } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { fulfillmentId, credentials, trackingNumber, trackingUrl, trackingCompany, notifyCustomer } =
      await req.json() as {
        fulfillmentId: string
        credentials: StoreCreds
        trackingNumber: string
        trackingUrl?: string
        trackingCompany?: string
        notifyCustomer?: boolean
      }

    await updateShopifyTracking(credentials, fulfillmentId, trackingNumber, trackingUrl, trackingCompany, notifyCustomer)

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
