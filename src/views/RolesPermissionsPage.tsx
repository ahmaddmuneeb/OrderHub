'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { RoleModal } from '../components/admin/RoleModal'
import { PermissionModal } from '../components/admin/PermissionModal'
import {
  PERMISSION_LABELS, ROLE_DEFAULT_PERMISSIONS,
  type RoleDefinition, type PermissionDefinition, type Role, type Permission,
} from '../types'
import { Plus, Pencil, Trash2, Lock, Shield, Key } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'roles' | 'permissions'

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Unrestricted access to all features and settings',
  admin: 'Full access to all features except user management',
  manager: 'Orders and analytics access, no store management',
  viewer: 'Read-only access to orders and analytics',
}

const SYSTEM_ROLES: RoleDefinition[] = (
  Object.entries(ROLE_DEFAULT_PERMISSIONS) as [Role, Permission[]][]
).map(([key, perms]) => ({
  id: key,
  name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  description: ROLE_DESCRIPTIONS[key as Role],
  permissions: perms,
  isSystem: true,
  createdAt: null as never,
}))

const SYSTEM_PERMISSIONS: PermissionDefinition[] = (
  Object.entries(PERMISSION_LABELS) as [Permission, string][]
).map(([key, label]) => ({
  id: key,
  key,
  label,
  description: '',
  isSystem: true,
  createdAt: null as never,
}))

export function RolesPermissionsPage() {
  const [tab, setTab] = useState<Tab>('roles')
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>([])
  const [customPerms, setCustomPerms] = useState<PermissionDefinition[]>([])
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleDefinition | null>(null)
  const [permModalOpen, setPermModalOpen] = useState(false)
  const [editPerm, setEditPerm] = useState<PermissionDefinition | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'roles'), orderBy('createdAt', 'asc')),
      (snap) => setCustomRoles(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RoleDefinition)),
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'permissions'), orderBy('createdAt', 'asc')),
      (snap) => setCustomPerms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PermissionDefinition)),
    )
    return unsub
  }, [])

  async function handleDeleteRole(role: RoleDefinition) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return
    setDeletingId(role.id)
    try {
      await deleteDoc(doc(db, 'roles', role.id))
      toast.success('Role deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeletePerm(perm: PermissionDefinition) {
    if (!confirm(`Delete permission "${perm.label}"? Roles using this permission will lose it.`)) return
    setDeletingId(perm.id)
    try {
      await deleteDoc(doc(db, 'permissions', perm.id))
      toast.success('Permission deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete permission')
    } finally {
      setDeletingId(null)
    }
  }

  const allRoles = [...SYSTEM_ROLES, ...customRoles]
  const allPerms = [
    ...SYSTEM_PERMISSIONS,
    ...customPerms.filter((cp) => !SYSTEM_PERMISSIONS.some((sp) => sp.key === cp.key)),
  ]

  const permLabelMap: Record<string, string> = Object.fromEntries(
    allPerms.map((p) => [p.key, p.label]),
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-8 py-5">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Roles &amp; Permissions</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Define custom roles and permissions for granular access control
          </p>
        </div>
        <button
          onClick={() => {
            if (tab === 'roles') { setEditRole(null); setRoleModalOpen(true) }
            else { setEditPerm(null); setPermModalOpen(true) }
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500"
        >
          <Plus size={14} />
          {tab === 'roles' ? 'New Role' : 'New Permission'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] px-8">
        {(['roles', 'permissions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'roles' ? <Shield size={13} /> : <Key size={13} />}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {tab === 'roles' && (
          <div className="space-y-3">
            {allRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20 ring-1 ring-white/10">
                  <Shield size={15} className="text-indigo-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200">{role.name}</p>
                    {role.isSystem && (
                      <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-600">
                        <Lock size={9} /> system
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-slate-600">{role.description}</p>
                  )}
                  {role.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {role.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500"
                        >
                          {permLabelMap[p] ?? p}
                        </span>
                      ))}
                    </div>
                  )}
                  {role.permissions.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-slate-700">No permissions assigned</p>
                  )}
                </div>

                {!role.isSystem && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => { setEditRole(role); setRoleModalOpen(true) }}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
                      title="Edit role"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role)}
                      disabled={deletingId === role.id}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'permissions' && (
          <div className="space-y-3">
            {allPerms.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 ring-1 ring-white/10">
                  <Key size={14} className="text-emerald-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200">{perm.label}</p>
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                      {perm.key}
                    </code>
                    {perm.isSystem && (
                      <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-600">
                        <Lock size={9} /> system
                      </span>
                    )}
                  </div>
                  {perm.description && (
                    <p className="mt-0.5 text-xs text-slate-600">{perm.description}</p>
                  )}
                </div>

                {!perm.isSystem && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => { setEditPerm(perm); setPermModalOpen(true) }}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
                      title="Edit permission"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeletePerm(perm)}
                      disabled={deletingId === perm.id}
                      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                      title="Delete permission"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <RoleModal
        open={roleModalOpen}
        onClose={() => { setRoleModalOpen(false); setEditRole(null) }}
        role={editRole}
      />
      <PermissionModal
        open={permModalOpen}
        onClose={() => { setPermModalOpen(false); setEditPerm(null) }}
        permission={editPerm}
      />
    </div>
  )
}
