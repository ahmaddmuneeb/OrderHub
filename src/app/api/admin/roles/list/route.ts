import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
    const snap = await adminDb.collection('roles').orderBy('createdAt', 'asc').get()
    const roles = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json({ roles })
  } catch (err) {
    return errResponse(err)
  }
}
