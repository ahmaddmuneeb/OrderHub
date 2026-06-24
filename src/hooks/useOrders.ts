import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'
import { useOrderStore } from '../store/useOrderStore'
import { useStoreStore } from '../store/useStoreStore'

export function useOrders() {
  const { user } = useAuthStore()
  const { stores, storesLoading } = useStoreStore()
  const { setOrders } = useOrderStore()
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!user) { setOrders([]); setLoading(false); return }
    if (storesLoading) return
    if (stores.length === 0) { setOrders([]); setLoading(false); return }

    setLoading(true)
    try {
      const storeData = stores.map((s) => ({
        id: s.id,
        platform: s.platform,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        credentials: (s as any).credentials,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stores: storeData }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const { orders, errors } = await res.json()
      setOrders(orders)
      if (errors?.length) {
        errors.forEach((e: string) => console.warn(e))
        toast.error(`Failed to load orders from ${errors.length} store(s)`)
      }
    } catch (err) {
      console.error('Orders fetch error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [user, stores, storesLoading, setOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { loading, refresh: fetchOrders }
}
