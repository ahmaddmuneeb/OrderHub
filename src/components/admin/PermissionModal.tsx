'use client'

import { useState, useEffect } from 'react'
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useTranslations } from 'next-intl'
import { Modal } from '../ui/Modal'
import { db } from '../../lib/firebase'
import { type PermissionDefinition } from '../../types'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  permission: PermissionDefinition | null
}

export function PermissionModal({ open, onClose, permission }: Props) {
  const t = useTranslations('rolesPermissions')
  const { user } = useAuthStore()
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const isEdit = !!permission

  useEffect(() => {
    if (open) {
      setKey(permission?.key ?? '')
      setLabel(permission?.label ?? '')
      setDescription(permission?.description ?? '')
    }
  }, [open, permission])

  function handleClose() {
    setKey('')
    setLabel('')
    setDescription('')
    onClose()
  }

  function deriveKey(raw: string) {
    return raw.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  async function handleSave() {
    if (!label.trim()) { toast.error('Label is required'); return }
    const slug = isEdit ? permission!.key : deriveKey(key || label)
    if (!slug) { toast.error('Key must contain valid characters (a-z, 0-9, _)'); return }

    setSaving(true)
    try {
      if (isEdit && permission) {
        await updateDoc(doc(db, 'permissions', permission.id), {
          label: label.trim(),
          description: description.trim(),
        })
        toast.success('Permission updated')
      } else {
        const ref = doc(collection(db, 'permissions'))
        await setDoc(ref, {
          id: ref.id,
          key: slug,
          label: label.trim(),
          description: description.trim(),
          isSystem: false,
          createdAt: serverTimestamp(),
          createdBy: user?.uid ?? '',
        })
        toast.success('Permission created')
      }
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? t('editPermission') : t('createPermission')}
      size="sm"
    >
      <div className="space-y-4">
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('permKey')}</label>
            <input
              value={key}
              onChange={(e) => setKey(deriveKey(e.target.value))}
              placeholder="e.g. export_reports"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-600">{t('keyHint')}</p>
          </div>
        )}

        {isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('permKey')}</label>
            <div className="w-full rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-slate-500">
              {permission?.key}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">{t('keyLocked')}</p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('permLabel')}</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Export Reports"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">
            {t('permDesc')} <span className="font-normal text-slate-600">({t('optional')})</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this permission grant?"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-4">
          <button
            onClick={handleClose}
            className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving
              ? (isEdit ? 'Saving…' : 'Creating…')
              : (isEdit ? t('saveChanges') : t('createPermission'))}
          </button>
        </div>
      </div>
    </Modal>
  )
}
