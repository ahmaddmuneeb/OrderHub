'use client'

import { Navbar } from './Navbar'
import { useStoresListener } from '../../hooks/useStores'

export function AppLayout({ children }: { children: React.ReactNode }) {
  useStoresListener()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
