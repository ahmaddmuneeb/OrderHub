'use client'

import { Navbar } from './Navbar'
import { useStoresListener } from '../../hooks/useStores'

export function AppLayout({ children }: { children: React.ReactNode }) {
  useStoresListener()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
