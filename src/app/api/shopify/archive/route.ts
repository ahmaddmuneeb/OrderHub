import { NextRequest } from 'next/server'
import { errResponse } from '../../_server'
import type { StoreCreds } from '../../../../lib/_server_types'
import { archiveShopifyOrder, unarchiveShopifyOrder } from '../../../../lib/shopify'

export async function POST(req: NextRequest) {
  try {
    const { platformOrderId, credentials, archive } = await req.json() as {
      platformOrderId: string
      credentials: StoreCreds
      archive: boolean
    }

    if (archive) {
      await archiveShopifyOrder(credentials, platformOrderId)
    } else {
      await unarchiveShopifyOrder(credentials, platformOrderId)
    }

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
