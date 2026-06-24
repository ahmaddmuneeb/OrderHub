'use client'

import { useState } from 'react'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useTranslations } from 'next-intl'
import { Modal } from '../ui/Modal'
import { db, firebaseConfig } from '../../lib/firebase'
import {
  ROLE_DEFAULT_PERMISSIONS, ROLE_LOCKED_PERMISSIONS, PERMISSION_LABELS,
  type Role, type Permission,
} from '../../types'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const ROLE_OPTION_KEYS: Role[] = ['admin', 'manager', 'viewer']

const ALL_PERMISSIONS: Permission[] = [
  'view_orders',
  'update_order_status',
  'manage_stores',
  'view_analytics',
]

export function CreateUserModal({ open, onClose, onCreated }: Props) {
  const t = useTranslations('users')
  const tPerms = useTranslations('permissions')
  const tRoles = useTranslations('roles')

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_DEFAULT_PERMISSIONS['viewer'])
  const [saving, setSaving] = useState(false)

  const lockedOff = ROLE_LOCKED_PERMISSIONS[role] ?? []

  function handleRoleChange(r: Role) {
    setRole(r)
    setPermissions(ROLE_DEFAULT_PERMISSIONS[r])
  }

  function togglePermission(p: Permission) {
    if (lockedOff.includes(p)) return
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  function reset() {
    setDisplayName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
    setPermissions(ROLE_DEFAULT_PERMISSIONS['viewer'])
  }

  function handleClose() { reset(); onClose() }

  async function handleSave() {
    if (!email.trim() || !password.trim()) { toast.error('Email and password are required'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setSaving(true)
    const secondaryApp = initializeApp(firebaseConfig, `create-user-${Date.now()}`)
    let secondaryAuth: ReturnType<typeof getAuth> | null = null
    try {
      secondaryAuth = getAuth(secondaryApp)
      const { user: newUser } = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: email.trim(),
        displayName: displayName.trim() || email.split('@')[0],
        role,
        permissions,
        status: 'active',
        createdAt: serverTimestamp(),
      })

      toast.success('User created successfully')
      handleClose()
      onCreated()
    } catch (err: unknown) {
      if (secondaryAuth?.currentUser) await secondaryAuth.currentUser.delete().catch(() => {})
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      if (msg.includes('insufficient permissions') || msg.includes('permission-denied')) {
        toast.error('Firestore rules are blocking the write — update your Firestore security rules.')
      } else {
        toast.error(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)/, ''))
      }
    } finally {
      await deleteApp(secondaryApp)
      setSaving(false)
    }
  }

  function getRoleLabel(r: Role): string {
    try { return tRoles(r as Parameters<typeof tRoles>[0]) } catch { return r }
  }

  function getRoleDesc(r: Role): string {
    const map: Record<Role, string> = {
      admin: 'Full access to all features',
      manager: 'Orders & analytics, no store management',
      viewer: 'Read-only access',
      super_admin: '',
    }
    try {
      return tRoles(`${r}Desc` as Parameters<typeof tRoles>[0])
    } catch {
      return map[r]
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('createUser')} size="md">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">
            {t('displayNameOptional')}
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">{t('temporaryPassword')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordHint')}
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
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
                className={`rounded-xl border p-3 text-start transition-all ${
                  role === r
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-white/[0.1] bg-white/[0.04] text-slate-400 hover:border-white/[0.15] hover:text-slate-300'
                }`}
              >
                <p className="text-sm font-semibold">{getRoleLabel(r)}</p>
                <p className="mt-0.5 text-[11px] leading-tight opacity-70">{getRoleDesc(r)}</p>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-4">
          <button
            onClick={handleClose}
            className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !email.trim() || !password.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? t('creating') : t('createUser')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
