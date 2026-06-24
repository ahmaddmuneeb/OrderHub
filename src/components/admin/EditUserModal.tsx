'use client'

import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useTranslations } from 'next-intl'
import { Modal } from '../ui/Modal'
import { db } from '../../lib/firebase'
import {
  ROLE_DEFAULT_PERMISSIONS, ROLE_LOCKED_PERMISSIONS, PERMISSION_LABELS,
  type Role, type Permission, type UserProfile,
} from '../../types'
import { toast } from 'sonner'

interface Props {
  user: UserProfile | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

const ROLE_OPTION_KEYS: Role[] = ['admin', 'manager', 'viewer']

const ALL_PERMISSIONS: Permission[] = [
  'view_orders',
  'update_order_status',
  'manage_stores',
  'view_analytics',
]

export function EditUserModal({ user: targetUser, open, onClose, onUpdated }: Props) {
  const t = useTranslations('users')
  const tPerms = useTranslations('permissions')
  const tRoles = useTranslations('roles')

  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [saving, setSaving] = useState(false)

  const lockedOff = ROLE_LOCKED_PERMISSIONS[role] ?? []

  useEffect(() => {
    if (targetUser) {
      setDisplayName(targetUser.displayName)
      setRole(targetUser.role === 'super_admin' ? 'admin' : targetUser.role)
      setPermissions(targetUser.permissions)
      setStatus(targetUser.status)
    }
  }, [targetUser])

  function handleRoleChange(r: Role) {
    setRole(r)
    setPermissions(ROLE_DEFAULT_PERMISSIONS[r])
  }

  function togglePermission(p: Permission) {
    if (lockedOff.includes(p)) return
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  async function handleSave() {
    if (!targetUser) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), { displayName: displayName.trim(), role, permissions, status })
      toast.success('User updated')
      onClose()
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  function getRoleLabel(r: Role): string {
    try { return tRoles(r as Parameters<typeof tRoles>[0]) } catch { return r }
  }

  if (!targetUser) return null

  return (
    <Modal open={open} onClose={onClose} title={t('editUser')} size="md">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('displayName')}</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('email')}</label>
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-500">
            {targetUser.email}
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-400">{t('role')}</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTION_KEYS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`rounded-xl border p-3 text-center text-sm font-semibold transition-all ${
                  role === r
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-white/[0.1] bg-white/[0.04] text-slate-400 hover:border-white/[0.15] hover:text-slate-300'
                }`}
              >
                {getRoleLabel(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-400">{t('permissions')}</label>
          <div className="space-y-2">
            {ALL_PERMISSIONS.map((p) => {
              const isLocked = lockedOff.includes(p)
              const isChecked = permissions.includes(p)
              let label = PERMISSION_LABELS[p]
              try { label = tPerms(p as Parameters<typeof tPerms>[0]) } catch { /* use default */ }
              return (
                <label
                  key={p}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    isLocked
                      ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] opacity-40'
                      : 'cursor-pointer border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isLocked}
                    onChange={() => togglePermission(p)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 accent-indigo-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-slate-300">{label}</span>
                  {isLocked && <span className="ms-auto text-[10px] text-slate-600">{t('locked')}</span>}
                </label>
              )
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-400">{t('status')}</label>
          <div className="grid grid-cols-2 gap-2">
            {(['active', 'suspended'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-xl border p-3 text-center text-sm font-semibold capitalize transition-all ${
                  status === s
                    ? s === 'active'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                    : 'border-white/[0.1] bg-white/[0.04] text-slate-400 hover:border-white/[0.15]'
                }`}
              >
                {s === 'active' ? t('active') : t('suspended')}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
