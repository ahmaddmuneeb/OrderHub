'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { useTranslations } from 'next-intl'
import { db } from '../lib/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { useIsSuperAdmin } from '../hooks/useUserProfile'
import { CreateUserModal } from '../components/admin/CreateUserModal'
import { EditUserModal } from '../components/admin/EditUserModal'
import { RolesPermissionsPage } from './RolesPermissionsPage'
import type { UserProfile, Permission } from '../types'
import { PERMISSION_LABELS } from '../types'
import { UserPlus, Pencil, Trash2, ShieldCheck, Eye, Shield, AlertCircle, Users, Lock } from 'lucide-react'
import { toast } from 'sonner'

type AdminTab = 'users' | 'roles'

const ROLE_BADGE: Record<string, { cls: string }> = {
  super_admin: { cls: 'bg-violet-500/15 text-violet-400 border border-violet-500/25' },
  admin:       { cls: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25' },
  manager:     { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' },
  viewer:      { cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/25' },
}

export function AdminPage() {
  const t = useTranslations('admin')
  const tRoles = useTranslations('roles')
  const tUsers = useTranslations('users')
  const tPerms = useTranslations('permissions')

  const isSuperAdmin = useIsSuperAdmin()
  const { user: authUser } = useAuthStore()
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuperAdmin) return
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ ...d.data() }) as UserProfile))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [isSuperAdmin])

  async function handleDelete(u: UserProfile) {
    if (!confirm(`Remove ${u.displayName || u.email}? Their login will still exist but they will lose all access.`)) return
    setDeletingUid(u.uid)
    try {
      await deleteDoc(doc(db, 'users', u.uid))
      toast.success('User removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setDeletingUid(null)
    }
  }

  function getRoleLabel(role: string): string {
    const key = role as 'super_admin' | 'admin' | 'manager' | 'viewer'
    try { return tRoles(key) } catch { return role }
  }

  function getPermLabel(p: string): string {
    try { return tPerms(p as Parameters<typeof tPerms>[0]) } catch { return PERMISSION_LABELS[p as Permission] ?? p }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20">
          <AlertCircle size={22} className="text-rose-400" />
        </div>
        <p className="text-base font-semibold text-slate-300">{t('accessDenied')}</p>
        <p className="mt-1 text-sm text-slate-600">{t('accessDeniedDesc')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top-level tab bar */}
      <div className="flex gap-1 border-b border-white/[0.06] px-8">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'users'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users size={13} />
          {t('tabs.users')}
        </button>
        <button
          onClick={() => setTab('roles')}
          className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === 'roles'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lock size={13} />
          {t('tabs.roles')}
        </button>
      </div>

      {tab === 'roles' && <RolesPermissionsPage />}

      {tab === 'users' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-8 py-5">
            <div>
              <h1 className="text-lg font-bold text-slate-100">{t('userManagement')}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{t('userManagementDesc')}</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500"
            >
              <UserPlus size={14} />
              {t('createUser')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-8 py-6">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            )}

            {!loading && users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                  <Shield size={22} className="text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400">{t('noUsersTitle')}</p>
                <p className="mt-1 text-xs text-slate-600">{t('noUsersDesc')}</p>
              </div>
            )}

            {!loading && users.length > 0 && (
              <div className="space-y-3">
                {users.map((u) => {
                  const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.viewer
                  const RoleIcon = u.role === 'super_admin' ? ShieldCheck : u.role === 'admin' ? Shield : Eye
                  const isSelf = u.uid === authUser?.uid
                  const isLocked = u.role === 'super_admin'

                  return (
                    <div
                      key={u.uid}
                      className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.05]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20 ring-1 ring-white/10">
                        <RoleIcon size={15} className="text-indigo-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {u.displayName || u.email.split('@')[0]}
                          </p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          {isSelf && (
                            <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-600">
                              {tUsers('you')}
                            </span>
                          )}
                          {u.status === 'suspended' && (
                            <span className="shrink-0 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                              {tUsers('suspended')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-600">{u.email}</p>
                        {u.permissions?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {u.permissions.map((p) => (
                              <span key={p} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500">
                                {getPermLabel(p)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {!isLocked && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => setEditTarget(u)}
                            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
                            title={tUsers('editUser')}
                          >
                            <Pencil size={13} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={deletingUid === u.uid}
                              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                              title="Remove user"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => {}} />
          <EditUserModal user={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} onUpdated={() => {}} />
        </>
      )}
    </div>
  )
}
