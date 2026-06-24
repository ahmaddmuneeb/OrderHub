import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../_adminGuard'
import { ApiError } from '../../_server'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)

    const { uid } = await req.json() as { uid: string }
    if (!uid) throw new ApiError(400, 'uid is required')

    const snap = await adminDb.collection('users').doc(uid).get()
    if (!snap.exists) throw new ApiError(404, 'User not found')
    if (snap.data()?.role === 'super_admin') throw new ApiError(403, 'Cannot delete a super admin')

    await adminAuth.deleteUser(uid)
    await adminDb.collection('users').doc(uid).delete()

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
