import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { captureShopifyPayment } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, parentTransactionId, amount } = await req.json() as {
      platformOrderId: string
      credentials: StoreCreds
      parentTransactionId: string
      amount: string
    }

    await captureShopifyPayment(credentials, platformOrderId, parentTransactionId, amount)

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
