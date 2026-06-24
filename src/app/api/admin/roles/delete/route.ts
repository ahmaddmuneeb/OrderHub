import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'
import { ApiError } from '../../../_server'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
    const { id } = await req.json() as { id: string }
    if (!id) throw new ApiError(400, 'Role id is required')

    const snap = await adminDb.collection('roles').doc(id).get()
    if (!snap.exists) throw new ApiError(404, 'Role not found')
    if (snap.data()?.isSystem) throw new ApiError(403, 'System roles cannot be deleted')

    await adminDb.collection('roles').doc(id).delete()
    return Response.json({ ok: true })
  } catch (err) {
    return errResponse(err)
  }
}
