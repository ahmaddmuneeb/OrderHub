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
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <ShoppingBag size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">OrderHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-3">
        <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Menu
        </p>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 px-2.5 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <User size={13} className="text-indigo-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">
              {user?.displayName ?? user?.email?.split('@')[0]}
            </p>
            <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            title="Sign out"
            className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
