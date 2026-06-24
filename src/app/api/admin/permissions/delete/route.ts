import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'
import { ApiError } from '../../../_server'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
    const { id } = await req.json() as { id: string }
    if (!id) throw new ApiError(400, 'Permission id is required')

    const snap = await adminDb.collection('permissions').doc(id).get()
    if (!snap.exists) throw new ApiError(404, 'Permission not found')
    if (snap.data()?.isSystem) throw new ApiError(403, 'System permissions cannot be deleted')

    await adminDb.collection('permissions').doc(id).delete()
    return Response.json({ ok: true })
  } catch (err) {
    return errResponse(err)
  }
}
