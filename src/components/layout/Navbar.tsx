'use client'

import { signOut } from 'firebase/auth'
import { ShoppingBag, LayoutDashboard, Store, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../store/useAuthStore'

const navLinks = [
  { href: '/', label: 'Orders', icon: LayoutDashboard },
  { href: '/settings/stores', label: 'Stores', icon: Store },
]

export function Navbar() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-slate-950 border-r border-white/[0.04]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <ShoppingBag size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-white">{"OrderHub"}</span>
          <p className="text-[10px] text-slate-500 -mt-0.5">{"Dashboard - Order Management Tool"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          {"Workspace"}
        </p>
        <div className="space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-indigo-600/15 text-indigo-400'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                }`}
              >
                <Icon
                  size={15}
                  className={active ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}
                />
                {label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/20 ring-1 ring-white/10">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <User size={13} className="text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-300">
              {user?.displayName ?? user?.email?.split('@')[0]}
            </p>
            <p className="truncate text-[10px] text-slate-600">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            title="Sign out"
            className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-400"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
