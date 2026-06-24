import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'
import { ApiError } from '../../../_server'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { uid: createdBy } = await verifyAdmin(req)
    const { name, description, permissions } = await req.json() as {
      name: string
      description: string
      permissions: string[]
    }

    if (!name?.trim()) throw new ApiError(400, 'Role name is required')

    const existing = await adminDb.collection('roles').where('name', '==', name.trim()).get()
    if (!existing.empty) throw new ApiError(409, 'A role with this name already exists')

    const ref = adminDb.collection('roles').doc()
    await ref.set({
      id: ref.id,
      name: name.trim(),
      description: description?.trim() ?? '',
      permissions: permissions ?? [],
      isSystem: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy,
    })

    return Response.json({ id: ref.id })
  } catch (err) {
    return errResponse(err)
  }
}
