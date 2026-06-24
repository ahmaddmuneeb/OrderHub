import { useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { useStoreStore } from '../store/useStoreStore'
import { Store } from '../types'

export function useStoresListener() {
  const { user, loading } = useAuthStore()
  const { setStores, setStoresLoading } = useStoreStore()

  useEffect(() => {
    if (loading || !user) {
      setStores([])
      setStoresLoading(false)
      return
    }

    const q = query(collection(db, 'stores'), where('userId', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const stores = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Store)
        setStores(stores)
        setStoresLoading(false)
      },
      (err) => {
        console.error('Firestore stores listener error:', err.code, err.message)
        setStoresLoading(false)
      },
    )

    return unsub
  }, [user, loading, setStores, setStoresLoading])
}
