import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
    const snap = await adminDb.collection('permissions').orderBy('createdAt', 'asc').get()
    const permissions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json({ permissions })
  } catch (err) {
    return errResponse(err)
  }
}
