import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { refundShopifyOrder, calculateShopifyRefund, type RefundLineItem, type RefundShipping } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, lineItems, shipping, note, notify, transactions, calculate } =
      await req.json() as {
        platformOrderId: string
        credentials: StoreCreds
        lineItems: RefundLineItem[]
        shipping?: RefundShipping
        note?: string
        notify?: boolean
        calculate?: boolean
        transactions?: Array<{ parentId: string; amount: string; kind?: string; gateway?: string }>
      }

    if (calculate) {
      const preview = await calculateShopifyRefund(credentials, platformOrderId, lineItems, shipping)
      return Response.json({ success: true, preview })
    }

    await refundShopifyOrder(credentials, platformOrderId, {
      lineItems, shipping, note, notify, transactions,
    })

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
