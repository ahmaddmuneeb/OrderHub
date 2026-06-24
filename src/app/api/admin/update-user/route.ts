import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from '../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../_adminGuard'
import { ApiError } from '../../_server'
import type { Role, Permission } from '../../../../types'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)

    const { uid, displayName, role, permissions, status } = await req.json() as {
      uid: string
      displayName?: string
      role?: Role
      permissions?: Permission[]
      status?: 'active' | 'suspended'
    }

    if (!uid) throw new ApiError(400, 'uid is required')
    if (role === 'super_admin') throw new ApiError(400, 'Cannot promote to super admin')

    const snap = await adminDb.collection('users').doc(uid).get()
    if (!snap.exists) throw new ApiError(404, 'User not found')
    if (snap.data()?.role === 'super_admin') throw new ApiError(403, 'Cannot modify a super admin')

    const updates: Record<string, unknown> = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (role !== undefined) updates.role = role
    if (permissions !== undefined) updates.permissions = permissions
    if (status !== undefined) updates.status = status

    await adminDb.collection('users').doc(uid).update(updates)

    if (status === 'suspended') await adminAuth.updateUser(uid, { disabled: true })
    if (status === 'active') await adminAuth.updateUser(uid, { disabled: false })

    return Response.json({ success: true })
  } catch (err) {
    return errResponse(err)
  }
}
