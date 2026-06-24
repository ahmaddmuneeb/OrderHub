'use client'

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import {
  ShoppingBag, LayoutDashboard, Store, LogOut, User, ShieldCheck,
  Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../store/useAuthStore'
import { useIsSuperAdmin } from '../../hooks/useUserProfile'

const baseNavLinks = [
  { href: '/', label: 'Orders', icon: LayoutDashboard },
  { href: '/settings/stores', label: 'Stores', icon: Store },
]

export function Navbar() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const isSuperAdmin = useIsSuperAdmin()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = isSuperAdmin
    ? [...baseNavLinks, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
    : baseNavLinks

  function navContent(mobile = false) {
    const slim = collapsed && !mobile

    return (
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={`flex items-center border-b border-white/[0.06] ${slim ? 'justify-center py-[18px]' : 'gap-3 px-5 py-5'}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <ShoppingBag size={15} className="text-white" />
          </div>
          {!slim && (
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold tracking-tight text-white">OrderHub</span>
              <p className="truncate text-[10px] text-slate-500 -mt-0.5">Order Management</p>
            </div>
          )}
          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className={`flex-1 py-4 ${slim ? 'px-2' : 'px-3'}`}>
          {!slim && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Workspace
            </p>
          )}
          <div className="space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => mobile && setMobileOpen(false)}
                  title={slim ? label : undefined}
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    slim ? 'justify-center' : 'gap-3'
                  } ${
                    active
                      ? 'bg-indigo-600/15 text-indigo-400'
                      : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 ${active ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                  />
                  {!slim && (
                    <>
                      <span className="flex-1">{label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {isSuperAdmin && (
            slim ? (
              <div className="mt-4 flex justify-center" title="Super Admin">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-violet-500/15 bg-violet-500/5 px-3 py-2">
                <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-widest">Super Admin</p>
              </div>
            )
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          <div className={`flex items-center rounded-xl px-2.5 py-2.5 ${slim ? 'justify-center' : 'gap-2.5'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20 ring-1 ring-white/10">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" className="h-full w-full object-cover" />
                : <User size={13} className="text-indigo-400" />}
            </div>
            {!slim && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-300">
                  {user?.displayName ?? user?.email?.split('@')[0]}
                </p>
                <p className="truncate text-[10px] text-slate-600">{user?.email}</p>
              </div>
            )}
            <button
              onClick={() => signOut(auth)}
              title="Sign out"
              className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-400"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <div className="border-t border-white/[0.06] flex justify-center py-2.5">
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-400"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex h-screen shrink-0 flex-col bg-slate-950 border-r border-white/[0.04] overflow-hidden transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {navContent()}
      </aside>

      {/* ── Mobile: fixed top bar ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-slate-950 px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <ShoppingBag size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">OrderHub</span>
        </div>
        <div className="w-9" />
      </div>

      {/* ── Mobile: slide-in drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-72 flex-col border-r border-white/[0.06] bg-slate-950">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
