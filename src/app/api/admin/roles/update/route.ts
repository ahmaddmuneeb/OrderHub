import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'
import { ApiError } from '../../../_server'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
    const { id, name, description, permissions } = await req.json() as {
      id: string
      name?: string
      description?: string
      permissions?: string[]
    }

    if (!id) throw new ApiError(400, 'Role id is required')

    const snap = await adminDb.collection('roles').doc(id).get()
    if (!snap.exists) throw new ApiError(404, 'Role not found')
    if (snap.data()?.isSystem) throw new ApiError(403, 'System roles cannot be modified')

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description.trim()
    if (permissions !== undefined) updates.permissions = permissions

    await adminDb.collection('roles').doc(id).update(updates)
    return Response.json({ ok: true })
  } catch (err) {
    return errResponse(err)
  }
}
