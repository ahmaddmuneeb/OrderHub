'use client'

import { Navbar } from './Navbar'
import { useStoresListener } from '../../hooks/useStores'

export function AppLayout({ children }: { children: React.ReactNode }) {
  useStoresListener()

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-950">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-hidden min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
