'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useTranslations } from 'next-intl'
import { Modal } from '../ui/Modal'
import { db } from '../../lib/firebase'
import { PERMISSION_LABELS, type Permission, type RoleDefinition, type PermissionDefinition } from '../../types'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  role: RoleDefinition | null
}

const SYSTEM_PERMISSIONS = Object.entries(PERMISSION_LABELS).map(([key, label]) => ({
  key,
  label,
  isSystem: true,
}))

export function RoleModal({ open, onClose, role }: Props) {
  const t = useTranslations('rolesPermissions')
  const tPerms = useTranslations('permissions')
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [customPerms, setCustomPerms] = useState<PermissionDefinition[]>([])
  const [saving, setSaving] = useState(false)

  const isEdit = !!role

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setDescription(role?.description ?? '')
      setSelectedPerms(role?.permissions ?? [])
    }
  }, [open, role])

  useEffect(() => {
    const q = query(collection(db, 'permissions'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setCustomPerms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PermissionDefinition))
    })
    return unsub
  }, [])

  const allPermissions = [
    ...SYSTEM_PERMISSIONS,
    ...customPerms.filter((cp) => !SYSTEM_PERMISSIONS.some((sp) => sp.key === cp.key)),
  ].map((p) => {
    let label = p.label
    try { label = tPerms(p.key as Parameters<typeof tPerms>[0]) } catch { /* use default */ }
    return { ...p, label }
  })

  function togglePerm(key: string) {
    setSelectedPerms((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  function handleClose() {
    setName('')
    setDescription('')
    setSelectedPerms([])
    onClose()
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      if (isEdit && role) {
        await updateDoc(doc(db, 'roles', role.id), {
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPerms,
        })
        toast.success('Role updated')
      } else {
        const ref = doc(collection(db, 'roles'))
        await setDoc(ref, {
          id: ref.id,
          name: name.trim(),
          description: description.trim(),
          permissions: selectedPerms,
          isSystem: false,
          createdAt: serverTimestamp(),
          createdBy: user?.uid ?? '',
        })
        toast.success('Role created')
      }
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? t('editRole') : t('createRole')}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('roleName')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Support Agent"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">
            {t('description')} <span className="font-normal text-slate-600">({t('optional')})</span>
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What can users with this role do?"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-400">
            {t('permissionsLabel')}{' '}
            <span className="ms-1 text-[11px] font-normal text-slate-600">
              ({t('selected', { count: selectedPerms.length })})
            </span>
          </label>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pe-1">
            {allPermissions.map(({ key, label, isSystem: sys }) => {
              const checked = selectedPerms.includes(key)
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePerm(key)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 accent-indigo-500"
                  />
                  <span className="flex-1 text-sm text-slate-300">{label}</span>
                  {sys && <span className="text-[10px] text-slate-600">{t('system')}</span>}
                </label>
              )
            })}
          </div>
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
            disabled={saving || !name.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving
              ? (isEdit ? 'Saving…' : 'Creating…')
              : (isEdit ? t('saveChanges') : t('createRole'))}
          </button>
        </div>
      </div>
    </Modal>
  )
}
