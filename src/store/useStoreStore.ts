import { create } from 'zustand'
import { Store } from '../types'

interface StoreState {
  stores: Store[]
  storesLoading: boolean
  setStores: (stores: Store[]) => void
  setStoresLoading: (loading: boolean) => void
}

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  storesLoading: true,
  setStores: (stores) => set({ stores }),
  setStoresLoading: (loading) => set({ storesLoading: loading }),
}))
