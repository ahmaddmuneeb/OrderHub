'use client'

import { signOut } from 'firebase/auth'
import { ShoppingBag, Settings, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '../../lib/firebase'
import { useAuthStore } from '../../store/useAuthStore'

export function Navbar() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center px-4 gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <span className="text-base">OrderHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/settings/stores"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname?.startsWith('/settings') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Stores
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/settings/stores" className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50">
            <Settings size={16} />
          </Link>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <User size={13} className="text-indigo-700" />
              )}
            </div>
            <span className="max-w-[120px] truncate text-xs text-gray-600">
              {user?.displayName ?? user?.email}
            </span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
