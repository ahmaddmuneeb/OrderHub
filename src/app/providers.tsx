'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { Toaster } from 'sonner'
import { auth } from '../lib/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { useUserProfile } from '../hooks/useUserProfile'

const PUBLIC_PATHS = ['/auth']

function ProfileLoader() {
  useUserProfile()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading])

  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_PATHS.includes(pathname)
    if (!user && !isPublic) router.replace('/auth')
    if (user && isPublic) router.replace('/')
  }, [user, loading, pathname, router])

  if (loading && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <ProfileLoader />
      {children}
      <Toaster richColors theme="dark" position="top-right" />
    </>
  )
}
