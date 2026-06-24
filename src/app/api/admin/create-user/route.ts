import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../_adminGuard'
import { ApiError } from '../../_server'
import type { Role, Permission } from '../../../../types'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { uid: createdBy } = await verifyAdmin(req)

    const { email, password, displayName, role, permissions } = await req.json() as {
      email: string
      password: string
      displayName: string
      role: Role
      permissions: Permission[]
    }

    if (!email || !password || !role) throw new ApiError(400, 'email, password, and role are required')
    if (role === 'super_admin') throw new ApiError(400, 'Cannot create another super admin')

    const userRecord = await adminAuth.createUser({ email, password, displayName })

    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      permissions,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      createdBy,
    })

    return Response.json({ uid: userRecord.uid })
  } catch (err) {
    return errResponse(err)
  }
}
