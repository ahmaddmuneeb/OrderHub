import { NextRequest } from 'next/server'
import { adminDb } from '../../../../../lib/firebase-admin'
import { verifyAdmin, errResponse } from '../../_adminGuard'
import { ApiError } from '../../../_server'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { uid: createdBy } = await verifyAdmin(req)
    const { key, label, description } = await req.json() as {
      key: string
      label: string
      description: string
    }

    if (!key?.trim()) throw new ApiError(400, 'Permission key is required')
    if (!label?.trim()) throw new ApiError(400, 'Permission label is required')

    const slug = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (!slug) throw new ApiError(400, 'Permission key must contain valid characters')

    const existing = await adminDb.collection('permissions').where('key', '==', slug).get()
    if (!existing.empty) throw new ApiError(409, 'A permission with this key already exists')

    const ref = adminDb.collection('permissions').doc()
    await ref.set({
      id: ref.id,
      key: slug,
      label: label.trim(),
      description: description?.trim() ?? '',
      isSystem: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy,
    })

    return Response.json({ id: ref.id })
  } catch (err) {
    return errResponse(err)
  }
}
