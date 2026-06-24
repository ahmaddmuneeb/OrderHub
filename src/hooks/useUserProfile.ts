import { useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthStore } from '../store/useAuthStore'
import type { UserProfile } from '../types'

export function useUserProfile() {
  const { user, loading, setUserProfile } = useAuthStore()

  useEffect(() => {
    if (loading || !user) {
      setUserProfile(null)
      return
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile)
      } else {
        setUserProfile(null)
      }
    }, () => {
      setUserProfile(null)
    })

    return unsub
  }, [user, loading, setUserProfile])
}

export function useHasPermission(permission: string): boolean {
  const { userProfile } = useAuthStore()
  if (!userProfile) return false
  return userProfile.role === 'super_admin' || userProfile.permissions.includes(permission as never)
}

export function useIsSuperAdmin(): boolean {
  const { userProfile } = useAuthStore()
  return userProfile?.role === 'super_admin'
}
